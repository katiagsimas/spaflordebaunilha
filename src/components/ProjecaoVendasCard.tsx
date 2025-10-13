import { useState } from "react";
import { TrendingUp, Info, Target, Calendar, DollarSign, Activity } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useLocalStorage } from "@/hooks/useLocalStorage";

interface Order {
  id: string;
  orderNumber: number;
  client: string;
  phone: string;
  product: string;
  quantity: number;
  total: number;
  downPayment: number;
  balance: number;
  status: "Pendente" | "Confirmado" | "Em Produção" | "Pronto" | "Entregue" | "Cancelado";
  orderDate: string;
  deliveryDate: string;
  deliveryTime: string;
  address: string;
  notes: string;
  createdAt: string;
}

interface ConfiguracaoPlanejamento {
  metaFaturamentoMensal: number;
  metaFaturamentoAnual: number;
  alertaCMV: number;
  custoFixoMensal: number;
}

type StatusProjecao = 'vai_bater' | 'quase' | 'precisa_acelerar';
type Confianca = 'alta' | 'media' | 'baixa';

interface ProjecaoVendasData {
  projecao: number;
  faturamentoAtual: number;
  mediaDiaria: number;
  diasDecorridos: number;
  diasRestantes: number;
  diasNoMes: number;
  meta: number;
  diferenca: number;
  necessarioPorDia: number;
  status: StatusProjecao;
  confianca: Confianca;
}

