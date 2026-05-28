import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { LoadingState } from '@/components/LoadingState';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { Plus, Edit, Clock, Scale, Info, MoreVertical, Trash2, FileDown, ArrowRight } from 'lucide-react';
import { exportarPrePreparoPDF } from '@/utils/exportarPrePreparoPDF';
import { EmptyState } from '@/components/EmptyState';
import { ChefHat } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { BackButton } from '@/components/BackButton';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

export default function PrePreparos() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [preparos, setPreparos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [prepairoParaExcluir, setPreparoParaExcluir] = useState<any>(null);
  const [dialogExcluirAberto, setDialogExcluirAberto] = useState(false);

  useEffect(() => {
    fetchPreparos();
  }, []);

  const fetchPreparos = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Buscar pré-preparos com rendimento
      const { data: preparosData, error: preparosError } = await supabase
        .from('pre_preparos')
        .select(`
          *,
          rendimento_unidade:unidades_medida!rendimento_unidade_id (
            nome,
            sigla
          )
        `)
        .eq('usuario_id', user.id)
        .order('nome');

      if (preparosError) throw preparosError;

      // Buscar mão de obra de todos os pré-preparos
      const { data: maosObraData, error: maosObraError } = await supabase
        .from('pre_preparos_mao_obra')
        .select(`
          *,
          perfil:mao_obra_perfis(valor_hora)
        `);

      if (maosObraError) throw maosObraError;

      // Buscar perfil de mão de obra marcado como padrão
      const { data: perfilPadraoData } = await supabase
        .from('mao_obra_perfis')
        .select('valor_hora')
        .eq('user_id', user.id)
        .eq('padrao', true)
        .eq('ativo', true)
        .maybeSingle();

      // Calcular custo total incluindo mão de obra
      const preparosComCustoTotal = preparosData?.map((preparo) => {
        const maosObraPreparo = maosObraData?.filter(
          (mo) => mo.pre_preparo_id === preparo.id
        ) || [];

        let custoMaoObra = 0;
        maosObraPreparo.forEach((mo) => {
          const valorHora = mo.usar_valor_padrao
            ? (perfilPadraoData?.valor_hora || 0)
            : (mo.perfil?.valor_hora || 0);
          custoMaoObra += valorHora * mo.horas;
        });

        return {
          ...preparo,
          custo_total_com_mao_obra: preparo.custo_total + custoMaoObra,
        };
      });

      setPreparos(preparosComCustoTotal || []);
    } catch (error) {
      console.error('Erro ao buscar pré-preparos:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar os pré-preparos.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const formatarTempo = (tempo: number, unidade: string) => {
    return `${tempo} ${unidade}`;
  };

  const formatarPreco = (preco: number) => {
    return preco.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    });
  };

  const verificarPreparoEmUso = async (preparoId: string): Promise<boolean> => {
    try {
      // Verificar se o pré-preparo está sendo usado em receitas_ingredientes
      const { data: ingredientes } = await supabase
        .from('ingredientes')
        .select('tipo_insumo_id')
        .eq('e_pre_preparo', true);

      if (!ingredientes || ingredientes.length === 0) return false;

      const tiposInsumosIds = ingredientes.map(ing => ing.tipo_insumo_id);

      // Verificar se algum tipo_insumo corresponde ao pré-preparo
      const { data: tiposInsumos } = await supabase
        .from('tipos_insumos')
        .select('id')
        .eq('pre_preparo_id', preparoId)
        .in('id', tiposInsumosIds);

      if (!tiposInsumos || tiposInsumos.length === 0) return false;

      // Verificar se está sendo usado em receitas
      const { data: receitasUsando, error } = await supabase
        .from('receitas_ingredientes')
        .select('id')
        .in('ingrediente_id', tiposInsumos.map(t => t.id))
        .limit(1);

      if (error) throw error;

      return receitasUsando && receitasUsando.length > 0;
    } catch (error) {
      console.error('Erro ao verificar uso do pré-preparo:', error);
      return true; // Em caso de erro, previne a exclusão por segurança
    }
  };

  const handleConfirmarExclusao = async () => {
    if (!prepairoParaExcluir) return;

    try {
      // Verificar se está em uso
      const emUso = await verificarPreparoEmUso(prepairoParaExcluir.id);

      if (emUso) {
        toast({
          title: 'Não é possível excluir',
          description: 'Este pré-preparo está sendo utilizado em uma ou mais fichas técnicas. Remova-o das receitas antes de excluir.',
          variant: 'destructive',
        });
        setDialogExcluirAberto(false);
        setPreparoParaExcluir(null);
        return;
      }

      // Excluir ingredientes relacionados
      const { data: ingredientesRelacionados } = await supabase
        .from('ingredientes')
        .select('tipo_insumo_id')
        .eq('e_pre_preparo', true);

      if (ingredientesRelacionados) {
        const { data: tiposInsumosParaExcluir } = await supabase
          .from('tipos_insumos')
          .select('id')
          .eq('pre_preparo_id', prepairoParaExcluir.id);

        if (tiposInsumosParaExcluir && tiposInsumosParaExcluir.length > 0) {
          const idsParaExcluir = tiposInsumosParaExcluir.map(t => t.id);
          
          await supabase
            .from('ingredientes')
            .delete()
            .in('tipo_insumo_id', idsParaExcluir);
        }
      }

      // Excluir ingredientes do pré-preparo
      await supabase
        .from('pre_preparos_ingredientes')
        .delete()
        .eq('pre_preparo_id', prepairoParaExcluir.id);

      // Excluir mão de obra do pré-preparo
      await supabase
        .from('pre_preparos_mao_obra')
        .delete()
        .eq('pre_preparo_id', prepairoParaExcluir.id);

      // Excluir o pré-preparo
      const { error: deleteError } = await supabase
        .from('pre_preparos')
        .delete()
        .eq('id', prepairoParaExcluir.id);

      if (deleteError) throw deleteError;

      toast({
        title: 'Pré-preparo excluído',
        description: 'O pré-preparo foi excluído com sucesso.',
      });

      fetchPreparos();
    } catch (error: any) {
      console.error('Erro ao excluir pré-preparo:', error);
      toast({
        title: 'Erro ao excluir',
        description: error.message || 'Não foi possível excluir o pré-preparo.',
        variant: 'destructive',
      });
    } finally {
      setDialogExcluirAberto(false);
      setPreparoParaExcluir(null);
    }
  };

  const handleExcluir = (preparo: any) => {
    setPreparoParaExcluir(preparo);
    setDialogExcluirAberto(true);
  };

  if (loading) return <LoadingState message="Carregando Pré-Preparos" submessage="Listando pré-preparos..." />;

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between gap-3">
          <BackButton to="/precificacao" />
          <Button
            variant="ghost"
            onClick={() => navigate('/precificacao/ficha-tecnica')}
            className="gap-2 text-muted-foreground hover:text-foreground font-body"
          >
            Ficha Técnica
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div className="flex flex-col items-start">
            <h1 className="font-display text-3xl tracking-tight text-cda-vinho-escuro sm:text-4xl">
              Pré-Preparos
            </h1>
            <div className="mt-2 flex items-center gap-3">
              <span className="h-px w-12 bg-cda-dourado" />
              <p className="text-sm font-body italic text-cda-vinho/70">
                Cadastre preparos intermediários para usar em receitas
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {/* ações removidas para baixo do alerta */}
          </div>
        </div>
      </div>

      <Alert className="bg-purple-50 border-purple-200 dark:bg-purple-950 dark:border-purple-800">
        <Info className="h-4 w-4 text-purple-600 dark:text-purple-400" />
        <AlertDescription>
          Pré-preparos aparecem automaticamente na lista de Ingredientes e podem ser usados em receitas. 
          Editações aqui atualizam automaticamente em Ingredientes.
        </AlertDescription>
      </Alert>

      {preparos.length === 0 ? (
        <EmptyState
          icon={ChefHat}
          title="Nenhum pré-preparo cadastrado"
          description="Crie seus pré-preparos para otimizar a produção e calcular custos de forma precisa"
          actionLabel="Criar novo Pré-Preparo"
          onAction={() => navigate('/precificacao/pre-preparos/novo')}
        />
      ) : (
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Tempo de Preparo</TableHead>
                <TableHead>Rendimento</TableHead>
                <TableHead>Custo</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {preparos.map(preparo => (
                <TableRow key={preparo.id}>
                  <TableCell className="font-medium">{preparo.nome}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      {formatarTempo(preparo.tempo_preparo, preparo.tempo_preparo_unidade)}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Scale className="h-4 w-4 text-muted-foreground" />
                      {preparo.rendimento_quantidade.toLocaleString('pt-BR')}{' '}
                      {preparo.rendimento_unidade?.sigla}
                    </div>
                  </TableCell>
                  <TableCell className="font-medium">
                    {formatarPreco(preparo.custo_total_com_mao_obra || preparo.custo_total || 0)}
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => navigate(`/precificacao/pre-preparos/${preparo.id}`)}
                        >
                          <Edit className="mr-2 h-4 w-4" />
                          Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={async () => {
                            try {
                              await exportarPrePreparoPDF(preparo.id);
                            } catch (e: any) {
                              toast({
                                title: 'Erro ao exportar',
                                description: e?.message || 'Falha ao gerar PDF.',
                                variant: 'destructive',
                              });
                            }
                          }}
                        >
                          <FileDown className="mr-2 h-4 w-4" />
                          Exportar PDF
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleExcluir(preparo)}
                          className="text-destructive focus:text-destructive"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Excluir
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <AlertDialog open={dialogExcluirAberto} onOpenChange={setDialogExcluirAberto}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o pré-preparo "{prepairoParaExcluir?.nome}"?
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmarExclusao}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
