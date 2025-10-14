import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  ShoppingBag, TrendingUp, DollarSign, Package, Clock, 
  AlertCircle, Calendar, Users, Target, ArrowUpRight, 
  ArrowDownRight, TrendingDown, Bell, Cake, MessageSquare,
  ChevronRight, Truck, CookingPot
} from "lucide-react";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { format, isToday, isTomorrow, parseISO, startOfMonth, endOfMonth, startOfWeek, endOfWeek, addDays, isSameDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";

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
  const [orders] = useLocalStorage<Order[]>("orders", []);
  const [contasReceber] = useLocalStorage<ContaReceber[]>("sugarbox_contas_receber", []);
  const [contasPagar] = useLocalStorage<ContaPagar[]>("sugarbox_contas_pagar", []);

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

      return {
        dia,
        diaStr,
        nome: format(dia, 'EEE', { locale: ptBR }),
        numero: format(dia, 'd'),
        entregas,
        isHoje: isSameDay(dia, now)
      };
    });

    return dias;
  }, [orders, now]);

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
          {greeting()}! 👋
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
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Agenda da Semana
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-7 gap-2">
            {agendaSemanal.map((dia) => (
              <div
                key={dia.diaStr}
                className={cn(
                  "p-3 rounded-lg border text-center transition-all",
                  dia.isHoje && "bg-primary text-primary-foreground border-primary",
                  !dia.isHoje && "hover:bg-muted"
                )}
              >
                <p className={cn(
                  "text-xs font-medium uppercase mb-1",
                  dia.isHoje ? "text-primary-foreground" : "text-muted-foreground"
                )}>
                  {dia.nome}
                </p>
                <p className={cn(
                  "text-2xl font-bold mb-2",
                  dia.isHoje ? "text-primary-foreground" : "text-foreground"
                )}>
                  {dia.numero}
                </p>
                {dia.entregas > 0 && (
                  <Badge variant={dia.isHoje ? "secondary" : "outline"} className="text-xs">
                    {dia.entregas} {dia.entregas === 1 ? 'entrega' : 'entregas'}
                  </Badge>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;
