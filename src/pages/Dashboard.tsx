import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { PremiumCard } from "@/components/dashboard/PremiumCard";
import { HeroBanner } from "@/components/HeroBanner";
import illuPresenteVinho from "@/assets/bolo-aniversariantes.png";
import illuCalendarioRosa from "@/assets/sfb-illu-calendario-rosa.png";
import illuCalendarioProximas from "@/assets/calendario-proximas-entregas.png";
import { getTodayISO, formatDateToISO } from "@/lib/dateUtils";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { LoadingStateFullScreen } from "@/components/LoadingState";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  AlertCircle,
  TrendingUp,
  TrendingDown,
  ChevronLeft,
  ChevronRight,
  DollarSign,
  Cake,
  Calendar as CalendarIcon,
  Sparkles,
  Loader2,
  ArrowRight
} from "lucide-react";
import { usePlano } from "@/hooks/usePlano";
import { useModuleHelp } from "@/hooks/useModuleHelp";
import { HelpButton } from "@/components/help/HelpButton";
import { ModuleHelpDrawer } from "@/components/help/ModuleHelpDrawer";
import { dashboardHelp } from "@/components/help/contents/dashboardHelp";

import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useGroup } from "@/contexts/GroupContext";

import { useUserProfile } from "@/hooks/useUserProfile";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import { useNavigate } from "react-router-dom";
import { saudacaoPorHora } from "@/lib/saudacao";
import { getPrimeiroNome } from "@/components/UserMenu";
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameDay,
  isToday,
  isTomorrow,
  getDay,
  addDays
} from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell
} from "recharts";
import { ShoppingBag, Users } from "lucide-react";

interface Encomenda {
  id: string;
  cliente: string;
  data_entrega: string;
  hora_entrega: string;
  valor: number;
  status: string;
}

interface DadosDia {
  dia: Date;
  encomendas: Encomenda[];
  quantidade: number;
  isHoje: boolean;
  isAmanha: boolean;
}

