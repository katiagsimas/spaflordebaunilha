import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
import { useToast } from '@/hooks/use-toast';
import { Plus, Eye, DollarSign } from 'lucide-react';

export default function ContasReceber() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [contas, setContas] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchContas();
  }, []);

  const fetchContas = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('contas_receber')
        .select(`
          *,
          cliente:clientes (
            nome
          ),
          tipo_documento:tipos_documento (
            descricao
          ),
          plano_conta:plano_contas (
            codigo_estruturado,
            descricao
          ),
          banco:bancos (
            nome
          )
        `)
        .eq('usuario_id', user.id)
        .order('data_emissao', { ascending: false });

      if (error) throw error;
      setContas(data || []);
    } catch (error) {
      console.error('Erro ao buscar contas:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar as contas.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const formatarData = (dataISO: string) => {
    const data = new Date(dataISO + 'T00:00:00');
    return data.toLocaleDateString('pt-BR');
  };

  const formatarValor = (valor: number) => {
    return valor.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    });
  };

  if (loading) return <div className="flex justify-center p-8">Carregando...</div>;

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold">Contas a Receber</h1>
          <p className="text-muted-foreground">
            Gerencie suas contas a receber e recebimentos
          </p>
        </div>
        <Button onClick={() => navigate('/financeiro/contas-receber/nova')}>
          <Plus className="mr-2 h-4 w-4" />
          Adicionar Conta a Receber
        </Button>
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Data Emissão</TableHead>
              <TableHead>Cliente</TableHead>
              <TableHead>Tipo Doc</TableHead>
              <TableHead>Plano de Contas</TableHead>
              <TableHead>Valor Total</TableHead>
              <TableHead>Parcelas</TableHead>
              <TableHead>Recorrente</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {contas.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                  Nenhuma conta a receber cadastrada. Clique em "Adicionar".
                </TableCell>
              </TableRow>
            ) : (
              contas.map((conta: any) => (
                <TableRow key={conta.id}>
                  <TableCell>{formatarData(conta.data_emissao)}</TableCell>
                  <TableCell className="font-medium">
                    {conta.cliente?.nome || 'N/A'}
                  </TableCell>
                  <TableCell>{conta.tipo_documento?.descricao || 'N/A'}</TableCell>
                  <TableCell className="text-sm">
                    {conta.plano_conta?.codigo_estruturado} - {conta.plano_conta?.descricao}
                  </TableCell>
                  <TableCell className="font-medium text-green-600">
                    {formatarValor(conta.valor)}
                  </TableCell>
                  <TableCell>
                    {conta.numero_parcelas}x
                  </TableCell>
                  <TableCell>
                    {conta.e_recorrente ? (
                      <Badge className="bg-purple-100 text-purple-700 border-purple-300">
                        Sim
                      </Badge>
                    ) : (
                      <Badge variant="outline">Não</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => navigate(`/financeiro/contas-receber/${conta.id}`)}
                        title="Ver detalhes"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        title="Receber"
                      >
                        <DollarSign className="h-4 w-4 text-green-600" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
