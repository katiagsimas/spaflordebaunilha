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
import { Plus, Edit, Clock, Scale, Info } from 'lucide-react';
import { EmptyState } from '@/components/EmptyState';
import { ChefHat } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { BackButton } from '@/components/BackButton';
import { PageHeader } from '@/components/PageHeader';

export default function PrePreparos() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [preparos, setPreparos] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPreparos();
  }, []);

  const fetchPreparos = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
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

      if (error) throw error;
      setPreparos(data || []);
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

  if (loading) return <LoadingState message="Carregando Pré-Preparos" submessage="Listando pré-preparos..." />;

  return (
    <div className="container mx-auto p-6 space-y-6">
      <PageHeader
        title="Pré-Preparos"
        description="Cadastre preparos intermediários para usar em receitas"
        backButton={<BackButton to="/precificacao" />}
        actions={
          <Button onClick={() => navigate('/precificacao/pre-preparos/novo')}>
            <Plus className="mr-2 h-4 w-4" />
            Criar Novo Pré-Preparo
          </Button>
        }
      />

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
                    {formatarPreco(preparo.custo_total || 0)}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => navigate(`/precificacao/pre-preparos/${preparo.id}`)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