export function ProjecaoVendasCard() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [orders] = useLocalStorage<Order[]>("orders", []);
  const [config] = useLocalStorage<ConfiguracaoPlanejamento>("configuracaoPlanejamento", {
    metaFaturamentoMensal: 10000,
    metaFaturamentoAnual: 120000,
    alertaCMV: 50,
    custoFixoMensal: 2000,
  });

  // Calcular projeção do mês atual
  const hoje = new Date();
  const mesAtual = hoje.getMonth();
  const anoAtual = hoje.getFullYear();
  
  const primeiroDiaMes = new Date(anoAtual, mesAtual, 1);
  const ultimoDiaMes = new Date(anoAtual, mesAtual + 1, 0);
  
  const diasDecorridos = Math.max(1, 
    Math.floor((hoje.getTime() - primeiroDiaMes.getTime()) / (1000 * 60 * 60 * 24)) + 1
  );
  const diasNoMes = ultimoDiaMes.getDate();
  const diasRestantes = diasNoMes - diasDecorridos;

  // Faturamento já realizado
  const faturamentoAtual = orders
    .filter(order => {
      if (order.status !== "Entregue") return false;
      const deliveryDate = new Date(order.deliveryDate);
      return deliveryDate.getMonth() === mesAtual 
        && deliveryDate.getFullYear() === anoAtual
        && deliveryDate <= hoje;
    })
    .reduce((acc, o) => acc + o.total, 0);

  // Média dos últimos 7 dias
  const seteDiasAtras = new Date(hoje);
  seteDiasAtras.setDate(hoje.getDate() - 7);

  const faturamentoUltimos7Dias = orders
    .filter(order => {
      if (order.status !== "Entregue") return false;
      const deliveryDate = new Date(order.deliveryDate);
      return deliveryDate >= seteDiasAtras 
        && deliveryDate <= hoje;
    })
    .reduce((acc, o) => acc + o.total, 0);

  const mediaDiaria = faturamentoUltimos7Dias / 7;

  // Projeção
  const projecao = faturamentoAtual + (mediaDiaria * diasRestantes);

  const meta = config.metaFaturamentoMensal || 0;
  const diferenca = projecao - meta;

  const faltaParaMeta = Math.max(0, meta - faturamentoAtual);
  const necessarioPorDia = diasRestantes > 0 ? faltaParaMeta / diasRestantes : 0;

  // Status
  let status: StatusProjecao;
  if (meta === 0 || diferenca >= 0) {
    status = 'vai_bater';
  } else if (diferenca / meta > -0.1) {
    status = 'quase';
  } else {
    status = 'precisa_acelerar';
  }

  // Confiança
  const qtdVendas = orders.filter(order => {
    if (order.status !== "Entregue") return false;
    const deliveryDate = new Date(order.deliveryDate);
    return deliveryDate.getMonth() === mesAtual 
      && deliveryDate.getFullYear() === anoAtual;
  }).length;

  let confianca: Confianca;
  if (qtdVendas >= 20) {
    confianca = 'alta';
  } else if (qtdVendas >= 10) {
    confianca = 'media';
  } else {
    confianca = 'baixa';
  }

  const projecaoData: ProjecaoVendasData = {
    projecao,
    faturamentoAtual,
    mediaDiaria,
    diasDecorridos,
    diasRestantes,
    diasNoMes,
    meta,
    diferenca,
    necessarioPorDia,
    status,
    confianca,
  };

  const getBorderColor = () => {
    switch (status) {
      case 'vai_bater':
        return 'border-l-success';
      case 'quase':
        return 'border-l-warning';
      case 'precisa_acelerar':
        return 'border-l-error';
      default:
        return 'border-l-muted-foreground';
    }
  };

  const getValueColor = () => {
    switch (status) {
      case 'vai_bater':
        return 'text-success';
      case 'quase':
        return 'text-warning';
      case 'precisa_acelerar':
        return 'text-error';
      default:
        return 'text-foreground';
    }
  };

  const getStatusInfo = () => {
    switch (status) {
      case 'vai_bater':
        return { badge: '🎯 Vai bater a meta!', badgeClass: 'bg-success text-white' };
      case 'quase':
        return { badge: '🟡 Quase lá!', badgeClass: 'bg-warning text-foreground' };
      case 'precisa_acelerar':
        return { badge: '🔴 Precisa acelerar', badgeClass: 'bg-error text-white' };
      default:
        return { badge: 'N/A', badgeClass: '' };
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const statusInfo = getStatusInfo();

  // Sparkline simples (últimos 7 dias)
  const sparklineData = Array.from({ length: 7 }, (_, i) => {
    const dia = new Date(hoje);
    dia.setDate(hoje.getDate() - (6 - i));
    
    const vendas = orders
      .filter(order => {
        if (order.status !== "Entregue") return false;
        const deliveryDate = new Date(order.deliveryDate);
        return deliveryDate.toDateString() === dia.toDateString();
      })
      .reduce((acc, o) => acc + o.total, 0);
    
    return vendas;
  });

  const maxSparkline = Math.max(...sparklineData, 1);
  const sparklineChars = sparklineData.map(value => {
    const percent = value / maxSparkline;
    if (percent >= 0.875) return '█';
    if (percent >= 0.75) return '▇';
    if (percent >= 0.625) return '▆';
    if (percent >= 0.5) return '▅';
    if (percent >= 0.375) return '▃';
    if (percent >= 0.25) return '▂';
    return '▁';
  }).join('');

  return (
    <>
      <Card
        className={cn(
          "transition-all duration-300 hover:-translate-y-1 hover:shadow-elevated border-l-4 cursor-pointer",
          getBorderColor()
        )}
        onClick={() => setDialogOpen(true)}
      >
        <CardHeader className="pb-4">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-lg bg-warning/10 flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-warning" />
              </div>
              <div>
                <h3 className="text-sm uppercase font-semibold tracking-wide text-muted-foreground">
                  📈 PROJEÇÃO DE VENDAS
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">Baseada no ritmo atual</p>
              </div>
            </div>
            <Tooltip>
              <TooltipTrigger onClick={(e) => e.stopPropagation()}>
                <Info className="h-4 w-4 text-muted-foreground" />
              </TooltipTrigger>
              <TooltipContent>
                <p className="max-w-xs text-sm">
                  Projeção calculada com base na média de vendas dos últimos 7 dias. Clique para ver detalhes.
                </p>
              </TooltipContent>
            </Tooltip>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Valor Principal */}
          <div>
            <p className={cn("text-5xl font-bold", getValueColor())}>
              {formatCurrency(projecao)}
            </p>
            <p className="text-sm text-muted-foreground mt-1">até o final do mês</p>
          </div>

          {/* Comparação com Meta */}
          {meta > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Meta:</span>
                <span className="font-semibold text-foreground">{formatCurrency(meta)}</span>
              </div>

              {diferenca >= 0 ? (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-success font-medium">Vai superar em:</span>
                  <span className="font-semibold text-success">
                    {formatCurrency(diferenca)} ({((diferenca / meta) * 100).toFixed(0)}%)
                  </span>
                </div>
              ) : (
                <div className="flex items-center justify-between text-sm">
                  <span className={cn("font-medium", status === 'precisa_acelerar' ? 'text-error' : 'text-warning')}>
                    Faltam:
                  </span>
                  <span className={cn("font-semibold", status === 'precisa_acelerar' ? 'text-error' : 'text-warning')}>
                    {formatCurrency(Math.abs(diferenca))} ({((Math.abs(diferenca) / meta) * 100).toFixed(0)}%)
                  </span>
                </div>
              )}

              <div className="pt-2">
                <Badge className={statusInfo.badgeClass}>
                  {statusInfo.badge}
                </Badge>
              </div>
            </div>
          )}

          {/* Métricas Adicionais */}
          <div className="grid grid-cols-2 gap-3 pt-3 border-t border-border">
            <div className="space-y-1">
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <DollarSign className="h-3 w-3" />
                <span>Média diária:</span>
              </div>
              <p className="text-sm font-semibold">{formatCurrency(mediaDiaria)}</p>
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Calendar className="h-3 w-3" />
                <span>Dias restantes:</span>
              </div>
              <p className="text-sm font-semibold">{diasRestantes}</p>
            </div>

            {meta > 0 && diferenca < 0 && (
              <div className="space-y-1 col-span-2">
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Target className="h-3 w-3" />
                  <span>Necessário/dia:</span>
                </div>
                <p className="text-sm font-semibold">{formatCurrency(necessarioPorDia)}</p>
              </div>
            )}
          </div>

          {/* Tendência */}
          <div className="pt-3 border-t border-border">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Tendência (7 dias):</span>
              <span className="text-lg font-mono text-primary">{sparklineChars}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Modal de Detalhamento */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-warning" />
              Detalhes da Projeção
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 pt-4">
            {/* Status da projeção */}
            <div className="bg-muted/30 p-4 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Status da Projeção:</span>
                <Badge className={statusInfo.badgeClass}>
                  {statusInfo.badge}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                {status === 'vai_bater' 
                  ? 'No ritmo atual, você vai atingir ou superar a meta! Continue assim! 🎉'
                  : status === 'quase'
                  ? 'Você está bem próximo da meta. Um pequeno esforço extra vai te levar lá! 💪'
                  : 'Você precisa acelerar as vendas para atingir a meta. Foque em prospecção e vendas! 🚀'
                }
              </p>
            </div>

            {/* Métricas detalhadas */}
            <div className="space-y-3">
              <div className="flex items-center justify-between py-2 border-b">
                <span className="text-sm font-medium">Faturamento atual:</span>
                <span className="font-semibold">{formatCurrency(faturamentoAtual)}</span>
              </div>

              <div className="flex items-center justify-between py-2 border-b">
                <span className="text-sm font-medium">Projeção final:</span>
                <span className="font-semibold">{formatCurrency(projecao)}</span>
              </div>

              <div className="flex items-center justify-between py-2 border-b">
                <span className="text-sm font-medium">Dias decorridos:</span>
                <span className="font-semibold">{diasDecorridos} de {diasNoMes}</span>
              </div>

              <div className="flex items-center justify-between py-2 border-b">
                <span className="text-sm font-medium">Média diária (7d):</span>
                <span className="font-semibold">{formatCurrency(mediaDiaria)}</span>
              </div>

              <div className="flex items-center justify-between py-2 border-b">
                <span className="text-sm font-medium">Total de vendas:</span>
                <span className="font-semibold">{qtdVendas} encomendas</span>
              </div>

              <div className="flex items-center justify-between py-2">
                <span className="text-sm font-medium">Confiança da projeção:</span>
                <Badge variant="outline" className={cn(
                  confianca === 'alta' ? 'border-success text-success' :
                  confianca === 'media' ? 'border-warning text-warning' :
                  'border-error text-error'
                )}>
                  {confianca === 'alta' ? '🟢 Alta' : confianca === 'media' ? '🟡 Média' : '🔴 Baixa'}
                </Badge>
              </div>
            </div>

            {/* Informação sobre confiança */}
            <div className="bg-info/10 border-l-4 border-info p-4 rounded-lg">
              <p className="text-sm text-foreground">
                <span className="font-semibold">💡 Sobre a confiança:</span>{' '}
                {confianca === 'alta' 
                  ? 'Com mais de 20 vendas no mês, a projeção é bastante confiável.'
                  : confianca === 'media'
                  ? 'Com 10-19 vendas, a projeção tem precisão moderada. Mais vendas aumentam a confiabilidade.'
                  : 'Com menos de 10 vendas, a projeção pode variar bastante. Considere como uma estimativa inicial.'
                }
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