export default function Dashboard() {
  const { user } = useAuth();
  const { activeGroupId } = useGroup();

  const { profile } = useUserProfile();
  const navigate = useNavigate();
  const [mesSelecionado, setMesSelecionado] = useState(() => {
    const saved = localStorage.getItem('cda_dashboard_periodo');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (typeof parsed.mes === 'number') return parsed.mes;
    }
    return new Date().getMonth();
  });
  const [anoSelecionado, setAnoSelecionado] = useState(() => {
    const saved = localStorage.getItem('cda_dashboard_periodo');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (typeof parsed.ano === 'number') return parsed.ano;
    }
    return new Date().getFullYear();
  });
  const [diaSelecionado, setDiaSelecionado] = useState(new Date());
  const [loading, setLoading] = useState(true);
  const { plano } = usePlano();
  const { isAdmin } = useIsAdmin();
  const { isHelpOpen, toggleHelp, closeHelp } = useModuleHelp();

  const [alertas, setAlertas] = useState({
    receberAtrasado: { quantidade: 0, valor: 0 },
    pagarAtrasado: { quantidade: 0, valor: 0 },
    inadimplenciaTotal: 0
  });

  const [calendarioDados, setCalendarioDados] = useState<DadosDia[]>([]);
  const [calendarioAnteriorDados, setCalendarioAnteriorDados] = useState<DadosDia[]>([]);
  const [calendarioSeguinteDados, setCalendarioSeguinteDados] = useState<DadosDia[]>([]);
  const [encomendasDia, setEncomendasDia] = useState<Encomenda[]>([]);
  
  // Estados para navegação dos 3 calendários
  const [mesAnterior, setMesAnterior] = useState({ mes: mesSelecionado - 1 < 0 ? 11 : mesSelecionado - 1, ano: mesSelecionado - 1 < 0 ? anoSelecionado - 1 : anoSelecionado });
  const [mesSeguinte, setMesSeguinte] = useState({ mes: mesSelecionado + 1 > 11 ? 0 : mesSelecionado + 1, ano: mesSelecionado + 1 > 11 ? anoSelecionado + 1 : anoSelecionado });

  const [financeiro, setFinanceiro] = useState({
    receberAberto: 0,
    pagarAberto: 0,
    saldoAtual: 0
  });

  const [visaoEconomica, setVisaoEconomica] = useState({
    mensal: { receitas: 0, custos: 0, lucro: 0 },
    anual: [] as { mes: string; receitas: number; custos: number; lucro: number }[]
  });

  const [tabEconomica, setTabEconomica] = useState("mensal");

  // Estados para Top 5 Produtos e Ticket Médio
  const [produtos, setProdutos] = useState<any[]>([]);
  const [ticketMedio, setTicketMedio] = useState({
    mensal: 0,
    anual: 0
  });
  const [modoVisualizacao, setModoVisualizacao] = useState<'mensal' | 'anual'>(() => {
    const saved = localStorage.getItem('cda_dashboard_periodo');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed.modo === 'mensal' || parsed.modo === 'anual') return parsed.modo;
    }
    return 'mensal';
  });

  // Contadores topo
  const [contadores, setContadores] = useState({
    encomendasConfirmadas: 0,
    clientes: 0
  });

  // Aniversariantes do mês
  const [aniversariantes, setAniversariantes] = useState<any[]>([]);


  // Vendas por mês (últimos 6 meses)
  const [vendasPorMes, setVendasPorMes] = useState<{ mes: string; total: number }[]>([]);
  // Fluxo de caixa (últimos 6 meses)
  const [fluxoCaixa, setFluxoCaixa] = useState<{ mes: string; saldo: number }[]>([]);

  const meses = [
    "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
    "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
  ];

  const dataAtual = new Date(anoSelecionado, mesSelecionado, 1);

  useEffect(() => {
    if (user) {
      carregarDados();
      carregarCalendarioAnterior();
      carregarCalendarioSeguinte();
    }
  }, [mesSelecionado, anoSelecionado, user]);

  useEffect(() => {
    if (user) {
      carregarProdutosMaisVendidos();
    }
  }, [mesSelecionado, anoSelecionado, modoVisualizacao, user]);

  // Debounce para evitar múltiplas chamadas em cascata via realtime (Semana 1 - otimização)
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const debounceCalendarioRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Realtime restrito a `encomendas` (Quick Win #2 — Maio/2026):
  // As 4 tabelas financeiras (contas_receber_parcelas/pagamentos e contas_pagar_parcelas/pagamentos)
  // foram removidas da publicação `supabase_realtime`. O Dashboard recarrega ao remontar (navegação
  // entre rotas) e as próprias telas financeiras chamam suas rotinas de recarga após mutações.
  useEffect(() => {
    if (!user || !activeGroupId) return;

    const recarregarTudoDebounced = () => {
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
      if (debounceCalendarioRef.current) clearTimeout(debounceCalendarioRef.current);
      debounceTimerRef.current = setTimeout(() => {
        carregarDados();
      }, 2500);
      debounceCalendarioRef.current = setTimeout(() => {
        carregarCalendarioAnterior();
        carregarCalendarioSeguinte();
      }, 2500);
    };

    const channel = supabase
      .channel('dashboard-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'encomendas',
          filter: `owner_group_id=eq.${activeGroupId}`,
        },
        recarregarTudoDebounced
      )
      .subscribe();

    return () => {
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
      if (debounceCalendarioRef.current) clearTimeout(debounceCalendarioRef.current);
      supabase.removeChannel(channel);
    };
  }, [user, activeGroupId, mesSelecionado, anoSelecionado]);


  // Persistir período selecionado no localStorage
  useEffect(() => {
    localStorage.setItem('cda_dashboard_periodo', JSON.stringify({
      mes: mesSelecionado,
      ano: anoSelecionado,
      modo: modoVisualizacao
    }));
  }, [mesSelecionado, anoSelecionado, modoVisualizacao]);

  useEffect(() => {
    setMesAnterior({ mes: mesSelecionado - 1 < 0 ? 11 : mesSelecionado - 1, ano: mesSelecionado - 1 < 0 ? anoSelecionado - 1 : anoSelecionado });
    setMesSeguinte({ mes: mesSelecionado + 1 > 11 ? 0 : mesSelecionado + 1, ano: mesSelecionado + 1 > 11 ? anoSelecionado + 1 : anoSelecionado });
  }, [mesSelecionado, anoSelecionado]);

  useEffect(() => {
    if (user) {
      carregarCalendarioAnterior();
    }
  }, [mesAnterior, user]);

  useEffect(() => {
    if (user) {
      carregarCalendarioSeguinte();
    }
  }, [mesSeguinte, user]);

  async function carregarDados() {
    setLoading(true);
    try {
      await Promise.all([
        carregarAlertas(),
        carregarCalendario(),
        carregarFinanceiro(),
        carregarVisaoEconomica(),
        carregarContadoresEGraficos(),
        carregarAniversariantes()
      ]);
    } catch (error) {
      console.error("Erro ao carregar dashboard:", error);
    } finally {
      setLoading(false);
    }
  }

  async function carregarAniversariantes() {
    if (!user) return;
    const mesAtual = new Date().getMonth() + 1;
    const { data } = await supabase
      .from('clientes')
      .select('id, nome, data_aniversario, telefone')
      .eq('usuario_id', user.id)
      .not('data_aniversario', 'is', null);

    const aniversariantesDoMes = (data || []).filter((c: any) => {
      if (!c.data_aniversario) return false;
      const mes = parseInt(c.data_aniversario.split('-')[1]);
      return mes === mesAtual;
    }).sort((a: any, b: any) => {
      const diaA = parseInt(a.data_aniversario.split('-')[2]);
      const diaB = parseInt(b.data_aniversario.split('-')[2]);
      return diaA - diaB;
    });

    setAniversariantes(aniversariantesDoMes);
  }

  async function carregarContadoresEGraficos() {
    if (!user) return;

    const inicioMes = format(new Date(anoSelecionado, mesSelecionado, 1), "yyyy-MM-dd");
    const fimMes = format(new Date(anoSelecionado, mesSelecionado + 1, 0), "yyyy-MM-dd");

    // Encomendas confirmadas no mês
    const { count: confirmadasCount } = await supabase
      .from("encomendas")
      .select("id", { count: "exact", head: true })
      .eq("usuario_id", user.id)
      .gte("data_entrega", inicioMes)
      .lte("data_entrega", fimMes)
      .in("status", ["confirmado", "em_producao", "pronto", "entregue"]);

    // Clientes únicos atendidos no mês
    const { data: encomendasMes } = await supabase
      .from("encomendas")
      .select("cliente")
      .eq("usuario_id", user.id)
      .gte("data_entrega", inicioMes)
      .lte("data_entrega", fimMes)
      .in("status", ["confirmado", "em_producao", "pronto", "entregue"]);

    const clientesUnicos = new Set((encomendasMes || []).map(e => (e.cliente || "").trim().toLowerCase()).filter(Boolean));

    setContadores({
      encomendasConfirmadas: confirmadasCount || 0,
      clientes: clientesUnicos.size
    });

    // Vendas por mês — últimos 6 meses (a partir do mês selecionado)
    const vendasMeses: { mes: string; total: number }[] = [];
    const fluxoMeses: { mes: string; saldo: number }[] = [];

    for (let i = 5; i >= 0; i--) {
      const ref = new Date(anoSelecionado, mesSelecionado - i, 1);
      const ini = format(startOfMonth(ref), "yyyy-MM-dd");
      const fim = format(endOfMonth(ref), "yyyy-MM-dd");
      const label = format(ref, "MMM", { locale: ptBR });

      const { data: encs } = await supabase
        .from("encomendas")
        .select("valor")
        .eq("usuario_id", user.id)
        .gte("data_entrega", ini)
        .lte("data_entrega", fim)
        .in("status", ["confirmado", "em_producao", "pronto", "entregue"]);

      const total = (encs || []).reduce((s, e: any) => s + (e.valor || 0), 0);
      vendasMeses.push({ mes: label.charAt(0).toUpperCase() + label.slice(1), total });

      // Fluxo de caixa (entradas - saídas pagas no mês)
      const [{ data: pagamentosReceber }, { data: pagamentosPagar }] = await Promise.all([
        supabase
          .from("contas_receber_pagamentos")
          .select("valor_pago, data_pagamento, parcela:contas_receber_parcelas!inner(conta_receber:contas_receber!inner(usuario_id))")
          .eq("parcela.conta_receber.usuario_id", user.id)
          .gte("data_pagamento", ini)
          .lte("data_pagamento", fim)
          .eq("estornado", false),
        supabase
          .from("contas_pagar_pagamentos")
          .select("valor_pago, data_pagamento, parcela:contas_pagar_parcelas!inner(conta_pagar:contas_pagar!inner(usuario_id))")
          .eq("parcela.conta_pagar.usuario_id", user.id)
          .gte("data_pagamento", ini)
          .lte("data_pagamento", fim)
          .eq("estornado", false)
      ]);

      const entradas = (pagamentosReceber || []).reduce((s, p: any) => s + (p.valor_pago || 0), 0);
      const saidas = (pagamentosPagar || []).reduce((s, p: any) => s + (p.valor_pago || 0), 0);
      fluxoMeses.push({ mes: label.charAt(0).toUpperCase() + label.slice(1), saldo: entradas - saidas });
    }

    setVendasPorMes(vendasMeses);
    setFluxoCaixa(fluxoMeses);
  }

  async function carregarAlertas() {
    if (!user) return;
    const hoje = getTodayISO();

    // Buscar parcelas de contas a receber atrasadas (não pagas)
    const { data: parcelasReceberAtrasadas } = await supabase
      .from("contas_receber_parcelas")
      .select(`
        valor_parcela,
        valor_pago,
        conta_receber:contas_receber!inner (
          usuario_id
        )
      `)
      .eq("conta_receber.usuario_id", user.id)
      .lt("data_vencimento", hoje)
      .in("status", ["aberto", "atrasado", "pagamento_parcial"]);

    // Buscar parcelas de contas a pagar atrasadas (não pagas)
    const { data: parcelasPagarAtrasadas } = await supabase
      .from("contas_pagar_parcelas")
      .select(`
        valor_parcela,
        valor_pago,
        conta_pagar:contas_pagar!inner (
          usuario_id
        )
      `)
      .eq("conta_pagar.usuario_id", user.id)
      .lt("data_vencimento", hoje)
      .in("status", ["aberto", "atrasado", "pagamento_parcial"]);

    // Calcular valores pendentes (parcela - pago)
    const valorReceberAtrasado = parcelasReceberAtrasadas?.reduce((sum, p) => {
      const pendente = (p.valor_parcela || 0) - (p.valor_pago || 0);
      return sum + pendente;
    }, 0) || 0;

    const valorPagarAtrasado = parcelasPagarAtrasadas?.reduce((sum, p) => {
      const pendente = (p.valor_parcela || 0) - (p.valor_pago || 0);
      return sum + pendente;
    }, 0) || 0;

    setAlertas({
      receberAtrasado: {
        quantidade: parcelasReceberAtrasadas?.length || 0,
        valor: valorReceberAtrasado
      },
      pagarAtrasado: {
        quantidade: parcelasPagarAtrasadas?.length || 0,
        valor: valorPagarAtrasado
      },
      inadimplenciaTotal: valorReceberAtrasado + valorPagarAtrasado
    });
  }

  async function carregarCalendario() {
    if (!user) return;
    const inicio = startOfMonth(dataAtual);
    const fim = endOfMonth(dataAtual);
    
    const inicioStr = format(inicio, "yyyy-MM-dd");
    const fimStr = format(fim, "yyyy-MM-dd");

    const { data: encomendas } = await supabase
      .from("encomendas")
      .select("id, data_entrega, hora_entrega, valor, status, cliente")
      .eq("usuario_id", user.id)
      .gte("data_entrega", inicioStr)
      .lte("data_entrega", fimStr)
      .neq("status", "cancelada")
      .order("data_entrega", { ascending: true });

    const dias = eachDayOfInterval({ start: inicio, end: fim });
    
    const dadosCalendario = dias.map(dia => {
      const encomendasDia = encomendas?.filter(enc => 
        isSameDay(new Date(enc.data_entrega!), dia)
      ).map(enc => ({
        id: enc.id,
        cliente: enc.cliente || "Cliente",
        data_entrega: enc.data_entrega || "",
        hora_entrega: enc.hora_entrega || "",
        valor: enc.valor || 0,
        status: enc.status || "pendente"
      })) || [];

      return {
        dia,
        encomendas: encomendasDia,
        quantidade: encomendasDia.length,
        isHoje: isToday(dia),
        isAmanha: isTomorrow(dia)
      };
    });

    setCalendarioDados(dadosCalendario);
    
    const dadosHoje = dadosCalendario.find(d => isToday(d.dia));
    if (dadosHoje) {
      setEncomendasDia(dadosHoje.encomendas);
    }
  }

  async function carregarCalendarioAnterior() {
    if (!user) return;
    const dataAnterior = new Date(mesAnterior.ano, mesAnterior.mes, 1);
    const inicio = startOfMonth(dataAnterior);
    const fim = endOfMonth(dataAnterior);
    
    const inicioStr = format(inicio, "yyyy-MM-dd");
    const fimStr = format(fim, "yyyy-MM-dd");

    const { data: encomendas } = await supabase
      .from("encomendas")
      .select("id, data_entrega, hora_entrega, valor, status, cliente")
      .eq("usuario_id", user.id)
      .gte("data_entrega", inicioStr)
      .lte("data_entrega", fimStr)
      .neq("status", "cancelada")
      .order("data_entrega", { ascending: true });

    const dias = eachDayOfInterval({ start: inicio, end: fim });
    
    const dadosCalendario = dias.map(dia => {
      const encomendasDia = encomendas?.filter(enc => 
        isSameDay(new Date(enc.data_entrega!), dia)
      ).map(enc => ({
        id: enc.id,
        cliente: enc.cliente || "Cliente",
        data_entrega: enc.data_entrega || "",
        hora_entrega: enc.hora_entrega || "",
        valor: enc.valor || 0,
        status: enc.status || "pendente"
      })) || [];

      return {
        dia,
        encomendas: encomendasDia,
        quantidade: encomendasDia.length,
        isHoje: isToday(dia),
        isAmanha: isTomorrow(dia)
      };
    });

    setCalendarioAnteriorDados(dadosCalendario);
  }

  async function carregarCalendarioSeguinte() {
    if (!user) return;
    const dataSeguinte = new Date(mesSeguinte.ano, mesSeguinte.mes, 1);
    const inicio = startOfMonth(dataSeguinte);
    const fim = endOfMonth(dataSeguinte);
    
    const inicioStr = format(inicio, "yyyy-MM-dd");
    const fimStr = format(fim, "yyyy-MM-dd");

    const { data: encomendas } = await supabase
      .from("encomendas")
      .select("id, data_entrega, hora_entrega, valor, status, cliente")
      .eq("usuario_id", user.id)
      .gte("data_entrega", inicioStr)
      .lte("data_entrega", fimStr)
      .neq("status", "cancelada")
      .order("data_entrega", { ascending: true });

    const dias = eachDayOfInterval({ start: inicio, end: fim });
    
    const dadosCalendario = dias.map(dia => {
      const encomendasDia = encomendas?.filter(enc => 
        isSameDay(new Date(enc.data_entrega!), dia)
      ).map(enc => ({
        id: enc.id,
        cliente: enc.cliente || "Cliente",
        data_entrega: enc.data_entrega || "",
        hora_entrega: enc.hora_entrega || "",
        valor: enc.valor || 0,
        status: enc.status || "pendente"
      })) || [];

      return {
        dia,
        encomendas: encomendasDia,
        quantidade: encomendasDia.length,
        isHoje: isToday(dia),
        isAmanha: isTomorrow(dia)
      };
    });

    setCalendarioSeguinteDados(dadosCalendario);
  }

  async function carregarFinanceiro() {
    if (!user) return;
    const inicioMes = formatDateToISO(new Date(anoSelecionado, mesSelecionado, 1));
    const fimMes = formatDateToISO(new Date(anoSelecionado, mesSelecionado + 1, 0));

    // Buscar parcelas de contas a receber em aberto no mês
    const { data: parcelasReceber } = await supabase
      .from("contas_receber_parcelas")
      .select(`
        valor_parcela,
        valor_pago,
        conta_receber:contas_receber!inner (
          usuario_id
        )
      `)
      .eq("conta_receber.usuario_id", user.id)
      .gte("data_vencimento", inicioMes)
      .lte("data_vencimento", fimMes)
      .in("status", ["aberto", "atrasado", "pagamento_parcial"]);

    // Buscar parcelas de contas a pagar em aberto no mês
    const { data: parcelasPagar } = await supabase
      .from("contas_pagar_parcelas")
      .select(`
        valor_parcela,
        valor_pago,
        conta_pagar:contas_pagar!inner (
          usuario_id
        )
      `)
      .eq("conta_pagar.usuario_id", user.id)
      .gte("data_vencimento", inicioMes)
      .lte("data_vencimento", fimMes)
      .in("status", ["aberto", "atrasado", "pagamento_parcial"]);

    // Calcular valores pendentes (parcela - pago)
    const receberAberto = parcelasReceber?.reduce((sum, p) => {
      const pendente = (p.valor_parcela || 0) - (p.valor_pago || 0);
      return sum + pendente;
    }, 0) || 0;

    const pagarAberto = parcelasPagar?.reduce((sum, p) => {
      const pendente = (p.valor_parcela || 0) - (p.valor_pago || 0);
      return sum + pendente;
    }, 0) || 0;

    // Buscar resumo financeiro usando a mesma view que a página Financeiro
    const mesAtual = new Date().getMonth() + 1;
    const anoAtual = new Date().getFullYear();
    
    const { data: resumo } = await supabase
      .from('vw_resumo_financeiro')
      .select('*')
      .eq('user_id', user.id)
      .eq('mes', mesAtual)
      .eq('ano', anoAtual);

    let saldoAtual = 0;
    if (resumo && resumo.length > 0) {
      saldoAtual = resumo.reduce((acc, b) => acc + (b.saldo_atual || 0), 0);
    }

    setFinanceiro({
      receberAberto,
      pagarAberto,
      saldoAtual
    });
  }

  async function carregarVisaoEconomica() {
    if (!user) return;

    // Calcular dados mensais usando o mesmo conceito do DRE
    // Buscar todas as contas a pagar com suas parcelas
    const { data: contasPagarMensal } = await supabase
      .from("contas_pagar")
      .select(`
        id,
        data_emissao,
        tipo_lancamento,
        contas_pagar_parcelas (
          id,
          valor_parcela,
          data_emissao
        )
      `)
      .eq("usuario_id", user.id);

    let custosMensal = 0;
    
    contasPagarMensal?.forEach((conta: any) => {
      // Para lançamentos não recorrentes, usar data_emissao da conta principal
      if (conta.tipo_lancamento !== 'recorrente') {
        const [anoEmissao, mesEmissaoStr] = conta.data_emissao.split('-').map(Number);
        const mesEmissao = mesEmissaoStr - 1; // JavaScript meses são 0-11
        
        // Se a data de emissão da conta está no mês selecionado, somar TODAS as parcelas
        if (mesEmissao === mesSelecionado && anoEmissao === anoSelecionado) {
          conta.contas_pagar_parcelas?.forEach((parcela: any) => {
            custosMensal += parcela.valor_parcela || 0;
          });
        }
      } else {
        // Para lançamentos recorrentes, usar data_emissao de cada parcela
        conta.contas_pagar_parcelas?.forEach((parcela: any) => {
          const [anoEmissaoParcela, mesEmissaoParcelaStr] = parcela.data_emissao.split('-').map(Number);
          const mesEmissaoParcela = mesEmissaoParcelaStr - 1; // JavaScript meses são 0-11
          
          if (mesEmissaoParcela === mesSelecionado && anoEmissaoParcela === anoSelecionado) {
            custosMensal += parcela.valor_parcela || 0;
          }
        });
      }
    });

    // Buscar receitas mensais (mantém o mesmo conceito para receitas)
    const { data: contasReceberMensal } = await supabase
      .from("contas_receber")
      .select(`
        id,
        data_emissao,
        tipo_lancamento,
        contas_receber_parcelas (
          id,
          valor_parcela,
          data_emissao
        )
      `)
      .eq("usuario_id", user.id);

    let receitasMensal = 0;
    
    contasReceberMensal?.forEach((conta: any) => {
      // Para lançamentos não recorrentes, usar data_emissao da conta principal
      if (conta.tipo_lancamento !== 'recorrente') {
        const [anoEmissao, mesEmissaoStr] = conta.data_emissao.split('-').map(Number);
        const mesEmissao = mesEmissaoStr - 1;
        
        if (mesEmissao === mesSelecionado && anoEmissao === anoSelecionado) {
          conta.contas_receber_parcelas?.forEach((parcela: any) => {
            receitasMensal += parcela.valor_parcela || 0;
          });
        }
      } else {
        // Para lançamentos recorrentes, usar data_emissao de cada parcela
        conta.contas_receber_parcelas?.forEach((parcela: any) => {
          const [anoEmissaoParcela, mesEmissaoParcelaStr] = parcela.data_emissao.split('-').map(Number);
          const mesEmissaoParcela = mesEmissaoParcelaStr - 1;
          
          if (mesEmissaoParcela === mesSelecionado && anoEmissaoParcela === anoSelecionado) {
            receitasMensal += parcela.valor_parcela || 0;
          }
        });
      }
    });

    const lucroMensal = receitasMensal - custosMensal;

    // Calcular dados anuais usando o mesmo conceito do DRE
    const dadosAnuais = [];
    for (let i = 0; i < 12; i++) {
      let custosAnual = 0;
      let receitasAnual = 0;

      // Processar custos anuais
      contasPagarMensal?.forEach((conta: any) => {
        if (conta.tipo_lancamento !== 'recorrente') {
          const [anoEmissao, mesEmissaoStr] = conta.data_emissao.split('-').map(Number);
          const mesEmissao = mesEmissaoStr - 1;
          
          if (mesEmissao === i && anoEmissao === anoSelecionado) {
            conta.contas_pagar_parcelas?.forEach((parcela: any) => {
              custosAnual += parcela.valor_parcela || 0;
            });
          }
        } else {
          conta.contas_pagar_parcelas?.forEach((parcela: any) => {
            const [anoEmissaoParcela, mesEmissaoParcelaStr] = parcela.data_emissao.split('-').map(Number);
            const mesEmissaoParcela = mesEmissaoParcelaStr - 1;
            
            if (mesEmissaoParcela === i && anoEmissaoParcela === anoSelecionado) {
              custosAnual += parcela.valor_parcela || 0;
            }
          });
        }
      });

      // Processar receitas anuais
      contasReceberMensal?.forEach((conta: any) => {
        if (conta.tipo_lancamento !== 'recorrente') {
          const [anoEmissao, mesEmissaoStr] = conta.data_emissao.split('-').map(Number);
          const mesEmissao = mesEmissaoStr - 1;
          
          if (mesEmissao === i && anoEmissao === anoSelecionado) {
            conta.contas_receber_parcelas?.forEach((parcela: any) => {
              receitasAnual += parcela.valor_parcela || 0;
            });
          }
        } else {
          conta.contas_receber_parcelas?.forEach((parcela: any) => {
            const [anoEmissaoParcela, mesEmissaoParcelaStr] = parcela.data_emissao.split('-').map(Number);
            const mesEmissaoParcela = mesEmissaoParcelaStr - 1;
            
            if (mesEmissaoParcela === i && anoEmissaoParcela === anoSelecionado) {
              receitasAnual += parcela.valor_parcela || 0;
            }
          });
        }
      });

      dadosAnuais.push({
        mes: meses[i].substring(0, 3),
        receitas: receitasAnual,
        custos: custosAnual,
        lucro: receitasAnual - custosAnual
      });
    }

    setVisaoEconomica({
      mensal: {
        receitas: receitasMensal,
        custos: custosMensal,
        lucro: lucroMensal
      },
      anual: dadosAnuais
    });
  }

  async function carregarProdutosMaisVendidos() {
    if (!user) return;
    
    try {
      let dataInicio: Date;
      let dataFim: Date;

      if (modoVisualizacao === 'mensal') {
        dataInicio = new Date(anoSelecionado, mesSelecionado, 1);
        dataFim = new Date(anoSelecionado, mesSelecionado + 1, 0);
      } else {
        dataInicio = new Date(anoSelecionado, 0, 1);
        dataFim = new Date(anoSelecionado, 11, 31);
      }

      const inicioStr = format(dataInicio, "yyyy-MM-dd");
      const fimStr = format(dataFim, "yyyy-MM-dd");

      // Buscar encomendas do período (excluindo pendentes e canceladas)
      const { data: encomendas, error } = await supabase
        .from("encomendas")
        .select(`
          id,
          valor,
          data_entrega
        `)
        .eq("usuario_id", user.id)
        .gte("data_entrega", inicioStr)
        .lte("data_entrega", fimStr)
        .in("status", ["confirmado", "em_producao", "pronto", "entregue"]);

      if (error) throw error;

      // Buscar todos os itens dessas encomendas
      const encomendaIds = encomendas?.map(e => e.id) || [];
      
      
      let itensData: any[] = [];
      if (encomendaIds.length > 0) {
        const { data: itens } = await supabase
          .from("encomenda_itens")
          .select("produto, quantidade, valor_unitario, encomenda_id")
          .in("encomenda_id", encomendaIds)
          .eq("usuario_id", user.id);
        
        itensData = itens || [];
      }

      // Agrupar produtos e contar vendas (número de encomendas únicas)
      const produtosMap = new Map();

      itensData.forEach((item: any) => {
        const produtoNome = item.produto || "Produto não informado";
        const quantidade = item.quantidade || 1;
        const valorItem = (item.valor_unitario || 0) * quantidade;
        const encomendaId = item.encomenda_id;

        if (produtosMap.has(produtoNome)) {
          const atual = produtosMap.get(produtoNome)!;
          // Adiciona a encomenda ao Set para contar vendas únicas
          atual.encomendasSet.add(encomendaId);
          produtosMap.set(produtoNome, {
            nome: atual.nome,
            encomendasSet: atual.encomendasSet,
            quantidadeTotal: atual.quantidadeTotal + quantidade,
            receita: atual.receita + valorItem
          });
        } else {
          const encomendasSet = new Set();
          encomendasSet.add(encomendaId);
          produtosMap.set(produtoNome, {
            nome: produtoNome,
            encomendasSet: encomendasSet,
            quantidadeTotal: quantidade,
            receita: valorItem
          });
        }
      });
      

      // Converter para array e ordenar por número de vendas (encomendas únicas)
      const produtosArray = Array.from(produtosMap.entries())
        .map(([id, dados]) => ({
          id,
          nome: dados.nome,
          quantidade: dados.encomendasSet.size, // número de encomendas diferentes
          quantidadeTotal: dados.quantidadeTotal, // total de unidades
          receita: dados.receita
        }))
        .sort((a, b) => b.quantidade - a.quantidade)
        .slice(0, 5);
      
      

      setProdutos(produtosArray);

      // Calcular ticket médio
      const totalEncomendas = encomendas?.length || 0;
      const totalReceita = encomendas?.reduce((sum, e) => sum + (e.valor || 0), 0) || 0;
      const ticketMedioCalc = totalEncomendas > 0 ? totalReceita / totalEncomendas : 0;

      if (modoVisualizacao === 'mensal') {
        setTicketMedio(prev => ({ ...prev, mensal: ticketMedioCalc }));
        
        // Calcular também o ticket médio anual
        const inicioAno = format(new Date(anoSelecionado, 0, 1), "yyyy-MM-dd");
        const fimAno = format(new Date(anoSelecionado, 11, 31), "yyyy-MM-dd");
        
        const { data: encomendasAnual } = await supabase
          .from("encomendas")
          .select("id, valor")
          .eq("usuario_id", user.id)
          .gte("data_entrega", inicioAno)
          .lte("data_entrega", fimAno)
          .eq("status", "entregue");
          
        const totalEncomendasAnual = encomendasAnual?.length || 0;
        const totalReceitaAnual = encomendasAnual?.reduce((sum, e) => sum + (e.valor || 0), 0) || 0;
        const ticketMedioAnual = totalEncomendasAnual > 0 ? totalReceitaAnual / totalEncomendasAnual : 0;
        
        setTicketMedio(prev => ({ ...prev, anual: ticketMedioAnual }));
      } else {
        setTicketMedio(prev => ({ ...prev, anual: ticketMedioCalc }));
      }
    } catch (error) {
      console.error("Erro ao carregar produtos mais vendidos:", error);
    }
  }

  function selecionarDia(dados: DadosDia) {
    setDiaSelecionado(dados.dia);
    setEncomendasDia(dados.encomendas);
  }

  function navegarMes(direcao: "prev" | "next", calendario: "anterior" | "atual" | "seguinte") {
    if (calendario === "atual") {
      if (direcao === "prev") {
        const novaMes = mesSelecionado === 0 ? 11 : mesSelecionado - 1;
        const novoAno = mesSelecionado === 0 ? anoSelecionado - 1 : anoSelecionado;
        setMesSelecionado(novaMes);
        setAnoSelecionado(novoAno);
      } else {
        const novaMes = mesSelecionado === 11 ? 0 : mesSelecionado + 1;
        const novoAno = mesSelecionado === 11 ? anoSelecionado + 1 : anoSelecionado;
        setMesSelecionado(novaMes);
        setAnoSelecionado(novoAno);
      }
    } else if (calendario === "anterior") {
      if (direcao === "prev") {
        const novaMes = mesAnterior.mes === 0 ? 11 : mesAnterior.mes - 1;
        const novoAno = mesAnterior.mes === 0 ? mesAnterior.ano - 1 : mesAnterior.ano;
        setMesAnterior({ mes: novaMes, ano: novoAno });
      } else {
        const novaMes = mesAnterior.mes === 11 ? 0 : mesAnterior.mes + 1;
        const novoAno = mesAnterior.mes === 11 ? mesAnterior.ano + 1 : mesAnterior.ano;
        setMesAnterior({ mes: novaMes, ano: novoAno });
      }
    } else if (calendario === "seguinte") {
      if (direcao === "prev") {
        const novaMes = mesSeguinte.mes === 0 ? 11 : mesSeguinte.mes - 1;
        const novoAno = mesSeguinte.mes === 0 ? mesSeguinte.ano - 1 : mesSeguinte.ano;
        setMesSeguinte({ mes: novaMes, ano: novoAno });
      } else {
        const novaMes = mesSeguinte.mes === 11 ? 0 : mesSeguinte.mes + 1;
        const novoAno = mesSeguinte.mes === 11 ? mesSeguinte.ano + 1 : mesSeguinte.ano;
        setMesSeguinte({ mes: novaMes, ano: novoAno });
      }
    }
  }

  if (loading) {
    return <LoadingStateFullScreen message="Carregando Meu Painel" submessage="Preparando suas informações gerenciais..." />;
  }

  const primeiroDia = getDay(startOfMonth(dataAtual));
  const diasVaziosInicio = Array(primeiroDia).fill(null);
  const diasCalendario = [...diasVaziosInicio, ...calendarioDados];

  const hojeStr = format(new Date(), "MM-dd");
  const hojeDate = new Date();
  hojeDate.setHours(0, 0, 0, 0);
  const limite = addDays(hojeDate, 7);
  const proximas = calendarioDados
    .filter(d => d.dia >= hojeDate && d.dia <= limite && d.encomendas.length > 0)
    .sort((a, b) => a.dia.getTime() - b.dia.getTime())
    .flatMap(d => d.encomendas.map(e => ({ ...e, _dia: d.dia })))
    .slice(0, 5);

  const statusBadge = (status: string) => {
    if (status === "confirmado") return "bg-sfb-dourado/20 text-sfb-vinho";
    if (status === "em_producao") return "bg-blue-100 text-blue-700";
    if (status === "pronto") return "bg-green-100 text-green-700";
    return "bg-sfb-creme text-sfb-vinho/70";
  };

  const initials = (nome: string) =>
    nome
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map(p => p.charAt(0).toUpperCase())
      .join("");

  return (
    <div className="flex h-full">
      <div className="flex-1 min-w-0 space-y-6">
      {/* ===== HEADER PREMIUM (padrão Negociações, com imagem à direita) ===== */}
        <div
          className="relative overflow-hidden rounded-2xl border border-sfb-cacau/10 shadow-[0_4px_24px_-16px_rgba(91,26,43,0.18)]"
          style={{ background: "var(--sfb-baunilha)" }}
        >
          <div className="flex items-center gap-3 px-4 py-4 sm:gap-4 sm:px-6 sm:py-5 lg:px-8 lg:py-6 pr-[150px] sm:pr-[200px] lg:pr-[260px] min-h-[130px] sm:min-h-[150px] lg:min-h-[170px]">
            <div className="flex-1 min-w-0">
              <h1 className="font-display text-2xl font-normal leading-tight text-sfb-cacau sm:text-3xl lg:text-[36px]">
                {saudacaoPorHora().texto}, {getPrimeiroNome(profile?.nome_completo, user?.email)}!
              </h1>
              <div className="mt-2 flex items-center gap-3">
                <span className="h-px w-8 bg-sfb-terracota sm:w-10" />
                <p className="text-xs italic text-sfb-terracota sm:text-sm">
                  Aqui está o resumo do seu negócio.
                </p>
              </div>
            </div>
          </div>
          <img
            src={saudacaoPorHora().imagem}
            alt={saudacaoPorHora().texto}
            aria-hidden="true"
            className="pointer-events-none absolute right-0 top-1/2 h-[140px] w-auto -translate-y-1/2 object-contain sm:h-[180px] lg:h-[220px]"
          />
        </div>


      {/* ===== BOTÃO DE AJUDA + FILTROS DE PERÍODO ===== */}
      <div className="flex items-center justify-between">
        <HelpButton isOpen={isHelpOpen} onClick={toggleHelp} />
        <div className="flex items-center gap-2">
          <Label className="text-xs font-body uppercase tracking-widest text-sfb-vinho/60">Período</Label>
          <Select value={anoSelecionado.toString()} onValueChange={(v) => setAnoSelecionado(parseInt(v))}>
            <SelectTrigger className="w-[100px] border-sfb-areia/40 bg-sfb-baunilha text-sfb-cacau hover:border-sfb-terracota">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Array.from({ length: 11 }, (_, i) => new Date().getFullYear() - 5 + i).map((year) => (
                <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={mesSelecionado.toString()} onValueChange={(v) => setMesSelecionado(parseInt(v))}>
            <SelectTrigger className="w-[130px] border-sfb-areia/40 bg-sfb-baunilha text-sfb-cacau hover:border-sfb-terracota">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {meses.map((mes, index) => (
                <SelectItem key={index} value={index.toString()}>{mes}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>




      {/* ===== 3 CARDS: SALDO / A RECEBER / A PAGAR ===== */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-3">
        {[
          {
            label: "Saldo Atual",
            sufixo: null,
            value: financeiro.saldoAtual,
            Icon: DollarSign,
            iconBg: "bg-sfb-cacau/10",
            iconColor: "text-sfb-cacau",
            accent: financeiro.saldoAtual >= 0 ? "text-sfb-cacau" : "text-sfb-terracota",
            onClick: () => navigate("/financeiro/dashboard"),
          },
          {
            label: "A Receber",
            sufixo: meses[mesSelecionado].slice(0, 3),
            value: financeiro.receberAberto,
            Icon: TrendingUp,
            iconBg: "bg-sfb-terracota/15",
            iconColor: "text-sfb-terracota",
            accent: "text-green-700",
            onClick: () => navigate("/financeiro/contas-receber"),
          },
          {
            label: "A Pagar",
            sufixo: meses[mesSelecionado].slice(0, 3),
            value: financeiro.pagarAberto,
            Icon: TrendingDown,
            iconBg: "bg-sfb-terracota/30",
            iconColor: "text-sfb-terracota",
            accent: "text-sfb-terracota",
            onClick: () => navigate("/financeiro/contas-pagar"),
          },
        ].map(({ label, sufixo, value, Icon, iconBg, iconColor, accent, onClick }) => (
          <button
            key={label}
            type="button"
            onClick={onClick}
            className="group flex items-center gap-4 rounded-2xl border border-sfb-areia/50 bg-white px-5 py-4 text-left shadow-[0_4px_18px_-10px_rgba(91,26,43,0.15)] transition hover:-translate-y-0.5 hover:border-sfb-terracota hover:shadow-[0_8px_24px_-12px_rgba(91,26,43,0.25)]"
          >
            <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full ${iconBg} ring-1 ring-sfb-areia/40`}>
              <Icon className={`h-5 w-5 ${iconColor}`} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-display text-sm text-sfb-cacau">
                {label}
                {sufixo && <span className="font-body text-sfb-cacau/60"> · {sufixo}</span>}
              </p>
              <p className={`mt-0.5 font-display text-xl ${accent}`}>
                R$ {value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
            </div>
          </button>
        ))}
      </div>

      {/* ===== PRÓXIMAS ENTREGAS + ANIVERSARIANTES (lado a lado) ===== */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Próximas Entregas — fundo creme/pink */}
        <div className="relative overflow-hidden rounded-2xl bg-sfb-terracota/5 shadow-[0_4px_24px_-12px_rgba(91,26,43,0.15)] border border-sfb-areia/50 transition-all duration-300 hover:shadow-[0_8px_32px_-12px_rgba(201,161,74,0.25)] hover:border-sfb-terracota">
          <div className="relative flex items-start justify-between px-6 pt-5">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-sfb-cacau/10 ring-1 ring-sfb-areia/40">
                <CalendarIcon className="h-5 w-5 text-sfb-cacau" />
              </div>
              <h3 className="font-display text-xl text-sfb-cacau sm:text-2xl">
                Próximas Entregas
              </h3>
            </div>
            <button
              type="button"
              onClick={() => navigate("/encomendas")}
              className="text-xs font-body italic text-sfb-cacau underline-offset-4 hover:underline"
            >
              Ver todas
            </button>
          </div>
          <div className="relative px-6 pb-6 pt-4 min-h-[140px] pl-[120px]">
            <img
              src={illuCalendarioProximas}
              alt=""
              aria-hidden="true"
              className="pointer-events-none absolute bottom-0 left-2 w-[110px] select-none"
            />
            {proximas.length === 0 ? (
              <p className="pt-2 text-sm font-body text-sfb-vinho/70">
                Nenhuma entrega nos próximos 7 dias
              </p>
            ) : (
              <ul className="divide-y divide-dashed divide-sfb-areia/30">
                {proximas.slice(0, 3).map((enc) => (
                  <li
                    key={enc.id}
                    onClick={() => navigate("/encomendas")}
                    className="flex cursor-pointer items-center gap-3 py-2"
                  >
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-sfb-cacau text-[10px] font-semibold text-sfb-baunilha ring-1 ring-sfb-areia/60">
                      {initials(enc.cliente)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-display text-sm text-sfb-cacau">{enc.cliente}</p>
                      <p className="text-[11px] font-body text-sfb-cacau/60">
                        {format(enc._dia, "EEE, dd/MM", { locale: ptBR })}
                        {enc.hora_entrega ? ` · ${enc.hora_entrega}` : ""}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* Aniversariantes — fundo vinho */}
        <div className="relative overflow-hidden rounded-2xl bg-sfb-cacau text-sfb-baunilha shadow-[0_4px_24px_-12px_rgba(91,26,43,0.35)]">
          <img
            src={illuPresenteVinho}
            alt=""
            aria-hidden="true"
            className="pointer-events-none absolute bottom-0 left-0 h-[90%] w-auto max-w-[42%] object-contain object-bottom-left"
          />
          <div className="relative flex items-start justify-between px-6 pt-5">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full ring-1 ring-sfb-areia/60">
                <Cake className="h-5 w-5 text-sfb-areia" />
              </div>
              <h3 className="font-display text-xl text-sfb-baunilha sm:text-2xl">
                Aniversariantes este mês
              </h3>
            </div>
            <button
              type="button"
              onClick={() => navigate("/clientes")}
              className="text-xs font-body italic text-sfb-terracota underline-offset-4 hover:underline"
            >
              Ver clientes
            </button>
          </div>
          <div className="relative px-6 pb-6 pt-4 min-h-[140px]">
            {aniversariantes.length === 0 ? (
              <p className="pt-2 text-sm font-body italic text-sfb-creme/70">
                Nenhum aniversariante este mês.
              </p>
            ) : (
              <ul className="divide-y divide-dashed divide-sfb-areia/20 pl-[42%]">
                {aniversariantes.slice(0, 3).map((c: any) => {
                  const partes = (c.data_aniversario || "").split("-");
                  const dia = parseInt(partes[2] || "0");
                  return (
                    <li key={c.id} className="flex items-center gap-3 py-2">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-sfb-cacau/80 ring-1 ring-sfb-areia/60">
                        <Cake className="h-4 w-4 text-sfb-areia" />
                      </div>
                      <p className="min-w-0 flex-1 truncate font-display text-base text-sfb-baunilha">
                        {c.nome}
                      </p>
                      <span className="text-xs font-body italic text-sfb-areia/90">
                        dia {String(dia).padStart(2, "0")}
                      </span>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>
      </div>


      {/* ===== VISÃO ECONÔMICA ===== */}
      <PremiumCard
        icon={TrendingUp}
        title="Visão econômica"
        subtitle="Faturamento, custos e lucro do período"
        headerRight={
          <div className="inline-flex rounded-full bg-sfb-cacau/40 p-1 ring-1 ring-sfb-areia/40">
            {(["mensal", "anual"] as const).map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setTabEconomica(tab)}
                className={`rounded-full px-4 py-1 text-xs font-body uppercase tracking-widest transition ${
                  tabEconomica === tab
                    ? "bg-sfb-terracota text-sfb-baunilha shadow"
                    : "text-sfb-baunilha/80 hover:text-sfb-baunilha"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        }
      >
        {tabEconomica === "mensal" ? (
          <div className="grid gap-3 grid-cols-2 md:grid-cols-4">
            {[
              { label: "Faturamento", value: visaoEconomica.mensal.receitas, Icon: TrendingUp, accent: "text-sfb-cacau" },
              { label: "Custos Totais", value: visaoEconomica.mensal.custos, Icon: TrendingDown, accent: "text-sfb-terracota" },
              {
                label: "Lucro Líquido",
                value: visaoEconomica.mensal.lucro,
                Icon: DollarSign,
                accent: visaoEconomica.mensal.lucro >= 0 ? "text-sfb-cacau" : "text-sfb-terracota",
                extra: `Margem: ${visaoEconomica.mensal.receitas > 0 ? ((visaoEconomica.mensal.lucro / visaoEconomica.mensal.receitas) * 100).toFixed(1) : 0}%`,
              },
              {
                label: "Ticket Médio",
                value: ticketMedio.mensal,
                Icon: DollarSign,
                accent: "text-sfb-cacau",
                extra: `Anual: R$ ${ticketMedio.anual.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
              },
            ].map(({ label, value, Icon, accent, extra }) => (
              <div key={label} className="rounded-xl border border-sfb-areia/20 bg-white p-3 text-center">
                <div className="mx-auto flex h-9 w-9 items-center justify-center rounded-full bg-sfb-cacau/10 ring-1 ring-sfb-areia/40">
                  <Icon className="h-4 w-4 text-sfb-cacau" />
                </div>
                <p className="mt-2 text-[10px] font-body uppercase tracking-widest text-sfb-cacau/60">{label}</p>
                <p className={`mt-1 font-display text-lg ${accent}`}>
                  R$ {value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
                {extra && <p className="mt-0.5 text-[10px] font-body text-sfb-cacau/60">{extra}</p>}
              </div>
            ))}

          </div>
        ) : (
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={visaoEconomica.anual}>
                <CartesianGrid strokeDasharray="3 3" stroke="#D8CBB9" vertical={false} />
                <XAxis dataKey="mes" stroke="#3D2F28" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#3D2F28" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(v) => `R$ ${v}`} />
                <Tooltip 
                  contentStyle={{ backgroundColor: "#FBF6EE", border: "1px solid #D8CBB9", borderRadius: "8px" }}
                  formatter={(v: number) => `R$ ${v.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`} 
                />
                <Legend iconType="circle" />
                <Line type="monotone" dataKey="receitas" stroke="#C98A75" name="Receitas" strokeWidth={3} dot={{ r: 4, fill: "#C98A75" }} activeDot={{ r: 6 }} />
                <Line type="monotone" dataKey="custos" stroke="#8E9E8C" name="Custos" strokeWidth={3} dot={{ r: 4, fill: "#8E9E8C" }} activeDot={{ r: 6 }} />
                <Line type="monotone" dataKey="lucro" stroke="#3D2F28" name="Lucro" strokeWidth={3} dot={{ r: 4, fill: "#3D2F28" }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </PremiumCard>

      {/* ===== VENDAS / FLUXO / TOP 5 ===== */}
      {(vendasPorMes.some(v => v.total > 0) || fluxoCaixa.some(f => f.saldo !== 0) || produtos.length > 0) && (
        <div className="grid gap-4 md:grid-cols-2">
          {vendasPorMes.some(v => v.total > 0) && (
            <PremiumCard
              icon={TrendingUp}
              title="Vendas por mês"
              subtitle="Últimos 6 meses"
            >
              <div className="h-[220px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={vendasPorMes}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#D8CBB9" />
                    <XAxis dataKey="mes" stroke="#3D2F28" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis stroke="#3D2F28" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(v) => `R$ ${v}`} />
                    <Tooltip 
                      cursor={{ fill: '#D8CBB9', opacity: 0.2 }}
                      contentStyle={{ backgroundColor: "#FBF6EE", border: "1px solid #D8CBB9", borderRadius: "8px" }}
                      formatter={(v: number) => [`R$ ${v.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, "Vendas"]} 
                    />
                    <Bar dataKey="total" fill="#C98A75" radius={[6, 6, 0, 0]}>
                      {vendasPorMes.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={index === vendasPorMes.length - 1 ? '#C98A75' : '#D8CBB9'} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </PremiumCard>
          )}

          <div className="space-y-4">
            {fluxoCaixa.some(f => f.saldo !== 0) && (
              <PremiumCard
                icon={DollarSign}
                title="Fluxo de caixa"
                subtitle="Últimos 6 meses"
              >
                <div className="h-[160px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={fluxoCaixa}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#D8CBB9" />
                      <XAxis dataKey="mes" stroke="#3D2F28" fontSize={12} tickLine={false} axisLine={false} />
                      <YAxis stroke="#3D2F28" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(v) => `R$ ${v}`} />
                      <Tooltip 
                        contentStyle={{ backgroundColor: "#FBF6EE", border: "1px solid #D8CBB9", borderRadius: "8px" }}
                        formatter={(v: number) => [`R$ ${v.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, "Saldo"]} 
                      />
                      <Line
                        type="monotone"
                        dataKey="saldo"
                        stroke="#C98A75"
                        strokeWidth={2.5}
                        dot={{ fill: "#3D2F28", r: 4 }}
                        activeDot={{ r: 6 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </PremiumCard>
            )}

            {produtos.length > 0 && (
              <PremiumCard
                icon={Sparkles}
                title="Top 5 produtos"
                subtitle={modoVisualizacao === 'mensal' ? `${meses[mesSelecionado]} de ${anoSelecionado}` : `Ano ${anoSelecionado}`}
                headerRight={
                  <div className="inline-flex rounded-full bg-sfb-vinho-escuro/40 p-1 ring-1 ring-sfb-dourado/40">
                    {(["mensal", "anual"] as const).map((tab) => (
                      <button
                        key={tab}
                        type="button"
                        onClick={() => setModoVisualizacao(tab)}
                        className={`rounded-full px-3 py-1 text-[10px] font-body uppercase tracking-widest transition ${
                          modoVisualizacao === tab
                            ? "bg-sfb-dourado text-sfb-vinho-escuro shadow"
                            : "text-sfb-creme/80 hover:text-sfb-creme"
                        }`}
                      >
                        {tab}
                      </button>
                    ))}
                  </div>
                }
              >
                <ul className="divide-y divide-dashed divide-sfb-dourado/30">
                  {produtos.map((produto, index) => (
                    <li key={produto.id} className="flex items-center gap-3 py-2.5">
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-sfb-vinho font-display text-sm text-sfb-dourado ring-1 ring-sfb-dourado/60">
                        {index + 1}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-display text-base text-sfb-vinho">{produto.nome}</p>
                        <p className="text-[11px] font-body text-sfb-vinho/60">
                          {produto.quantidade} {produto.quantidade === 1 ? 'venda' : 'vendas'}
                        </p>
                      </div>
                      <p className="font-display text-base text-sfb-vinho">
                        R$ {produto.receita.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </p>
                    </li>
                  ))}
                </ul>
              </PremiumCard>
            )}
          </div>
        </div>
      )}
    </div>
      <ModuleHelpDrawer content={dashboardHelp} isOpen={isHelpOpen} onClose={closeHelp} />
    </div>
  );
}
