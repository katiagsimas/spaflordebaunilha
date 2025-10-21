import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { Info, Power, PowerOff, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '@/components/PageHeader';

interface Categoria {
  id: string;
  codigo: string;
  descricao: string;
  indicador: 'Credito' | 'Debito';
  faixa_dre: string;
  ativo: boolean;
  ordem: number;
}

export default function CategoriasPlanoContas() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCategorias();
  }, []);

  const fetchCategorias = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Verificar se usuário já tem categorias
      const { data: categoriasExistentes, error: erroVerificacao } = await supabase
        .from('categorias_plano_contas')
        .select('id')
        .eq('user_id', user.id)
        .limit(1);

      if (erroVerificacao) throw erroVerificacao;

      // Se não tem categorias, criar as padrão
      if (!categoriasExistentes || categoriasExistentes.length === 0) {
        console.log('Criando categorias padrão...');
        const { error: erroCriar } = await supabase.rpc('criar_categorias_plano_padrao', {
          p_user_id: user.id
        });

        if (erroCriar) {
          console.error('Erro ao criar categorias padrão:', erroCriar);
        }
      }

      // Buscar todas as categorias
      const { data, error } = await supabase
        .from('categorias_plano_contas')
        .select('*')
        .eq('user_id', user.id)
        .order('ordem');

      if (error) throw error;
      setCategorias((data || []) as Categoria[]);
    } catch (error) {
      console.error('Erro ao buscar categorias:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar as categorias.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleToggleAtivo = async (id: string, ativoAtual: boolean) => {
    try {
      const novoStatus = !ativoAtual;

      const { error } = await supabase
        .from('categorias_plano_contas')
        .update({ ativo: novoStatus })
        .eq('id', id);

      if (error) throw error;

      toast({
        title: novoStatus ? '✅ Categoria ativada' : '⚠️ Categoria desativada',
        description: novoStatus 
          ? 'Categoria reativada com sucesso!' 
          : 'Categoria desativada. Não aparecerá mais nas opções.',
      });

      fetchCategorias();
    } catch (error) {
      console.error('Erro ao alterar status:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível alterar o status.',
        variant: 'destructive',
      });
    }
  };

  const getBadgeIndicador = (indicador: 'Credito' | 'Debito') => {
    if (indicador === 'Credito') {
      return <Badge className="bg-green-100 text-green-700 border-green-300">Crédito</Badge>;
    }
    return <Badge className="bg-red-100 text-red-700 border-red-300">Débito</Badge>;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-lg">Carregando...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center gap-4 mb-6">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate('/configuracoes')}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <PageHeader
            title="Categorias do Plano de Contas"
            description="Categorias para classificação de receitas e despesas no DRE"
          />
        </div>
      </div>

      <Alert className="bg-blue-50 border-blue-200">
        <Info className="h-4 w-4 text-blue-600" />
        <AlertDescription>
          Estas categorias são usadas para organizar o Plano de Contas e gerar relatórios contábeis. 
          Você pode desativar categorias que não utiliza.
        </AlertDescription>
      </Alert>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-24">Código</TableHead>
              <TableHead>Descrição</TableHead>
              <TableHead className="w-32">Indicador</TableHead>
              <TableHead>Faixa no DRE</TableHead>
              <TableHead className="w-32">Status</TableHead>
              <TableHead className="text-right w-32">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {categorias.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  Nenhuma categoria encontrada.
                </TableCell>
              </TableRow>
            ) : (
              categorias.map(categoria => (
                <TableRow 
                  key={categoria.id}
                  className={!categoria.ativo ? 'opacity-50 bg-muted/50' : ''}
                >
                  <TableCell className="font-mono font-bold">{categoria.codigo}</TableCell>
                  <TableCell className="font-medium">{categoria.descricao}</TableCell>
                  <TableCell>{getBadgeIndicador(categoria.indicador)}</TableCell>
                  <TableCell className="text-sm">{categoria.faixa_dre}</TableCell>
                  <TableCell>
                    {categoria.ativo ? (
                      <Badge variant="outline" className="bg-green-50 text-green-700 border-green-300">
                        Ativo
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="bg-gray-100 text-gray-600 border-gray-300">
                        Inativo
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleToggleAtivo(categoria.id, categoria.ativo)}
                      title={categoria.ativo ? 'Desativar categoria' : 'Ativar categoria'}
                    >
                      {categoria.ativo ? (
                        <PowerOff className="h-4 w-4 text-red-600" />
                      ) : (
                        <Power className="h-4 w-4 text-green-600" />
                      )}
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription className="text-sm">
          <strong>Dica:</strong> Categorias inativas não aparecem ao cadastrar contas no Plano de Contas. 
          Você pode reativá-las a qualquer momento.
        </AlertDescription>
      </Alert>
    </div>
  );
}
