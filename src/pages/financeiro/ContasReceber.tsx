import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
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
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { Plus, MoreVertical, Eye, DollarSign, Edit, Trash2, Info, Search } from 'lucide-react';

export default function ContasReceber() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [parcelas, setParcelas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Filtros
  const [termoBusca, setTermoBusca] = useState('');
  const [filtroStatus, setFiltroStatus] = useState('todos');

  // Modal baixa
  const [modalBaixaAberto, setModalBaixaAberto] = useState(false);
  const [parcelaBaixa, setParcelaBaixa] = useState<any>(null);
  const [valorPago, setValorPago] = useState('');
  const [dataPagamento, setDataPagamento] = useState(new Date().toISOString().split('T')[0]);

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
    if (filtroStatus !== 'todos' && p.status !== filtroStatus) {
      return false;
    }

    return true;
  });

  const handleAbrirBaixa = (parcela: any) => {
    setParcelaBaixa(parcela);
    setValorPago(parcela.valor_parcela.toString().replace('.', ','));
    setDataPagamento(new Date().toISOString().split('T')[0]);
    setModalBaixaAberto(true);
  };

  const handleDarBaixa = async () => {
    try {
      const valor = parseFloat(valorPago.replace(',', '.'));
      if (!valor || valor <= 0) {
        toast({
          title: 'Erro',
          description: 'Informe um valor válido!',
          variant: 'destructive',
        });
        return;
      }

      const { error } = await supabase
        .from('contas_receber_parcelas')
        .update({
          valor_pago: valor,
          data_pagamento: dataPagamento,
        })
        .eq('id', parcelaBaixa.id);

      if (error) throw error;

      toast({
        title: '✅ Baixa realizada',
        description: 'Pagamento registrado com sucesso!',
      });

      setModalBaixaAberto(false);
      fetchParcelas();
    } catch (error) {
      console.error('Erro ao dar baixa:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível registrar o pagamento.',
        variant: 'destructive',
      });
    }
  };

  const handleDeletar = async (id: string) => {
    try {
      if (!confirm('Deletar esta parcela?')) return;

      const { error } = await supabase
        .from('contas_receber_parcelas')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: '✅ Deletado',
        description: 'Parcela deletada com sucesso!',
      });

      fetchParcelas();
    } catch (error) {
      console.error('Erro ao deletar:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível deletar a parcela.',
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

      {/* Filtros */}
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

        <div className="space-y-2">
          <Label>Status</Label>
          <Select value={filtroStatus} onValueChange={setFiltroStatus}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos</SelectItem>
              <SelectItem value="aberto">Aberto</SelectItem>
              <SelectItem value="pago">Pago</SelectItem>
              <SelectItem value="atrasado">Atrasado</SelectItem>
              <SelectItem value="pagamento_parcial">Pagamento Parcial</SelectItem>
              <SelectItem value="adiantado">Adiantado</SelectItem>
            </SelectContent>
          </Select>
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
                        <DropdownMenuItem onClick={() => {}}>
                          <Eye className="mr-2 h-4 w-4" />
                          Detalhes
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => {}}>
                          <Edit className="mr-2 h-4 w-4" />
                          Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleAbrirBaixa(parcela)}>
                          <DollarSign className="mr-2 h-4 w-4 text-green-600" />
                          Dar Baixa
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => handleDeletar(parcela.id)}
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
      <Dialog open={modalBaixaAberto} onOpenChange={setModalBaixaAberto}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Dar Baixa na Parcela</DialogTitle>
            <DialogDescription>
              Registre o pagamento da parcela
            </DialogDescription>
          </DialogHeader>

          {parcelaBaixa && (
            <div className="space-y-4 py-4">
              <div className="p-4 bg-muted rounded-lg space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Cliente:</span>
                  <span className="font-medium">{parcelaBaixa.cliente_nome}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Parcela:</span>
                  <span className="font-medium">{parcelaBaixa.numero_parcela}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Valor:</span>
                  <span className="font-medium text-green-600">
                    {formatarValor(parcelaBaixa.valor_parcela)}
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="valor-pago">Valor Pago *</Label>
                <Input
                  id="valor-pago"
                  placeholder="Ex: 100,00"
                  value={valorPago}
                  onChange={(e) => {
                    const valor = e.target.value.replace(/[^\d,]/g, '');
                    setValorPago(valor);
                  }}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="data-pag">Data do Pagamento *</Label>
                <Input
                  id="data-pag"
                  type="date"
                  value={dataPagamento}
                  onChange={(e) => setDataPagamento(e.target.value)}
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setModalBaixaAberto(false)}>
              Cancelar
            </Button>
            <Button onClick={handleDarBaixa}>
              Confirmar Baixa
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
