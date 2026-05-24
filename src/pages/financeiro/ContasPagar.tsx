import { useState, useEffect } from 'react';
import { DatePickerField } from '@/components/DatePickerField';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import DarBaixaPagarDialog from '@/components/financeiro/DarBaixaPagarDialog';
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
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { useToast } from '@/hooks/use-toast';
import { 
  Plus, 
  MoreVertical, 
  Eye, 
  DollarSign, 
  Edit, 
  Trash2, 
  Info,
  TrendingDown,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  X,
  Download,
  FileDown,
  Check,
  ChevronsUpDown
} from 'lucide-react';
import { BackButton } from '@/components/BackButton';
import { PageHeader } from '@/components/PageHeader';

export default function ContasPagar() {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [parcelas, setParcelas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Dashboard
  const [dashboard, setDashboard] = useState({
    total_a_pagar: 0,
    total_pago: 0,
    total_atrasado: 0,
    vencendo_hoje: 0,
  });

  // Filtros pré-definidos
  const [filtroStatus, setFiltroStatus] = useState('aberto'); // Fixado em "aberto" por padrão

  // Filtros avançados
  const [mostrarFiltrosAvancados, setMostrarFiltrosAvancados] = useState(false);
  const [dataEmissaoInicio, setDataEmissaoInicio] = useState<Date | undefined>();
  const [dataEmissaoFim, setDataEmissaoFim] = useState<Date | undefined>();
  const [dataPagamentoInicio, setDataPagamentoInicio] = useState<Date | undefined>();
  const [dataPagamentoFim, setDataPagamentoFim] = useState<Date | undefined>();
  const [dataVencimentoInicio, setDataVencimentoInicio] = useState<Date | undefined>();
  const [dataVencimentoFim, setDataVencimentoFim] = useState<Date | undefined>();
  const [fornecedorFiltro, setFornecedorFiltro] = useState('todos');
  const [planoContasFiltro, setPlanoContasFiltro] = useState('todos');
  const [categoriaFiltro, setCategoriaFiltro] = useState('todos');
  const [tipoDocumentoFiltro, setTipoDocumentoFiltro] = useState('todos');
  const [bancoFiltro, setBancoFiltro] = useState('todos');

  // Dados para filtros
  const [fornecedores, setFornecedores] = useState<any[]>([]);
  const [planosContas, setPlanosContas] = useState<any[]>([]);
  const [categorias, setCategorias] = useState<any[]>([]);
  const [tiposDocumento, setTiposDocumento] = useState<any[]>([]);
  const [bancos, setBancos] = useState<any[]>([]);

  // Seleção múltipla
  const [parcelasSelecionadas, setParcelasSelecionadas] = useState<Set<string>>(new Set());
  const [modoSelecao, setModoSelecao] = useState(false);

  // Estados para baixa em lote
  const [modalBaixaLote, setModalBaixaLote] = useState(false);
  const [dataPagamentoLote, setDataPagamentoLote] = useState(new Date().toISOString().split('T')[0]);
  const [bancoIdLote, setBancoIdLote] = useState('');
  const [tipoDocumentoIdLote, setTipoDocumentoIdLote] = useState('');
  const [observacaoLote, setObservacaoLote] = useState('');
  
  // Estados para paginação e busca
  const [porPagina, setPorPagina] = useState(10);
  const [openFornecedor, setOpenFornecedor] = useState(false);
  const [searchFornecedor, setSearchFornecedor] = useState('');

  // Modal de baixa individual
  const [darBaixaOpen, setDarBaixaOpen] = useState(false);
  const [parcelaSelecionadaBaixa, setParcelaSelecionadaBaixa] = useState<any>(null);

  // Config de juros
  const [configJuros, setConfigJuros] = useState<any>(null);

  useEffect(() => {
    fetchDashboard();
    fetchParcelas();
    fetchDadosFiltros();
    fetchConfigJuros();
  }, []);

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


  const fetchDashboard = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Buscar todas as parcelas das contas do usuário
      const { data } = await supabase
        .from('contas_pagar_parcelas' as any)
        .select(`
          *,
          conta:contas_pagar!inner (
            usuario_id
          )
        `)
        .eq('conta.usuario_id', user.id) as any;

      // Calcular totais manualmente
      let totalAPagar = 0;
      let totalPago = 0;
      let totalAtrasado = 0;
      let vencendoHoje = 0;
      const hoje = new Date().toISOString().split('T')[0];

      data?.forEach((p: any) => {
        if (p.status === 'aberto' || p.status === 'atrasado' || p.status === 'pagamento_parcial') {
          totalAPagar += (p.valor_parcela - (p.valor_pago || 0));
        }
        if (p.status === 'pago' || p.status === 'adiantado') {
          totalPago += p.valor_pago || 0;
        }
        if (p.status === 'pagamento_parcial') {
          totalPago += p.valor_pago || 0;
        }
        if (p.status === 'atrasado') {
          totalAtrasado += (p.valor_parcela - (p.valor_pago || 0));
        }
        if (p.data_vencimento === hoje && (p.status === 'aberto' || p.status === 'pagamento_parcial')) {
          vencendoHoje += (p.valor_parcela - (p.valor_pago || 0));
        }
      });

      setDashboard({
        total_a_pagar: totalAPagar,
        total_pago: totalPago,
        total_atrasado: totalAtrasado,
        vencendo_hoje: vencendoHoje,
      });
    } catch (error) {
      console.error('Erro ao buscar dashboard:', error);
    }
  };

  const fetchParcelas = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('contas_pagar_parcelas' as any)
        .select(`
          *,
          conta:contas_pagar!inner (
            id,
            fornecedor_id,
            tipo_documento_id,
            plano_contas_id,
            banco_id,
            tipo_lancamento,
            numero_parcelas,
            descricao,
            usuario_id,
            fornecedor:fornecedores (
              nome
            ),
            tipo_documento:tipos_documento (
              descricao
            ),
            plano_contas:plano_contas (
              codigo_estruturado,
              descricao,
              categoria_id
            ),
            banco:bancos (
              codigo,
              nome
            )
          )
        `)
        .eq('conta.usuario_id', user.id)
        .order('data_vencimento', { ascending: true }) as any;

      if (error) throw error;

      // Achatar estrutura
      const parcelasProcessadas = (data || []).map((p: any) => ({
        ...p,
        fornecedor_nome: p.conta?.fornecedor?.nome,
        tipo_documento_descricao: p.conta?.tipo_documento?.descricao,
        plano_contas_codigo: p.conta?.plano_contas?.codigo_estruturado,
        plano_contas_descricao: p.conta?.plano_contas?.descricao,
        plano_contas_categoria_id: p.conta?.plano_contas?.categoria_id,
        banco_codigo: p.conta?.banco?.codigo,
        banco_nome: p.conta?.banco?.nome,
        numero_parcelas: p.conta?.numero_parcelas,
        descricao_conta: p.conta?.descricao,
      }));

      setParcelas(parcelasProcessadas);
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

  const fetchDadosFiltros = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return;
        return;
      }

      

      // Fornecedores
      const { data: dataFornecedores, error: errorFornecedores } = await supabase
        .from('fornecedores' as any)
        .select('id, nome')
        .eq('usuario_id', user.id)
        .order('nome') as any;
      
      
      setFornecedores(dataFornecedores || []);

      // Planos de Contas (apenas débito/despesas)
      const { data: dataPlanos } = await supabase
        .from('plano_contas' as any)
        .select(`
          id,
          codigo_estruturado,
          descricao,
          categoria:categorias_plano_contas!inner (
            indicador
          )
        `)
        .eq('user_id', user.id)
        .eq('ativo', true)
        .eq('categoria.indicador', 'Debito')
        .order('codigo_estruturado') as any;
      
      setPlanosContas(dataPlanos || []);

      // Categorias (apenas débito)
      const { data: dataCategorias } = await supabase
        .from('categorias_plano_contas')
        .select('*')
        .eq('user_id', user.id)
        .eq('indicador', 'Debito')
        .order('descricao');
      setCategorias(dataCategorias || []);

      // Tipos de Documentos
      const { data: dataTipos } = await supabase
        .from('tipos_documento')
        .select('id, descricao')
        .eq('usuario_id', user.id)
        .eq('habilitado', true)
        .eq('ativo', true)
        .order('descricao');
      setTiposDocumento(dataTipos || []);

      // Bancos habilitados
      const { data: dataBancos } = await supabase
        .from('bancos')
        .select('id, codigo, nome')
        .eq('usuario_id', user.id)
        .eq('habilitado', true)
        .order('nome');
      setBancos(dataBancos || []);
    } catch (error) {
      console.error('Erro ao buscar dados de filtros:', error);
    }
  };

  const parcelasFiltradas = parcelas.filter((p: any) => {
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

    // Filtros de data
    if (dataEmissaoInicio && p.data_emissao < dataEmissaoInicio) return false;
    if (dataEmissaoFim && p.data_emissao > dataEmissaoFim) return false;
    if (dataPagamentoInicio && (!p.data_pagamento || p.data_pagamento < dataPagamentoInicio)) return false;
    if (dataPagamentoFim && (!p.data_pagamento || p.data_pagamento > dataPagamentoFim)) return false;
    if (dataVencimentoInicio && p.data_vencimento < dataVencimentoInicio) return false;
    if (dataVencimentoFim && p.data_vencimento > dataVencimentoFim) return false;

    // Filtros avançados
    if (fornecedorFiltro !== 'todos' && p.conta?.fornecedor_id !== fornecedorFiltro) return false;
    if (planoContasFiltro !== 'todos' && p.conta?.plano_conta_id !== planoContasFiltro) return false;
    if (categoriaFiltro !== 'todos' && p.plano_contas_categoria_id !== categoriaFiltro) return false;
    if (tipoDocumentoFiltro !== 'todos' && p.conta?.tipo_documento_id !== tipoDocumentoFiltro) return false;
    if (bancoFiltro !== 'todos' && p.conta?.banco_id !== bancoFiltro) return false;

    return true;
  });
  
  // Paginação
  const parcelasPaginadas = parcelasFiltradas.slice(0, porPagina);

  const limparFiltros = () => {
    setFiltroStatus('aberto'); // Volta para "aberto" ao limpar filtros
    setDataEmissaoInicio('');
    setDataEmissaoFim('');
    setDataPagamentoInicio('');
    setDataPagamentoFim('');
    setDataVencimentoInicio('');
    setDataVencimentoFim('');
    setFornecedorFiltro('todos');
    setPlanoContasFiltro('todos');
    setCategoriaFiltro('todos');
    setTipoDocumentoFiltro('todos');
    setBancoFiltro('todos');
  };

  const handleSelecionarTodos = () => {
    if (parcelasSelecionadas.size === parcelasFiltradas.length) {
      setParcelasSelecionadas(new Set());
    } else {
      const novoSet = new Set(parcelasFiltradas.map((p: any) => p.id));
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

  const handleExportarExcel = () => {
    const parcelasExportar = parcelasFiltradas;

    const csvData = parcelasExportar.map((p: any) => ({
      'Documento': p.tipo_documento_descricao || '',
      'Nº Documento': p.numero_documento || '',
      'Data Emissão': formatarData(p.data_emissao),
      'Plano de Contas': `${p.plano_contas_codigo} - ${p.plano_contas_descricao}`,
      'Fornecedor': p.fornecedor_nome || '',
      'Data Vencimento': formatarData(p.data_vencimento),
      'Valor Total': p.valor_total,
      'Parcela': `${p.numero_parcela}/${p.numero_parcelas}`,
      'Valor a Pagar': p.valor_parcela,
      'Valor Pago': p.valor_pago || 0,
      'Data Pagamento': p.data_pagamento ? formatarData(p.data_pagamento) : '',
      'Status': p.status,
    }));

    const headers = Object.keys(csvData[0]);
    const csvContent = [
      headers.join(','),
      ...csvData.map(row => 
        headers.map(header => {
          const value = row[header as keyof typeof row];
          return typeof value === 'string' && value.includes(',') 
            ? `"${value}"` 
            : value;
        }).join(',')
      )
    ].join('\n');

    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `contas_pagar_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();

    toast({
      title: '✅ Exportado',
      description: 'Arquivo CSV gerado com sucesso!',
    });
  };

  // Ações em lote
  const handleAbrirBaixaLote = () => {
    if (parcelasSelecionadas.size === 0) {
      toast({
        title: 'Aviso',
        description: 'Selecione pelo menos uma parcela!',
        variant: 'default',
      });
      return;
    }

    // Verificar se todas as parcelas selecionadas estão em aberto
    const parcelasEmAberto = parcelasFiltradas.filter(
      (p: any) => parcelasSelecionadas.has(p.id) && 
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

      // Filtrar apenas parcelas em aberto
      const parcelasParaBaixa = parcelasFiltradas.filter(
        (p: any) => parcelasSelecionadas.has(p.id) && 
        (p.status === 'aberto' || p.status === 'atrasado' || p.status === 'pagamento_parcial')
      );

      let sucessos = 0;
      let erros = 0;

      for (const parcela of parcelasParaBaixa) {
        try {
          // Calcular valor restante
          const valorRestante = parcela.valor_parcela - (parcela.valor_pago || 0);

          // Calcular juros por atraso (mesma lógica de ContasReceber)
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

          // Inserir pagamento
          const { error } = await supabase
            .from('contas_pagar_pagamentos' as any)
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
        description: `${sucessos} parcela(s) paga(s) com sucesso${erros > 0 ? `. ${erros} erro(s).` : '!'}`,
      });

      setModalBaixaLote(false);
      handleLimparSelecao();
      fetchParcelas();
      fetchDashboard();
    } catch (error: any) {
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
        .from('contas_pagar_parcelas' as any)
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
    } catch (error: any) {
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

      const parcelasExportar = parcelasFiltradas.filter((p: any) => parcelasSelecionadas.has(p.id));

      // Preparar dados para CSV
      const csvData = parcelasExportar.map((p: any) => ({
        'Documento': p.tipo_documento_descricao || '',
        'Data Emissão': formatarData(p.data_emissao),
        'Plano de Contas': `${p.plano_contas_codigo} - ${p.plano_contas_descricao}`,
        'Fornecedor': p.fornecedor_nome || '',
        'Data Vencimento': formatarData(p.data_vencimento),
        'Valor Total': p.valor_total,
        'Parcela': `${p.numero_parcela} de ${p.numero_parcelas}`,
        'Valor a Pagar': p.valor_parcela,
        'Valor Pago': p.valor_pago || 0,
        'Data Pagamento': p.data_pagamento ? formatarData(p.data_pagamento) : '',
        'Status': p.status,
      }));

      // Criar CSV
      const headers = Object.keys(csvData[0]);
      const csvContent = [
        headers.join(','),
        ...csvData.map(row => 
          headers.map(header => {
            const value = row[header as keyof typeof row];
            return typeof value === 'string' && value.includes(',') 
              ? `"${value}"` 
              : value;
          }).join(',')
        )
      ].join('\n');

      // Download
      const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `contas_pagar_selecionadas_${new Date().toISOString().split('T')[0]}.csv`;
      link.click();

      toast({
        title: '✅ Exportado',
        description: `${parcelasSelecionadas.size} parcela(s) exportada(s)!`,
      });
    } catch (error: any) {
      console.error('Erro ao exportar:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível exportar as parcelas.',
        variant: 'destructive',
      });
    }
  };

  const handleExcluir = async (contaPagarId: string) => {
    if (!confirm('Tem certeza que deseja excluir esta conta a pagar? Esta ação não pode ser desfeita.')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('contas_pagar' as any)
        .delete()
        .eq('id', contaPagarId) as any;

      if (error) throw error;

      toast({
        title: '✅ Excluído',
        description: 'Conta a pagar excluída com sucesso!',
      });

      fetchParcelas();
      fetchDashboard();
    } catch (error) {
      console.error('Erro ao excluir:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível excluir a conta a pagar.',
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

  if (loading) return <LoadingState message="Carregando Contas a Pagar" submessage="Buscando suas despesas..." />;

  return (
    <div className="container mx-auto p-6 space-y-6">
      <PageHeader
        title="Contas a Pagar"
        description="Gerencie seus pagamentos aqui"
        backButton={<BackButton to="/financeiro" />}
      />

      {/* Dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
        <Card className="border-l-4 border-l-red-500">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-100 rounded-lg">
                <TrendingDown className="h-4 w-4 text-red-600" />
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground">A Pagar</p>
                <p className="text-lg font-bold text-red-600">
                  {formatarValor(dashboard.total_a_pagar)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-500">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground">Pago</p>
                <p className="text-lg font-bold text-green-600">
                  {formatarValor(dashboard.total_pago)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-orange-500">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-100 rounded-lg">
                <AlertTriangle className="h-4 w-4 text-orange-600" />
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground">Em Atraso</p>
                <p className="text-lg font-bold text-orange-600">
                  {formatarValor(dashboard.total_atrasado)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-blue-500">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Calendar className="h-4 w-4 text-blue-600" />
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground">Vence Hoje</p>
                <p className="text-lg font-bold text-blue-600">
                  {formatarValor(dashboard.vencendo_hoje)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros Rápidos */}
      <div className="flex flex-wrap justify-between items-center gap-2">
        <div className="flex flex-wrap gap-2">
          {[
            { value: 'todos', label: 'Todos' },
            { value: 'aberto', label: 'Em Aberto' },
            { value: 'vencido', label: 'Vencido' },
            { value: 'pago', label: 'Pago' },
          ].map(filtro => (
            <Button
              key={filtro.value}
              variant={filtroStatus === filtro.value ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFiltroStatus(filtro.value)}
            >
              {filtro.label}
            </Button>
          ))}
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setMostrarFiltrosAvancados(!mostrarFiltrosAvancados)}
          >
            Mais Opções de Busca
            <ChevronDown className={`ml-2 h-4 w-4 transition-transform ${mostrarFiltrosAvancados ? 'rotate-180' : ''}`} />
          </Button>
          <Button variant="outline" size="sm" onClick={limparFiltros}>
            Limpar Filtros
          </Button>
        </div>
      </div>

      {/* Filtros Avançados - Datas */}
      <div className="grid grid-cols-3 gap-4">
        {/* Data de Emissão */}
        <div className="space-y-2">
          <Label className="text-xs text-muted-foreground">Data de Emissão</Label>
          <div className="grid grid-cols-2 gap-2">
            <DatePickerField
              value={dataEmissaoInicio}
              onChange={setDataEmissaoInicio}
              placeholder="Inicial"
              className="flex-1"
            />
            <DatePickerField
              value={dataEmissaoFim}
              onChange={setDataEmissaoFim}
              placeholder="Final"
              className="flex-1"
            />
          </div>
        </div>

        {/* Data de Pagamento */}
        <div className="space-y-2">
          <Label className="text-xs text-muted-foreground">Data de Pagamento</Label>
          <div className="grid grid-cols-2 gap-2">
            <DatePickerField
              value={dataPagamentoInicio}
              onChange={setDataPagamentoInicio}
              placeholder="Inicial"
              className="flex-1"
            />
            <DatePickerField
              value={dataPagamentoFim}
              onChange={setDataPagamentoFim}
              placeholder="Final"
              className="flex-1"
            />
          </div>
        </div>

        {/* Data de Vencimento */}
        <div className="space-y-2">
          <Label className="text-xs text-muted-foreground">Data de Vencimento</Label>
          <div className="grid grid-cols-2 gap-2">
            <DatePickerField
              value={dataVencimentoInicio}
              onChange={setDataVencimentoInicio}
              placeholder="Inicial"
              className="flex-1"
            />
            <DatePickerField
              value={dataVencimentoFim}
              onChange={setDataVencimentoFim}
              placeholder="Final"
              className="flex-1"
            />
          </div>
        </div>
      </div>

      {/* Filtros Avançados Recolhíveis */}
      {mostrarFiltrosAvancados && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 p-4 border rounded-lg bg-muted/50">
          {/* Fornecedor */}
          <div className="space-y-2">
            <Label>Fornecedor</Label>
            <Popover open={openFornecedor} onOpenChange={setOpenFornecedor}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={openFornecedor}
                  className="w-full justify-between bg-popover"
                >
                  {fornecedorFiltro && fornecedorFiltro !== 'todos'
                    ? fornecedores.find((f: any) => f.id === fornecedorFiltro)?.nome || 'Selecione...'
                    : 'Todos'}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-full p-0 bg-popover z-50" align="start">
                <Command className="bg-popover">
                  <CommandInput
                    placeholder="Buscar fornecedor..."
                    value={searchFornecedor}
                    onValueChange={setSearchFornecedor}
                  />
                  <CommandEmpty>
                    Nenhum fornecedor encontrado.
                  </CommandEmpty>
                  <CommandGroup className="max-h-64 overflow-auto">
                    <CommandItem
                      value="todos"
                      onSelect={() => {
                        setFornecedorFiltro('todos');
                        setOpenFornecedor(false);
                        setSearchFornecedor('');
                      }}
                    >
                      <Check
                        className={`mr-2 h-4 w-4 ${fornecedorFiltro === 'todos' ? 'opacity-100' : 'opacity-0'}`}
                      />
                      Todos
                    </CommandItem>
                    {fornecedores
                      .filter((f: any) =>
                        f.nome.toLowerCase().includes(searchFornecedor.toLowerCase())
                      )
                      .map((f: any) => (
                        <CommandItem
                          key={f.id}
                          value={f.nome}
                          onSelect={() => {
                            setFornecedorFiltro(f.id);
                            setOpenFornecedor(false);
                            setSearchFornecedor('');
                          }}
                        >
                          <Check
                            className={`mr-2 h-4 w-4 ${fornecedorFiltro === f.id ? 'opacity-100' : 'opacity-0'}`}
                          />
                          {f.nome}
                        </CommandItem>
                      ))}
                  </CommandGroup>
                </Command>
              </PopoverContent>
            </Popover>
          </div>

          {/* Plano de Contas */}
          <div className="space-y-2">
            <Label>Plano de Contas</Label>
            <Select value={planoContasFiltro} onValueChange={setPlanoContasFiltro}>
              <SelectTrigger>
                <SelectValue placeholder="Todos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos</SelectItem>
                {planosContas.map((p: any) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.codigo_estruturado} - {p.descricao}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Categoria Plano de Contas */}
          <div className="space-y-2">
            <Label>Categoria Plano de Contas</Label>
            <Select value={categoriaFiltro} onValueChange={setCategoriaFiltro}>
              <SelectTrigger>
                <SelectValue placeholder="Todas" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todas</SelectItem>
                {categorias.map((c: any) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.descricao}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Tipo de Documento */}
          <div className="space-y-2">
            <Label>Tipo de Documento</Label>
            <Select value={tipoDocumentoFiltro} onValueChange={setTipoDocumentoFiltro}>
              <SelectTrigger>
                <SelectValue placeholder="Todos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos</SelectItem>
                {tiposDocumento.map((t: any) => (
                  <SelectItem key={t.id} value={t.id}>
                    {t.descricao}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Banco */}
          <div className="space-y-2">
            <Label>Banco</Label>
            <Select value={bancoFiltro} onValueChange={setBancoFiltro}>
              <SelectTrigger>
                <SelectValue placeholder="Todos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos</SelectItem>
                {bancos.map((b: any) => (
                  <SelectItem key={b.id} value={b.id}>
                    {b.codigo} - {b.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      )}

      {/* Card de Controles */}
      <div className="border rounded-lg p-4 space-y-4">
        {/* Linha Superior - Botão Adicionar */}
        <div className="flex items-center justify-start">
          <Button onClick={() => navigate('/financeiro/contas-pagar/nova')}>
            <Plus className="mr-2 h-4 w-4" />
            Adicionar Conta a Pagar
          </Button>
        </div>

        {/* Linha Inferior - Controles */}
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

          <Button variant="outline" size="sm" onClick={handleExportarExcel}>
            <Download className="mr-2 h-4 w-4" />
            Exportar para Excel
          </Button>
        </div>
      </div>

      {/* Barra de Ações em Lote */}
      {modoSelecao && parcelasSelecionadas.size > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-blue-600" />
            <span className="font-medium">
              {parcelasSelecionadas.size} parcela(s) selecionada(s)
            </span>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleAbrirBaixaLote}
            >
              <DollarSign className="mr-2 h-4 w-4" />
              Dar Baixa em Lote
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportarSelecionadas}
            >
              <Download className="mr-2 h-4 w-4" />
              Exportar Selecionadas
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleExcluirLote}
              className="text-red-600 hover:text-red-700"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Excluir Selecionadas
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLimparSelecao}
            >
              <X className="mr-2 h-4 w-4" />
              Limpar
            </Button>
          </div>
        </div>
      )}

      {/* Tabela */}
      <div className="border rounded-lg overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">
                <Checkbox
                  checked={parcelasSelecionadas.size === parcelasFiltradas.length && parcelasFiltradas.length > 0}
                  onCheckedChange={handleSelecionarTodos}
                />
              </TableHead>
              <TableHead>Documento</TableHead>
              <TableHead>Emissão</TableHead>
              <TableHead>Plano Contas</TableHead>
              <TableHead>Fornecedor</TableHead>
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
                <TableCell colSpan={13} className="text-center py-8 text-muted-foreground">
                  Nenhuma parcela encontrada.
                </TableCell>
              </TableRow>
            ) : (
              parcelasPaginadas.map((parcela: any) => (
                <TableRow key={parcela.id}>
                  <TableCell>
                    <Checkbox
                      checked={parcelasSelecionadas.has(parcela.id)}
                      onCheckedChange={() => handleToggleSelecao(parcela.id)}
                      onClick={(e: any) => {
                        e.stopPropagation();
                        if (!modoSelecao) setModoSelecao(true);
                      }}
                    />
                  </TableCell>
                  <TableCell>{parcela.tipo_documento_descricao || 'N/A'}</TableCell>
                  <TableCell>{formatarData(parcela.data_emissao)}</TableCell>
                  <TableCell className="text-sm">
                    {parcela.plano_contas_codigo} - {parcela.plano_contas_descricao}
                  </TableCell>
                  <TableCell className="font-medium">{parcela.fornecedor_nome || 'N/A'}</TableCell>
                  <TableCell>{formatarData(parcela.data_vencimento)}</TableCell>
                  <TableCell className="font-medium text-red-600">
                    {formatarValor(parcela.valor_total)}
                  </TableCell>
                  <TableCell className="font-mono font-medium">
                    {parcela.numero_parcela} de {parcela.numero_parcelas}
                  </TableCell>
                  <TableCell className="font-medium text-red-600">
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
                        <DropdownMenuItem onClick={() => navigate(`/financeiro/contas-pagar/detalhes/${parcela.conta_pagar_id}`)}>
                          <Eye className="mr-2 h-4 w-4" />
                          Detalhes
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => navigate(`/financeiro/contas-pagar/editar/${parcela.conta_pagar_id}`)}>
                          <Edit className="mr-2 h-4 w-4" />
                          Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => {
                            setParcelaSelecionadaBaixa(parcela);
                            setDarBaixaOpen(true);
                          }}
                          disabled={parcela.status === 'pago' || parcela.status === 'adiantado'}
                        >
                          <DollarSign className="mr-2 h-4 w-4 text-green-600" />
                          Dar Baixa
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => handleExcluir(parcela.conta_pagar_id)}
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

      {/* Modal Dar Baixa Individual */}
      <DarBaixaPagarDialog
        open={darBaixaOpen}
        onOpenChange={setDarBaixaOpen}
        parcela={parcelaSelecionadaBaixa}
        onSuccess={() => {
          fetchParcelas();
          fetchDashboard();
        }}
      />

      {/* Modal Baixa em Lote */}
      <Dialog open={modalBaixaLote} onOpenChange={setModalBaixaLote}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Dar Baixa em Lote</DialogTitle>
            <DialogDescription>
              Registre o pagamento de {parcelasSelecionadas.size} parcela(s) simultaneamente
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Resumo das Parcelas */}
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg space-y-2">
              <h4 className="font-medium">Parcelas Selecionadas:</h4>
              <div className="text-sm space-y-1 max-h-40 overflow-y-auto">
                {parcelasFiltradas
                  .filter((p: any) => parcelasSelecionadas.has(p.id) && 
                    (p.status === 'aberto' || p.status === 'atrasado' || p.status === 'pagamento_parcial'))
                  .map((p: any) => (
                    <div key={p.id} className="flex justify-between py-1 border-b border-blue-200">
                      <span>
                        {p.fornecedor_nome} - Parcela {p.numero_parcela}/{p.numero_parcelas}
                      </span>
                      <span className="font-medium text-red-600">
                        {formatarValor(p.valor_parcela - (p.valor_pago || 0))}
                      </span>
                    </div>
                  ))}
              </div>
              <div className="flex justify-between pt-2 border-t border-blue-300 font-bold">
                <span>Total a Pagar:</span>
                <span className="text-red-700">
                  {formatarValor(
                    parcelasFiltradas
                      .filter((p: any) => parcelasSelecionadas.has(p.id) && 
                        (p.status === 'aberto' || p.status === 'atrasado' || p.status === 'pagamento_parcial'))
                      .reduce((acc: number, p: any) => acc + (p.valor_parcela - (p.valor_pago || 0)), 0)
                  )}
                </span>
              </div>
            </div>

            <Alert className="bg-amber-50 border-amber-200">
              <Info className="h-4 w-4 text-amber-600" />
              <AlertDescription>
                <strong>Importante:</strong> Cada parcela será quitada pelo valor restante.
                Não serão aplicados juros ou descontos automaticamente.
              </AlertDescription>
            </Alert>

            {/* Formulário */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="data-lote">Data do Pagamento *</Label>
                <Input
                  id="data-lote"
                  type="date"
                  value={dataPagamentoLote}
                  onChange={(e) => setDataPagamentoLote(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Banco *</Label>
              <Select value={bancoIdLote} onValueChange={setBancoIdLote}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o banco..." />
                </SelectTrigger>
                <SelectContent>
                  {bancos.map((banco: any) => (
                    <SelectItem key={banco.id} value={banco.id}>
                      {banco.codigo} - {banco.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Tipo de Documento *</Label>
              <Select value={tipoDocumentoIdLote} onValueChange={setTipoDocumentoIdLote}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o tipo..." />
                </SelectTrigger>
                <SelectContent>
                  {tiposDocumento.map((tipo: any) => (
                    <SelectItem key={tipo.id} value={tipo.id}>
                      {tipo.descricao}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="obs-lote">Observação</Label>
              <Textarea
                id="obs-lote"
                placeholder="Observação aplicada a todos os pagamentos..."
                rows={3}
                value={observacaoLote}
                onChange={(e) => setObservacaoLote(e.target.value)}
              />
            </div>
          </div>

          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setModalBaixaLote(false)}
            >
              Cancelar
            </Button>
            <Button onClick={handleConfirmarBaixaLote}>
              Confirmar Pagamento em Lote
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
