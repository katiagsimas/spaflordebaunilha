import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  AlertCircle,
  TrendingUp,
  TrendingDown,
  ChevronLeft,
  ChevronRight,
  DollarSign
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameDay,
  isToday,
  isTomorrow,
  getDay
} from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from "recharts";

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

  // Configurar realtime updates para atualizar o dashboard quando houver mudanças
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('dashboard-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'contas_receber_parcelas'
        },
        () => {
          console.log('📊 Dashboard: Atualização detectada em contas_receber_parcelas');
          carregarDados();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'contas_receber_pagamentos'
        },
        () => {
          console.log('📊 Dashboard: Atualização detectada em contas_receber_pagamentos');
          carregarDados();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'contas_pagar_parcelas'
        },
        () => {
          console.log('📊 Dashboard: Atualização detectada em contas_pagar_parcelas');
          carregarDados();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'contas_pagar_pagamentos'
        },
        () => {
          console.log('📊 Dashboard: Atualização detectada em contas_pagar_pagamentos');
          carregarDados();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'encomendas'
        },
        () => {
          console.log('📊 Dashboard: Atualização detectada em encomendas');
          carregarDados();
          carregarCalendarioAnterior();
          carregarCalendarioSeguinte();
        }
      )
      .subscribe();

    return () => {
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
        carregarVisaoEconomica()
      ]);
    } catch (error) {
      console.error("Erro ao carregar dashboard:", error);
    } finally {
      setLoading(false);
    }
  }

  async function carregarAlertas() {
    if (!user) return;
    const hoje = new Date().toISOString().split('T')[0];

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
    const inicioMes = new Date(anoSelecionado, mesSelecionado, 1).toISOString().split('T')[0];
    const fimMes = new Date(anoSelecionado, mesSelecionado + 1, 0).toISOString().split('T')[0];

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
    const inicioMes = new Date(anoSelecionado, mesSelecionado, 1).toISOString().split('T')[0];
    const fimMes = new Date(anoSelecionado, mesSelecionado + 1, 0).toISOString().split('T')[0];

    const { data: receitasMes } = await supabase
      .from("contas_receber")
      .select("valor")
      .eq("usuario_id", user.id)
      .gte("data_vencimento", inicioMes)
      .lte("data_vencimento", fimMes);

    const { data: custosMes } = await supabase
      .from("contas_pagar")
      .select("valor_total")
      .eq("usuario_id", user.id)
      .gte("data_vencimento", inicioMes)
      .lte("data_vencimento", fimMes);

    const receitasMensal = receitasMes?.reduce((sum, r) => sum + (r.valor || 0), 0) || 0;
    const custosMensal = custosMes?.reduce((sum, c) => sum + (c.valor_total || 0), 0) || 0;
    const lucroMensal = receitasMensal - custosMensal;

    const dadosAnuais = [];
    for (let i = 0; i < 12; i++) {
      const mesAtual = new Date(anoSelecionado, i, 1);
      const inicioMesAnual = format(mesAtual, "yyyy-MM-dd");
      const fimMesAnual = format(new Date(anoSelecionado, i + 1, 0), "yyyy-MM-dd");

      const { data: receitasAnual } = await supabase
        .from("contas_receber")
        .select("valor")
        .eq("usuario_id", user.id)
        .gte("data_vencimento", inicioMesAnual)
        .lte("data_vencimento", fimMesAnual);

      const { data: custosAnual } = await supabase
        .from("contas_pagar")
        .select("valor_total")
        .eq("usuario_id", user.id)
        .gte("data_vencimento", inicioMesAnual)
        .lte("data_vencimento", fimMesAnual);

      const receitas = receitasAnual?.reduce((sum, r) => sum + (r.valor || 0), 0) || 0;
      const custos = custosAnual?.reduce((sum, c) => sum + (c.valor_total || 0), 0) || 0;

      dadosAnuais.push({
        mes: meses[i].substring(0, 3),
        receitas,
        custos,
        lucro: receitas - custos
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
      
      console.log('=== DEBUG Top 5 Produtos ===');
      console.log('Encomendas entregues no período:', encomendas?.length);
      console.log('IDs das encomendas:', encomendaIds);
      
      let itensData: any[] = [];
      if (encomendaIds.length > 0) {
        const { data: itens } = await supabase
          .from("encomenda_itens")
          .select("produto, quantidade, valor_unitario, encomenda_id")
          .in("encomenda_id", encomendaIds)
          .eq("usuario_id", user.id);
        
        itensData = itens || [];
        console.log('Total de itens encontrados:', itensData.length);
        console.log('Itens:', itensData);
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
      
      console.log('Produtos agrupados:', Array.from(produtosMap.entries()).map(([nome, dados]) => ({
        nome,
        vendas: dados.encomendasSet.size,
        unidades: dados.quantidadeTotal,
        receita: dados.receita
      })));

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
      
      console.log('Top 5 produtos finais:', produtosArray);

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
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando dashboard...</p>
        </div>
      </div>
    );
  }

  const primeiroDia = getDay(startOfMonth(dataAtual));
  const diasVaziosInicio = Array(primeiroDia).fill(null);
  const diasCalendario = [...diasVaziosInicio, ...calendarioDados];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">Visão geral do seu negócio</p>
        </div>

        {/* Filtro Mês/Ano */}
        <div className="flex items-center gap-2">
          <Label className="text-sm font-medium">Período:</Label>
          <Select
            value={anoSelecionado.toString()}
            onValueChange={(value) => setAnoSelecionado(parseInt(value))}
          >
            <SelectTrigger className="w-[100px]">
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
            <SelectTrigger className="w-[130px]">
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

      {/* FINANCEIRO E ALERTAS */}
      <div className="grid gap-3 md:grid-cols-4">
        {/* A Receber */}
        <Card 
          className="cursor-pointer hover:shadow-md transition-all duration-200 hover:-translate-y-0.5 border-l-4 border-l-green-600 group"
          onClick={() => navigate("/financeiro/contas-receber")}
        >
          <CardHeader className="p-3">
            <div className="flex flex-col items-center gap-2 text-center">
              <div className="w-8 h-8 rounded-lg bg-green-50 dark:bg-green-950/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                <TrendingUp className="h-4 w-4 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <CardTitle className="text-sm mb-0.5">A Receber</CardTitle>
                <CardDescription className="text-xs mb-1">{meses[mesSelecionado]}</CardDescription>
                <p className="text-lg font-bold text-green-600 dark:text-green-400">
                  R$ {financeiro.receberAberto.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* A Pagar */}
        <Card 
          className="cursor-pointer hover:shadow-md transition-all duration-200 hover:-translate-y-0.5 border-l-4 border-l-red-600 group"
          onClick={() => navigate("/financeiro/contas-pagar")}
        >
          <CardHeader className="p-3">
            <div className="flex flex-col items-center gap-2 text-center">
              <div className="w-8 h-8 rounded-lg bg-red-50 dark:bg-red-950/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                <TrendingDown className="h-4 w-4 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <CardTitle className="text-sm mb-0.5">A Pagar</CardTitle>
                <CardDescription className="text-xs mb-1">{meses[mesSelecionado]}</CardDescription>
                <p className="text-lg font-bold text-red-600 dark:text-red-400">
                  R$ {financeiro.pagarAberto.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Contas a Receber Atrasadas */}
        <Card 
          className="cursor-pointer hover:shadow-md transition-all duration-200 hover:-translate-y-0.5 border-l-4 border-l-orange-600 group"
          onClick={() => navigate("/financeiro/contas-receber")}
        >
          <CardHeader className="p-3">
            <div className="flex flex-col items-center gap-2 text-center">
              <div className="w-8 h-8 rounded-lg bg-orange-50 dark:bg-orange-950/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                <AlertCircle className="h-4 w-4 text-orange-600 dark:text-orange-400 animate-pulse" />
              </div>
              <div>
                <CardTitle className="text-sm mb-0.5">A Receber Atrasadas</CardTitle>
                <CardDescription className="text-xs mb-1">Em atraso</CardDescription>
                <p className="text-lg font-bold text-orange-600 dark:text-orange-400">
                  R$ {alertas.receberAtrasado.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Contas a Pagar Atrasadas */}
        <Card 
          className="cursor-pointer hover:shadow-md transition-all duration-200 hover:-translate-y-0.5 border-l-4 border-l-yellow-600 group"
          onClick={() => navigate("/financeiro/contas-pagar")}
        >
          <CardHeader className="p-3">
            <div className="flex flex-col items-center gap-2 text-center">
              <div className="w-8 h-8 rounded-lg bg-yellow-50 dark:bg-yellow-950/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                <AlertCircle className="h-4 w-4 text-yellow-600 dark:text-yellow-400 animate-pulse" />
              </div>
              <div>
                <CardTitle className="text-sm mb-0.5">A Pagar Atrasadas</CardTitle>
                <CardDescription className="text-xs mb-1">Em atraso</CardDescription>
                <p className="text-lg font-bold text-yellow-600 dark:text-yellow-400">
                  R$ {alertas.pagarAtrasado.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
              </div>
            </div>
          </CardHeader>
        </Card>
      </div>

      {/* SALDO ATUAL E CALENDÁRIOS DE ENCOMENDAS */}
      <div className="space-y-4">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-tight mb-4">Calendários de Encomendas</h2>
            <p className="text-muted-foreground mb-4">Visualize suas encomendas em 3 meses consecutivos</p>
          </div>
          
          {/* Card Saldo Atual */}
          <Card 
            className="cursor-pointer hover:shadow-md transition-all duration-200 hover:-translate-y-0.5 border-l-4 border-l-primary group w-[200px]"
            onClick={() => navigate("/financeiro/dashboard")}
          >
            <CardHeader className="p-3">
              <div className="flex flex-col items-center gap-2 text-center">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <DollarSign className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-sm mb-0.5">Saldo Atual</CardTitle>
                  <p className={`text-lg font-bold ${
                    financeiro.saldoAtual >= 0 ? "text-primary" : "text-red-600"
                  }`}>
                    R$ {financeiro.saldoAtual.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                </div>
              </div>
            </CardHeader>
          </Card>
        </div>
        
        <div className="grid gap-4 md:grid-cols-3">
          {/* CALENDÁRIO MÊS ANTERIOR */}
          <Card className="border-blue-200 bg-blue-50/30 dark:bg-blue-950/20">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">
                  {meses[mesAnterior.mes]} {mesAnterior.ano}
                </CardTitle>
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => navegarMes("prev", "anterior")}
                  >
                    <ChevronLeft className="h-3 w-3" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => navegarMes("next", "anterior")}
                  >
                    <ChevronRight className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="grid grid-cols-7 gap-1">
                {["D", "S", "T", "Q", "Q", "S", "S"].map((dia, i) => (
                  <div key={i} className="text-center text-[10px] font-medium text-muted-foreground py-1">
                    {dia}
                  </div>
                ))}
                {(() => {
                  const dataAnterior = new Date(mesAnterior.ano, mesAnterior.mes, 1);
                  const primeiroDia = getDay(startOfMonth(dataAnterior));
                  const diasVazios = Array(primeiroDia).fill(null);
                  const diasCalendario = [...diasVazios, ...calendarioAnteriorDados];
                  
                  return diasCalendario.map((dados, index) => {
                    if (!dados) {
                      return <div key={`empty-${index}`} className="aspect-square" />;
                    }
                    
                    const temEncomendas = dados.quantidade > 0;
                    let bgColor = "bg-background";
                    let textColor = "text-foreground";
                    
                    if (dados.isHoje && temEncomendas) {
                      bgColor = "bg-red-200";
                      textColor = "text-red-700";
                    } else if (temEncomendas) {
                      bgColor = "bg-blue-200";
                      textColor = "text-blue-700";
                    }
                    
                    return (
                      <button
                        key={index}
                        onClick={() => selecionarDia(dados)}
                        className={`aspect-square flex items-center justify-center rounded text-[10px] hover:scale-110 hover:shadow-sm transition-transform ${bgColor} ${textColor}`}
                      >
                        <div className="flex flex-col items-center">
                          <span>{format(dados.dia, "d")}</span>
                          {temEncomendas && (
                            <span className="text-[8px] font-bold">{dados.quantidade}</span>
                          )}
                        </div>
                      </button>
                    );
                  });
                })()}
              </div>
            </CardContent>
          </Card>

          {/* CALENDÁRIO MÊS ATUAL */}
          <Card className="border-green-200 bg-green-50/30 dark:bg-green-950/20">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">
                  {meses[mesSelecionado]} {anoSelecionado}
                </CardTitle>
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => navegarMes("prev", "atual")}
                  >
                    <ChevronLeft className="h-3 w-3" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => navegarMes("next", "atual")}
                  >
                    <ChevronRight className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="grid grid-cols-7 gap-1">
                {["D", "S", "T", "Q", "Q", "S", "S"].map((dia, i) => (
                  <div key={i} className="text-center text-[10px] font-medium text-muted-foreground py-1">
                    {dia}
                  </div>
                ))}
                {(() => {
                  const primeiroDia = getDay(startOfMonth(dataAtual));
                  const diasVazios = Array(primeiroDia).fill(null);
                  const diasCalendario = [...diasVazios, ...calendarioDados];
                  
                  return diasCalendario.map((dados, index) => {
                    if (!dados) {
                      return <div key={`empty-${index}`} className="aspect-square" />;
                    }
                    
                    const isSelected = isSameDay(dados.dia, diaSelecionado);
                    const temEncomendas = dados.quantidade > 0;
                    let bgColor = "bg-background";
                    let textColor = "text-foreground";
                    let borderColor = "";
                    
                    if (dados.isHoje && temEncomendas) {
                      bgColor = "bg-red-200";
                      textColor = "text-red-700";
                    } else if (dados.isAmanha && temEncomendas) {
                      bgColor = "bg-orange-200";
                      textColor = "text-orange-700";
                    } else if (temEncomendas) {
                      bgColor = "bg-green-200";
                      textColor = "text-green-700";
                    }
                    
                    if (isSelected) {
                      borderColor = "ring-2 ring-primary";
                    }
                    
                    return (
                      <button
                        key={index}
                        onClick={() => selecionarDia(dados)}
                        className={`aspect-square flex items-center justify-center rounded text-[10px] hover:scale-110 transition-transform ${bgColor} ${textColor} ${borderColor}`}
                      >
                        <div className="flex flex-col items-center">
                          <span>{format(dados.dia, "d")}</span>
                          {temEncomendas && (
                            <span className="text-[8px] font-bold">{dados.quantidade}</span>
                          )}
                        </div>
                      </button>
                    );
                  });
                })()}
              </div>
            </CardContent>
          </Card>

          {/* CALENDÁRIO MÊS SEGUINTE */}
          <Card className="border-purple-200 bg-purple-50/30 dark:bg-purple-950/20">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">
                  {meses[mesSeguinte.mes]} {mesSeguinte.ano}
                </CardTitle>
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => navegarMes("prev", "seguinte")}
                  >
                    <ChevronLeft className="h-3 w-3" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => navegarMes("next", "seguinte")}
                  >
                    <ChevronRight className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="grid grid-cols-7 gap-1">
                {["D", "S", "T", "Q", "Q", "S", "S"].map((dia, i) => (
                  <div key={i} className="text-center text-[10px] font-medium text-muted-foreground py-1">
                    {dia}
                  </div>
                ))}
                {(() => {
                  const dataSeguinte = new Date(mesSeguinte.ano, mesSeguinte.mes, 1);
                  const primeiroDia = getDay(startOfMonth(dataSeguinte));
                  const diasVazios = Array(primeiroDia).fill(null);
                  const diasCalendario = [...diasVazios, ...calendarioSeguinteDados];
                  
                  return diasCalendario.map((dados, index) => {
                    if (!dados) {
                      return <div key={`empty-${index}`} className="aspect-square" />;
                    }
                    
                    const temEncomendas = dados.quantidade > 0;
                    let bgColor = "bg-background";
                    let textColor = "text-foreground";
                    
                    if (dados.isHoje && temEncomendas) {
                      bgColor = "bg-red-200";
                      textColor = "text-red-700";
                    } else if (temEncomendas) {
                      bgColor = "bg-purple-200";
                      textColor = "text-purple-700";
                    }
                    
                    return (
                      <button
                        key={index}
                        onClick={() => selecionarDia(dados)}
                        className={`aspect-square flex items-center justify-center rounded text-[10px] hover:scale-110 hover:shadow-sm transition-transform ${bgColor} ${textColor}`}
                      >
                        <div className="flex flex-col items-center">
                          <span>{format(dados.dia, "d")}</span>
                          {temEncomendas && (
                            <span className="text-[8px] font-bold">{dados.quantidade}</span>
                          )}
                        </div>
                      </button>
                    );
                  });
                })()}
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* Detalhes do Dia Selecionado */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              Encomendas - {format(diaSelecionado, "dd 'de' MMMM", { locale: ptBR })}
              {isToday(diaSelecionado) && (
                <Badge variant="default" className="bg-red-500">HOJE</Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {encomendasDia.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">
                Nenhuma encomenda para este dia
              </p>
            ) : (
              <div className="space-y-2">
                {encomendasDia.map((encomenda) => (
                  <Card key={encomenda.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <p className="font-semibold">{encomenda.cliente}</p>
                            <Badge variant="outline" className="text-xs">
                              {encomenda.hora_entrega || "Sem horário"}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">
                            R$ {encomenda.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </p>
                        </div>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => navigate(`/encomendas?id=${encomenda.id}`)}
                        >
                          Ver Detalhes
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* VISÃO ECONÔMICA */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl">Visão Econômica - Regime de Competência</CardTitle>
            <div className="flex gap-2">
              <Button
                variant={tabEconomica === "mensal" ? "default" : "outline"}
                size="sm"
                onClick={() => setTabEconomica("mensal")}
              >
                Mensal
              </Button>
              <Button
                variant={tabEconomica === "anual" ? "default" : "outline"}
                size="sm"
                onClick={() => setTabEconomica("anual")}
              >
                Anual
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {tabEconomica === "mensal" ? (
            <div className="grid gap-3 md:grid-cols-3">
              {/* Receitas */}
              <Card 
                className="cursor-pointer hover:shadow-md transition-all duration-200 hover:-translate-y-0.5 border-l-4 border-l-green-600 group"
                onClick={() => navigate("/financeiro/dashboard")}
              >
                <CardHeader className="p-3">
                  <div className="flex flex-col items-center gap-2 text-center">
                    <div className="w-8 h-8 rounded-lg bg-green-50 dark:bg-green-950/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                      <TrendingUp className="h-4 w-4 text-green-600 dark:text-green-400" />
                    </div>
                    <div>
                      <CardTitle className="text-sm mb-0.5">Total de Receitas</CardTitle>
                      <CardDescription className="text-xs mb-1">{meses[mesSelecionado]}</CardDescription>
                      <p className="text-lg font-bold text-green-600 dark:text-green-400">
                        R$ {visaoEconomica.mensal.receitas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </p>
                    </div>
                  </div>
                </CardHeader>
              </Card>

              {/* Custos */}
              <Card 
                className="cursor-pointer hover:shadow-md transition-all duration-200 hover:-translate-y-0.5 border-l-4 border-l-red-600 group"
                onClick={() => navigate("/financeiro/dashboard")}
              >
                <CardHeader className="p-3">
                  <div className="flex flex-col items-center gap-2 text-center">
                    <div className="w-8 h-8 rounded-lg bg-red-50 dark:bg-red-950/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                      <TrendingDown className="h-4 w-4 text-red-600 dark:text-red-400" />
                    </div>
                    <div>
                      <CardTitle className="text-sm mb-0.5">Custos Totais</CardTitle>
                      <CardDescription className="text-xs mb-1">{meses[mesSelecionado]}</CardDescription>
                      <p className="text-lg font-bold text-red-600 dark:text-red-400">
                        R$ {visaoEconomica.mensal.custos.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </p>
                    </div>
                  </div>
                </CardHeader>
              </Card>

              {/* Lucro */}
              <Card 
                className={`cursor-pointer hover:shadow-md transition-all duration-200 hover:-translate-y-0.5 border-l-4 ${
                  visaoEconomica.mensal.lucro >= 0
                    ? "border-l-primary"
                    : "border-l-red-600"
                } group`}
                onClick={() => navigate("/financeiro/dashboard")}
              >
                <CardHeader className="p-3">
                  <div className="flex flex-col items-center gap-2 text-center">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform ${
                      visaoEconomica.mensal.lucro >= 0
                        ? "bg-primary/10"
                        : "bg-red-50 dark:bg-red-950/20"
                    }`}>
                      <DollarSign className={`h-4 w-4 ${
                        visaoEconomica.mensal.lucro >= 0 ? "text-primary" : "text-red-600 dark:text-red-400"
                      }`} />
                    </div>
                    <div>
                      <CardTitle className={`text-sm mb-0.5 ${
                        visaoEconomica.mensal.lucro >= 0 ? "text-primary" : "text-red-700 dark:text-red-400"
                      }`}>
                        Lucro Líquido
                      </CardTitle>
                      <CardDescription className="text-xs mb-1">{meses[mesSelecionado]}</CardDescription>
                      <p className={`text-lg font-bold ${
                        visaoEconomica.mensal.lucro >= 0 ? "text-primary" : "text-red-700 dark:text-red-400"
                      }`}>
                        R$ {visaoEconomica.mensal.lucro.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Margem: {visaoEconomica.mensal.receitas > 0
                          ? ((visaoEconomica.mensal.lucro / visaoEconomica.mensal.receitas) * 100).toFixed(1)
                          : 0}%
                      </p>
                    </div>
                  </div>
                </CardHeader>
              </Card>
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
                  <Line type="monotone" dataKey="receitas" stroke="#10b981" name="Receitas" strokeWidth={2} />
                  <Line type="monotone" dataKey="custos" stroke="#ef4444" name="Custos" strokeWidth={2} />
                  <Line type="monotone" dataKey="lucro" stroke="#8b5cf6" name="Lucro" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </CardContent>
      </Card>

      {/* TOP 5 PRODUTOS MAIS VENDIDOS */}
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <CardTitle className="text-xl">Top 5 Produtos Mais Vendidos</CardTitle>
            </div>
            <div className="flex gap-2">
              <Button
                variant={modoVisualizacao === 'mensal' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setModoVisualizacao('mensal')}
              >
                Mensal
              </Button>
              <Button
                variant={modoVisualizacao === 'anual' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setModoVisualizacao('anual')}
              >
                Anual
              </Button>
            </div>
          </div>
          <CardDescription>
            {modoVisualizacao === 'mensal' 
              ? `${meses[mesSelecionado]} de ${anoSelecionado}`
              : `Ano ${anoSelecionado}`
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          {produtos.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              Nenhuma venda no período selecionado
            </p>
          ) : (
            <div className="space-y-4">
              {produtos.map((produto, index) => (
                <div key={produto.id} className="flex items-center gap-4 p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors">
                  {/* Posição */}
                  <div className={`
                    flex items-center justify-center w-12 h-12 rounded-full font-bold text-white shrink-0
                    ${index === 0 ? 'bg-yellow-500' : ''}
                    ${index === 1 ? 'bg-gray-400' : ''}
                    ${index === 2 ? 'bg-amber-600' : ''}
                    ${index >= 3 ? 'bg-primary' : ''}
                  `}>
                    {index + 1}º
                  </div>

                  {/* Informações do Produto */}
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-foreground truncate">{produto.nome}</p>
                    <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                      <span>
                        {produto.quantidade} {produto.quantidade === 1 ? 'venda' : 'vendas'}
                      </span>
                      <span className="font-medium text-green-600">
                        R$ {produto.receita.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  </div>

                  {/* Badge de Destaque */}
                  {index === 0 && (
                    <Badge className="bg-yellow-500 hover:bg-yellow-600 text-white shrink-0">
                      🏆 Campeão
                    </Badge>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* TICKET MÉDIO */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Ticket Médio</CardTitle>
          <CardDescription>
            Valor médio por encomenda
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            {/* Mensal */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {meses[mesSelecionado]}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold text-primary">
                  R$ {ticketMedio.mensal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
              </CardContent>
            </Card>

            {/* Anual */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Ano {anoSelecionado}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold text-primary">
                  R$ {ticketMedio.anual.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
