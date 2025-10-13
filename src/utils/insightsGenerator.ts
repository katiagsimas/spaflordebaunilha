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
  cmvPercentual: number;
  alertaCMV: number;
  pontoEquilibrio: number;
  faturamentoMesAnterior: number;
  projecaoVendas: number;
}

export function gerarInsights(params: GerarInsightsParams): Insight[] {
  const insights: Insight[] = [];
  const {
    metaFaturamentoMensal,
    previsaoFaturamento,
    cmvPercentual,
    alertaCMV,
    pontoEquilibrio,
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

  // Insight 2: CMV
  if (cmvPercentual > 0) {
    if (cmvPercentual > alertaCMV) {
      insights.push({
        type: 'critical',
        text: `CMV em ${cmvPercentual.toFixed(0)}% - revise preços ou reduza custos`,
        icon: XCircle,
      });
    } else if (cmvPercentual > 40) {
      insights.push({
        type: 'warning',
        text: `CMV está em ${cmvPercentual.toFixed(0)}%, considere revisar precificação`,
        icon: AlertTriangle,
      });
    } else if (cmvPercentual < 35) {
      insights.push({
        type: 'success',
        text: `CMV saudável em ${cmvPercentual.toFixed(0)}% - ótima margem!`,
        icon: CheckCircle,
      });
    }
  }

  // Insight 3: Ponto de Equilíbrio
  if (pontoEquilibrio > 0 && previsaoFaturamento >= pontoEquilibrio) {
    const margem = ((previsaoFaturamento / pontoEquilibrio) - 1) * 100;
    insights.push({
      type: 'success',
      text: `Ponto de equilíbrio atingido com ${margem.toFixed(0)}% de margem de segurança`,
      icon: CheckCircle,
    });
  }

  // Insight 4: Tendência
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

  // Insight 5: Projeção
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
