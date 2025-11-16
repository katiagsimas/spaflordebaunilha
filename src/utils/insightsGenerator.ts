import { CheckCircle, AlertTriangle, XCircle, Info, TrendingUp, TrendingDown, Target } from "lucide-react";

export type InsightType = "success" | "warning" | "critical" | "info";

export interface Insight {
  type: InsightType;
  text: string;
  icon: typeof CheckCircle;
}

interface GerarInsightsParams {
  metaFaturamentoMensal: number;
  previsaoFaturamento: number;
  faturamentoMesAnterior: number;
  projecaoVendas: number;
}

export function gerarInsights(params: GerarInsightsParams): Insight[] {
  const insights: Insight[] = [];
  const {
    metaFaturamentoMensal,
    previsaoFaturamento,
    faturamentoMesAnterior,
    projecaoVendas,
  } = params;

  // Insight 1: Meta de Faturamento
  if (metaFaturamentoMensal > 0 && previsaoFaturamento > 0) {
    const percentual = ((previsaoFaturamento / metaFaturamentoMensal) - 1) * 100;

    if (percentual >= 10) {
      insights.push({
        type: 'success',
        text: `Você está ${percentual.toFixed(0)}% acima da meta de faturamento!`,
        icon: CheckCircle,
      });
    } else if (percentual < -20) {
      insights.push({
        type: 'critical',
        text: `Vendas ${Math.abs(percentual).toFixed(0)}% abaixo da meta - ação necessária!`,
        icon: XCircle,
      });
    } else if (percentual < 0) {
      const falta = metaFaturamentoMensal - previsaoFaturamento;
      insights.push({
        type: 'warning',
        text: `Faltam R$ ${falta.toFixed(2)} para atingir a meta`,
        icon: AlertTriangle,
      });
    }
  }

  // Insight 2: Tendência
  if (faturamentoMesAnterior > 0 && previsaoFaturamento > 0) {
    const crescimento = ((previsaoFaturamento / faturamentoMesAnterior) - 1) * 100;
    if (crescimento > 0) {
      insights.push({
        type: 'info',
        text: `Vendas cresceram ${crescimento.toFixed(0)}% vs mês passado`,
        icon: TrendingUp,
      });
    } else if (crescimento < -10) {
      insights.push({
        type: 'warning',
        text: `Vendas caíram ${Math.abs(crescimento).toFixed(0)}% vs mês passado`,
        icon: TrendingDown,
      });
    }
  }

  // Insight 3: Projeção
  if (metaFaturamentoMensal > 0 && projecaoVendas > 0) {
    const diferenca = projecaoVendas - metaFaturamentoMensal;
    const percentualMeta = Math.abs(diferenca / metaFaturamentoMensal) * 100;
    
    if (diferenca >= 0 && percentualMeta < 5) {
      insights.push({
        type: 'info',
        text: `No ritmo atual, você vai bater a meta! 🎯`,
        icon: Target,
      });
    }
  }

  return insights;
}
