import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import DarBaixaDialog from '@/components/financeiro/DarBaixaDialog';
import { Label } from '@/components/ui/label';
import { DatePickerField } from '@/components/DatePickerField';
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
import { Plus, MoreVertical, Eye, DollarSign, Edit, Trash2, Info, Filter, Calendar, ChevronDown, X, Download } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import * as XLSX from 'xlsx';

export default function ContasReceber() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [parcelas, setParcelas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Filtros
  const [filtroStatus, setFiltroStatus] = useState('todos');
  
  // Filtros de Data
  const [dataEmissaoInicial, setDataEmissaoInicial] = useState<Date | undefined>();
  const [dataEmissaoFinal, setDataEmissaoFinal] = useState<Date | undefined>();
  const [dataPagamentoInicial, setDataPagamentoInicial] = useState<Date | undefined>();
  const [dataPagamentoFinal, setDataPagamentoFinal] = useState<Date | undefined>();
  const [dataVencimentoInicial, setDataVencimentoInicial] = useState<Date | undefined>();
  const [dataVencimentoFinal, setDataVencimentoFinal] = useState<Date | undefined>();

  // Mais opções de busca
  const [maisOpcoesOpen, setMaisOpcoesOpen] = useState(false);
  const [filtroPlanoContas, setFiltroPlanoContas] = useState('');
  const [filtroCliente, setFiltroCliente] = useState('');
  const [filtroCategoria, setFiltroCategoria] = useState('');
  const [filtroTipoDoc, setFiltroTipoDoc] = useState('');
  const [filtroBanco, setFiltroBanco] = useState('');

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
    // Filtro de status
    if (filtroStatus !== 'todos') {
      // Tratar "vencido" como sinônimo de "atrasado"
      if (filtroStatus === 'vencido' && p.status !== 'atrasado') {
        return false;
      } else if (filtroStatus !== 'vencido' && p.status !== filtroStatus) {
        return false;
      }
    }

    // Filtro de Data de Emissão
    if (dataEmissaoInicial && p.data_emissao) {
      const dataEmissao = new Date(p.data_emissao + 'T00:00:00');
      if (dataEmissao < dataEmissaoInicial) return false;
    }
    if (dataEmissaoFinal && p.data_emissao) {
      const dataEmissao = new Date(p.data_emissao + 'T00:00:00');
      if (dataEmissao > dataEmissaoFinal) return false;
    }

    // Filtro de Data de Pagamento
    if (dataPagamentoInicial && p.data_pagamento) {
      const dataPagamento = new Date(p.data_pagamento + 'T00:00:00');
      if (dataPagamento < dataPagamentoInicial) return false;
    }
    if (dataPagamentoFinal && p.data_pagamento) {
      const dataPagamento = new Date(p.data_pagamento + 'T00:00:00');
      if (dataPagamento > dataPagamentoFinal) return false;
    }

    // Filtro de Data de Vencimento
    if (dataVencimentoInicial && p.data_vencimento) {
      const dataVencimento = new Date(p.data_vencimento + 'T00:00:00');
      if (dataVencimento < dataVencimentoInicial) return false;
    }
    if (dataVencimentoFinal && p.data_vencimento) {
      const dataVencimento = new Date(p.data_vencimento + 'T00:00:00');
      if (dataVencimento > dataVencimentoFinal) return false;
    }

    // Mais opções de busca
    if (filtroPlanoContas && p.plano_contas_descricao) {
      if (!p.plano_contas_descricao.toLowerCase().includes(filtroPlanoContas.toLowerCase())) {
        return false;
      }
    }
    if (filtroCliente && p.cliente_nome) {
      if (!p.cliente_nome.toLowerCase().includes(filtroCliente.toLowerCase())) {
        return false;
      }
    }
    if (filtroCategoria && p.plano_contas_codigo) {
      if (!p.plano_contas_codigo.toLowerCase().includes(filtroCategoria.toLowerCase())) {
        return false;
      }
    }
    if (filtroTipoDoc && p.tipo_documento_descricao) {
      if (!p.tipo_documento_descricao.toLowerCase().includes(filtroTipoDoc.toLowerCase())) {
        return false;
      }
    }
    if (filtroBanco && p.banco_nome) {
      if (!p.banco_nome.toLowerCase().includes(filtroBanco.toLowerCase())) {
        return false;
      }
    }

    return true;
  });

  const limparFiltros = () => {
    setFiltroStatus('todos');
    setDataEmissaoInicial(undefined);
    setDataEmissaoFinal(undefined);
    setDataPagamentoInicial(undefined);
    setDataPagamentoFinal(undefined);
    setDataVencimentoInicial(undefined);
    setDataVencimentoFinal(undefined);
    setFiltroPlanoContas('');
    setFiltroCliente('');
    setFiltroCategoria('');
    setFiltroTipoDoc('');
    setFiltroBanco('');
  };

  const exportarParaExcel = () => {
    const dadosExportacao = parcelasFiltradas.map(p => ({
      'Documento': p.tipo_documento_descricao || 'N/A',
      'Emissão': formatarData(p.data_emissao),
      'Plano Contas': `${p.plano_contas_codigo} - ${p.plano_contas_descricao}`,
      'Cliente': p.cliente_nome || 'N/A',
      'Vencimento': formatarData(p.data_vencimento),
      'Valor Total': p.valor_total,
      'Parcela': `${p.numero_parcela} de ${p.numero_parcelas}`,
      'Valor a Pagar': p.valor_parcela,
      'Valor Pago': p.valor_pago || 0,
      'Data Pagamento': formatarData(p.data_pagamento),
      'Status': p.status,
      'Banco': p.banco_nome || 'N/A',
    }));

    const ws = XLSX.utils.json_to_sheet(dadosExportacao);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Contas a Receber');
    XLSX.writeFile(wb, `contas-receber-${new Date().toISOString().split('T')[0]}.xlsx`);
    
    toast({
      title: '✅ Exportado',
      description: 'Dados exportados para Excel com sucesso!',
    });
  };

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

      {/* Filtros de Data */}
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Data de Emissão */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 mb-3">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <Label className="text-sm">Data de Emissão</Label>
            </div>
            <div className="flex gap-2">
              <DatePickerField
                value={dataEmissaoInicial}
                onChange={setDataEmissaoInicial}
                placeholder="Inicial"
                className="flex-1"
              />
              <DatePickerField
                value={dataEmissaoFinal}
                onChange={setDataEmissaoFinal}
                placeholder="Final"
                className="flex-1"
              />
            </div>
          </div>

          {/* Data de Pagamento */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 mb-3">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <Label className="text-sm">Data de Pagamento</Label>
            </div>
            <div className="flex gap-2">
              <DatePickerField
                value={dataPagamentoInicial}
                onChange={setDataPagamentoInicial}
                placeholder="Inicial"
                className="flex-1"
              />
              <DatePickerField
                value={dataPagamentoFinal}
                onChange={setDataPagamentoFinal}
                placeholder="Final"
                className="flex-1"
              />
            </div>
          </div>

          {/* Data de Vencimento */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 mb-3">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <Label className="text-sm">Data de Vencimento</Label>
            </div>
            <div className="flex gap-2">
              <DatePickerField
                value={dataVencimentoInicial}
                onChange={setDataVencimentoInicial}
                placeholder="Inicial"
                className="flex-1"
              />
              <DatePickerField
                value={dataVencimentoFinal}
                onChange={setDataVencimentoFinal}
                placeholder="Final"
                className="flex-1"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Mais Opções de Busca + Limpar + Exportar */}
      <div className="flex flex-wrap gap-2">
        <Collapsible open={maisOpcoesOpen} onOpenChange={setMaisOpcoesOpen}>
          <CollapsibleTrigger asChild>
            <Button variant="outline" size="sm">
              <Filter className="mr-2 h-4 w-4" />
              Mais opções de Busca
              <ChevronDown className={`ml-2 h-4 w-4 transition-transform ${maisOpcoesOpen ? 'rotate-180' : ''}`} />
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="mt-4">
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 p-4 border rounded-lg bg-muted/30">
              <div className="space-y-2">
                <Label className="text-sm">Plano de Contas</Label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border rounded-md text-sm"
                  placeholder="Buscar plano..."
                  value={filtroPlanoContas}
                  onChange={(e) => setFiltroPlanoContas(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm">Cliente</Label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border rounded-md text-sm"
                  placeholder="Buscar cliente..."
                  value={filtroCliente}
                  onChange={(e) => setFiltroCliente(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm">Categoria do Plano de Contas</Label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border rounded-md text-sm"
                  placeholder="Buscar categoria..."
                  value={filtroCategoria}
                  onChange={(e) => setFiltroCategoria(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm">Tipo de Documento</Label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border rounded-md text-sm"
                  placeholder="Buscar tipo..."
                  value={filtroTipoDoc}
                  onChange={(e) => setFiltroTipoDoc(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm">Banco</Label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border rounded-md text-sm"
                  placeholder="Buscar banco..."
                  value={filtroBanco}
                  onChange={(e) => setFiltroBanco(e.target.value)}
                />
              </div>
            </div>
          </CollapsibleContent>
        </Collapsible>

        <Button variant="outline" size="sm" onClick={limparFiltros}>
          <X className="mr-2 h-4 w-4" />
          Limpar Filtros
        </Button>

        <Button variant="outline" size="sm" onClick={exportarParaExcel}>
          <Download className="mr-2 h-4 w-4" />
          Exportar para Excel
        </Button>
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
