import { useLocalStorage } from "./useLocalStorage";

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

  const [orders] = useLocalStorage<Order[]>("orders", []);

  const formatarMesAno = (mes: number, ano: number): string => {
    return `${meses[mes]}/${ano}`;
  };

  const calcularFaturamentoMes = (mes: number, ano: number): number => {
    return orders
      .filter(order => {
        if (order.status === "Cancelado") return false;
        const deliveryDate = new Date(order.deliveryDate);
        return deliveryDate.getMonth() === mes && deliveryDate.getFullYear() === ano;
      })
      .reduce((acc, order) => acc + order.total, 0);
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
    calcularPrevisaoFaturamentoCompleta,
    calcularCMVGlobal,
    calcularPontoEquilibrio,
    calcularFaturamentoMesAnterior,
    calcularProjecaoVendas,
  };
}
