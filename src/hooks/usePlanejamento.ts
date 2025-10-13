import { useLocalStorage } from "./useLocalStorage";

export interface ConfiguracaoPlanejamento {
  metaFaturamentoMensal: number;
  metaFaturamentoAnual: number;
  alertaCMV: number;
  custoFixoMensal: number;
}

export interface DadosCMV {
  mes: string;
  estoqueInicial: number;
  compras: number;
  estoqueFinal: number;
  custoMensal: number;
  faturamento: number;
  cmvPercentual: number;
}

const meses = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
];

export function usePlanejamento() {
  const [config] = useLocalStorage<ConfiguracaoPlanejamento>("configuracaoPlanejamento", {
    metaFaturamentoMensal: 10000,
    metaFaturamentoAnual: 120000,
    alertaCMV: 50,
    custoFixoMensal: 2000,
  });

  const [dadosCMV] = useLocalStorage<DadosCMV[]>("cmvData", 
    meses.map(mes => ({
      mes,
      estoqueInicial: 0,
      compras: 0,
      estoqueFinal: 0,
      custoMensal: 0,
      faturamento: 0,
      cmvPercentual: 0,
    }))
  );

  const calcularPrevisaoFaturamento = (): number => {
    const mesAtual = new Date().getMonth();
    const dadosMesAtual = dadosCMV[mesAtual];
    return dadosMesAtual?.faturamento || 0;
  };

  const calcularCMVGlobal = (): { cmv: number; custoTotal: number; faturamentoTotal: number } => {
    const mesAtual = new Date().getMonth();
    const dadosMesAtual = dadosCMV[mesAtual];
    
    return {
      cmv: dadosMesAtual?.cmvPercentual || 0,
      custoTotal: dadosMesAtual?.custoMensal || 0,
      faturamentoTotal: dadosMesAtual?.faturamento || 0,
    };
  };

  const calcularPontoEquilibrio = (): { valor: number; alcancado: boolean } => {
    const cmv = calcularCMVGlobal();
    const margemContribuicao = 1 - (cmv.cmv / 100);
    
    if (margemContribuicao <= 0) {
      return { valor: Infinity, alcancado: false };
    }
    
    const pontoEquilibrio = config.custoFixoMensal / margemContribuicao;
    const previsao = calcularPrevisaoFaturamento();
    
    return {
      valor: pontoEquilibrio,
      alcancado: previsao >= pontoEquilibrio,
    };
  };

  const calcularFaturamentoMesAnterior = (): number => {
    const mesAtual = new Date().getMonth();
    const mesAnterior = mesAtual === 0 ? 11 : mesAtual - 1;
    return dadosCMV[mesAnterior]?.faturamento || 0;
  };

  const calcularProjecaoVendas = (): { projecao: number; tendencia: 'crescimento' | 'estavel' | 'queda' } => {
    const mesAtual = new Date().getMonth();
    const ultimosTresMeses = [mesAtual - 2, mesAtual - 1, mesAtual].map(i => {
      const idx = i < 0 ? 12 + i : i;
      return dadosCMV[idx]?.faturamento || 0;
    });
    
    const media = ultimosTresMeses.reduce((a, b) => a + b, 0) / 3;
    const crescimento = ultimosTresMeses[2] - ultimosTresMeses[0];
    
    let tendencia: 'crescimento' | 'estavel' | 'queda' = 'estavel';
    if (crescimento > media * 0.1) tendencia = 'crescimento';
    else if (crescimento < -media * 0.1) tendencia = 'queda';
    
    return {
      projecao: media,
      tendencia,
    };
  };

  return {
    config,
    calcularPrevisaoFaturamento,
    calcularCMVGlobal,
    calcularPontoEquilibrio,
    calcularFaturamentoMesAnterior,
    calcularProjecaoVendas,
  };
}
