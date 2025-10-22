import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  ShoppingBag, TrendingUp, DollarSign, Package, Clock, 
  AlertCircle, Calendar, Users, Target, ArrowUpRight, 
  ArrowDownRight, TrendingDown, Bell, Cake, MessageSquare,
  ChevronRight, Truck, CookingPot
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { format, isToday, isTomorrow, parseISO, startOfMonth, endOfMonth, startOfWeek, endOfWeek, addDays, isSameDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from "recharts";

interface Order {
  id: string;
  orderNumber: number;
  client: string;
  product: string;
  total: number;
  status: string;
  deliveryDate: string;
  createdAt: string;
}

interface ContaReceber {
  id: string;
  descricao: string;
  valor: number;
  dataVencimento: string;
  dataRecebimento?: string;
  status: string;
}

interface ContaPagar {
  id: string;
  descricao: string;
  valor: number;
  dataVencimento: string;
  dataPagamento?: string;
  status: string;
}

const Dashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  // Buscar perfil do usuário
  const { data: profile } = useQuery({
    queryKey: ['profile', user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      return data;
    },
    enabled: !!user,
  });

  // Buscar encomendas do Supabase
  const { data: orders = [] } = useQuery({
    queryKey: ['encomendas-dashboard', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('encomendas')
        .select('*')
        .eq('usuario_id', user.id)
        .order('data_entrega', { ascending: true });

      if (error) throw error;
      
      // Mapear para o formato esperado pelo Dashboard
      return (data || []).map(e => ({
        id: e.id,
        orderNumber: parseInt(e.id.substring(0, 8), 16), // Simular número de pedido
        client: e.cliente,
        product: 'Encomenda', // Simplificado
        total: Number(e.valor),
        status: e.status === 'pendente' ? 'Pendente' : 
                e.status === 'confirmado' ? 'Confirmado' : 
                e.status === 'producao' ? 'Em Produção' : 
                e.status === 'pronto' ? 'Pronto' : 
                e.status === 'entregue' ? 'Concluído' : 'Cancelado',
        deliveryDate: e.data_entrega || '',
        createdAt: e.created_at || '',
      })) as Order[];
    },
    enabled: !!user,
  });

  // Buscar Contas a Receber (parcelas) do Supabase
  const { data: contasReceberData = [] } = useQuery({
    queryKey: ['contas-receber-dashboard', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('contas_receber_parcelas')
        .select(`
          *,
          conta_receber:contas_receber(descricao, usuario_id)
        `)
        .eq('conta_receber.usuario_id', user.id)
        .order('data_vencimento', { ascending: true });

      if (error) throw error;
      
      return (data || []).map(p => ({
        id: p.id,
        descricao: p.conta_receber?.descricao || 'Sem descrição',
        valor: Number(p.valor_parcela),
        dataVencimento: p.data_vencimento,
        dataRecebimento: p.data_pagamento || undefined,
        status: p.status === 'aberto' ? 'pendente' : 
                p.status === 'pago' || p.status === 'adiantado' ? 'pago' : 
                p.status === 'atrasado' ? 'vencida' : 'pendente',
      })) as ContaReceber[];
    },
    enabled: !!user,
  });

  const contasReceber = contasReceberData;

  // Buscar Contas a Pagar (parcelas) do Supabase
  const { data: contasPagarData = [] } = useQuery({
    queryKey: ['contas-pagar-dashboard', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('contas_pagar_parcelas')
        .select(`
          *,
          conta_pagar:contas_pagar(descricao, usuario_id)
        `)
        .eq('conta_pagar.usuario_id', user.id)
        .order('data_vencimento', { ascending: true });

      if (error) throw error;
      
      return (data || []).map(p => ({
        id: p.id,
        descricao: p.conta_pagar?.descricao || 'Sem descrição',
        valor: Number(p.valor_parcela),
        dataVencimento: p.data_vencimento,
        dataPagamento: p.data_pagamento || undefined,
        status: p.status === 'aberto' ? 'pendente' : 
                p.status === 'pago' ? 'pago' : 
                p.status === 'atrasado' ? 'vencida' : 'pendente',
      })) as ContaPagar[];
    },
    enabled: !!user,
  });

  const contasPagar = contasPagarData;

  // Extrair primeiro nome
  const primeiroNome = profile?.nome_completo?.split(' ')[0] || '';

  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();
  const today = format(now, 'yyyy-MM-dd');

  // SEÇÃO 1: VISÃO DO DIA
  const encomendasHoje = useMemo(() => {
    return orders.filter(o => {
      const deliveryDate = format(parseISO(o.deliveryDate), 'yyyy-MM-dd');
      return deliveryDate === today && o.status !== "Cancelado" && o.status !== "Concluído";
    });
  }, [orders, today]);

  const encomendasPendentes = useMemo(() => {
    return encomendasHoje.filter(o => o.status === "Pendente").length;
  }, [encomendasHoje]);

  const encomendasAtrasadas = useMemo(() => {
    const ontem = new Date(now);
    ontem.setDate(ontem.getDate() - 1);
    return orders.filter(o => {
      const deliveryDate = new Date(o.deliveryDate);
      return deliveryDate < now && o.status !== "Concluído" && o.status !== "Cancelado";
    }).length;
  }, [orders, now]);

  const emProducao = useMemo(() => {
    return orders.filter(o => o.status === "Em Produção" || o.status === "Produzindo").length;
  }, [orders]);

  const pedidosUrgentes = useMemo(() => {
    return orders
      .filter(o => {
        const deliveryDate = new Date(o.deliveryDate);
        const amanha = new Date(now);
        amanha.setDate(amanha.getDate() + 1);
        return deliveryDate <= amanha && o.status !== "Concluído" && o.status !== "Cancelado";
      })
      .sort((a, b) => new Date(a.deliveryDate).getTime() - new Date(b.deliveryDate).getTime())
      .slice(0, 5);
  }, [orders, now]);

  // SEÇÃO 2: FINANCEIRO RÁPIDO
  const aReceberHoje = useMemo(() => {
    const valores = contasReceber.filter(c => 
      c.dataVencimento === today && c.status !== 'recebido'
    );
    return {
      valor: valores.reduce((acc, c) => acc + c.valor, 0),
      quantidade: valores.length
    };
  }, [contasReceber, today]);

  const aPagarHoje = useMemo(() => {
    const valores = contasPagar.filter(c => 
      c.dataVencimento === today && c.status !== 'pago'
    );
    return {
      valor: valores.reduce((acc, c) => acc + c.valor, 0),
      quantidade: valores.length
    };
  }, [contasPagar, today]);

  const faturamentoMes = useMemo(() => {
    const inicio = format(startOfMonth(now), 'yyyy-MM-dd');
    const fim = format(endOfMonth(now), 'yyyy-MM-dd');
    
    const faturamentoAtual = contasReceber
      .filter(c => c.status === 'recebido' && c.dataRecebimento && c.dataRecebimento >= inicio && c.dataRecebimento <= fim)
      .reduce((acc, c) => acc + c.valor, 0);

    // Mês anterior
    const mesAnterior = new Date(now);
    mesAnterior.setMonth(mesAnterior.getMonth() - 1);
    const inicioAnterior = format(startOfMonth(mesAnterior), 'yyyy-MM-dd');
    const fimAnterior = format(endOfMonth(mesAnterior), 'yyyy-MM-dd');
    
    const faturamentoAnterior = contasReceber
      .filter(c => c.status === 'recebido' && c.dataRecebimento && c.dataRecebimento >= inicioAnterior && c.dataRecebimento <= fimAnterior)
      .reduce((acc, c) => acc + c.valor, 0);

    const variacao = faturamentoAnterior > 0 
      ? ((faturamentoAtual - faturamentoAnterior) / faturamentoAnterior) * 100 
      : 0;

    return {
      valor: faturamentoAtual,
      variacao,
      crescimento: variacao >= 0
    };
  }, [contasReceber, now]);

  const metaMensal = useMemo(() => {
    const meta = 30000; // TODO: buscar de configuração
    const percentual = (faturamentoMes.valor / meta) * 100;
    const faltam = meta - faturamentoMes.valor;

    return {
      meta,
      realizado: faturamentoMes.valor,
      percentual: Math.min(percentual, 100),
      faltam: faltam > 0 ? faltam : 0
    };
  }, [faturamentoMes]);

  // SEÇÃO 4: INDICADORES
  const vendasSemana = useMemo(() => {
    const inicioSemana = format(startOfWeek(now, { weekStartsOn: 1 }), 'yyyy-MM-dd');
    const fimSemana = format(endOfWeek(now, { weekStartsOn: 1 }), 'yyyy-MM-dd');
    
    const vendasAtual = contasReceber
      .filter(c => c.status === 'recebido' && c.dataRecebimento && c.dataRecebimento >= inicioSemana && c.dataRecebimento <= fimSemana)
      .reduce((acc, c) => acc + c.valor, 0);

    // Semana anterior
    const semanaAnterior = new Date(now);
    semanaAnterior.setDate(semanaAnterior.getDate() - 7);
    const inicioAnterior = format(startOfWeek(semanaAnterior, { weekStartsOn: 1 }), 'yyyy-MM-dd');
    const fimAnterior = format(endOfWeek(semanaAnterior, { weekStartsOn: 1 }), 'yyyy-MM-dd');
    
    const vendasAnterior = contasReceber
      .filter(c => c.status === 'recebido' && c.dataRecebimento && c.dataRecebimento >= inicioAnterior && c.dataRecebimento <= fimAnterior)
      .reduce((acc, c) => acc + c.valor, 0);

    const variacao = vendasAnterior > 0 
      ? ((vendasAtual - vendasAnterior) / vendasAnterior) * 100 
      : 0;

    return {
      valor: vendasAtual,
      variacao,
      crescimento: variacao >= 0
    };
  }, [contasReceber, now]);

  const produtoMaisVendido = useMemo(() => {
    const productCount: Record<string, { count: number; valor: number }> = {};
    orders.forEach(order => {
      if (!productCount[order.product]) {
        productCount[order.product] = { count: 0, valor: 0 };
      }
      productCount[order.product].count += 1;
      productCount[order.product].valor += order.total;
    });
    
    const topProduct = Object.entries(productCount)
      .sort((a, b) => b[1].count - a[1].count)[0];

    return topProduct ? {
      nome: topProduct[0],
      quantidade: topProduct[1].count,
      valor: topProduct[1].valor
    } : null;
  }, [orders]);

  const ticketMedio = useMemo(() => {
    const pedidosMes = orders.filter(o => {
      const orderDate = new Date(o.createdAt);
      return orderDate.getMonth() === currentMonth && orderDate.getFullYear() === currentYear;
    });

    const totalMes = pedidosMes.reduce((acc, o) => acc + o.total, 0);
    const ticketAtual = pedidosMes.length > 0 ? totalMes / pedidosMes.length : 0;

    // Mês anterior
    const mesAnterior = currentMonth === 0 ? 11 : currentMonth - 1;
    const anoAnterior = currentMonth === 0 ? currentYear - 1 : currentYear;
    
    const pedidosAnterior = orders.filter(o => {
      const orderDate = new Date(o.createdAt);
      return orderDate.getMonth() === mesAnterior && orderDate.getFullYear() === anoAnterior;
    });

    const totalAnterior = pedidosAnterior.reduce((acc, o) => acc + o.total, 0);
    const ticketAnterior = pedidosAnterior.length > 0 ? totalAnterior / pedidosAnterior.length : 0;

    const variacao = ticketAnterior > 0 
      ? ((ticketAtual - ticketAnterior) / ticketAnterior) * 100 
      : 0;

    return {
      valor: ticketAtual,
      variacao,
      crescimento: variacao >= 0
    };
  }, [orders, currentMonth, currentYear]);

  // SEÇÃO 5: AGENDA SEMANAL
  const agendaSemanal = useMemo(() => {
    const dias = Array.from({ length: 7 }, (_, i) => {
      const dia = addDays(startOfWeek(now, { weekStartsOn: 1 }), i);
      const diaStr = format(dia, 'yyyy-MM-dd');
      
      const entregas = orders.filter(o => {
        const deliveryDate = format(parseISO(o.deliveryDate), 'yyyy-MM-dd');
        return deliveryDate === diaStr && o.status !== "Cancelado";
      }).length;

      const producoes = orders.filter(o => {
        const deliveryDate = format(parseISO(o.deliveryDate), 'yyyy-MM-dd');
        return deliveryDate === diaStr && (o.status === "Em Produção" || o.status === "Produzindo");
      }).length;

      // Definir nível de carga
      let nivelCarga: 'leve' | 'medio' | 'pesado' = 'leve';
      if (entregas >= 9) nivelCarga = 'pesado';
      else if (entregas >= 5) nivelCarga = 'medio';

      return {
        dia,
        diaStr,
        nome: format(dia, 'EEE', { locale: ptBR }),
        nomeLongo: format(dia, 'EEEE', { locale: ptBR }),
        numero: format(dia, 'd'),
        mesAno: format(dia, 'dd/MM'),
        entregas,
        producoes,
        nivelCarga,
        isHoje: isSameDay(dia, now)
      };
    });

    return dias;
  }, [orders, now]);

  // SEÇÃO 6: GRÁFICOS
  const faturamentoUltimos30Dias = useMemo(() => {
    const dias = Array.from({ length: 30 }, (_, i) => {
      const dia = new Date(now);
      dia.setDate(dia.getDate() - (29 - i));
      const diaStr = format(dia, 'yyyy-MM-dd');
      
      const faturamento = contasReceber
        .filter(c => c.status === 'recebido' && c.dataRecebimento === diaStr)
        .reduce((acc, c) => acc + c.valor, 0);

      return {
        data: format(dia, 'dd/MM'),
        valor: faturamento
      };
    });

    return dias;
  }, [contasReceber, now]);

  const top5Produtos = useMemo(() => {
    const productCount: Record<string, { count: number; valor: number }> = {};
    
    const pedidosMes = orders.filter(o => {
      const orderDate = new Date(o.createdAt);
      return orderDate.getMonth() === currentMonth && orderDate.getFullYear() === currentYear;
    });

    pedidosMes.forEach(order => {
      if (!productCount[order.product]) {
        productCount[order.product] = { count: 0, valor: 0 };
      }
      productCount[order.product].count += 1;
      productCount[order.product].valor += order.total;
    });
    
    return Object.entries(productCount)
      .map(([nome, dados]) => ({
        nome,
        quantidade: dados.count,
        valor: dados.valor
      }))
      .sort((a, b) => b.quantidade - a.quantidade)
      .slice(0, 5);
  }, [orders, currentMonth, currentYear]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const greeting = () => {
    const hour = now.getHours();
    if (hour < 12) return "Bom dia";
    if (hour < 18) return "Boa tarde";
    return "Boa noite";
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-4xl font-bold text-foreground">
          {greeting()}{primeiroNome && `, ${primeiroNome}`}! 👋
        </h1>
        <p className="text-muted-foreground text-lg">
          {format(now, "EEEE, d 'de' MMMM 'de' yyyy", { locale: ptBR })}
        </p>
      </div>

      {/* SEÇÃO 1: VISÃO DO DIA */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Encomendas do Dia */}
        <Card 
          className="cursor-pointer hover:shadow-lg transition-all border-l-4 border-l-primary"
          onClick={() => navigate('/encomendas')}
        >
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-semibold flex items-center gap-2">
                <ShoppingBag className="h-5 w-5 text-primary" />
                Encomendas Hoje
              </CardTitle>
              {encomendasAtrasadas > 0 && (
                <Badge variant="destructive" className="animate-pulse">
                  {encomendasAtrasadas} atrasadas
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div>
                <p className="text-4xl font-bold text-primary">{encomendasHoje.length}</p>
                <p className="text-sm text-muted-foreground mt-1">
                  {encomendasPendentes} pendentes
                </p>
              </div>
              
              {encomendasHoje.slice(0, 3).map((order) => (
                <div key={order.id} className="flex items-center justify-between text-sm border-t pt-2">
                  <span className="text-foreground truncate">{order.client}</span>
                  <span className="text-muted-foreground">{order.product}</span>
                </div>
              ))}

              <Button variant="ghost" size="sm" className="w-full mt-2">
                Ver todas as encomendas
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Em Produção */}
        <Card 
          className="cursor-pointer hover:shadow-lg transition-all border-l-4 border-l-warning"
          onClick={() => navigate('/producao')}
        >
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <CookingPot className="h-5 w-5 text-warning" />
              Em Produção Agora
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div>
                <p className="text-4xl font-bold text-warning">{emProducao}</p>
                <p className="text-sm text-muted-foreground mt-1">
                  produtos sendo produzidos
                </p>
              </div>

              <Button variant="ghost" size="sm" className="w-full mt-2">
                Ir para Produção
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Entregas de Hoje */}
        <Card 
          className="cursor-pointer hover:shadow-lg transition-all border-l-4 border-l-info"
          onClick={() => navigate('/encomendas')}
        >
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <Truck className="h-5 w-5 text-info" />
              Entregas Hoje
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div>
                <p className="text-4xl font-bold text-info">{encomendasHoje.length}</p>
                <p className="text-sm text-muted-foreground mt-1">
                  programadas para hoje
                </p>
              </div>

              {encomendasHoje.slice(0, 2).map((order) => (
                <div key={order.id} className="flex items-center justify-between text-sm border-t pt-2">
                  <span className="text-foreground truncate">{order.client}</span>
                  <span className="text-xs text-muted-foreground">
                    {format(parseISO(order.deliveryDate), 'HH:mm')}
                  </span>
                </div>
              ))}

              <Button variant="ghost" size="sm" className="w-full mt-2">
                Ver agenda de entregas
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* SEÇÃO 2: FINANCEIRO RÁPIDO */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* A Receber Hoje */}
        <Card 
          className="cursor-pointer hover:shadow-lg transition-all"
          onClick={() => navigate('/financeiro/contas-receber')}
        >
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              💵 A Receber Hoje
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-success">{formatCurrency(aReceberHoje.valor)}</p>
            <p className="text-xs text-muted-foreground mt-1">
              {aReceberHoje.quantidade} conta{aReceberHoje.quantidade !== 1 ? 's' : ''}
            </p>
          </CardContent>
        </Card>

        {/* A Pagar Hoje */}
        <Card 
          className="cursor-pointer hover:shadow-lg transition-all"
          onClick={() => navigate('/financeiro/contas-pagar')}
        >
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              💳 A Pagar Hoje
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-destructive">{formatCurrency(aPagarHoje.valor)}</p>
            <p className="text-xs text-muted-foreground mt-1">
              {aPagarHoje.quantidade} conta{aPagarHoje.quantidade !== 1 ? 's' : ''}
            </p>
          </CardContent>
        </Card>

        {/* Faturamento do Mês */}
        <Card 
          className="cursor-pointer hover:shadow-lg transition-all"
          onClick={() => navigate('/relatorios/dre')}
        >
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              📊 Faturamento do Mês
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-primary">{formatCurrency(faturamentoMes.valor)}</p>
            <div className="flex items-center gap-1 mt-1">
              {faturamentoMes.crescimento ? (
                <ArrowUpRight className="h-3 w-3 text-success" />
              ) : (
                <ArrowDownRight className="h-3 w-3 text-destructive" />
              )}
              <p className={cn(
                "text-xs font-medium",
                faturamentoMes.crescimento ? "text-success" : "text-destructive"
              )}>
                {Math.abs(faturamentoMes.variacao).toFixed(1)}% vs mês anterior
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Meta Mensal */}
        <Card 
          className="cursor-pointer hover:shadow-lg transition-all"
          onClick={() => navigate('/planejamento')}
        >
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              🎯 Meta Mensal
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-primary">{metaMensal.percentual.toFixed(0)}%</p>
            <Progress value={metaMensal.percentual} className="h-2 mt-2" />
            <p className="text-xs text-muted-foreground mt-1">
              Faltam {formatCurrency(metaMensal.faltam)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* SEÇÃO 3: PEDIDOS URGENTES */}
      {pedidosUrgentes.length > 0 && (
        <Card className="border-l-4 border-l-warning">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-warning" />
                Pedidos Urgentes/Prioritários
              </CardTitle>
              <Badge variant="outline">{pedidosUrgentes.length} pedidos</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {pedidosUrgentes.map((order) => {
                const deliveryDate = parseISO(order.deliveryDate);
                const isHoje = isToday(deliveryDate);
                const isAmanha = isTomorrow(deliveryDate);
                
                return (
                  <div 
                    key={order.id} 
                    className={cn(
                      "flex items-center justify-between p-3 rounded-lg border",
                      isHoje && "bg-destructive/5 border-destructive",
                      isAmanha && "bg-warning/5 border-warning"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "w-2 h-2 rounded-full",
                        isHoje && "bg-destructive",
                        isAmanha && "bg-warning"
                      )} />
                      <div>
                        <p className="font-semibold">{order.product} - {order.client}</p>
                        <p className="text-xs text-muted-foreground">
                          {isHoje ? 'Hoje' : isAmanha ? 'Amanhã' : format(deliveryDate, "dd/MM")} às {format(deliveryDate, 'HH:mm')} • {order.status}
                        </p>
                      </div>
                    </div>
                    <p className="font-semibold text-primary">{formatCurrency(order.total)}</p>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* SEÇÃO 4: INDICADORES DE DESEMPENHO */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Vendas da Semana */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              📈 Vendas da Semana
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-foreground">{formatCurrency(vendasSemana.valor)}</p>
            <div className="flex items-center gap-1 mt-1">
              {vendasSemana.crescimento ? (
                <ArrowUpRight className="h-3 w-3 text-success" />
              ) : (
                <ArrowDownRight className="h-3 w-3 text-destructive" />
              )}
              <p className={cn(
                "text-xs font-medium",
                vendasSemana.crescimento ? "text-success" : "text-destructive"
              )}>
                {Math.abs(vendasSemana.variacao).toFixed(1)}% vs semana anterior
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Produto Mais Vendido */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              ⭐ Produto Mais Vendido
            </CardTitle>
          </CardHeader>
          <CardContent>
            {produtoMaisVendido ? (
              <>
                <p className="text-xl font-bold text-foreground truncate">{produtoMaisVendido.nome}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {produtoMaisVendido.quantidade} unidades • {formatCurrency(produtoMaisVendido.valor)}
                </p>
              </>
            ) : (
              <p className="text-muted-foreground">Sem dados</p>
            )}
          </CardContent>
        </Card>

        {/* Ticket Médio */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              💰 Ticket Médio
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-foreground">{formatCurrency(ticketMedio.valor)}</p>
            <div className="flex items-center gap-1 mt-1">
              {ticketMedio.crescimento ? (
                <ArrowUpRight className="h-3 w-3 text-success" />
              ) : (
                <ArrowDownRight className="h-3 w-3 text-destructive" />
              )}
              <p className={cn(
                "text-xs font-medium",
                ticketMedio.crescimento ? "text-success" : "text-destructive"
              )}>
                {Math.abs(ticketMedio.variacao).toFixed(1)}% vs mês anterior
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Encomendas do Mês */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              📦 Encomendas do Mês
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-foreground">
              {orders.filter(o => {
                const orderDate = new Date(o.createdAt);
                return orderDate.getMonth() === currentMonth && orderDate.getFullYear() === currentYear;
              }).length}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              pedidos recebidos
            </p>
          </CardContent>
        </Card>
      </div>

      {/* SEÇÃO 5: AGENDA SEMANAL */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Agenda da Semana
            </CardTitle>
            <Button variant="ghost" size="sm" onClick={() => navigate('/encomendas')}>
              Ver planejamento completo
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {agendaSemanal.map((dia) => {
              const cargaTotal = dia.entregas + dia.producoes;
              const maxCarga = Math.max(...agendaSemanal.map(d => d.entregas + d.producoes), 15);
              const porcentagemBarra = (cargaTotal / maxCarga) * 100;

              return (
                <div
                  key={dia.diaStr}
                  className={cn(
                    "p-4 rounded-lg border transition-all cursor-pointer hover:shadow-md",
                    dia.isHoje && "bg-primary/5 border-primary ring-2 ring-primary/20"
                  )}
                  onClick={() => navigate('/encomendas')}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <div className="text-center min-w-[60px]">
                        <p className={cn(
                          "text-xs font-medium uppercase",
                          dia.isHoje ? "text-primary" : "text-muted-foreground"
                        )}>
                          {dia.nome}
                        </p>
                        <p className={cn(
                          "text-xl font-bold",
                          dia.isHoje ? "text-primary" : "text-foreground"
                        )}>
                          {dia.numero}
                        </p>
                      </div>

                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="text-sm font-semibold capitalize">{dia.nomeLongo}</p>
                          {dia.nivelCarga === 'pesado' && (
                            <Badge variant="destructive" className="text-xs">
                              ⚠️ SOBRECARREGADO
                            </Badge>
                          )}
                        </div>
                        
                        {/* Barra de carga */}
                        <div className="h-6 bg-muted rounded-full overflow-hidden">
                          <div
                            className={cn(
                              "h-full transition-all duration-300 flex items-center px-2",
                              dia.nivelCarga === 'leve' && "bg-success",
                              dia.nivelCarga === 'medio' && "bg-warning",
                              dia.nivelCarga === 'pesado' && "bg-destructive"
                            )}
                            style={{ width: `${Math.max(porcentagemBarra, 5)}%` }}
                          >
                            <span className="text-xs font-medium text-white whitespace-nowrap">
                              {dia.entregas > 0 && `${dia.entregas} entregas`}
                              {dia.entregas > 0 && dia.producoes > 0 && ' | '}
                              {dia.producoes > 0 && `${dia.producoes} produções`}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="text-right ml-4">
                      <p className="text-2xl font-bold text-foreground">{cargaTotal}</p>
                      <p className="text-xs text-muted-foreground">tarefas</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* SEÇÃO 6: GRÁFICOS ANALÍTICOS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Gráfico 1: Faturamento dos Últimos 30 Dias */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              📊 Faturamento dos Últimos 30 Dias
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={faturamentoUltimos30Dias}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis 
                  dataKey="data" 
                  stroke="hsl(var(--muted-foreground))"
                  tick={{ fontSize: 11 }}
                  interval="preserveStartEnd"
                />
                <YAxis 
                  stroke="hsl(var(--muted-foreground))"
                  tick={{ fontSize: 11 }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "0.5rem",
                  }}
                  formatter={(value: number) => formatCurrency(value)}
                />
                <Line
                  type="monotone"
                  dataKey="valor"
                  stroke="hsl(var(--primary))"
                  strokeWidth={3}
                  dot={{ fill: "hsl(var(--primary))", strokeWidth: 2, r: 3 }}
                  activeDot={{ r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Gráfico 2: Top 5 Produtos do Mês */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              🥧 Top 5 Produtos do Mês
            </CardTitle>
          </CardHeader>
          <CardContent>
            {top5Produtos.length === 0 ? (
              <div className="flex items-center justify-center h-[250px] text-muted-foreground">
                Nenhum produto vendido este mês
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={top5Produtos} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis type="number" stroke="hsl(var(--muted-foreground))" />
                  <YAxis 
                    dataKey="nome" 
                    type="category" 
                    stroke="hsl(var(--muted-foreground))"
                    width={100}
                    tick={{ fontSize: 11 }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "0.5rem",
                    }}
                    formatter={(value: number, name: string) => {
                      if (name === 'quantidade') return [value, 'Vendidos'];
                      if (name === 'valor') return [formatCurrency(value), 'Faturamento'];
                      return value;
                    }}
                  />
                  <Legend />
                  <Bar dataKey="quantidade" fill="hsl(var(--primary))" name="Quantidade" />
                  <Bar dataKey="valor" fill="hsl(var(--success))" name="Faturamento (R$)" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
