import { DollarSign, Info, TrendingUp, TrendingDown } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { type PrevisaoFaturamento } from "@/hooks/usePlanejamento";
import { cn } from "@/lib/utils";

interface PrevisaoFaturamentoCardProps {
  dados: PrevisaoFaturamento;
}

export function PrevisaoFaturamentoCard({ dados }: PrevisaoFaturamentoCardProps) {
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
    <Card
      className={cn(
        "transition-all duration-300 hover:-translate-y-1 hover:shadow-elevated border-l-4",
        getBorderColor()
      )}
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
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger>
                <Info className="h-4 w-4 text-muted-foreground" />
              </TooltipTrigger>
              <TooltipContent>
                <p className="max-w-xs text-sm">
                  Previsão calculada com base nas encomendas confirmadas do mês atual
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
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
  );
}
