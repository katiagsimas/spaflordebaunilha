import { useUserProfile } from "./useUserProfile";
import { useEncomendas } from "./useEncomendas";
import { useCMVMensal } from "./useCMVMensal";

export type StatusPrevisao = 'sucesso' | 'atencao' | 'critico' | 'sem_meta';

export interface ConfiguracaoPlanejamento {
  metaFaturamentoMensal: number;
  metaFaturamentoAnual: number;
  alertaCMV: number;
  custoFixoMensal: number;
}

export interface PrevisaoFaturamento {
  mesAtual: string;
  valorAtual: number;
  meta: number;
  percentualMeta: number;
  falta: number;
  comparativoMesAnterior: number;
  status: StatusPrevisao;
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
  const { profile } = useUserProfile();
  const { encomendas } = useEncomendas();
  const { dados: dadosCMV } = useCMVMensal();

  const config: ConfiguracaoPlanejamento = {
    metaFaturamentoMensal: profile?.meta_faturamento_mensal || 10000,
    metaFaturamentoAnual: profile?.meta_faturamento_anual || 120000,
    alertaCMV: profile?.alerta_cmv || 50,
    custoFixoMensal: profile?.custo_fixo_mensal || 2000,
  };

  const formatarMesAno = (mes: number, ano: number): string => {
    return `${meses[mes]}/${ano}`;
  };

  const calcularFaturamentoMes = (mes: number, ano: number): number => {
    return encomendas
      .filter(order => {
        if (order.status === "cancelado") return false;
        const deliveryDate = new Date(order.data_entrega);
        return deliveryDate.getMonth() === mes && deliveryDate.getFullYear() === ano;
      })
      .reduce((acc, order) => acc + order.valor, 0);
  };

  const calcularPrevisaoFaturamentoCompleta = (): PrevisaoFaturamento => {
    const hoje = new Date();
    const mesAtual = hoje.getMonth();
    const anoAtual = hoje.getFullYear();

    const valorAtual = calcularFaturamentoMes(mesAtual, anoAtual);
    const meta = config.metaFaturamentoMensal;
    const percentualMeta = meta > 0 ? (valorAtual / meta) * 100 : 0;
    const falta = meta - valorAtual;

    const mesAnterior = mesAtual === 0 ? 11 : mesAtual - 1;
    const anoAnterior = mesAtual === 0 ? anoAtual - 1 : anoAtual;
    const faturamentoMesAnterior = calcularFaturamentoMes(mesAnterior, anoAnterior);
    const comparativo = faturamentoMesAnterior > 0 
      ? ((valorAtual / faturamentoMesAnterior) - 1) * 100 
      : 0;

    let status: StatusPrevisao;
    if (meta === 0) {
      status = 'sem_meta';
    } else if (percentualMeta >= 90) {
      status = 'sucesso';
    } else if (percentualMeta >= 70) {
      status = 'atencao';
    } else {
      status = 'critico';
    }

    return {
      mesAtual: formatarMesAno(mesAtual, anoAtual),
      valorAtual,
      meta,
      percentualMeta,
      falta,
      comparativoMesAnterior: comparativo,
      status,
    };
  };

  const calcularPrevisaoFaturamento = (): number => {
    const mesAtual = new Date().getMonth();
    const dadosMesAtual = dadosCMV.find(d => parseInt(d.mes.toString()) === mesAtual + 1);
    return dadosMesAtual?.faturamento || 0;
  };

  const calcularCMVGlobal = (): { cmv: number; custoTotal: number; faturamentoTotal: number } => {
    const mesAtual = new Date().getMonth();
    const dadosMesAtual = dadosCMV.find(d => parseInt(d.mes.toString()) === mesAtual + 1);
    
    if (!dadosMesAtual) {
      return { cmv: 0, custoTotal: 0, faturamentoTotal: 0 };
    }
    
    const cmvPercentual = dadosMesAtual.faturamento > 0 
      ? ((dadosMesAtual.estoque_inicial + dadosMesAtual.compras - dadosMesAtual.estoque_final) / dadosMesAtual.faturamento) * 100
      : 0;
    
    return {
      cmv: cmvPercentual,
      custoTotal: dadosMesAtual.estoque_inicial + dadosMesAtual.compras - dadosMesAtual.estoque_final,
      faturamentoTotal: dadosMesAtual.faturamento,
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
    const mesAnterior = mesAtual === 0 ? 12 : mesAtual;
    const dadosMesAnterior = dadosCMV.find(d => parseInt(d.mes.toString()) === mesAnterior);
    return dadosMesAnterior?.faturamento || 0;
  };

  const calcularProjecaoVendas = (): { projecao: number; tendencia: 'crescimento' | 'estavel' | 'queda' } => {
    const mesAtual = new Date().getMonth() + 1;
    const ultimosTresMeses = [mesAtual - 2, mesAtual - 1, mesAtual].map(m => {
      const mes = m <= 0 ? 12 + m : m;
      const dadosMes = dadosCMV.find(d => parseInt(d.mes.toString()) === mes);
      return dadosMes?.faturamento || 0;
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
    calcularPrevisaoFaturamentoCompleta,
    calcularCMVGlobal,
    calcularPontoEquilibrio,
    calcularFaturamentoMesAnterior,
    calcularProjecaoVendas,
  };
}
