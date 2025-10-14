import { useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  ShoppingBag, DollarSign, Clock, 
  AlertCircle, Calendar, ArrowUpRight, 
  ArrowDownRight, ChevronRight, Truck, CookingPot, TrendingUp
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

  // VISÃO DO DIA
  const encomendasHoje = useMemo(() => {
    return orders.filter(o => {
      const deliveryDate = format(parseISO(o.deliveryDate), 'yyyy-MM-dd');
      return deliveryDate === today && o.status !== "Cancelado" && o.status !== "Concluído";
    });
  }, [orders, today]);

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
      .slice(0, 3);
  }, [orders, now]);

  // FINANCEIRO
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
    const meta = 30000;
    const percentual = (faturamentoMes.valor / meta) * 100;
    const faltam = meta - faturamentoMes.valor;

    return {
      meta,
      realizado: faturamentoMes.valor,
      percentual: Math.min(percentual, 100),
      faltam: faltam > 0 ? faltam : 0
    };
  }, [faturamentoMes]);

  // AGENDA SEMANAL
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

  const quickActions = [
    {
      title: "Encomendas Hoje",
      description: `${encomendasHoje.length} entregas programadas`,
      icon: ShoppingBag,
      color: "text-primary bg-primary/10",
      url: "/encomendas",
      value: encomendasHoje.length,
    },
    {
      title: "Em Produção",
      description: "produtos em preparo",
      icon: CookingPot,
      color: "text-warning bg-warning/10",
      url: "/producao",
      value: emProducao,
    },
    {
      title: "Entregas Hoje",
      description: "saídas programadas",
      icon: Truck,
      color: "text-info bg-info/10",
      url: "/encomendas",
      value: encomendasHoje.length,
    },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="space-y-1">
        <h1 className="text-3xl font-bold text-foreground">
          {greeting()}! 👋
        </h1>
        <p className="text-muted-foreground">
          {format(now, "EEEE, d 'de' MMMM", { locale: ptBR })}
        </p>
      </div>

      {/* Quick Actions - Visão do Dia */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
        {quickActions.map((action, index) => {
          const Icon = action.icon;
          return (
            <Card
              key={action.title}
              className="group cursor-pointer transition-all duration-200 hover:shadow-lg hover:scale-[1.02] animate-fade-in border-l-4"
              style={{ 
                animationDelay: `${index * 0.05}s`,
                borderLeftColor: action.color.includes('primary') ? 'hsl(var(--primary))' :
                                action.color.includes('warning') ? 'hsl(var(--warning))' :
                                'hsl(var(--info))'
              }}
              onClick={() => navigate(action.url)}
            >
              <CardHeader className="p-4 space-y-2">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-lg ${action.color} flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <CardTitle className="text-base font-semibold leading-tight">
                      {action.title}
                    </CardTitle>
                  </div>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-bold text-foreground">{action.value}</span>
                  <CardDescription className="text-xs">
                    {action.description}
                  </CardDescription>
                </div>
              </CardHeader>
            </Card>
          );
        })}
      </div>

      {/* Alertas - Pedidos Urgentes */}
      {pedidosUrgentes.length > 0 && (
        <Card className="border-l-4 border-l-warning shadow-soft">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-warning" />
                Pedidos Urgentes
              </CardTitle>
              <Badge variant="outline" className="text-xs">{pedidosUrgentes.length}</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            {pedidosUrgentes.map((order) => {
              const deliveryDate = parseISO(order.deliveryDate);
              const isHoje = isToday(deliveryDate);
              
              return (
                <div 
                  key={order.id} 
                  className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors cursor-pointer"
                  onClick={() => navigate('/encomendas')}
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className={cn("w-2 h-2 rounded-full shrink-0", isHoje ? "bg-destructive" : "bg-warning")} />
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-sm truncate">{order.product}</p>
                      <p className="text-xs text-muted-foreground truncate">{order.client}</p>
                    </div>
                  </div>
                  <div className="text-right shrink-0 ml-4">
                    <p className="font-semibold text-sm">{formatCurrency(order.total)}</p>
                    <p className="text-xs text-muted-foreground">
                      {isHoje ? 'Hoje' : format(deliveryDate, "dd/MM")}
                    </p>
                  </div>
                </div>
              );
            })}
            <Button variant="ghost" size="sm" className="w-full mt-2" onClick={() => navigate('/encomendas')}>
              Ver todas as encomendas
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Financeiro */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        <Card 
          className="cursor-pointer transition-all duration-200 hover:shadow-lg hover:scale-[1.02]"
          onClick={() => navigate('/financeiro/contas-receber')}
        >
          <CardHeader className="p-4">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              A Receber Hoje
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <p className="text-2xl font-bold text-success">{formatCurrency(aReceberHoje.valor)}</p>
            <p className="text-xs text-muted-foreground mt-1">
              {aReceberHoje.quantidade} conta{aReceberHoje.quantidade !== 1 ? 's' : ''}
            </p>
          </CardContent>
        </Card>

        <Card 
          className="cursor-pointer transition-all duration-200 hover:shadow-lg hover:scale-[1.02]"
          onClick={() => navigate('/financeiro/contas-pagar')}
        >
          <CardHeader className="p-4">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              A Pagar Hoje
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <p className="text-2xl font-bold text-destructive">{formatCurrency(aPagarHoje.valor)}</p>
            <p className="text-xs text-muted-foreground mt-1">
              {aPagarHoje.quantidade} conta{aPagarHoje.quantidade !== 1 ? 's' : ''}
            </p>
          </CardContent>
        </Card>

        <Card 
          className="cursor-pointer transition-all duration-200 hover:shadow-lg hover:scale-[1.02]"
          onClick={() => navigate('/relatorios/dre')}
        >
          <CardHeader className="p-4">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Faturamento do Mês
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
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
                {Math.abs(faturamentoMes.variacao).toFixed(1)}%
              </p>
            </div>
          </CardContent>
        </Card>

        <Card 
          className="cursor-pointer transition-all duration-200 hover:shadow-lg hover:scale-[1.02]"
          onClick={() => navigate('/planejamento')}
        >
          <CardHeader className="p-4">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Meta Mensal
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <p className="text-2xl font-bold text-primary">{metaMensal.percentual.toFixed(0)}%</p>
            <Progress value={metaMensal.percentual} className="h-2 mt-2" />
            <p className="text-xs text-muted-foreground mt-1">
              Faltam {formatCurrency(metaMensal.faltam)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Agenda Semanal */}
      <Card className="shadow-soft">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Agenda da Semana
            </CardTitle>
            <Button variant="ghost" size="sm" onClick={() => navigate('/encomendas')}>
              Ver todas
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-7 gap-2">
            {agendaSemanal.map((dia) => (
              <div
                key={dia.diaStr}
                className={cn(
                  "p-3 rounded-lg border text-center transition-all cursor-pointer",
                  dia.isHoje && "bg-primary text-primary-foreground border-primary",
                  !dia.isHoje && "hover:bg-muted"
                )}
                onClick={() => navigate('/encomendas')}
              >
                <p className={cn(
                  "text-xs font-medium uppercase mb-1",
                  dia.isHoje ? "text-primary-foreground" : "text-muted-foreground"
                )}>
                  {dia.nome}
                </p>
                <p className={cn(
                  "text-2xl font-bold mb-1",
                  dia.isHoje ? "text-primary-foreground" : "text-foreground"
                )}>
                  {dia.numero}
                </p>
                {dia.entregas > 0 && (
                  <Badge 
                    variant={dia.isHoje ? "secondary" : "outline"} 
                    className="text-xs px-1 py-0"
                  >
                    {dia.entregas}
                  </Badge>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Ações Rápidas */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Button 
          variant="outline" 
          className="h-auto py-4 flex-col gap-2"
          onClick={() => navigate('/encomendas')}
        >
          <ShoppingBag className="h-5 w-5" />
          <span className="text-xs">Nova Encomenda</span>
        </Button>
        <Button 
          variant="outline" 
          className="h-auto py-4 flex-col gap-2"
          onClick={() => navigate('/producao')}
        >
          <CookingPot className="h-5 w-5" />
          <span className="text-xs">Iniciar Produção</span>
        </Button>
        <Button 
          variant="outline" 
          className="h-auto py-4 flex-col gap-2"
          onClick={() => navigate('/financeiro/contas-receber')}
        >
          <DollarSign className="h-5 w-5" />
          <span className="text-xs">Lançar Recebimento</span>
        </Button>
        <Button 
          variant="outline" 
          className="h-auto py-4 flex-col gap-2"
          onClick={() => navigate('/relatorios')}
        >
          <TrendingUp className="h-5 w-5" />
          <span className="text-xs">Ver Relatórios</span>
        </Button>
      </div>
    </div>
  );
};

export default Dashboard;
