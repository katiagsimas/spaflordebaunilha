import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import DarBaixaDialog from '@/components/financeiro/DarBaixaDialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
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
import { Plus, MoreVertical, Eye, DollarSign, Edit, Trash2, Info, Filter, Calendar, ChevronDown, X, Download, CheckSquare, Square } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import * as XLSX from 'xlsx';

export default function ContasReceber() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [parcelas, setParcelas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Dados para os filtros
  const [planoContas, setPlanoContas] = useState<any[]>([]);
  const [clientes, setClientes] = useState<any[]>([]);
  const [categorias, setCategorias] = useState<any[]>([]);
  const [tiposDocumento, setTiposDocumento] = useState<any[]>([]);
  const [bancos, setBancos] = useState<any[]>([]);

  // Filtros
  const [visualizacao, setVisualizacao] = useState<'ativas' | 'pagas'>('ativas'); // Novo filtro principal
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
  const [filtroPlanoContasId, setFiltroPlanoContasId] = useState('');
  const [filtroClienteId, setFiltroClienteId] = useState('');
  const [filtroCategoriaId, setFiltroCategoriaId] = useState('');
  const [filtroTipoDocId, setFiltroTipoDocId] = useState('');
  const [filtroBancoId, setFiltroBancoId] = useState('');

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

  useEffect(() => {
    fetchParcelas();
    fetchDadosFiltros();
    fetchConfigJuros();
  }, []);

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
        .eq('ativo', true)
        .order('descricao');
      
      setTiposDocumento(tiposData || []);

      // Buscar bancos
      const { data: bancosData } = await supabase
        .from('bancos')
        .select('*')
        .eq('usuario_id', user.id)
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
    // Filtro principal: Ativas (não pagas) vs Pagas
    if (visualizacao === 'ativas') {
      // Mostrar apenas parcelas que NÃO estão pagas ou adiantadas
      if (p.status === 'pago' || p.status === 'adiantado') {
        return false;
      }
    } else if (visualizacao === 'pagas') {
      // Mostrar apenas parcelas pagas ou adiantadas
      if (p.status !== 'pago' && p.status !== 'adiantado') {
        return false;
      }
    }
    
    // Filtro de status (secundário)
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

  const limparFiltros = () => {
    setFiltroStatus('todos');
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

      {/* Filtro Principal - Visualização */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <Label className="font-semibold">Visualização</Label>
        </div>
        
        <div className="flex gap-3">
          <Button
            variant={visualizacao === 'ativas' ? 'default' : 'outline'}
            size="lg"
            onClick={() => {
              setVisualizacao('ativas');
              setFiltroStatus('todos');
            }}
            className="flex-1"
          >
            📋 Contas Ativas
          </Button>
          <Button
            variant={visualizacao === 'pagas' ? 'default' : 'outline'}
            size="lg"
            onClick={() => {
              setVisualizacao('pagas');
              setFiltroStatus('todos');
            }}
            className="flex-1"
          >
            ✅ Contas Pagas
          </Button>
        </div>
      </div>

      {/* Filtros Pré-Definidos */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <Label>Filtros de Status</Label>
        </div>
        
        <div className="flex flex-wrap gap-2">
          <Button
            variant={filtroStatus === 'todos' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFiltroStatus('todos')}
          >
            Todos {visualizacao === 'ativas' ? '(Ativas)' : '(Pagas)'}
          </Button>
          
          {visualizacao === 'ativas' ? (
            <>
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
                variant={filtroStatus === 'vencido' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFiltroStatus('vencido')}
              >
                Vencido
              </Button>
              <Button
                variant={filtroStatus === 'atrasado' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFiltroStatus('atrasado')}
              >
                Atrasado
              </Button>
            </>
          ) : (
            <>
              <Button
                variant={filtroStatus === 'pago' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFiltroStatus('pago')}
              >
                Pago
              </Button>
              <Button
                variant={filtroStatus === 'adiantado' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFiltroStatus('adiantado')}
              >
                Adiantado
              </Button>
            </>
          )}
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
      <Collapsible open={maisOpcoesOpen} onOpenChange={setMaisOpcoesOpen} className="w-full space-y-4">
        <div className="flex flex-wrap gap-2">
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

          <Button variant="outline" size="sm" onClick={exportarParaExcel}>
            <Download className="mr-2 h-4 w-4" />
            Exportar para Excel
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
              <Select value={filtroClienteId} onValueChange={setFiltroClienteId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos</SelectItem>
                  {clientes.map((cliente) => (
                    <SelectItem key={cliente.id} value={cliente.id}>
                      {cliente.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
