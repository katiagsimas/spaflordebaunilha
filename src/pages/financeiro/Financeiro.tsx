import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PageHeader } from '@/components/PageHeader';
import { TileCard } from '@/components/TileCard';
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
  Settings2,
  Plus,
  Trash2,
  Wallet,
  ArrowUp,
  ArrowDown,
  ArrowUpCircle,
  ArrowDownCircle,
  Building2,
  LayoutDashboard,
  AlertCircle,
  Users,
  BookOpen,
  CalendarCheck,
  CalendarDays,
  ChevronLeft,
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

import { useResumoDashboard } from '@/hooks/useResumoDashboard';
import { TabelaInadimplencia } from '@/components/financeiro/TabelaInadimplencia';
import { useModuleHelp } from '@/hooks/useModuleHelp';
import { HelpButton } from '@/components/help/HelpButton';
import { ModuleHelpDrawer } from '@/components/help/ModuleHelpDrawer';
import { financeiroHelp } from '@/components/help/contents/financeiroHelp';
import dinheiroHero from '@/assets/dinheiro-hero-banner.png';
import { HeroBanner } from '@/components/HeroBanner';

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
  const { inadimplenciaClientes, inadimplenciaFornecedores } = useResumoDashboard();
  const { isHelpOpen, toggleHelp, closeHelp } = useModuleHelp();

  useEffect(() => {
    fetchResumo();
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

  // Dashboard: dados e queries vivem em useResumoDashboard


  const coresBanco = [
    { border: 'border-l-blue-500', text: 'text-primary', bg: 'bg-sfb-areia/10 dark:bg-sfb-areia/20' },
    { border: 'border-l-green-500', text: 'text-success', bg: 'bg-success/10 dark:bg-success/20' },
    { border: 'border-l-sfb-terracota', text: 'text-sfb-terracota', bg: 'bg-sfb-terracota/15 dark:bg-sfb-terracota/20' },
    { border: 'border-l-orange-500', text: 'text-warning', bg: 'bg-warning/10 dark:bg-warning/20' },
    { border: 'border-l-sfb-terracota', text: 'text-sfb-terracota', bg: 'bg-sfb-terracota/10 dark:bg-sfb-terracota/20' },
    { border: 'border-l-cyan-500', text: 'text-cyan-600', bg: 'bg-cyan-50 dark:bg-cyan-950' },
    { border: 'border-l-indigo-500', text: 'text-indigo-600', bg: 'bg-indigo-50 dark:bg-indigo-950' },
    { border: 'border-l-teal-500', text: 'text-teal-600', bg: 'bg-teal-50 dark:bg-teal-950' },
  ];

  const getCorBanco = (index: number) => {
    return coresBanco[index % coresBanco.length];
  };

  if (loading) return <LoadingState message="Carregando Meu Dinheiro" submessage="Preparando suas informações financeiras..." />;

  const maxSaldo = Math.max(...bancosSaldos.map(b => b.saldo_atual || 0), 1);

  const navCards = [
    { icon: Settings2, title: 'Cadastros', desc: 'Bancos, plano de contas e categorias.', to: '/financeiro/cadastros' },
    { icon: TrendingUp, title: 'Contas a Receber', desc: 'O que entra na sua confeitaria.', to: '/financeiro/contas-receber' },
    { icon: TrendingDown, title: 'Contas a Pagar', desc: 'O que sai e precisa do seu cuidado.', to: '/financeiro/contas-pagar' },
    { icon: BookOpen, title: 'Fluxo de Caixa', desc: 'Movimentações diárias e mensais.', to: '/financeiro/fluxo-caixa' },
    { icon: PieChart, title: 'DRE', desc: 'Resultado do mês em uma visão clara.', to: '/financeiro/dre' },
    { icon: CalendarCheck, title: 'Fechamento de Mês', desc: 'Encerre o ciclo com tranquilidade.', to: '/financeiro/fechamento-mes' },
  ];

  return (
    <div className="flex h-full overflow-hidden bg-sfb-baunilha">
      <div className="flex-1 min-w-0 overflow-auto">
        <div className="container mx-auto px-6 pt-1 pb-6 space-y-6 pb-24">
          {/* ===== HEADER PREMIUM ===== */}
          <div
            className="relative overflow-hidden rounded-2xl border border-sfb-cacau/10 shadow-[0_4px_24px_-16px_rgba(91,26,43,0.18)]"
            style={{ background: "var(--sfb-baunilha)" }}
          >
            <div className="flex items-center gap-3 px-4 py-4 sm:gap-4 sm:px-6 sm:py-5 lg:px-8 lg:py-6 pr-[150px] sm:pr-[200px] lg:pr-[260px] min-h-[130px] sm:min-h-[150px] lg:min-h-[170px]">
              <div className="flex-1 min-w-0">
                <h1 className="font-display text-2xl font-normal leading-tight text-sfb-cacau sm:text-3xl lg:text-[36px]">
                  Meu Dinheiro
                </h1>
                <div className="mt-2 flex items-center gap-3">
                  <span className="h-px w-8 bg-sfb-terracota sm:w-10" />
                  <p className="text-xs italic text-sfb-terracota sm:text-sm">
                    Controle total do que entra, sai e vira lucro.
                  </p>
                </div>
              </div>
            </div>
            <img
              src={dinheiroHero}
              alt=""
              aria-hidden="true"
              className="pointer-events-none absolute right-0 top-1/2 h-[140px] w-auto -translate-y-1/2 object-contain sm:h-[180px] lg:h-[220px]"
            />
          </div>


          {/* Botão de ajuda padronizado: canto esquerdo, abaixo do header */}
          <div className="flex justify-start">
            <HelpButton isOpen={isHelpOpen} onClick={toggleHelp} />
          </div>


          {/* CARDS DE NAVEGAÇÃO 2x3 */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {navCards.map((c) => {
              const Icon = c.icon;
              return (
                <button
                  key={c.title}
                  onClick={() => navigate(c.to)}
                  className="group flex items-center gap-4 bg-white border-2 border-sfb-terracota/60 rounded-xl p-5 text-left transition-all duration-200 hover:border-sfb-terracota hover:shadow-md"
                >
                  <div className="w-11 h-11 rounded-full bg-sfb-baunilha flex items-center justify-center shrink-0">
                    <Icon className="h-5 w-5 text-sfb-cacau" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-display text-[15px] font-semibold text-sfb-cacau leading-tight">
                      {c.title}
                    </p>
                    <p className="text-[12px] text-muted-foreground mt-0.5">
                      {c.desc}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>

          {/* RESUMO FINANCEIRO */}
          <div className="bg-white border border-sfb-cacau/10 rounded-xl p-6 space-y-5">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-sfb-cacau" />
                <h2 className="font-display text-[18px] uppercase tracking-wide text-sfb-cacau">
                  Resumo Financeiro
                </h2>
              </div>
              <Button
                onClick={handleAbrirConfig}
                className={`bg-sfb-terracota hover:bg-sfb-terracota/90 text-sfb-baunilha rounded-lg px-4 py-2 text-sm ${bancosSaldos.length === 0 ? 'animate-pulse' : ''}`}
              >
                <Settings2 className="mr-2 h-4 w-4" />
                Configure Saldos Iniciais
              </Button>
            </div>

            {/* Filtros */}
            <div className="grid grid-cols-2 gap-3 max-w-2xl">
              <div>
                <Label className="text-[11px] text-muted-foreground mb-1">Mês</Label>
                <Select value={mesSelecionado.toString()} onValueChange={(v) => setMesSelecionado(parseInt(v))}>
                  <SelectTrigger className="w-full border-sfb-cacau/20 rounded-lg bg-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[1,2,3,4,5,6,7,8,9,10,11,12].map((mes) => (
                      <SelectItem key={mes} value={mes.toString()}>{getMesNome(mes)}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-[11px] text-muted-foreground mb-1">Ano</Label>
                <Select value={anoSelecionado.toString()} onValueChange={(v) => setAnoSelecionado(parseInt(v))}>
                  <SelectTrigger className="w-full border-sfb-cacau/20 rounded-lg bg-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {gerarOpcoesAnos().map((ano) => (
                      <SelectItem key={ano} value={ano.toString()}>{ano}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <div className="bg-white border border-sfb-cacau/10 rounded-xl p-5 flex items-center justify-between">
                <div>
                  <p className="text-[12px] text-muted-foreground">Saldo Anterior</p>
                  <p className="text-2xl font-bold text-sfb-cacau mt-1">{formatarValor(saldoAnterior)}</p>
                </div>
                <CalendarDays className="h-7 w-7 text-muted-foreground" />
              </div>
              <div className="bg-white border border-sfb-cacau/10 rounded-xl p-5 flex items-center justify-between">
                <div>
                  <p className="text-[12px] text-muted-foreground">Entradas</p>
                  <p className="text-2xl font-bold mt-1" style={{ color: '#2e7d32' }}>{formatarValor(entradas)}</p>
                </div>
                <ArrowUp className="h-7 w-7" style={{ color: '#2e7d32' }} />
              </div>
              <div className="bg-white border border-sfb-cacau/10 rounded-xl p-5 flex items-center justify-between">
                <div>
                  <p className="text-[12px] text-muted-foreground">Saídas</p>
                  <p className="text-2xl font-bold text-sfb-terracota mt-1">{formatarValor(saidas)}</p>
                </div>
                <ArrowDown className="h-7 w-7 text-sfb-terracota" />
              </div>
              <div className="bg-white border border-sfb-cacau/10 rounded-xl p-5 flex items-center justify-between">
                <div>
                  <p className="text-[12px] text-muted-foreground">Saldo Atual</p>
                  <p className="text-2xl font-bold text-sfb-cacau mt-1">{formatarValor(saldoAtual)}</p>
                </div>
                <DollarSign className="h-7 w-7 text-sfb-terracota" />
              </div>
            </div>

            {/* Distribuição por Banco */}
            {bancosSaldos.filter(b => b.saldo_atual !== 0).length > 0 && (
              <>
                <Separator />
                <div>
                  <h3 className="font-display text-[15px] uppercase tracking-wide text-sfb-cacau mb-4 flex items-center gap-2">
                    <Building2 className="h-5 w-5 text-sfb-cacau" />
                    Distribuição por Banco
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                    {bancosSaldos.filter(b => b.saldo_atual !== 0).map((banco) => (
                      <div key={banco.banco_id} className="bg-white border border-sfb-cacau/10 rounded-xl p-4 flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-muted-foreground truncate font-semibold">
                            {banco.banco_codigo} - {banco.banco_nome}
                          </p>
                          <p className="text-lg font-bold mt-1 text-sfb-cacau">
                            {formatarValor(banco.saldo_atual)}
                          </p>
                        </div>
                        <div className="w-10 h-10 rounded-lg bg-sfb-baunilha flex items-center justify-center">
                          <Wallet className="h-5 w-5 text-sfb-terracota" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>

          {/* INADIMPLÊNCIA */}
          <div className="grid gap-4 md:grid-cols-2">
            <TabelaInadimplencia tipo="clientes" itens={inadimplenciaClientes} />
            <TabelaInadimplencia tipo="fornecedores" itens={inadimplenciaFornecedores} />
          </div>
        </div>

        {/* Botões flutuantes */}
        <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2">
          <button
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="w-11 h-11 rounded-full bg-sfb-terracota text-sfb-baunilha flex items-center justify-center shadow-lg hover:opacity-90 transition"
            aria-label="Topo"
          >
            <ArrowUp className="h-5 w-5" />
          </button>
          <button
            onClick={() => navigate(-1)}
            className="w-11 h-11 rounded-full bg-sfb-terracota text-sfb-baunilha flex items-center justify-center shadow-lg hover:bg-sfb-terracota/90 transition"
            aria-label="Voltar"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
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
                              <Trash2 className="h-4 w-4 text-sfb-coral" />
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
      <ModuleHelpDrawer content={financeiroHelp} isOpen={isHelpOpen} onClose={closeHelp} />
    </div>

  );
}
