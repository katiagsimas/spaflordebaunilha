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
import { Plus, Edit, Clock, Scale, Info, MoreVertical, Trash2, FileDown, ArrowLeft, ArrowRight } from 'lucide-react';
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

export default function Receitas() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [receitas, setReceitas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [receitaParaExcluir, setReceitaParaExcluir] = useState<any>(null);
  const [dialogExcluirAberto, setDialogExcluirAberto] = useState(false);

  useEffect(() => {
    fetchReceitas();
  }, []);

  const fetchReceitas = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Buscar receitas com rendimento
      const { data: receitasData, error: receitasError } = await supabase
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

      if (receitasError) throw receitasError;

      // Buscar mão de obra de todos os receitas
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
      const receitasComCustoTotal = receitasData?.map((receita) => {
        const maosObraReceita = maosObraData?.filter(
          (mo) => mo.pre_preparo_id === receita.id
        ) || [];

        let custoMaoObra = 0;
        maosObraReceita.forEach((mo) => {
          const valorHora = mo.usar_valor_padrao
            ? (perfilPadraoData?.valor_hora || 0)
            : (mo.perfil?.valor_hora || 0);
          custoMaoObra += valorHora * mo.horas;
        });

        return {
          ...receita,
          custo_total_com_mao_obra: receita.custo_total + custoMaoObra,
        };
      });

      setReceitas(receitasComCustoTotal || []);
    } catch (error) {
      console.error('Erro ao buscar receitas:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar os receitas.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const formatarTempo = (tempo: any, unidade: any) => {
    if (tempo === undefined || tempo === null) return "—";
    const unit = unidade || "minutos";
    return `${tempo} ${unit}`;
  };

  const formatarPreco = (preco: number) => {
    return preco.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    });
  };

  const verificarReceitaEmUso = async (receitaId: string): Promise<boolean> => {
    try {
      // Verificar se o receita está sendo usado em receitas_ingredientes
      const { data: ingredientes } = await supabase
        .from('ingredientes')
        .select('tipo_insumo_id')
        .eq('e_pre_preparo', true);

      if (!ingredientes || ingredientes.length === 0) return false;

      const tiposInsumosIds = ingredientes.map(ing => ing.tipo_insumo_id);

      // Verificar se algum tipo_insumo corresponde ao receita
      const { data: tiposInsumos } = await supabase
        .from('tipos_insumos')
        .select('id')
        .eq('pre_preparo_id', receitaId)
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
      console.error('Erro ao verificar uso do receita:', error);
      return true; // Em caso de erro, previne a exclusão por segurança
    }
  };

  const handleConfirmarExclusao = async () => {
    if (!receitaParaExcluir) return;

    try {
      // Verificar se está em uso
      const emUso = await verificarReceitaEmUso(receitaParaExcluir.id);

      if (emUso) {
        toast({
          title: 'Não é possível excluir',
          description: 'Este receita está sendo utilizado em uma ou mais fichas técnicas. Remova-o das receitas antes de excluir.',
          variant: 'destructive',
        });
        setDialogExcluirAberto(false);
        setReceitaParaExcluir(null);
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
          .eq('pre_preparo_id', receitaParaExcluir.id);

        if (tiposInsumosParaExcluir && tiposInsumosParaExcluir.length > 0) {
          const idsParaExcluir = tiposInsumosParaExcluir.map(t => t.id);
          
          await supabase
            .from('ingredientes')
            .delete()
            .in('tipo_insumo_id', idsParaExcluir);
        }
      }

      // Excluir ingredientes do receita
      await supabase
        .from('pre_preparos_ingredientes')
        .delete()
        .eq('pre_preparo_id', receitaParaExcluir.id);

      // Excluir mão de obra do receita
      await supabase
        .from('pre_preparos_mao_obra')
        .delete()
        .eq('pre_preparo_id', receitaParaExcluir.id);

      // Excluir o receita
      const { error: deleteError } = await supabase
        .from('pre_preparos')
        .delete()
        .eq('id', receitaParaExcluir.id);

      if (deleteError) throw deleteError;

      toast({
        title: 'Receita excluído',
        description: 'O receita foi excluído com sucesso.',
      });

      fetchReceitas();
    } catch (error: any) {
      console.error('Erro ao excluir receita:', error);
      toast({
        title: 'Erro ao excluir',
        description: error.message || 'Não foi possível excluir o receita.',
        variant: 'destructive',
      });
    } finally {
      setDialogExcluirAberto(false);
      setReceitaParaExcluir(null);
    }
  };

  const handleExcluir = (receita: any) => {
    setReceitaParaExcluir(receita);
    setDialogExcluirAberto(true);
  };

  if (loading) return <LoadingState message="Carregando Receitas" submessage="Listando receitas..." />;

  return (
    <div className="container mx-auto px-6 pt-1 pb-6 space-y-6">
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between gap-3">
          <BackButton to="/cadastros" />
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              onClick={() => navigate('/precificacao/embalagens')}
              className="gap-2 text-muted-foreground hover:text-foreground font-body"
            >
              <ArrowLeft className="h-4 w-4" />
              Embalagens
            </Button>
            <Button
              variant="ghost"
              onClick={() => navigate('/precificacao/ficha-tecnica')}
              className="gap-2 text-muted-foreground hover:text-foreground font-body"
            >
              <ArrowRight className="h-4 w-4" />
              Ficha Técnica
            </Button>
          </div>
        </div>
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div className="flex flex-col items-start">
            <h1 className="font-display text-3xl tracking-tight text-sfb-cacau sm:text-4xl">
              Receitas
            </h1>
            <div className="mt-2 flex items-center gap-3">
              <span className="h-px w-12 bg-sfb-terracota" />
              <p className="text-sm font-body italic text-sfb-cacau/70">
                Cadastre receitas intermediários para usar em receitas
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
          Receitas aparecem automaticamente na lista de Ingredientes e podem ser usados em receitas. 
          Editações aqui atualizam automaticamente em Ingredientes.
        </AlertDescription>
      </Alert>

      <div className="flex justify-start">
        <Button onClick={() => navigate('/cadastros/receitas/novo')} className="bg-sfb-terracota text-sfb-baunilha hover:bg-sfb-terracota/90">
          <Plus className="mr-2 h-4 w-4" />
          Criar Novo Receita
        </Button>
      </div>

      {receitas.length === 0 ? (
        <EmptyState
          icon={ChefHat}
          title="Nenhum receita cadastrado"
          description="Crie seus receitas para otimizar a produção e calcular custos de forma precisa"
          actionLabel="Criar novo Receita"
          onAction={() => navigate('/cadastros/receitas/novo')}
        />
      ) : (
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Tempo de Receita</TableHead>
                <TableHead>Rendimento</TableHead>
                <TableHead>Custo</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {receitas.map(receita => (
                <TableRow key={receita.id}>
                  <TableCell className="font-medium">{receita.nome}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      {formatarTempo(receita.tempo_receita, receita.tempo_receita_unidade)}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Scale className="h-4 w-4 text-muted-foreground" />
                      {receita.rendimento_quantidade.toLocaleString('pt-BR')}{' '}
                      {receita.rendimento_unidade?.sigla}
                    </div>
                  </TableCell>
                  <TableCell className="font-medium">
                    {formatarPreco(receita.custo_total_com_mao_obra || receita.custo_total || 0)}
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
                          onClick={() => navigate(`/cadastros/receitas/${receita.id}`)}
                        >
                          <Edit className="mr-2 h-4 w-4" />
                          Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={async () => {
                            try {
                              await exportarPrePreparoPDF(receita.id);
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
                          onClick={() => handleExcluir(receita)}
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
              Tem certeza que deseja excluir o receita "{receitaParaExcluir?.nome}"?
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
