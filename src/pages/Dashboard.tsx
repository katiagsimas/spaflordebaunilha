import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
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
  Calendar as CalendarIcon
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useUserProfile } from "@/hooks/useUserProfile";
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight font-display text-cda-vinho-escuro">
            {saudacaoPorHora().texto}, {getPrimeiroNome(profile?.nome_completo, user?.email)}! {saudacaoPorHora().emoji}
          </h1>
          <p className="text-muted-foreground">Aqui está o resumo do seu negócio</p>
        </div>

        {/* Filtro Mês/Ano */}
        <div className="flex items-center gap-2">
          <Label className="text-sm font-medium">Período:</Label>
          <Select
            value={anoSelecionado.toString()}
            onValueChange={(value) => setAnoSelecionado(parseInt(value))}
          >
            <SelectTrigger className="w-[100px] border-[#C9A14A]/40 hover:border-[#C9A14A]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Array.from({ length: 11 }, (_, i) => new Date().getFullYear() - 5 + i).map((year) => (
                <SelectItem key={year} value={year.toString()}>
                  {year}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={mesSelecionado.toString()}
            onValueChange={(value) => setMesSelecionado(parseInt(value))}
          >
            <SelectTrigger className="w-[130px] border-[#C9A14A]/40 hover:border-[#C9A14A]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {meses.map((mes, index) => (
                <SelectItem key={index} value={index.toString()}>
                  {mes}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* CONTADOR TOPO: Encomendas Confirmadas */}
      <div className="grid gap-2 grid-cols-1 md:grid-cols-1">
        <Card
          className="cursor-pointer hover:shadow-md transition-all duration-200 hover:-translate-y-0.5 border-l-4 border-l-primary group"
          onClick={() => navigate("/encomendas")}
        >
          <CardHeader className="p-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 shrink-0 rounded-md bg-primary/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                <ShoppingBag className="h-5 w-5 text-primary" />
              </div>
              <div className="min-w-0 flex-1">
                <CardTitle className="text-xs leading-tight mb-0.5 text-muted-foreground">
                  Encomendas Confirmadas <span className="font-normal">· {meses[mesSelecionado].slice(0, 3)}</span>
                </CardTitle>
                <p className="text-2xl font-bold leading-tight text-primary">
                  {contadores.encomendasConfirmadas}
                </p>
                <p className="text-[10px] text-muted-foreground leading-tight">
                  Quantidade de vendas feitas no período
                </p>
              </div>
            </div>
          </CardHeader>
        </Card>
      </div>

      {/* FINANCEIRO: Saldo Atual | A Receber | A Pagar */}
      <div className="grid gap-2 grid-cols-1 md:grid-cols-3">
        {/* Saldo Atual */}
        <Card
          className="cursor-pointer hover:shadow-md transition-all duration-200 hover:-translate-y-0.5 border-l-4 border-l-[#5B1A2B] group bg-white"
          onClick={() => navigate("/financeiro/dashboard")}
        >
          <CardHeader className="p-2.5">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 shrink-0 rounded-md bg-[#5B1A2B]/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                <DollarSign className="h-3.5 w-3.5 text-[#5B1A2B]" />
              </div>
              <div className="min-w-0">
                <CardTitle className="text-[11px] leading-tight mb-0.5">Saldo Atual</CardTitle>
                <p className={`text-sm font-bold leading-tight truncate ${financeiro.saldoAtual >= 0 ? "text-foreground" : "text-red-600"}`}>
                  R$ {financeiro.saldoAtual.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* A Receber */}
        <Card
          className="cursor-pointer hover:shadow-md transition-all duration-200 hover:-translate-y-0.5 border-l-4 border-l-[#C9A14A] group"
          onClick={() => navigate("/financeiro/contas-receber")}
        >
          <CardHeader className="p-2.5">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 shrink-0 rounded-md bg-[#C9A14A]/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                <TrendingUp className="h-3.5 w-3.5 text-[#C9A14A]" />
              </div>
              <div className="min-w-0 flex-1">
                <CardTitle className="text-[11px] leading-tight mb-0.5">
                  A Receber <span className="font-normal text-muted-foreground">· {meses[mesSelecionado].slice(0, 3)}</span>
                </CardTitle>
                <p className="text-sm font-bold leading-tight truncate text-green-600 dark:text-green-400">
                  R$ {financeiro.receberAberto.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
                {alertas.receberAtrasado.valor > 0 && (
                  <p className="text-orange-600 text-[10px] leading-tight mt-0.5">
                    ⚠ R$ {alertas.receberAtrasado.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} em atraso
                  </p>
                )}
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* A Pagar */}
        <Card
          className="cursor-pointer hover:shadow-md transition-all duration-200 hover:-translate-y-0.5 border-l-4 border-l-[#F28C82] group"
          onClick={() => navigate("/financeiro/contas-pagar")}
        >
          <CardHeader className="p-2.5">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 shrink-0 rounded-md bg-[#F28C82]/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                <TrendingDown className="h-3.5 w-3.5 text-[#F28C82]" />
              </div>
              <div className="min-w-0 flex-1">
                <CardTitle className="text-[11px] leading-tight mb-0.5">
                  A Pagar <span className="font-normal text-muted-foreground">· {meses[mesSelecionado].slice(0, 3)}</span>
                </CardTitle>
                <p className="text-sm font-bold leading-tight truncate text-red-600 dark:text-red-400">
                  R$ {financeiro.pagarAberto.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
                {alertas.pagarAtrasado.valor > 0 && (
                  <p className="text-orange-600 text-[10px] leading-tight mt-0.5">
                    ⚠ R$ {alertas.pagarAtrasado.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} em atraso
                  </p>
                )}
              </div>
            </div>
          </CardHeader>
        </Card>
      </div>

      {/* PRÓXIMAS ENTREGAS */}
      {(() => {
        const hojeDate = new Date();
        hojeDate.setHours(0, 0, 0, 0);
        const limite = addDays(hojeDate, 7);
        const proximas = calendarioDados
          .filter(d => d.dia >= hojeDate && d.dia <= limite && d.encomendas.length > 0)
          .sort((a, b) => a.dia.getTime() - b.dia.getTime())
          .flatMap(d => d.encomendas.map(e => ({ ...e, _dia: d.dia })))
          .slice(0, 5);

        const statusBadge = (status: string) => {
          if (status === "confirmado") return "bg-[#C9A14A]/20 text-[#5B1A2B]";
          if (status === "em_producao") return "bg-blue-100 text-blue-700";
          if (status === "pronto") return "bg-green-100 text-green-700";
          return "bg-muted text-muted-foreground";
        };

        return (
          <Card>
            <CardHeader className="pb-2 flex flex-row items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <CalendarIcon className="h-4 w-4 text-[#5B1A2B]" />
                Próximas Entregas
              </CardTitle>
              <Button
                variant="link"
                size="sm"
                className="text-[#5B1A2B] h-auto p-0"
                onClick={() => navigate("/encomendas")}
              >
                Ver todas
              </Button>
            </CardHeader>
            <CardContent>
              {proximas.length === 0 ? (
                <p className="text-muted-foreground text-sm">Nenhuma entrega nos próximos 7 dias</p>
              ) : (
                <div className="space-y-2">
                  {proximas.map((enc) => (
                    <div
                      key={enc.id}
                      className="flex items-center justify-between gap-3 p-2 rounded-md hover:bg-muted/40 transition-colors cursor-pointer"
                      onClick={() => navigate("/encomendas")}
                    >
                      <div className="min-w-0 flex-1">
                        <p className="text-xs text-muted-foreground">
                          {format(enc._dia, "EEE, dd/MM", { locale: ptBR })}
                          {enc.hora_entrega ? ` · ${enc.hora_entrega}` : ""}
                        </p>
                        <p className="text-sm font-medium truncate">{enc.cliente}</p>
                      </div>
                      <p className="text-sm font-bold text-primary whitespace-nowrap">
                        R$ {enc.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </p>
                      <Badge className={`${statusBadge(enc.status)} border-transparent`}>
                        {enc.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        );
      })()}

      {/* ANIVERSARIANTES DO MÊS */}
      {(() => {
        const hojeStr = format(new Date(), "MM-dd");
        return (
          <Card>
            <CardHeader className="pb-2 flex flex-row items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <Cake className="h-4 w-4 text-[#C9A14A]" />
                Aniversariantes este mês
              </CardTitle>
              <Button
                variant="link"
                size="sm"
                className="text-[#5B1A2B] h-auto p-0"
                onClick={() => navigate("/cadastros/clientes")}
              >
                Ver clientes
              </Button>
            </CardHeader>
            <CardContent>
              {aniversariantes.length === 0 ? (
                <p className="text-muted-foreground text-sm">Nenhum aniversariante este mês.</p>
              ) : (
                <div className="space-y-2">
                  {aniversariantes.map((c: any) => {
                    const partes = (c.data_aniversario || "").split("-");
                    const dia = parseInt(partes[2] || "0");
                    const ehHoje = `${partes[1]}-${partes[2]}` === hojeStr;
                    return (
                      <div
                        key={c.id}
                        className="flex items-center justify-between gap-3 p-2 rounded-md hover:bg-muted/40 transition-colors"
                      >
                        <div className="flex items-center gap-2 min-w-0 flex-1">
                          <span className="text-lg">🎂</span>
                          <p className="text-sm font-medium truncate">{c.nome}</p>
                        </div>
                        <p className="text-xs text-muted-foreground whitespace-nowrap">dia {dia}</p>
                        {ehHoje && (
                          <Badge className="bg-[#C9A14A]/20 text-[#5B1A2B] border-transparent">
                            Hoje! 🎉
                          </Badge>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        );
      })()}


      {/* VISÃO ECONÔMICA */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl">Visão Econômica</CardTitle>
            <div className="flex gap-2">
              <Button
                variant={tabEconomica === "mensal" ? "default" : "outline"}
                size="sm"
                onClick={() => setTabEconomica("mensal")}
                className={tabEconomica === "mensal" ? "bg-[#5B1A2B] text-[#FFF9F5]" : "border border-[#C9A14A]/50 text-[#5B1A2B] bg-transparent hover:border-[#C9A14A] hover:text-[#5B1A2B]"}
              >
                Mensal
              </Button>
              <Button
                variant={tabEconomica === "anual" ? "default" : "outline"}
                size="sm"
                onClick={() => setTabEconomica("anual")}
                className={tabEconomica === "anual" ? "bg-[#5B1A2B] text-[#FFF9F5]" : "border border-[#C9A14A]/50 text-[#5B1A2B] bg-transparent hover:border-[#C9A14A] hover:text-[#5B1A2B]"}
              >
                Anual
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {tabEconomica === "mensal" ? (
            <div className="grid gap-3 grid-cols-2 md:grid-cols-5">
              {/* Faturamento */}
              <Card 
                className="cursor-pointer hover:shadow-md transition-all duration-200 hover:-translate-y-0.5 border-l-4 border-l-[#C9A14A] group"
                onClick={() => navigate("/financeiro/dashboard")}
              >
                <CardHeader className="p-2.5">
                  <div className="flex flex-col items-center gap-1.5 text-center">
                    <div className="w-7 h-7 rounded-lg bg-[#C9A14A]/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                      <TrendingUp className="h-3.5 w-3.5 text-[#C9A14A]" />
                    </div>
                    <div>
                      <CardTitle className="text-[11px] mb-0.5">Faturamento</CardTitle>
                      <CardDescription className="text-[10px] mb-0.5">{meses[mesSelecionado]}</CardDescription>
                      <p className="text-sm font-bold text-green-600 dark:text-green-400">
                        R$ {visaoEconomica.mensal.receitas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </p>
                    </div>
                  </div>
                </CardHeader>
              </Card>

              {/* Custos */}
              <Card 
                className="cursor-pointer hover:shadow-md transition-all duration-200 hover:-translate-y-0.5 border-l-4 border-l-[#F28C82] group"
                onClick={() => navigate("/financeiro/dashboard")}
              >
                <CardHeader className="p-2.5">
                  <div className="flex flex-col items-center gap-1.5 text-center">
                    <div className="w-7 h-7 rounded-lg bg-[#F28C82]/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                      <TrendingDown className="h-3.5 w-3.5 text-[#F28C82]" />
                    </div>
                    <div>
                      <CardTitle className="text-[11px] mb-0.5">Custos Totais</CardTitle>
                      <CardDescription className="text-[10px] mb-0.5">{meses[mesSelecionado]}</CardDescription>
                      <p className="text-sm font-bold text-red-600 dark:text-red-400">
                        R$ {visaoEconomica.mensal.custos.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </p>
                    </div>
                  </div>
                </CardHeader>
              </Card>

              {/* Lucro */}
              <Card 
                className={`cursor-pointer hover:shadow-md transition-all duration-200 hover:-translate-y-0.5 border-l-4 group ${visaoEconomica.mensal.lucro >= 0 ? "border-l-[#5B1A2B]" : "border-l-[#F28C82]"}`}
                onClick={() => navigate("/financeiro/dashboard")}
              >
                <CardHeader className="p-2.5">
                  <div className="flex flex-col items-center gap-1.5 text-center">
                    <div className="w-7 h-7 rounded-lg bg-[#5B1A2B]/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                      <DollarSign className="h-3.5 w-3.5 text-[#5B1A2B]" />
                    </div>
                    <div>
                      <CardTitle className="text-[11px] mb-0.5">
                        Lucro Líquido
                      </CardTitle>
                      <CardDescription className="text-[10px] mb-0.5">{meses[mesSelecionado]}</CardDescription>
                      <p className={`text-sm font-bold ${
                        visaoEconomica.mensal.lucro >= 0 ? "text-green-600 dark:text-green-400" : "text-red-700 dark:text-red-400"
                      }`}>
                        R$ {visaoEconomica.mensal.lucro.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">
                        Margem: {visaoEconomica.mensal.receitas > 0
                          ? ((visaoEconomica.mensal.lucro / visaoEconomica.mensal.receitas) * 100).toFixed(1)
                          : 0}%
                      </p>
                    </div>
                  </div>
                </CardHeader>
              </Card>

              {/* Ticket Médio */}
              <Card className="border-l-4 border-l-[#C9A14A]/50 bg-white">
                <CardHeader className="p-2.5">
                  <div className="flex flex-col items-center gap-1.5 text-center">
                    <div className="w-7 h-7 rounded-lg bg-[#C9A14A]/10 flex items-center justify-center">
                      <DollarSign className="h-3.5 w-3.5 text-[#C9A14A]/60" />
                    </div>
                    <div>
                      <CardTitle className="text-[11px] mb-0.5">Ticket Médio</CardTitle>
                      <CardDescription className="text-[10px] mb-0.5">{meses[mesSelecionado]}</CardDescription>
                      <p className="text-sm font-bold text-foreground">
                        R$ {ticketMedio.mensal.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">
                        Anual: R$ {ticketMedio.anual.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </p>
                    </div>
                  </div>
                </CardHeader>
              </Card>

              {/* Meta do Mês */}
              {(() => {
                const meta = profile?.meta_faturamento_mensal || 0;
                const atual = visaoEconomica.mensal.receitas;
                const pct = meta > 0 ? Math.min((atual / meta) * 100, 100) : 0;
                const corBarra = pct >= 80 ? "bg-green-500" : pct >= 50 ? "bg-[#C9A14A]" : "bg-[#F28C82]";
                return (
                  <Card
                    className="cursor-pointer hover:shadow-md transition-all duration-200 hover:-translate-y-0.5 border-l-4 border-l-[#5B1A2B] group"
                    onClick={() => navigate("/planejamento")}
                  >
                    <CardHeader className="p-2.5">
                      <div className="flex flex-col items-center gap-1.5 text-center">
                        <div className="w-7 h-7 rounded-lg bg-[#5B1A2B]/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                          <TrendingUp className="h-3.5 w-3.5 text-[#5B1A2B]" />
                        </div>
                        <div className="w-full">
                          <CardTitle className="text-[11px] mb-0.5">Meta do Mês</CardTitle>
                          <CardDescription className="text-[10px] mb-0.5">{meses[mesSelecionado]}</CardDescription>
                          {meta > 0 ? (
                            <>
                              <p className="text-sm font-bold text-foreground">
                                {pct.toFixed(0)}%
                              </p>
                              <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden mt-1">
                                <div
                                  className={`h-full ${corBarra} transition-all`}
                                  style={{ width: `${pct}%` }}
                                />
                              </div>
                              <p className="text-[10px] text-muted-foreground mt-0.5">
                                R$ {atual.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })} / R$ {meta.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                              </p>
                            </>
                          ) : (
                            <>
                              <p className="text-xs text-muted-foreground">Meta não definida</p>
                              <p className="text-[10px] text-[#5B1A2B] underline mt-1">Definir meta</p>
                            </>
                          )}
                        </div>
                      </div>
                    </CardHeader>
                  </Card>
                );
              })()}
            </div>
          ) : (
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={visaoEconomica.anual}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="mes" />
                  <YAxis />
                  <Tooltip
                    formatter={(value: number) =>
                      `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
                    }
                  />
                  <Legend />
                  <Line type="monotone" dataKey="receitas" stroke="#C9A14A" name="Receitas" strokeWidth={2} />
                  <Line type="monotone" dataKey="custos" stroke="#F28C82" name="Custos" strokeWidth={2} />
                  <Line type="monotone" dataKey="lucro" stroke="#5B1A2B" name="Lucro" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </CardContent>
      </Card>

      {/* VENDAS POR MÊS + FLUXO DE CAIXA + TOP 5 (somente quando houver dados) */}
      {(vendasPorMes.some(v => v.total > 0) || fluxoCaixa.some(f => f.saldo !== 0) || produtos.length > 0) && (
        <div className="grid gap-4 md:grid-cols-2">
          {/* Vendas por mês */}
          {vendasPorMes.some(v => v.total > 0) && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Vendas por mês</CardTitle>
                <CardDescription>Últimos 6 meses</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[220px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={vendasPorMes}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="mes" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                      <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "hsl(var(--card))",
                          border: "1px solid hsl(var(--border))",
                          borderRadius: "0.5rem"
                        }}
                        formatter={(value: number) =>
                          [`R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, "Vendas"]
                        }
                      />
                      <Bar dataKey="total" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Fluxo de caixa + Top 5 (lado direito) */}
          <div className="space-y-4">
            {fluxoCaixa.some(f => f.saldo !== 0) && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">Fluxo de caixa</CardTitle>
                  <CardDescription>Últimos 6 meses</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[160px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={fluxoCaixa}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                        <XAxis dataKey="mes" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                        <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "hsl(var(--card))",
                            border: "1px solid hsl(var(--border))",
                            borderRadius: "0.5rem"
                          }}
                          formatter={(value: number) =>
                            [`R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, "Saldo"]
                          }
                        />
                        <Line
                          type="monotone"
                          dataKey="saldo"
                          stroke="hsl(var(--primary))"
                          strokeWidth={2.5}
                          dot={{ fill: "hsl(var(--primary))", r: 4 }}
                          activeDot={{ r: 6 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            )}

            {produtos.length > 0 && (
              <Card>
                <CardHeader className="pb-2 flex flex-row items-center justify-between">
                  <div>
                    <CardTitle className="text-lg">Top 5 Produtos</CardTitle>
                    <CardDescription>
                      {modoVisualizacao === 'mensal'
                        ? `${meses[mesSelecionado]} de ${anoSelecionado}`
                        : `Ano ${anoSelecionado}`}
                    </CardDescription>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant={modoVisualizacao === 'mensal' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setModoVisualizacao('mensal')}
                      className={modoVisualizacao === 'mensal' ? "bg-[#5B1A2B] text-[#FFF9F5]" : "border border-[#C9A14A]/50 text-[#5B1A2B] bg-transparent hover:border-[#C9A14A] hover:text-[#5B1A2B]"}
                    >
                      Mensal
                    </Button>
                    <Button
                      variant={modoVisualizacao === 'anual' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setModoVisualizacao('anual')}
                      className={modoVisualizacao === 'anual' ? "bg-[#5B1A2B] text-[#FFF9F5]" : "border border-[#C9A14A]/50 text-[#5B1A2B] bg-transparent hover:border-[#C9A14A] hover:text-[#5B1A2B]"}
                    >
                      Anual
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="overflow-hidden rounded-md border border-border">
                    <table className="w-full text-sm">
                      <thead className="bg-muted/50">
                        <tr>
                          <th className="px-3 py-2 text-left font-medium text-muted-foreground">Items</th>
                          <th className="px-3 py-2 text-right font-medium text-muted-foreground">Preço</th>
                        </tr>
                      </thead>
                      <tbody>
                        {produtos.map((produto, index) => (
                          <tr key={produto.id} className="border-t border-border hover:bg-muted/30 transition-colors">
                            <td className="px-3 py-2 text-foreground">
                              <span className="font-semibold text-muted-foreground mr-2">{index + 1}º</span>
                              {produto.nome}
                              <span className="ml-2 text-xs text-muted-foreground">
                                ({produto.quantidade} {produto.quantidade === 1 ? 'venda' : 'vendas'})
                              </span>
                            </td>
                            <td className="px-3 py-2 text-right font-medium text-primary">
                              R$ {produto.receita.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
