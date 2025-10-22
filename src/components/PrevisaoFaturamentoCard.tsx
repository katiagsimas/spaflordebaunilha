import { useState } from "react";
import { DollarSign, Info, TrendingUp, TrendingDown, CheckCircle, Clock, AlertCircle } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { type PrevisaoFaturamento } from "@/hooks/usePlanejamento";
import { cn } from "@/lib/utils";
import { useEncomendas } from "@/hooks/useEncomendas";

interface PrevisaoFaturamentoCardProps {
  dados: PrevisaoFaturamento;
}

export function PrevisaoFaturamentoCard({ dados }: PrevisaoFaturamentoCardProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const { encomendas } = useEncomendas();

  // Calcular breakdown de encomendas do mês atual
  const hoje = new Date();
  const mesAtual = hoje.getMonth();
  const anoAtual = hoje.getFullYear();

  const encomendasDoMes = encomendas.filter(order => {
    if (order.status === "cancelado") return false;
    const deliveryDate = new Date(order.data_entrega);
    return deliveryDate.getMonth() === mesAtual && deliveryDate.getFullYear() === anoAtual;
  });

  const jaEntregues = encomendasDoMes
    .filter(o => o.status === "entregue")
    .reduce((acc, o) => acc + o.valor, 0);

  const confirmadas = encomendasDoMes
    .filter(o => ["confirmado", "em_producao", "pronto"].includes(o.status))
    .reduce((acc, o) => acc + o.valor, 0);

  const pendentes = encomendasDoMes
    .filter(o => o.status === "pendente")
    .reduce((acc, o) => acc + o.valor, 0);

  // Calcular dias restantes no mês
  const ultimoDiaMes = new Date(anoAtual, mesAtual + 1, 0).getDate();
  const diasRestantes = ultimoDiaMes - hoje.getDate();

  // Calcular média por dia
  const mediaPorDia = diasRestantes > 0 ? dados.valorAtual / diasRestantes : 0;

  const getBorderColor = () => {
    switch (dados.status) {
      case 'sucesso':
        return 'border-l-success';
      case 'atencao':
        return 'border-l-warning';
      case 'critico':
        return 'border-l-error';
      default:
        return 'border-l-muted-foreground';
    }
  };

  const getValueColor = () => {
    switch (dados.status) {
      case 'sucesso':
        return 'text-success';
      case 'atencao':
        return 'text-warning';
      case 'critico':
        return 'text-error';
      default:
        return 'text-foreground';
    }
  };

  const getProgressColor = () => {
    switch (dados.status) {
      case 'sucesso':
        return 'bg-gradient-to-r from-success to-success/80';
      case 'atencao':
        return 'bg-gradient-to-r from-warning to-warning/80';
      case 'critico':
        return 'bg-gradient-to-r from-error to-error/80';
      default:
        return 'bg-muted-foreground';
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

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
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                <DollarSign className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="text-sm uppercase font-semibold tracking-wide text-muted-foreground">
                  💰 PREVISÃO DE FATURAMENTO
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">{dados.mesAtual}</p>
              </div>
            </div>
            <Tooltip>
              <TooltipTrigger onClick={(e) => e.stopPropagation()}>
                <Info className="h-4 w-4 text-muted-foreground" />
              </TooltipTrigger>
              <TooltipContent>
                <p className="max-w-xs text-sm">
                  Previsão calculada com base nas encomendas confirmadas do mês atual. Clique para ver detalhes.
                </p>
              </TooltipContent>
            </Tooltip>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Valor Principal */}
          <div>
            <p className={cn("text-5xl font-bold", getValueColor())}>
              {formatCurrency(dados.valorAtual)}
            </p>
          </div>

          {/* Barra de Progresso */}
          {dados.meta > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Progresso da meta</span>
                <span className={cn("font-semibold", getValueColor())}>
                  {dados.percentualMeta.toFixed(0)}%
                </span>
              </div>
              <div className="h-2 bg-border rounded-full overflow-hidden">
                <div
                  className={cn("h-full transition-all duration-1000 ease-out", getProgressColor())}
                  style={{ width: `${Math.min(dados.percentualMeta, 100)}%` }}
                />
              </div>
            </div>
          )}

          {/* Meta e Diferença */}
          {dados.meta > 0 && (
            <div className="space-y-1">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Meta do mês:</span>
                <span className="font-semibold text-foreground">{formatCurrency(dados.meta)}</span>
              </div>
              {dados.falta > 0 ? (
                <div className="flex items-center justify-between text-sm">
                  <span className={cn("font-medium", dados.status === 'critico' ? 'text-error' : 'text-warning')}>
                    Faltam:
                  </span>
                  <span className={cn("font-semibold", dados.status === 'critico' ? 'text-error' : 'text-warning')}>
                    {formatCurrency(dados.falta)} ({((dados.falta / dados.meta) * 100).toFixed(0)}%)
                  </span>
                </div>
              ) : (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-success font-medium">Meta atingida! 🎉</span>
                  <span className="font-semibold text-success">
                    +{formatCurrency(Math.abs(dados.falta))}
                  </span>
                </div>
              )}
            </div>
          )}

          {dados.meta === 0 && (
            <div className="text-sm text-muted-foreground text-center py-2">
              Configure uma meta mensal para acompanhar seu progresso
            </div>
          )}

          {/* Comparativo com Mês Anterior */}
          {dados.comparativoMesAnterior !== 0 && (
            <div className="pt-3 border-t border-border">
              <div className="flex items-center gap-2 text-xs">
                {dados.comparativoMesAnterior > 0 ? (
                  <>
                    <TrendingUp className="h-4 w-4 text-success" />
                    <span className="text-success font-medium">
                      +{dados.comparativoMesAnterior.toFixed(0)}% vs mês anterior
                    </span>
                  </>
                ) : (
                  <>
                    <TrendingDown className="h-4 w-4 text-error" />
                    <span className="text-error font-medium">
                      {dados.comparativoMesAnterior.toFixed(0)}% vs mês anterior
                    </span>
                  </>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal de Detalhamento */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-primary" />
              Detalhamento do Faturamento
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 pt-4">
            {/* Breakdown */}
            <div className="space-y-3">
              <div className="flex items-center justify-between py-2 border-b">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-success" />
                  <span className="text-sm font-medium">Já entregues:</span>
                </div>
                <span className="font-semibold text-success">{formatCurrency(jaEntregues)}</span>
              </div>

              <div className="flex items-center justify-between py-2 border-b">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-primary" />
                  <span className="text-sm font-medium">Confirmadas:</span>
                </div>
                <span className="font-semibold text-primary">{formatCurrency(confirmadas)}</span>
              </div>

              <div className="flex items-center justify-between py-2 border-b">
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-warning" />
                  <span className="text-sm font-medium">Pendentes:</span>
                </div>
                <span className="font-semibold text-warning">{formatCurrency(pendentes)}</span>
              </div>

              {/* Total */}
              <div className="flex items-center justify-between py-3 border-t-2 border-border bg-muted/30 px-3 rounded-lg mt-2">
                <span className="text-base font-bold">TOTAL:</span>
                <span className="text-lg font-bold text-foreground">{formatCurrency(dados.valorAtual)}</span>
              </div>
            </div>

            {/* Métricas adicionais */}
            <div className="grid grid-cols-2 gap-4 pt-4">
              <Card className="bg-secondary/50">
                <CardContent className="p-4">
                  <p className="text-xs text-muted-foreground mb-1">📊 Dias restantes</p>
                  <p className="text-2xl font-bold text-foreground">{diasRestantes}</p>
                  <p className="text-xs text-muted-foreground">dias</p>
                </CardContent>
              </Card>

              <Card className="bg-secondary/50">
                <CardContent className="p-4">
                  <p className="text-xs text-muted-foreground mb-1">📈 Média por dia</p>
                  <p className="text-2xl font-bold text-foreground">
                    {formatCurrency(mediaPorDia).replace('R$', '')}
                  </p>
                  <p className="text-xs text-muted-foreground">por dia</p>
                </CardContent>
              </Card>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
