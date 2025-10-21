import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import DarBaixaDialog from '@/components/financeiro/DarBaixaDialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { Plus, MoreVertical, Eye, DollarSign, Edit, Trash2, Info, Search, Filter } from 'lucide-react';

export default function ContasReceber() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [parcelas, setParcelas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Filtros
  const [termoBusca, setTermoBusca] = useState('');
  const [filtroStatus, setFiltroStatus] = useState('todos');

  // Modal de baixa
  const [darBaixaOpen, setDarBaixaOpen] = useState(false);
  const [parcelaSelecionada, setParcelaSelecionada] = useState<any>(null);

  useEffect(() => {
    fetchParcelas();
  }, []);

  const fetchParcelas = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('vw_contas_receber_parcelas')
        .select('*')
        .eq('user_id', user.id)
        .order('data_vencimento', { ascending: true });

      if (error) throw error;
      setParcelas(data || []);
    } catch (error) {
      console.error('Erro ao buscar parcelas:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar as parcelas.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const parcelasFiltradas = parcelas.filter(p => {
    // Filtro de busca
    if (termoBusca) {
      const termo = termoBusca.toLowerCase();
      if (
        !p.cliente_nome?.toLowerCase().includes(termo) &&
        !p.tipo_documento_descricao?.toLowerCase().includes(termo) &&
        !p.plano_contas_descricao?.toLowerCase().includes(termo)
      ) {
        return false;
      }
    }

    // Filtro de status
    if (filtroStatus !== 'todos') {
      // Tratar "vencido" como sinônimo de "atrasado"
      if (filtroStatus === 'vencido' && p.status !== 'atrasado') {
        return false;
      } else if (filtroStatus !== 'vencido' && p.status !== filtroStatus) {
        return false;
      }
    }

    return true;
  });

  const handleExcluir = async (contaId: string) => {
    try {
      if (!confirm('Deseja realmente excluir esta conta e todas as suas parcelas?')) return;

      const { error } = await supabase
        .from('contas_receber')
        .delete()
        .eq('id', contaId);

      if (error) throw error;

      toast({
        title: '✅ Conta excluída',
        description: 'Conta e parcelas excluídas com sucesso!',
      });

      fetchParcelas();
    } catch (error) {
      console.error('Erro ao excluir:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível excluir a conta.',
        variant: 'destructive',
      });
    }
  };

  const formatarData = (dataISO: string) => {
    if (!dataISO) return '-';
    const data = new Date(dataISO + 'T00:00:00');
    return data.toLocaleDateString('pt-BR');
  };

  const formatarValor = (valor: number) => {
    if (!valor) return 'R$ 0,00';
    return valor.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    });
  };

  const getBadgeStatus = (status: string) => {
    const badges: Record<string, JSX.Element> = {
      aberto: <Badge variant="outline">Aberto</Badge>,
      pago: <Badge className="bg-green-100 text-green-700 border-green-300">Pago</Badge>,
      pagamento_parcial: <Badge className="bg-yellow-100 text-yellow-700 border-yellow-300">Pagamento Parcial</Badge>,
      atrasado: <Badge className="bg-red-100 text-red-700 border-red-300">Atrasado</Badge>,
      vencido: <Badge className="bg-red-100 text-red-700 border-red-300">Vencido</Badge>,
      adiantado: <Badge className="bg-blue-100 text-blue-700 border-blue-300">Adiantado</Badge>,
    };
    return badges[status] || <Badge variant="outline">{status}</Badge>;
  };

  if (loading) return <div className="flex justify-center p-8">Carregando...</div>;

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold">Contas a Receber</h1>
          <p className="text-muted-foreground">
            Gerencie suas contas a receber por parcela
          </p>
        </div>
        <Button onClick={() => navigate('/financeiro/contas-receber/nova')}>
          <Plus className="mr-2 h-4 w-4" />
          Adicionar Conta a Receber
        </Button>
      </div>

      <Alert className="bg-blue-50 border-blue-200">
        <Info className="h-4 w-4 text-blue-600" />
        <AlertDescription>
          Cada linha representa uma parcela individual. Use os filtros para encontrar parcelas específicas.
        </AlertDescription>
      </Alert>

      {/* Filtros Pré-Definidos */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <Label>Filtros Pré-Definidos</Label>
        </div>
        
        <div className="flex flex-wrap gap-2">
          <Button
            variant={filtroStatus === 'todos' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFiltroStatus('todos')}
          >
            Todos
          </Button>
          <Button
            variant={filtroStatus === 'aberto' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFiltroStatus('aberto')}
          >
            Em Aberto
          </Button>
          <Button
            variant={filtroStatus === 'pagamento_parcial' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFiltroStatus('pagamento_parcial')}
          >
            Pago Parcialmente
          </Button>
          <Button
            variant={filtroStatus === 'pago' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFiltroStatus('pago')}
          >
            Pago
          </Button>
          <Button
            variant={filtroStatus === 'vencido' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFiltroStatus('vencido')}
          >
            Vencido
          </Button>
          <Button
            variant={filtroStatus === 'adiantado' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFiltroStatus('adiantado')}
          >
            Adiantado
          </Button>
          <Button
            variant={filtroStatus === 'atrasado' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFiltroStatus('atrasado')}
          >
            Atrasado
          </Button>
        </div>
      </div>

      {/* Filtros de Busca */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Buscar</Label>
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Cliente, documento ou plano..."
              value={termoBusca}
              onChange={(e) => setTermoBusca(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
      </div>

      <div className="text-sm text-muted-foreground">
        Mostrando <strong>{parcelasFiltradas.length}</strong> de <strong>{parcelas.length}</strong> parcela(s)
      </div>

      {/* Tabela */}
      <div className="border rounded-lg overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Documento</TableHead>
              <TableHead>Emissão</TableHead>
              <TableHead>Plano Contas</TableHead>
              <TableHead>Cliente</TableHead>
              <TableHead>Vencimento</TableHead>
              <TableHead>Valor Total</TableHead>
              <TableHead className="w-28">Parcela</TableHead>
              <TableHead>Valor a Pagar</TableHead>
              <TableHead>Valor Pago</TableHead>
              <TableHead>Data Pag.</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {parcelasFiltradas.length === 0 ? (
              <TableRow>
                <TableCell colSpan={12} className="text-center py-8 text-muted-foreground">
                  Nenhuma parcela encontrada.
                </TableCell>
              </TableRow>
            ) : (
              parcelasFiltradas.map(parcela => (
                <TableRow key={parcela.id}>
                  <TableCell>{parcela.tipo_documento_descricao || 'N/A'}</TableCell>
                  <TableCell>{formatarData(parcela.data_emissao)}</TableCell>
                  <TableCell className="text-sm">
                    {parcela.plano_contas_codigo} - {parcela.plano_contas_descricao}
                  </TableCell>
                  <TableCell className="font-medium">{parcela.cliente_nome || 'N/A'}</TableCell>
                  <TableCell>{formatarData(parcela.data_vencimento)}</TableCell>
                  <TableCell className="text-green-600 font-medium">
                    {formatarValor(parcela.valor_total)}
                  </TableCell>
                  <TableCell className="font-mono font-medium">
                    {parcela.numero_parcela} de {parcela.numero_parcelas}
                  </TableCell>
                  <TableCell className="text-green-600 font-medium">
                    {formatarValor(parcela.valor_parcela)}
                  </TableCell>
                  <TableCell>
                    {parcela.valor_pago ? formatarValor(parcela.valor_pago) : '-'}
                  </TableCell>
                  <TableCell>{formatarData(parcela.data_pagamento)}</TableCell>
                  <TableCell>{getBadgeStatus(parcela.status)}</TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem 
                          onClick={() => {
                            setParcelaSelecionada(parcela);
                            setDarBaixaOpen(true);
                          }}
                          disabled={parcela.status === 'pago'}
                        >
                          <DollarSign className="mr-2 h-4 w-4" />
                          Dar Baixa
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => navigate(`/financeiro/contas-receber/detalhes/${parcela.conta_receber_id}`)}>
                          <Eye className="mr-2 h-4 w-4" />
                          Detalhes
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => navigate(`/financeiro/contas-receber/editar/${parcela.conta_receber_id}`)}>
                          <Edit className="mr-2 h-4 w-4" />
                          Editar
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem 
                          onClick={() => handleExcluir(parcela.conta_receber_id)}
                          className="text-red-600"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Excluir
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Modal Dar Baixa */}
      <DarBaixaDialog
        open={darBaixaOpen}
        onOpenChange={setDarBaixaOpen}
        parcela={parcelaSelecionada}
        onSuccess={fetchParcelas}
      />
    </div>
  );
}
