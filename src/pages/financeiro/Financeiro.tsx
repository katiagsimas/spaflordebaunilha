import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import { LoadingState } from '@/components/LoadingState';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format } from 'date-fns';
import { CalendarIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getTodayISO, formatDateToISO, formatDateBR, parseISOToDate } from '@/lib/dateUtils';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
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
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import {
  TrendingUp, 
  TrendingDown, 
  DollarSign,
  Calendar as CalendarDaysIcon,
  PieChart,
  Settings,
  Plus,
  Trash2,
  Wallet,
  ArrowUpCircle,
  ArrowDownCircle,
  Building2,
  LayoutDashboard,
  AlertCircle,
  Users
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';

interface InadimplenciaItem {
  id: string;
  nome: string;
  valor: number;
  dias_atraso: number;
  telefone?: string;
}

export default function Financeiro() {
  const navigate = useNavigate();
  const { toast } = useToast();

  // Estados de navegação temporal
  const [mesSelecionado, setMesSelecionado] = useState(new Date().getMonth() + 1);
  const [anoSelecionado, setAnoSelecionado] = useState(new Date().getFullYear());

  // Estados do banner
  const [loading, setLoading] = useState(true);
  const [saldoAnterior, setSaldoAnterior] = useState(0);
  const [entradas, setEntradas] = useState(0);
  const [saidas, setSaidas] = useState(0);
  const [saldoAtual, setSaldoAtual] = useState(0);
  const [bancosSaldos, setBancosSaldos] = useState([]);

  // Estados do modal
  const [modalConfigAberto, setModalConfigAberto] = useState(false);
  const [bancos, setBancos] = useState([]);
  const [saldosConfigurados, setSaldosConfigurados] = useState([]);
  
  // Formulário de novo saldo
  const [bancoId, setBancoId] = useState('');
  const [mesReferencia, setMesReferencia] = useState(new Date().getMonth() + 1);
  const [anoReferencia, setAnoReferencia] = useState(new Date().getFullYear());
  const [dataReferencia, setDataReferencia] = useState<Date>(new Date());
  const [saldoInicial, setSaldoInicial] = useState('');
  const [observacao, setObservacao] = useState('');

  // Estados do dashboard
  const [resumoDashboard, setResumoDashboard] = useState({
    totalReceber: 0,
    totalPagar: 0,
    receitasRecebidas: 0,
    despesasPagas: 0,
    saldoLiquido: 0
  });
  const [inadimplenciaClientes, setInadimplenciaClientes] = useState<InadimplenciaItem[]>([]);
  const [inadimplenciaFornecedores, setInadimplenciaFornecedores] = useState<InadimplenciaItem[]>([]);
  const [mostrarTodosClientes, setMostrarTodosClientes] = useState(false);
  const [mostrarTodosFornecedores, setMostrarTodosFornecedores] = useState(false);

  useEffect(() => {
    fetchResumo();
    carregarDadosDashboard();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mesSelecionado, anoSelecionado]);

  const fetchResumo = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Buscar resumo financeiro do mês/ano selecionado
      const { data: resumo } = await supabase
        .from('vw_resumo_financeiro')
        .select('*')
        .eq('user_id', user.id)
        .eq('mes', mesSelecionado)
        .eq('ano', anoSelecionado);

      if (resumo && resumo.length > 0) {
        // Calcular totais
        const totalSaldoInicial = resumo.reduce((acc, b) => acc + (b.saldo_inicial || 0), 0);
        const totalEntradas = resumo.reduce((acc, b) => acc + (b.entradas_mes || 0), 0);
        const totalSaidas = resumo.reduce((acc, b) => acc + (b.saidas_mes || 0), 0);
        const totalSaldoAtual = resumo.reduce((acc, b) => acc + (b.saldo_atual || 0), 0);

        setSaldoAnterior(totalSaldoInicial);
        setEntradas(totalEntradas);
        setSaidas(totalSaidas);
        setSaldoAtual(totalSaldoAtual);
        setBancosSaldos(resumo);
      } else {
        // Não tem dados para este mês/ano
        setSaldoAnterior(0);
        setEntradas(0);
        setSaidas(0);
        setSaldoAtual(0);
        setBancosSaldos([]);
      }
    } catch (error) {
      console.error('Erro ao buscar resumo:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAbrirConfig = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Buscar bancos habilitados (ordenar por código para que 000 - Caixa Empresa apareça primeiro)
      const { data: dataBancos } = await supabase
        .from('bancos')
        .select('id, codigo, nome')
        .eq('usuario_id', user.id)
        .eq('habilitado', true)
        .order('codigo');
      setBancos(dataBancos || []);

      // Buscar saldos configurados do mês atual
      const mesAtual = new Date().getMonth() + 1;
      const anoAtual = new Date().getFullYear();

      const { data: dataSaldos } = await supabase
        .from('saldos_iniciais_bancos')
        .select(`
          id,
          banco_id,
          mes_referencia,
          ano_referencia,
          data_referencia,
          saldo_inicial,
          bancos (
            codigo,
            nome
          )
        `)
        .eq('user_id', user.id)
        .eq('mes_referencia', mesAtual)
        .eq('ano_referencia', anoAtual)
        .order('saldo_inicial', { ascending: false });

      setSaldosConfigurados(dataSaldos || []);

      // Resetar formulário
      setBancoId('');
      setMesReferencia(mesAtual);
      setAnoReferencia(anoAtual);
      setDataReferencia(new Date());
      setSaldoInicial('');
      setObservacao('');

      setModalConfigAberto(true);
    } catch (error) {
      console.error('Erro ao abrir configuração:', error);
    }
  };

  const handleAdicionarSaldo = async () => {
    try {
      if (!bancoId) {
        toast({
          title: 'Erro',
          description: 'Selecione o banco!',
          variant: 'destructive',
        });
        return;
      }

      const valor = parseFloat(saldoInicial.replace(',', '.'));
      if (isNaN(valor)) {
        toast({
          title: 'Erro',
          description: 'Informe um valor válido!',
          variant: 'destructive',
        });
        return;
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Não autenticado');

      // Inserir ou atualizar
      const { error } = await supabase
        .from('saldos_iniciais_bancos')
        .upsert({
          user_id: user.id,
          banco_id: bancoId,
          mes_referencia: mesReferencia,
          ano_referencia: anoReferencia,
          data_referencia: format(dataReferencia, 'yyyy-MM-dd'),
          saldo_inicial: valor,
          observacao: observacao.trim() || null,
        }, {
          onConflict: 'user_id,banco_id,mes_referencia,ano_referencia'
        });

      if (error) throw error;

      toast({
        title: '✅ Saldo configurado',
        description: 'O saldo inicial foi salvo com sucesso!',
      });

      // Recarregar dados e fechar modal
      await fetchResumo();
      setModalConfigAberto(false);
      
      // Redirecionar para a página principal do financeiro
      navigate('/financeiro');
    } catch (error) {
      console.error('Erro ao adicionar saldo:', error);
      toast({
        title: 'Erro',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const handleExcluirSaldo = async (saldoId) => {
    try {
      const confirmar = window.confirm('Tem certeza que deseja excluir este saldo inicial?');
      if (!confirmar) return;

      const { error } = await supabase
        .from('saldos_iniciais_bancos')
        .delete()
        .eq('id', saldoId);

      if (error) throw error;

      toast({
        title: '✅ Saldo excluído',
        description: 'O saldo inicial foi excluído!',
      });

      handleAbrirConfig();
      fetchResumo();
    } catch (error) {
      console.error('Erro ao excluir saldo:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível excluir o saldo.',
        variant: 'destructive',
      });
    }
  };

  const formatarValor = (valor) => {
    return valor.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    });
  };

  const getMesNome = (mes?: number) => {
    const meses = [
      'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
      'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
    ];
    return meses[(mes || mesSelecionado) - 1];
  };

  const gerarOpcoesAnos = () => {
    const anoAtual = new Date().getFullYear();
    const anos = [];
    for (let ano = anoAtual - 5; ano <= anoAtual + 5; ano++) {
      anos.push(ano);
    }
    return anos;
  };

  // Funções do Dashboard
  async function carregarDadosDashboard() {
    try {
      await Promise.all([
        carregarResumoDashboard(),
        carregarInadimplenciaClientes(),
        carregarInadimplenciaFornecedores()
      ]);
    } catch (error) {
      console.error("Erro ao carregar dashboard financeiro:", error);
    }
  }

  async function carregarResumoDashboard() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    
    const hoje = getTodayISO();
    const inicioMes = formatDateToISO(new Date(new Date().getFullYear(), new Date().getMonth(), 1));

    // Buscar todas as parcelas a receber
    const { data: parcelasReceber } = await supabase
      .from("vw_contas_receber_parcelas")
      .select("*")
      .eq("user_id", user.id);

    // Buscar todas as parcelas a pagar
    const { data: parcelasPagar } = await supabase
      .from("contas_pagar_parcelas")
      .select(`
        *,
        conta:contas_pagar!inner (
          usuario_id
        )
      `)
      .eq("conta.usuario_id", user.id);

    let totalReceber = 0;
    let receitasRecebidas = 0;

    parcelasReceber?.forEach((p: any) => {
      if (p.status === 'aberto' || p.status === 'atrasado') {
        // Parcelas em aberto ou atrasadas: soma valor total pendente
        totalReceber += (p.valor_parcela || 0) - (p.valor_pago || 0);
      } else if (p.status === 'pagamento_parcial') {
        // Parcelas parcialmente pagas: desmembra os valores
        const valorPago = p.valor_pago || 0;
        const valorPendente = (p.valor_parcela || 0) - valorPago;
        
        totalReceber += valorPendente; // Valor pendente vai para "Em Aberto"
        receitasRecebidas += valorPago; // Valor pago vai para "Recebido"
      } else if ((p.status === 'pago' || p.status === 'adiantado') && p.data_pagamento >= inicioMes) {
        // Parcelas totalmente pagas no mês: soma para recebido
        receitasRecebidas += p.valor_pago || 0;
      }
    });

    let totalPagar = 0;
    let despesasPagas = 0;

    parcelasPagar?.forEach((p: any) => {
      if (p.status === 'aberto' || p.status === 'atrasado') {
        // Parcelas em aberto ou atrasadas: soma valor total pendente
        totalPagar += (p.valor_parcela || 0) - (p.valor_pago || 0);
      } else if (p.status === 'pagamento_parcial') {
        // Parcelas parcialmente pagas: desmembra os valores
        const valorPago = p.valor_pago || 0;
        const valorPendente = (p.valor_parcela || 0) - valorPago;
        
        totalPagar += valorPendente; // Valor pendente vai para "Em Aberto"
        despesasPagas += valorPago; // Valor pago vai para "Pago"
      } else if ((p.status === 'pago' || p.status === 'adiantado') && p.data_pagamento >= inicioMes) {
        // Parcelas totalmente pagas no mês: soma para pago
        despesasPagas += p.valor_pago || 0;
      }
    });

    setResumoDashboard({
      totalReceber,
      totalPagar,
      receitasRecebidas,
      despesasPagas,
      saldoLiquido: receitasRecebidas - despesasPagas
    });
  }

  async function carregarInadimplenciaClientes() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    
    const hoje = getTodayISO();

    // Buscar parcelas com status "atrasado"
    const { data } = await supabase
      .from("vw_contas_receber_parcelas")
      .select('*')
      .eq("user_id", user.id)
      .eq("status", "atrasado")
      .order("data_vencimento", { ascending: true });

    if (!data) return;

    const inadimplentesMap = new Map<string, InadimplenciaItem>();

    for (const parcela of data) {
      const vencimento = new Date(parcela.data_vencimento + 'T00:00:00');
      const hojeDate = new Date(hoje + 'T00:00:00');
      const diasAtraso = Math.floor((hojeDate.getTime() - vencimento.getTime()) / (1000 * 60 * 60 * 24));

      const clienteId = parcela.cliente_id || parcela.id;
      const clienteNome = parcela.cliente_nome || "Cliente desconhecido";
      const valorDevido = (parcela.valor_parcela || 0) - (parcela.valor_pago || 0);

      if (inadimplentesMap.has(clienteId)) {
        const existing = inadimplentesMap.get(clienteId)!;
        existing.valor += valorDevido;
        existing.dias_atraso = Math.max(existing.dias_atraso, diasAtraso);
      } else {
        const { data: cliente } = await supabase
          .from("clientes")
          .select("telefone")
          .eq("id", clienteId)
          .maybeSingle();

        inadimplentesMap.set(clienteId, {
          id: clienteId,
          nome: clienteNome,
          valor: valorDevido,
          dias_atraso: diasAtraso,
          telefone: cliente?.telefone
        });
      }
    }

    const agrupado = Array.from(inadimplentesMap.values());
    agrupado.sort((a, b) => b.valor - a.valor);

    setInadimplenciaClientes(agrupado);
  }

  async function carregarInadimplenciaFornecedores() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    
    const hoje = getTodayISO();

    // Buscar parcelas com status "atrasado" das contas a pagar do usuário
    const { data: parcelas } = await supabase
      .from("contas_pagar_parcelas")
      .select(`
        id,
        valor_parcela,
        valor_pago,
        data_vencimento,
        status,
        contas_pagar!inner (
          fornecedor_id,
          usuario_id,
          fornecedores (
            id,
            nome,
            telefone
          )
        )
      `)
      .eq("status", "atrasado")
      .eq("contas_pagar.usuario_id", user.id)
      .order("data_vencimento", { ascending: true });

    if (!parcelas || parcelas.length === 0) {
      setInadimplenciaFornecedores([]);
      return;
    }

    const inadimplentesMap = new Map<string, InadimplenciaItem>();

    for (const parcela of parcelas) {
      const vencimento = new Date(parcela.data_vencimento + 'T00:00:00');
      const hojeDate = new Date(hoje + 'T00:00:00');
      const diasAtraso = Math.floor((hojeDate.getTime() - vencimento.getTime()) / (1000 * 60 * 60 * 24));

      const contaPagar = parcela.contas_pagar as any;
      const fornecedor = contaPagar?.fornecedores;
      const fornecedorId = contaPagar?.fornecedor_id;
      
      if (!fornecedorId) continue;

      const valorDevido = (parcela.valor_parcela || 0) - (parcela.valor_pago || 0);

      if (inadimplentesMap.has(fornecedorId)) {
        const existing = inadimplentesMap.get(fornecedorId)!;
        existing.valor += valorDevido;
        existing.dias_atraso = Math.max(existing.dias_atraso, diasAtraso);
      } else {
        inadimplentesMap.set(fornecedorId, {
          id: fornecedorId,
          nome: fornecedor?.nome || "Fornecedor desconhecido",
          valor: valorDevido,
          dias_atraso: diasAtraso,
          telefone: fornecedor?.telefone
        });
      }
    }

    const agrupado = Array.from(inadimplentesMap.values());
    agrupado.sort((a, b) => b.valor - a.valor);

    setInadimplenciaFornecedores(agrupado);
  }

  function getCorPorDiasAtraso(dias: number) {
    if (dias > 30) return "bg-red-600 text-white";
    if (dias > 15) return "bg-orange-500 text-white";
    return "bg-yellow-500 text-white";
  }

  const coresBanco = [
    { border: 'border-l-blue-500', text: 'text-blue-600', bg: 'bg-blue-50 dark:bg-blue-950' },
    { border: 'border-l-green-500', text: 'text-green-600', bg: 'bg-green-50 dark:bg-green-950' },
    { border: 'border-l-purple-500', text: 'text-purple-600', bg: 'bg-purple-50 dark:bg-purple-950' },
    { border: 'border-l-orange-500', text: 'text-orange-600', bg: 'bg-orange-50 dark:bg-orange-950' },
    { border: 'border-l-pink-500', text: 'text-pink-600', bg: 'bg-pink-50 dark:bg-pink-950' },
    { border: 'border-l-cyan-500', text: 'text-cyan-600', bg: 'bg-cyan-50 dark:bg-cyan-950' },
    { border: 'border-l-indigo-500', text: 'text-indigo-600', bg: 'bg-indigo-50 dark:bg-indigo-950' },
    { border: 'border-l-teal-500', text: 'text-teal-600', bg: 'bg-teal-50 dark:bg-teal-950' },
  ];

  const getCorBanco = (index: number) => {
    return coresBanco[index % coresBanco.length];
  };

  if (loading) return <LoadingState message="Carregando Meu Dinheiro" submessage="Preparando suas informações financeiras..." />;

  const maxSaldo = Math.max(...bancosSaldos.map(b => b.saldo_atual || 0), 1);

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Título da Página */}
      <div className="mb-6">
        <h1 className="text-xl md:text-2xl font-bold tracking-tight flex items-center gap-2 whitespace-nowrap">
          <DollarSign className="w-6 h-6 md:w-7 md:h-7 text-primary flex-shrink-0" />
          MEU DINHEIRO
        </h1>
      </div>

      {/* Cards de Navegação */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">

        {/* Card Cadastros */}
        <Card 
          className="group cursor-pointer hover:shadow-lg transition-all duration-200 border-l-4 border-l-teal-500"
          onClick={() => navigate('/financeiro/cadastros')}
        >
          <CardHeader className="p-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-teal-50 dark:bg-teal-950 text-teal-600 dark:text-teal-400 flex items-center justify-center shrink-0">
                <Settings className="h-4 w-4" />
              </div>
              <CardTitle className="text-sm font-semibold">
                Cadastros
              </CardTitle>
            </div>
          </CardHeader>
        </Card>

        {/* Card Contas a Receber */}
        <Card 
          className="group cursor-pointer hover:shadow-lg transition-all duration-200 border-l-4 border-l-green-500"
          onClick={() => navigate('/financeiro/contas-receber')}
        >
          <CardHeader className="p-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-green-50 dark:bg-green-950 text-green-600 dark:text-green-400 flex items-center justify-center shrink-0">
                <TrendingUp className="h-4 w-4" />
              </div>
              <CardTitle className="text-sm font-semibold">
                Contas a Receber
              </CardTitle>
            </div>
          </CardHeader>
        </Card>

        {/* Card Contas a Pagar */}
        <Card 
          className="group cursor-pointer hover:shadow-lg transition-all duration-200 border-l-4 border-l-red-500"
          onClick={() => navigate('/financeiro/contas-pagar')}
        >
          <CardHeader className="p-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-red-50 dark:bg-red-950 text-red-600 dark:text-red-400 flex items-center justify-center shrink-0">
                <TrendingDown className="h-4 w-4" />
              </div>
              <CardTitle className="text-sm font-semibold">
                Contas a Pagar
              </CardTitle>
            </div>
          </CardHeader>
        </Card>

        {/* Card Fluxo de Caixa */}
        <Card 
          className="group cursor-pointer hover:shadow-lg transition-all duration-200 border-l-4 border-l-blue-500"
          onClick={() => navigate('/financeiro/fluxo-caixa')}
        >
          <CardHeader className="p-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                <Wallet className="h-4 w-4" />
              </div>
              <CardTitle className="text-sm font-semibold">
                Fluxo de Caixa
              </CardTitle>
            </div>
          </CardHeader>
        </Card>

        {/* Card DRE */}
        <Card 
          className="group cursor-pointer hover:shadow-lg transition-all duration-200 border-l-4 border-l-purple-500"
          onClick={() => navigate('/financeiro/dre')}
        >
          <CardHeader className="p-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-purple-50 dark:bg-purple-950 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
                <PieChart className="h-4 w-4" />
              </div>
              <CardTitle className="text-sm font-semibold">
                DRE
              </CardTitle>
            </div>
          </CardHeader>
        </Card>
      </div>

      {/* Banner de Saldos */}
      <Card className="border-2">
        <CardHeader className="pb-3">
          <div className="flex justify-between items-start gap-4">
            <div className="flex-1">
              <CardTitle className="text-xl md:text-2xl font-bold uppercase flex items-center gap-2 mb-4">
                <Wallet className="h-6 w-6 text-primary" />
                Resumo Financeiro
              </CardTitle>
              
              {/* Seletores de Mês e Ano */}
              <div className="flex gap-3 items-center">
                <div className="flex-1">
                  <Label className="text-xs text-muted-foreground mb-1">Mês</Label>
                  <Select value={mesSelecionado.toString()} onValueChange={(v) => setMesSelecionado(parseInt(v))}>
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((mes) => (
                        <SelectItem key={mes} value={mes.toString()}>
                          {getMesNome(mes)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="flex-1">
                  <Label className="text-xs text-muted-foreground mb-1">Ano</Label>
                  <Select value={anoSelecionado.toString()} onValueChange={(v) => setAnoSelecionado(parseInt(v))}>
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {gerarOpcoesAnos().map((ano) => (
                        <SelectItem key={ano} value={ano.toString()}>
                          {ano}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
            
            <Button 
              variant="outline" 
              onClick={handleAbrirConfig}
              className={`font-bold bg-primary text-primary-foreground hover:bg-primary/90 ${bancosSaldos.length === 0 ? 'animate-pulse' : ''}`}
            >
              <Settings className="mr-2 h-4 w-4" />
              Configure Saldos Iniciais
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Cards de Resumo de Saldos */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Saldo Anterior</p>
                    <p className="text-2xl font-bold">
                      {formatarValor(saldoAnterior)}
                    </p>
                  </div>
                  <CalendarDaysIcon className="h-8 w-8 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Entradas</p>
                    <p className="text-2xl font-bold text-green-600">
                      {formatarValor(entradas)}
                    </p>
                  </div>
                  <ArrowUpCircle className="h-8 w-8 text-green-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Saídas</p>
                    <p className="text-2xl font-bold text-red-600">
                      {formatarValor(saidas)}
                    </p>
                  </div>
                  <ArrowDownCircle className="h-8 w-8 text-red-600" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-2 border-primary">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Saldo Atual</p>
                    <p className={`text-2xl font-bold ${saldoAtual >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                      {formatarValor(saldoAtual)}
                    </p>
                  </div>
                  <DollarSign className="h-8 w-8 text-primary" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Distribuição por Banco */}
          {bancosSaldos.filter(b => b.saldo_atual !== 0).length > 0 && (
            <>
              <Separator />
              <div>
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                  <Building2 className="h-5 w-5" />
                  Distribuição por Banco
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {bancosSaldos.filter(b => b.saldo_atual !== 0).map((banco, index) => {
                    const cor = getCorBanco(index);
                    return (
                      <Card key={banco.banco_id} className={`border-l-4 ${cor.border}`}>
                        <CardContent className="pt-6">
                          <div className="flex items-center justify-between">
                            <div className="flex-1 min-w-0">
                              <p className="text-xs text-muted-foreground truncate font-semibold">
                                {banco.banco_codigo} - {banco.banco_nome}
                              </p>
                              <p className={`text-xl font-bold mt-1 ${cor.text}`}>
                                {formatarValor(banco.saldo_atual)}
                              </p>
                            </div>
                            <div className={`w-10 h-10 rounded-lg ${cor.bg} flex items-center justify-center`}>
                              <Wallet className={`h-5 w-5 ${cor.text}`} />
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Dashboard Financeiro */}
      <div className="space-y-6">


        {/* INADIMPLÊNCIA */}
        <div className="grid gap-4 md:grid-cols-2">
          {/* Clientes */}
          <Card className="border-l-4 border-l-red-500">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-red-50 dark:bg-red-950 flex items-center justify-center">
                    <Users className="h-5 w-5 text-red-600 dark:text-red-400" />
                  </div>
                  <div>
                    <CardTitle className="text-base font-semibold">
                      Inadimplência - Clientes
                    </CardTitle>
                    <CardDescription className="text-sm">
                      {inadimplenciaClientes.length} cliente(s) inadimplente(s)
                    </CardDescription>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                    R$ {inadimplenciaClientes.reduce((sum, c) => sum + c.valor, 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                  <p className="text-xs text-muted-foreground">Total em atraso</p>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {inadimplenciaClientes.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground bg-muted/30 rounded-lg">
                  <p className="font-medium">Nenhum cliente inadimplente 🎉</p>
                  <p className="text-sm mt-1">Todas as contas estão em dia</p>
                </div>
              ) : (
                <>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Cliente</TableHead>
                        <TableHead className="text-right">Valor</TableHead>
                        <TableHead className="text-right">Atraso</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {(mostrarTodosClientes ? inadimplenciaClientes : inadimplenciaClientes.slice(0, 10)).map((cliente, index) => (
                        <TableRow key={cliente.id}>
                          <TableCell>
                            <div>
                              <p className="font-medium">{index + 1}. {cliente.nome}</p>
                              {cliente.telefone && (
                                <p className="text-xs text-muted-foreground">{cliente.telefone}</p>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-right font-semibold">
                            R$ {cliente.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </TableCell>
                          <TableCell className="text-right">
                            <Badge className={getCorPorDiasAtraso(cliente.dias_atraso)}>
                              {cliente.dias_atraso} dias
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>

                  {inadimplenciaClientes.length > 10 && (
                    <div className="mt-4 text-center">
                      <Button
                        variant="outline"
                        onClick={() => setMostrarTodosClientes(!mostrarTodosClientes)}
                      >
                        {mostrarTodosClientes
                          ? "Mostrar apenas TOP 10"
                          : `Ver todos os ${inadimplenciaClientes.length} clientes`}
                      </Button>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>

          {/* Fornecedores */}
          <Card className="border-l-4 border-l-orange-500">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-orange-50 dark:bg-orange-950 flex items-center justify-center">
                    <Building2 className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                  </div>
                  <div>
                    <CardTitle className="text-base font-semibold">
                      Inadimplência - Fornecedores
                    </CardTitle>
                    <CardDescription className="text-sm">
                      {inadimplenciaFornecedores.length} fornecedor(es) inadimplente(s)
                    </CardDescription>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                    R$ {inadimplenciaFornecedores.reduce((sum, f) => sum + f.valor, 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                  <p className="text-xs text-muted-foreground">Total em atraso</p>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {inadimplenciaFornecedores.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground bg-muted/30 rounded-lg">
                  <p className="font-medium">Nenhum fornecedor inadimplente 🎉</p>
                  <p className="text-sm mt-1">Todas as contas estão em dia</p>
                </div>
              ) : (
                <>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Fornecedor</TableHead>
                        <TableHead className="text-right">Valor</TableHead>
                        <TableHead className="text-right">Atraso</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {(mostrarTodosFornecedores ? inadimplenciaFornecedores : inadimplenciaFornecedores.slice(0, 10)).map((fornecedor, index) => (
                        <TableRow key={fornecedor.id}>
                          <TableCell>
                            <div>
                              <p className="font-medium">{index + 1}. {fornecedor.nome}</p>
                              {fornecedor.telefone && (
                                <p className="text-xs text-muted-foreground">{fornecedor.telefone}</p>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-right font-semibold">
                            R$ {fornecedor.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </TableCell>
                          <TableCell className="text-right">
                            <Badge className={getCorPorDiasAtraso(fornecedor.dias_atraso)}>
                              {fornecedor.dias_atraso} dias
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>

                  {inadimplenciaFornecedores.length > 10 && (
                    <div className="mt-4 text-center">
                      <Button
                        variant="outline"
                        onClick={() => setMostrarTodosFornecedores(!mostrarTodosFornecedores)}
                      >
                        {mostrarTodosFornecedores
                          ? "Mostrar apenas TOP 10"
                          : `Ver todos os ${inadimplenciaFornecedores.length} fornecedores`}
                      </Button>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Modal de Configuração */}
      <Dialog open={modalConfigAberto} onOpenChange={setModalConfigAberto}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Configurar Saldos Iniciais</DialogTitle>
            <DialogDescription>
              Adicione o saldo inicial de cada banco para o mês de {getMesNome(mesReferencia)}/{anoReferencia}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Formulário */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Adicionar Saldo</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label>Banco *</Label>
                    <Select value={bancoId} onValueChange={setBancoId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o banco" />
                      </SelectTrigger>
                      <SelectContent>
                        {bancos.map((banco) => (
                          <SelectItem key={banco.id} value={banco.id}>
                            {banco.codigo} - {banco.nome}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Data do Saldo *</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-normal",
                            !dataReferencia && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {dataReferencia ? format(dataReferencia, "dd/MM/yyyy") : <span>Selecione a data</span>}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={dataReferencia}
                          onSelect={(date) => date && setDataReferencia(date)}
                          initialFocus
                          className="pointer-events-auto"
                        />
                      </PopoverContent>
                    </Popover>
                  </div>

                  <div>
                    <Label>Saldo Inicial *</Label>
                    <Input
                      type="text"
                      placeholder="0,00"
                      value={saldoInicial}
                      onChange={(e) => setSaldoInicial(e.target.value)}
                    />
                  </div>
                </div>

                <div>
                  <Label>Observação</Label>
                  <Textarea
                    placeholder="Observações sobre o saldo (opcional)"
                    value={observacao}
                    onChange={(e) => setObservacao(e.target.value)}
                  />
                </div>

                <Button onClick={handleAdicionarSaldo} className="w-full">
                  <Plus className="mr-2 h-4 w-4" />
                  Adicionar Saldo
                </Button>
              </CardContent>
            </Card>

            {/* Lista de Saldos Configurados */}
            {saldosConfigurados.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Saldos Configurados</CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Banco</TableHead>
                        <TableHead>Data</TableHead>
                        <TableHead className="text-right">Saldo Inicial</TableHead>
                        <TableHead className="text-right">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {saldosConfigurados.map((saldo: any) => (
                        <TableRow key={saldo.id}>
                          <TableCell>
                            {saldo.bancos?.codigo} - {saldo.bancos?.nome}
                          </TableCell>
                          <TableCell>
                            {saldo.data_referencia ? formatDateBR(saldo.data_referencia) : '-'}
                          </TableCell>
                          <TableCell className="text-right font-bold">
                            {formatarValor(saldo.saldo_inicial)}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleExcluirSaldo(saldo.id)}
                            >
                              <Trash2 className="h-4 w-4 text-red-600" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setModalConfigAberto(false)}>
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
