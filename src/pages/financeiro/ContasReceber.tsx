import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import DarBaixaDialog from '@/components/financeiro/DarBaixaDialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { DatePickerField } from '@/components/DatePickerField';
import { LoadingState } from '@/components/LoadingState';
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
import { Plus, MoreVertical, Eye, DollarSign, Edit, Trash2, Info, Filter, Calendar, ChevronDown, X, Download, CheckSquare, Square, TrendingUp, CheckCircle2, AlertTriangle, ChevronsUpDown, Check } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from '@/components/ui/command';
import { cn } from '@/lib/utils';
import * as XLSX from '@/lib/xlsxShim';
import { BackButton } from '@/components/BackButton';
import { FinanceiroNav } from '@/components/financeiro/FinanceiroNav';
import { PageHeader } from '@/components/PageHeader';
import { Card, CardContent } from '@/components/ui/card';

export default function ContasReceber() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [parcelas, setParcelas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Dashboard
  const [dashboard, setDashboard] = useState({
    total_a_receber: 0,
    total_recebido: 0,
    total_atrasado: 0,
    vencendo_hoje: 0,
  });

  // Dados para os filtros
  const [planoContas, setPlanoContas] = useState<any[]>([]);
  const [clientes, setClientes] = useState<any[]>([]);
  const [categorias, setCategorias] = useState<any[]>([]);
  const [tiposDocumento, setTiposDocumento] = useState<any[]>([]);
  const [bancos, setBancos] = useState<any[]>([]);

  // Filtros
  const [visualizacao, setVisualizacao] = useState<'ativas' | 'pagas'>('ativas'); // Novo filtro principal
  const [filtroStatus, setFiltroStatus] = useState('aberto'); // Fixado em "aberto" por padrão
  
  // Filtros de Data
  const [dataEmissaoInicial, setDataEmissaoInicial] = useState<Date | undefined>();
  const [dataEmissaoFinal, setDataEmissaoFinal] = useState<Date | undefined>();
  const [dataPagamentoInicial, setDataPagamentoInicial] = useState<Date | undefined>();
  const [dataPagamentoFinal, setDataPagamentoFinal] = useState<Date | undefined>();
  const [dataVencimentoInicial, setDataVencimentoInicial] = useState<Date | undefined>();
  const [dataVencimentoFinal, setDataVencimentoFinal] = useState<Date | undefined>();

  // Mais opções de busca
  const [maisOpcoesOpen, setMaisOpcoesOpen] = useState(false);
  const [filtroPlanoContasId, setFiltroPlanoContasId] = useState('');
  const [filtroClienteId, setFiltroClienteId] = useState('');
  const [filtroCategoriaId, setFiltroCategoriaId] = useState('');
  const [filtroTipoDocId, setFiltroTipoDocId] = useState('');
  const [filtroBancoId, setFiltroBancoId] = useState('');
  
  // Estados para combobox de cliente
  const [openCliente, setOpenCliente] = useState(false);

  // Modal de baixa
  const [darBaixaOpen, setDarBaixaOpen] = useState(false);
  const [parcelaSelecionada, setParcelaSelecionada] = useState<any>(null);

  // Estados para seleção múltipla e ações em lote
  const [parcelasSelecionadas, setParcelasSelecionadas] = useState(new Set<string>());
  const [modoSelecao, setModoSelecao] = useState(false);
  const [modalBaixaLote, setModalBaixaLote] = useState(false);
  const [dataPagamentoLote, setDataPagamentoLote] = useState(new Date().toISOString().split('T')[0]);
  const [bancoIdLote, setBancoIdLote] = useState('');
  const [tipoDocumentoIdLote, setTipoDocumentoIdLote] = useState('');
  const [observacaoLote, setObservacaoLote] = useState('');
  const [configJuros, setConfigJuros] = useState<any>(null);
  
  // Estados para paginação e busca
  const [porPagina, setPorPagina] = useState(10);
  const [buscaNome, setBuscaNome] = useState('');

  useEffect(() => {
    fetchDashboard();
    fetchParcelas();
    fetchDadosFiltros();
    fetchConfigJuros();
  }, []);

  const fetchDashboard = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from('vw_contas_receber_parcelas')
        .select('*')
        .eq('user_id', user.id);

      let totalAReceber = 0;
      let totalRecebido = 0;
      let totalAtrasado = 0;
      let vencendoHoje = 0;
      const hoje = new Date().toISOString().split('T')[0];

      data?.forEach((p: any) => {
        if (p.status === 'aberto' || p.status === 'atrasado' || p.status === 'pagamento_parcial') {
          totalAReceber += (p.valor_parcela - (p.valor_pago || 0));
        }
        if (p.status === 'pago' || p.status === 'adiantado') {
          totalRecebido += p.valor_pago || 0;
        }
        if (p.status === 'pagamento_parcial') {
          totalRecebido += p.valor_pago || 0;
        }
        if (p.status === 'atrasado') {
          totalAtrasado += (p.valor_parcela - (p.valor_pago || 0));
        }
        if (p.data_vencimento === hoje && (p.status === 'aberto' || p.status === 'pagamento_parcial')) {
          vencendoHoje += (p.valor_parcela - (p.valor_pago || 0));
        }
      });

      setDashboard({
        total_a_receber: totalAReceber,
        total_recebido: totalRecebido,
        total_atrasado: totalAtrasado,
        vencendo_hoje: vencendoHoje,
      });
    } catch (error) {
      console.error('Erro ao buscar dashboard:', error);
    }
  };

  const fetchDadosFiltros = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Buscar planos de contas
      const { data: planosData } = await supabase
        .from('plano_contas')
        .select('*')
        .eq('user_id', user.id)
        .eq('ativo', true)
        .order('codigo');
      
      setPlanoContas(planosData || []);

      // Buscar clientes
      const { data: clientesData } = await supabase
        .from('clientes')
        .select('*')
        .eq('usuario_id', user.id)
        .order('nome');
      
      setClientes(clientesData || []);

      // Buscar categorias
      const { data: categoriasData } = await supabase
        .from('categorias_plano_contas')
        .select('*')
        .eq('user_id', user.id)
        .eq('ativo', true)
        .order('codigo');
      
      setCategorias(categoriasData || []);

      // Buscar tipos de documento
      const { data: tiposData } = await supabase
        .from('tipos_documento')
        .select('*')
        .eq('usuario_id', user.id)
        .eq('habilitado', true)
        .eq('ativo', true)
        .order('descricao');
      
      setTiposDocumento(tiposData || []);

      // Buscar bancos habilitados
      const { data: bancosData } = await supabase
        .from('bancos')
        .select('*')
        .eq('usuario_id', user.id)
        .eq('habilitado', true)
        .order('nome');
      
      setBancos(bancosData || []);
    } catch (error) {
      console.error('Erro ao buscar dados dos filtros:', error);
    }
  };

  const fetchConfigJuros = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from('configuracoes_juros')
        .select('*')
        .eq('usuario_id', user.id)
        .maybeSingle();

      setConfigJuros(data);
    } catch (error) {
      console.error('Erro ao buscar config juros:', error);
    }
  };

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

  const handleSelecionarTodos = () => {
    if (parcelasSelecionadas.size === parcelasFiltradas.length) {
      setParcelasSelecionadas(new Set());
    } else {
      const novoSet = new Set(parcelasFiltradas.map(p => p.id));
      setParcelasSelecionadas(novoSet);
    }
  };

  const handleToggleSelecao = (parcelaId: string) => {
    const novoSet = new Set(parcelasSelecionadas);
    if (novoSet.has(parcelaId)) {
      novoSet.delete(parcelaId);
    } else {
      novoSet.add(parcelaId);
    }
    setParcelasSelecionadas(novoSet);
  };

  const handleLimparSelecao = () => {
    setParcelasSelecionadas(new Set());
    setModoSelecao(false);
  };

  const handleAbrirBaixaLote = () => {
    if (parcelasSelecionadas.size === 0) {
      toast({
        title: 'Aviso',
        description: 'Selecione pelo menos uma parcela!',
        variant: 'default',
      });
      return;
    }

    const parcelasEmAberto = parcelasFiltradas.filter(
      p => parcelasSelecionadas.has(p.id) && 
      (p.status === 'aberto' || p.status === 'atrasado' || p.status === 'pagamento_parcial')
    );

    if (parcelasEmAberto.length === 0) {
      toast({
        title: 'Aviso',
        description: 'Nenhuma parcela em aberto foi selecionada!',
        variant: 'default',
      });
      return;
    }

    if (parcelasEmAberto.length < parcelasSelecionadas.size) {
      toast({
        title: 'Aviso',
        description: `${parcelasSelecionadas.size - parcelasEmAberto.length} parcela(s) já está(ão) paga(s) e será(ão) ignorada(s).`,
        variant: 'default',
      });
    }

    setDataPagamentoLote(new Date().toISOString().split('T')[0]);
    setBancoIdLote('');
    setTipoDocumentoIdLote('');
    setObservacaoLote('');
    setModalBaixaLote(true);
  };

  const handleConfirmarBaixaLote = async () => {
    try {
      if (!bancoIdLote) {
        toast({
          title: 'Erro',
          description: 'Selecione o banco!',
          variant: 'destructive',
        });
        return;
      }

      if (!tipoDocumentoIdLote) {
        toast({
          title: 'Erro',
          description: 'Selecione o tipo de documento!',
          variant: 'destructive',
        });
        return;
      }

      const parcelasParaBaixa = parcelasFiltradas.filter(
        p => parcelasSelecionadas.has(p.id) && 
        (p.status === 'aberto' || p.status === 'atrasado' || p.status === 'pagamento_parcial')
      );

      let sucessos = 0;
      let erros = 0;

      for (const parcela of parcelasParaBaixa) {
        try {
          const valorRestante = parcela.valor_parcela - (parcela.valor_pago || 0);

          let juros = 0;
          if (configJuros && configJuros.cobrar_juros) {
            const venc = new Date(parcela.data_vencimento + 'T00:00:00');
            const pag = new Date(dataPagamentoLote + 'T00:00:00');
            const diffDays = Math.ceil((pag.getTime() - venc.getTime()) / (1000 * 60 * 60 * 24));
            
            if (diffDays > 0) {
              if (configJuros.tipo_juros === 'mensal') {
                const taxaDia = configJuros.percentual_juros / 30;
                juros = valorRestante * (taxaDia / 100) * diffDays;
              } else {
                juros = valorRestante * (configJuros.percentual_juros / 100) * diffDays;
              }
              
              if (configJuros.multa_atraso) {
                juros += valorRestante * (configJuros.percentual_multa / 100);
              }
            }
          }

          const { error } = await supabase
            .from('contas_receber_pagamentos')
            .insert({
              parcela_id: parcela.id,
              data_pagamento: dataPagamentoLote,
              valor_pago: valorRestante,
              juros: juros,
              desconto: 0,
              banco_id: bancoIdLote,
              tipo_documento_id: tipoDocumentoIdLote,
              observacao: observacaoLote.trim() || null,
            });

          if (error) throw error;
          sucessos++;
        } catch (error) {
          console.error('Erro ao dar baixa na parcela:', parcela.id, error);
          erros++;
        }
      }

      toast({
        title: '✅ Baixa em lote concluída',
        description: `${sucessos} parcela(s) recebida(s) com sucesso${erros > 0 ? `. ${erros} erro(s).` : '!'}`,
      });

      setModalBaixaLote(false);
      handleLimparSelecao();
      fetchParcelas();
      fetchDashboard();
    } catch (error) {
      console.error('Erro ao processar baixa em lote:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível processar a baixa em lote.',
        variant: 'destructive',
      });
    }
  };

  const handleExcluirLote = async () => {
    try {
      if (parcelasSelecionadas.size === 0) {
        toast({
          title: 'Aviso',
          description: 'Selecione pelo menos uma parcela!',
          variant: 'default',
        });
        return;
      }

      const confirmar = window.confirm(
        `Tem certeza que deseja excluir ${parcelasSelecionadas.size} parcela(s)?\n\n` +
        `Esta ação não pode ser desfeita e excluirá todos os pagamentos relacionados.`
      );

      if (!confirmar) return;

      const ids = Array.from(parcelasSelecionadas);
      
      const { error } = await supabase
        .from('contas_receber_parcelas')
        .delete()
        .in('id', ids);

      if (error) throw error;

      toast({
        title: '✅ Parcelas excluídas',
        description: `${ids.length} parcela(s) excluída(s) com sucesso!`,
      });

      handleLimparSelecao();
      fetchParcelas();
      fetchDashboard();
    } catch (error) {
      console.error('Erro ao excluir em lote:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível excluir as parcelas.',
        variant: 'destructive',
      });
    }
  };

  const handleExportarSelecionadas = () => {
    try {
      if (parcelasSelecionadas.size === 0) {
        toast({
          title: 'Aviso',
          description: 'Selecione pelo menos uma parcela!',
          variant: 'default',
        });
        return;
      }

      const parcelasExportar = parcelasFiltradas.filter(p => parcelasSelecionadas.has(p.id));

      const dadosExportacao = parcelasExportar.map(p => ({
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
      XLSX.utils.book_append_sheet(wb, ws, 'Selecionadas');
      XLSX.writeFile(wb, `contas_receber_selecionadas_${new Date().toISOString().split('T')[0]}.xlsx`);

      toast({
        title: '✅ Exportado',
        description: `${parcelasSelecionadas.size} parcela(s) exportada(s)!`,
      });
    } catch (error) {
      console.error('Erro ao exportar:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível exportar as parcelas.',
        variant: 'destructive',
      });
    }
  };

  const parcelasFiltradas = parcelas.filter(p => {
    // Filtro de status
    if (filtroStatus !== 'todos') {
      if (filtroStatus === 'aberto') {
        // "Em Aberto" inclui: aberto, atrasado e pagamento_parcial (todas que ainda não foram totalmente pagas)
        if (!['aberto', 'atrasado', 'pagamento_parcial'].includes(p.status)) {
          return false;
        }
      } else if (filtroStatus === 'vencido') {
        // "Vencido" mostra apenas atrasadas
        if (p.status !== 'atrasado') {
          return false;
        }
      } else {
        // Para outros filtros específicos (pago, adiantado, pagamento_parcial)
        if (p.status !== filtroStatus) {
          return false;
        }
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
    if (filtroPlanoContasId && p.plano_conta_id !== filtroPlanoContasId) {
      return false;
    }
    if (filtroClienteId && p.cliente_id !== filtroClienteId) {
      return false;
    }
    if (filtroCategoriaId) {
      const plano = planoContas.find(pc => pc.id === p.plano_conta_id);
      if (!plano || plano.categoria_id !== filtroCategoriaId) {
        return false;
      }
    }
    if (filtroTipoDocId && p.tipo_documento_id !== filtroTipoDocId) {
      return false;
    }
    if (filtroBancoId && p.banco_id !== filtroBancoId) {
      return false;
    }

    return true;
  });
  
  // Paginação
  const parcelasPaginadas = parcelasFiltradas.slice(0, porPagina);

  const limparFiltros = () => {
    setFiltroStatus('aberto'); // Volta para "aberto" ao limpar filtros
    setDataEmissaoInicial(undefined);
    setDataEmissaoFinal(undefined);
    setDataPagamentoInicial(undefined);
    setDataPagamentoFinal(undefined);
    setDataVencimentoInicial(undefined);
    setDataVencimentoFinal(undefined);
    setFiltroPlanoContasId('');
    setFiltroClienteId('');
    setFiltroCategoriaId('');
    setFiltroTipoDocId('');
    setFiltroBancoId('');
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
      fetchDashboard();
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
      pago: <Badge className="bg-success/15 text-success border-success/40">Pago</Badge>,
      pagamento_parcial: <Badge className="bg-warning/15 text-warning border-warning/40">Pagamento Parcial</Badge>,
      atrasado: <Badge className="bg-sfb-coral/15 text-sfb-coral border-sfb-coral/40">Atrasado</Badge>,
      vencido: <Badge className="bg-sfb-coral/15 text-sfb-coral border-sfb-coral/40">Vencido</Badge>,
      adiantado: <Badge className="bg-sfb-areia/15 text-primary border-sfb-areia/40">Adiantado</Badge>,
    };
    return badges[status] || <Badge variant="outline">{status}</Badge>;
  };

  if (loading) return <LoadingState message="Carregando Contas a Receber" submessage="Buscando suas receitas..." />;

  return (
    <div className="container mx-auto px-6 pt-1 pb-6 space-y-6">
      <PageHeader
        title="Contas a Receber"
        description="Gerencie seus recebimentos aqui"
        backButton={
          <div className="flex flex-wrap items-center gap-2">
            <BackButton to="/financeiro" />
            <FinanceiroNav current="/financeiro/contas-receber" />
          </div>
        }
      />

      {/* Dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
        <Card className="border-l-4 border-l-green-500">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-success/15 rounded-lg">
                <TrendingUp className="h-4 w-4 text-success" />
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground">A Receber</p>
                <p className="text-lg font-bold text-success">
                  {formatarValor(dashboard.total_a_receber)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-blue-500">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-sfb-areia/15 rounded-lg">
                <CheckCircle2 className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground">Recebido</p>
                <p className="text-lg font-bold text-primary">
                  {formatarValor(dashboard.total_recebido)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-orange-500">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-warning/15 rounded-lg">
                <AlertTriangle className="h-4 w-4 text-warning" />
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground">Em Atraso</p>
                <p className="text-lg font-bold text-warning">
                  {formatarValor(dashboard.total_atrasado)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-purple-500">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-sfb-pink/20 rounded-lg">
                <Calendar className="h-4 w-4 text-sfb-pink" />
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground">Vence Hoje</p>
                <p className="text-lg font-bold text-sfb-pink">
                  {formatarValor(dashboard.vencendo_hoje)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Botão Adicionar */}
      <div className="flex justify-start">
        <Button onClick={() => navigate('/financeiro/contas-receber/nova')}>
          <Plus className="mr-2 h-4 w-4" />
          Adicionar Conta a Receber
        </Button>
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

      {/* Filtros de Status + Mais Opções de Busca + Limpar + Exportar */}
      <Collapsible open={maisOpcoesOpen} onOpenChange={setMaisOpcoesOpen} className="w-full space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          {/* Filtros de Status */}
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

          {/* Separador visual */}
          <div className="h-8 w-px bg-border mx-1" />

          {/* Mais Opções de Busca */}
          <CollapsibleTrigger asChild>
            <Button 
              variant={maisOpcoesOpen ? 'default' : 'outline'}
              size="sm"
            >
              <Filter className="mr-2 h-4 w-4" />
              Mais opções de Busca
              <ChevronDown className={`ml-2 h-4 w-4 transition-transform ${maisOpcoesOpen ? 'rotate-180' : ''}`} />
            </Button>
          </CollapsibleTrigger>

          <Button variant="default" size="sm" onClick={limparFiltros}>
            <X className="mr-2 h-4 w-4" />
            Limpar Filtros
          </Button>
        </div>

        <CollapsibleContent>
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 p-4 border rounded-lg bg-muted/30">
            <div className="space-y-2">
              <Label className="text-sm">Plano de Contas</Label>
              <Select value={filtroPlanoContasId} onValueChange={setFiltroPlanoContasId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos</SelectItem>
                  {planoContas.map((plano) => (
                    <SelectItem key={plano.id} value={plano.id}>
                      {plano.codigo} - {plano.descricao}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label className="text-sm">Cliente</Label>
              <Popover open={openCliente} onOpenChange={setOpenCliente}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={openCliente}
                    className="w-full justify-between"
                  >
                    {filtroClienteId && filtroClienteId !== 'todos'
                      ? clientes.find((c) => c.id === filtroClienteId)?.nome || "Selecione..."
                      : filtroClienteId === 'todos'
                      ? "Todos"
                      : "Selecione..."}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-full p-0 bg-background" align="start">
                  <Command>
                    <CommandInput placeholder="Digite para buscar..." />
                    <CommandEmpty>Nenhum cliente encontrado.</CommandEmpty>
                    <CommandGroup className="max-h-64 overflow-auto">
                      <CommandItem
                        value="todos"
                        onSelect={() => {
                          setFiltroClienteId('todos');
                          setOpenCliente(false);
                        }}
                      >
                        <Check
                          className={cn(
                            "mr-2 h-4 w-4",
                            filtroClienteId === 'todos' ? "opacity-100" : "opacity-0"
                          )}
                        />
                        Todos
                      </CommandItem>
                      {clientes.map((cliente) => (
                        <CommandItem
                          key={cliente.id}
                          value={cliente.nome}
                          onSelect={() => {
                            setFiltroClienteId(cliente.id);
                            setOpenCliente(false);
                          }}
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              filtroClienteId === cliente.id ? "opacity-100" : "opacity-0"
                            )}
                          />
                          {cliente.nome}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>
            
            <div className="space-y-2">
              <Label className="text-sm">Categoria do Plano de Contas</Label>
              <Select value={filtroCategoriaId} onValueChange={setFiltroCategoriaId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos</SelectItem>
                  {categorias.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.codigo} - {cat.descricao}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label className="text-sm">Tipo de Documento</Label>
              <Select value={filtroTipoDocId} onValueChange={setFiltroTipoDocId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos</SelectItem>
                  {tiposDocumento.map((tipo) => (
                    <SelectItem key={tipo.id} value={tipo.id}>
                      {tipo.descricao}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label className="text-sm">Banco</Label>
              <Select value={filtroBancoId} onValueChange={setFiltroBancoId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos</SelectItem>
                  {bancos.map((banco) => (
                    <SelectItem key={banco.id} value={banco.id}>
                      {banco.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CollapsibleContent>
      </Collapsible>

      {/* Card de Controles */}
      <div className="border rounded-lg p-4 space-y-4">
        {/* Controles */}
        <div className="flex items-center gap-4">
          {/* Resultados por Página - Esquerda */}
          <div className="flex items-center gap-2">
            <Select value={porPagina.toString()} onValueChange={(value) => setPorPagina(Number(value))}>
              <SelectTrigger className="w-20 bg-popover">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-popover z-50">
                <SelectItem value="10">10</SelectItem>
                <SelectItem value="25">25</SelectItem>
                <SelectItem value="50">50</SelectItem>
                <SelectItem value="100">100</SelectItem>
              </SelectContent>
            </Select>
            <span className="text-sm text-muted-foreground whitespace-nowrap">Resultados por Página</span>
          </div>

          <Button variant="outline" size="sm" onClick={exportarParaExcel}>
            <Download className="mr-2 h-4 w-4" />
            Exportar .xlsx
          </Button>
          
        </div>
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
            {parcelasPaginadas.length === 0 ? (
              <TableRow>
                <TableCell colSpan={12} className="text-center py-8 text-muted-foreground">
                  Nenhuma parcela encontrada.
                </TableCell>
              </TableRow>
            ) : (
              parcelasPaginadas.map(parcela => (
                <TableRow key={parcela.id}>
                  <TableCell>{parcela.tipo_documento_descricao || 'N/A'}</TableCell>
                  <TableCell>{formatarData(parcela.data_emissao)}</TableCell>
                  <TableCell className="text-sm">
                    {parcela.plano_contas_codigo} - {parcela.plano_contas_descricao}
                  </TableCell>
                  <TableCell className="font-medium">{parcela.cliente_nome || 'N/A'}</TableCell>
                  <TableCell>{formatarData(parcela.data_vencimento)}</TableCell>
                  <TableCell className="text-success font-medium">
                    {formatarValor(parcela.valor_total)}
                  </TableCell>
                  <TableCell className="font-mono font-medium">
                    {parcela.numero_parcela} de {parcela.numero_parcelas}
                  </TableCell>
                  <TableCell className="text-success font-medium">
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
                          className="text-sfb-coral"
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
