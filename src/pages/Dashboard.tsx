import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { PremiumCard } from "@/components/dashboard/PremiumCard";
import illuPresenteVinho from "@/assets/cda-illu-presente-vinho.png";
import illuCalendarioRosa from "@/assets/cda-illu-calendario-rosa.png";
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

import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
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
  const { profile } = useUserProfile();
  const navigate = useNavigate();
  const [mesSelecionado, setMesSelecionado] = useState(new Date().getMonth());
  const [anoSelecionado, setAnoSelecionado] = useState(new Date().getFullYear());
  const [diaSelecionado, setDiaSelecionado] = useState(new Date());
  const [loading, setLoading] = useState(true);
  const { plano } = usePlano();
  const { isAdmin } = useIsAdmin();

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
  const [modoVisualizacao, setModoVisualizacao] = useState<'mensal' | 'anual'>('mensal');

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
    if (!user) return;

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
      .on('postgres_changes', { event: '*', schema: 'public', table: 'encomendas' }, recarregarTudoDebounced)
      .subscribe();

    return () => {
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
      if (debounceCalendarioRef.current) clearTimeout(debounceCalendarioRef.current);
      supabase.removeChannel(channel);
    };
  }, [user, mesSelecionado, anoSelecionado]);


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
    if (status === "confirmado") return "bg-cda-dourado/20 text-cda-vinho";
    if (status === "em_producao") return "bg-blue-100 text-blue-700";
    if (status === "pronto") return "bg-green-100 text-green-700";
    return "bg-cda-creme text-cda-vinho/70";
  };

  const initials = (nome: string) =>
    nome
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map(p => p.charAt(0).toUpperCase())
      .join("");

  return (
    <div className="space-y-6">
      {/* ===== HEADER ===== */}
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="font-display text-3xl tracking-tight text-cda-vinho-escuro sm:text-4xl">
            {saudacaoPorHora().texto}, {getPrimeiroNome(profile?.nome_completo, user?.email)}! {saudacaoPorHora().emoji}
          </h1>
          <div className="mt-2 flex items-center gap-3">
            <span className="h-px w-12 bg-cda-dourado" />
            <p className="text-sm font-body italic text-cda-vinho/70">
              Aqui está o resumo do seu negócio.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Label className="text-xs font-body uppercase tracking-widest text-cda-vinho/60">Período</Label>
          <Select value={anoSelecionado.toString()} onValueChange={(v) => setAnoSelecionado(parseInt(v))}>
            <SelectTrigger className="w-[100px] border-cda-dourado/40 bg-cda-creme text-cda-vinho hover:border-cda-dourado">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Array.from({ length: 11 }, (_, i) => new Date().getFullYear() - 5 + i).map((year) => (
                <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={mesSelecionado.toString()} onValueChange={(v) => setMesSelecionado(parseInt(v))}>
            <SelectTrigger className="w-[130px] border-cda-dourado/40 bg-cda-creme text-cda-vinho hover:border-cda-dourado">
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

      {/* ===== RESUMO DO MÊS ===== */}
      <PremiumCard
        icon={Sparkles}
        title="Resumo do mês"
        subtitle={`${meses[mesSelecionado]} de ${anoSelecionado} — operação e caixa em uma só olhada`}
      >
        <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
          {[
            {
              label: "Encomendas confirmadas",
              value: contadores.encomendasConfirmadas.toString(),
              hint: "Vendas no período",
              Icon: ShoppingBag,
              onClick: () => navigate("/encomendas"),
              accent: "text-cda-vinho",
            },
            {
              label: "Saldo atual",
              value: `R$ ${financeiro.saldoAtual.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
              hint: "Bancos cadastrados",
              Icon: DollarSign,
              onClick: () => navigate("/financeiro/dashboard"),
              accent: financeiro.saldoAtual >= 0 ? "text-cda-vinho" : "text-cda-coral",
            },
            {
              label: "A receber",
              value: `R$ ${financeiro.receberAberto.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
              hint: alertas.receberAtrasado.valor > 0
                ? `⚠ R$ ${alertas.receberAtrasado.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} em atraso`
                : "Aberto neste mês",
              Icon: TrendingUp,
              onClick: () => navigate("/financeiro/contas-receber"),
              accent: "text-cda-vinho",
            },
            {
              label: "A pagar",
              value: `R$ ${financeiro.pagarAberto.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
              hint: alertas.pagarAtrasado.valor > 0
                ? `⚠ R$ ${alertas.pagarAtrasado.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} em atraso`
                : "Aberto neste mês",
              Icon: TrendingDown,
              onClick: () => navigate("/financeiro/contas-pagar"),
              accent: "text-cda-coral",
            },
          ].map(({ label, value, hint, Icon, onClick, accent }) => (
            <button
              key={label}
              type="button"
              onClick={onClick}
              className="group flex flex-col items-start gap-2 rounded-xl border border-cda-dourado/20 bg-cda-branco p-4 text-left transition hover:-translate-y-0.5 hover:border-cda-dourado/60 hover:shadow-md"
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-cda-vinho/10 ring-1 ring-cda-dourado/40 transition group-hover:bg-cda-vinho/15">
                <Icon className="h-4 w-4 text-cda-vinho" />
              </div>
              <span className="text-[11px] font-body uppercase tracking-widest text-cda-vinho/60">{label}</span>
              <span className={`font-display text-xl ${accent}`}>{value}</span>
              <span className="text-[11px] font-body text-cda-vinho/60">{hint}</span>
            </button>
          ))}
        </div>
      </PremiumCard>

      {/* ===== PRÓXIMAS ENTREGAS ===== */}
      <PremiumCard
        icon={CalendarIcon}
        title="Próximas entregas"
        subtitle="Os próximos 7 dias do seu calendário"
        headerOrnament={illuCalendarioRosa}
        footerCta={{ label: "Ver todas", onClick: () => navigate("/encomendas") }}
        footerNote="Cada entrega é uma promessa cumprida."
        footerNoteIcon={<Sparkles className="h-4 w-4 text-cda-dourado" />}
      >
        {proximas.length === 0 ? (
          <p className="py-6 text-center text-sm font-body italic text-cda-vinho/60">
            Nenhuma entrega nos próximos 7 dias.
          </p>
        ) : (
          <ul className="divide-y divide-dashed divide-cda-dourado/30">
            {proximas.map((enc) => (
              <li
                key={enc.id}
                onClick={() => navigate("/encomendas")}
                className="flex cursor-pointer items-center gap-3 py-3 transition hover:bg-cda-pink/10"
              >
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-cda-vinho text-xs font-semibold text-cda-dourado ring-1 ring-cda-dourado/60">
                  {initials(enc.cliente)}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-display text-base text-cda-vinho">{enc.cliente}</p>
                  <p className="text-xs font-body text-cda-vinho/60">
                    {format(enc._dia, "EEE, dd 'de' MMMM", { locale: ptBR })}
                    {enc.hora_entrega ? ` · ${enc.hora_entrega}` : ""}
                  </p>
                </div>
                <p className="hidden font-display text-base text-cda-vinho sm:block">
                  R$ {enc.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
                <Badge className={`${statusBadge(enc.status)} border-transparent capitalize`}>
                  {enc.status.replace("_", " ")}
                </Badge>
              </li>
            ))}
          </ul>
        )}
      </PremiumCard>

      {/* ===== ANIVERSARIANTES DO MÊS ===== */}
      <PremiumCard
        icon={Cake}
        title="Aniversariantes do mês"
        subtitle="Celebre, presenteie e fortaleça conexões."
        headerOrnament={illuPresenteVinho}
        footerCta={{ label: "Ver todos", onClick: () => navigate("/cadastros/clientes") }}
        footerNote="Pequenos gestos criam grandes lembranças."
        footerNoteIcon={<span aria-hidden="true">🎉</span>}
        asideRight={
          <div className="flex h-full flex-col items-center justify-center rounded-xl bg-cda-pink/15 p-5 text-center ring-1 ring-cda-dourado/20">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-cda-pink/30 ring-1 ring-cda-dourado/40">
              <Cake className="h-6 w-6 text-cda-vinho" />
            </div>
            <p className="mt-3 font-display text-4xl text-cda-vinho">{aniversariantes.length}</p>
            <p className="text-xs font-body text-cda-vinho/70">aniversariantes<br/>este mês</p>
            <div className="mt-3 flex w-full items-center justify-center gap-2">
              <span className="h-px flex-1 bg-cda-dourado/50" />
              <span aria-hidden="true" className="text-cda-dourado">♥</span>
              <span className="h-px flex-1 bg-cda-dourado/50" />
            </div>
          </div>
        }
      >
        {aniversariantes.length === 0 ? (
          <p className="py-6 text-center text-sm font-body italic text-cda-vinho/60">
            Nenhum aniversariante este mês.
          </p>
        ) : (
          <ul className="divide-y divide-dashed divide-cda-dourado/30">
            {aniversariantes.slice(0, 5).map((c: any) => {
              const partes = (c.data_aniversario || "").split("-");
              const dia = parseInt(partes[2] || "0");
              const mesNum = parseInt(partes[1] || "0");
              const ehHoje = `${partes[1]}-${partes[2]}` === hojeStr;
              return (
                <li key={c.id} className="flex items-center gap-4 py-3">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-cda-vinho text-xs font-semibold text-cda-dourado ring-1 ring-cda-dourado/60">
                    {initials(c.nome)}
                  </div>
                  <p className="flex-1 font-display text-base text-cda-vinho">{c.nome}</p>
                  <div className="flex items-center gap-1.5 text-sm font-body text-cda-vinho/80">
                    <CalendarIcon className="h-4 w-4 text-cda-vinho" />
                    {String(dia).padStart(2, "0")} de {(meses[mesNum - 1] || "").toLowerCase()}
                  </div>
                  {ehHoje && (
                    <Badge className="bg-cda-dourado/20 text-cda-vinho border-transparent">Hoje! 🎉</Badge>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </PremiumCard>

      {/* ===== VISÃO ECONÔMICA ===== */}
      <PremiumCard
        icon={TrendingUp}
        title="Visão econômica"
        subtitle="Faturamento, custos e lucro do período"
        headerRight={
          <div className="inline-flex rounded-full bg-cda-vinho-escuro/40 p-1 ring-1 ring-cda-dourado/40">
            {(["mensal", "anual"] as const).map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setTabEconomica(tab)}
                className={`rounded-full px-4 py-1 text-xs font-body uppercase tracking-widest transition ${
                  tabEconomica === tab
                    ? "bg-cda-dourado text-cda-vinho-escuro shadow"
                    : "text-cda-creme/80 hover:text-cda-creme"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        }
      >
        {tabEconomica === "mensal" ? (
          <div className="grid gap-3 grid-cols-2 md:grid-cols-5">
            {[
              { label: "Faturamento", value: visaoEconomica.mensal.receitas, Icon: TrendingUp, accent: "text-cda-vinho" },
              { label: "Custos Totais", value: visaoEconomica.mensal.custos, Icon: TrendingDown, accent: "text-cda-coral" },
              {
                label: "Lucro Líquido",
                value: visaoEconomica.mensal.lucro,
                Icon: DollarSign,
                accent: visaoEconomica.mensal.lucro >= 0 ? "text-cda-vinho" : "text-cda-coral",
                extra: `Margem: ${visaoEconomica.mensal.receitas > 0 ? ((visaoEconomica.mensal.lucro / visaoEconomica.mensal.receitas) * 100).toFixed(1) : 0}%`,
              },
              {
                label: "Ticket Médio",
                value: ticketMedio.mensal,
                Icon: DollarSign,
                accent: "text-cda-vinho",
                extra: `Anual: R$ ${ticketMedio.anual.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
              },
            ].map(({ label, value, Icon, accent, extra }) => (
              <div key={label} className="rounded-xl border border-cda-dourado/20 bg-cda-branco p-3 text-center">
                <div className="mx-auto flex h-9 w-9 items-center justify-center rounded-full bg-cda-vinho/10 ring-1 ring-cda-dourado/40">
                  <Icon className="h-4 w-4 text-cda-vinho" />
                </div>
                <p className="mt-2 text-[10px] font-body uppercase tracking-widest text-cda-vinho/60">{label}</p>
                <p className={`mt-1 font-display text-lg ${accent}`}>
                  R$ {value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
                {extra && <p className="mt-0.5 text-[10px] font-body text-cda-vinho/60">{extra}</p>}
              </div>
            ))}

            {/* Meta do Mês */}
            {(() => {
              const meta = profile?.meta_faturamento_mensal || 0;
              const atual = visaoEconomica.mensal.receitas;
              const pct = meta > 0 ? Math.min((atual / meta) * 100, 100) : 0;
              const corBarra = pct >= 80 ? "bg-green-500" : pct >= 50 ? "bg-cda-dourado" : "bg-cda-coral";
              return (
                <button
                  type="button"
                  onClick={() => navigate("/planejamento")}
                  className="rounded-xl border border-cda-dourado/20 bg-cda-branco p-3 text-center transition hover:-translate-y-0.5 hover:border-cda-dourado/60 hover:shadow-md"
                >
                  <div className="mx-auto flex h-9 w-9 items-center justify-center rounded-full bg-cda-vinho/10 ring-1 ring-cda-dourado/40">
                    <TrendingUp className="h-4 w-4 text-cda-vinho" />
                  </div>
                  <p className="mt-2 text-[10px] font-body uppercase tracking-widest text-cda-vinho/60">Meta do mês</p>
                  {meta > 0 ? (
                    <>
                      <p className="mt-1 font-display text-lg text-cda-vinho">{pct.toFixed(0)}%</p>
                      <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-cda-dourado/15">
                        <div className={`h-full ${corBarra} transition-all`} style={{ width: `${pct}%` }} />
                      </div>
                      <p className="mt-1 text-[10px] font-body text-cda-vinho/60">
                        R$ {atual.toLocaleString('pt-BR', { maximumFractionDigits: 0 })} / R$ {meta.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}
                      </p>
                    </>
                  ) : (
                    <>
                      <p className="mt-1 text-xs font-body text-cda-vinho/60">Meta não definida</p>
                      <p className="mt-1 text-[10px] font-body text-cda-vinho underline">Definir meta</p>
                    </>
                  )}
                </button>
              );
            })()}
          </div>
        ) : (
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={visaoEconomica.anual}>
                <CartesianGrid strokeDasharray="3 3" stroke="#C9A14A33" />
                <XAxis dataKey="mes" stroke="#5B1A2B" />
                <YAxis stroke="#5B1A2B" />
                <Tooltip formatter={(v: number) => `R$ ${v.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`} />
                <Legend />
                <Line type="monotone" dataKey="receitas" stroke="#C9A14A" name="Receitas" strokeWidth={2} />
                <Line type="monotone" dataKey="custos" stroke="#F28C82" name="Custos" strokeWidth={2} />
                <Line type="monotone" dataKey="lucro" stroke="#5B1A2B" name="Lucro" strokeWidth={2} />
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
                    <CartesianGrid strokeDasharray="3 3" stroke="#C9A14A33" />
                    <XAxis dataKey="mes" stroke="#5B1A2B" fontSize={12} />
                    <YAxis stroke="#5B1A2B" fontSize={12} />
                    <Tooltip formatter={(v: number) => [`R$ ${v.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, "Vendas"]} />
                    <Bar dataKey="total" fill="#5B1A2B" radius={[6, 6, 0, 0]} />
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
                      <CartesianGrid strokeDasharray="3 3" stroke="#C9A14A33" />
                      <XAxis dataKey="mes" stroke="#5B1A2B" fontSize={12} />
                      <YAxis stroke="#5B1A2B" fontSize={12} />
                      <Tooltip formatter={(v: number) => [`R$ ${v.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, "Saldo"]} />
                      <Line
                        type="monotone"
                        dataKey="saldo"
                        stroke="#C9A14A"
                        strokeWidth={2.5}
                        dot={{ fill: "#5B1A2B", r: 4 }}
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
                  <div className="inline-flex rounded-full bg-cda-vinho-escuro/40 p-1 ring-1 ring-cda-dourado/40">
                    {(["mensal", "anual"] as const).map((tab) => (
                      <button
                        key={tab}
                        type="button"
                        onClick={() => setModoVisualizacao(tab)}
                        className={`rounded-full px-3 py-1 text-[10px] font-body uppercase tracking-widest transition ${
                          modoVisualizacao === tab
                            ? "bg-cda-dourado text-cda-vinho-escuro shadow"
                            : "text-cda-creme/80 hover:text-cda-creme"
                        }`}
                      >
                        {tab}
                      </button>
                    ))}
                  </div>
                }
              >
                <ul className="divide-y divide-dashed divide-cda-dourado/30">
                  {produtos.map((produto, index) => (
                    <li key={produto.id} className="flex items-center gap-3 py-2.5">
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-cda-vinho font-display text-sm text-cda-dourado ring-1 ring-cda-dourado/60">
                        {index + 1}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-display text-base text-cda-vinho">{produto.nome}</p>
                        <p className="text-[11px] font-body text-cda-vinho/60">
                          {produto.quantidade} {produto.quantidade === 1 ? 'venda' : 'vendas'}
                        </p>
                      </div>
                      <p className="font-display text-base text-cda-vinho">
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
  );
}
