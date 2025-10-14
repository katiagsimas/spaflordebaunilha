import { useState, useEffect } from "react";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { format, startOfMonth, endOfMonth } from "date-fns";

interface DadosMes {
  mes: number;
  ano: number;
}

interface ComprasMes {
  total: number;
  quantidade: number;
  porCategoria: Record<string, number>;
  maiorCompra: number;
}

interface EstoqueFinal {
  valor: number;
  detalhes: {
    totalItens: number;
    itensAtivos: number;
    itensAbaixoMinimo: number;
    itensVencendo: number;
  };
}

interface Faturamento {
  valor: number;
  pedidos: number;
}

interface Classificacao {
  status: 'EXCELENTE' | 'BOM' | 'ATENÇÃO' | 'CRÍTICO';
  emoji: string;
  cor: string;
  mensagem: string;
}

interface Alerta {
  tipo: 'CRITICO' | 'ATENCAO' | 'INFO' | 'SUCESSO';
  titulo: string;
  mensagem: string;
  icone: string;
}

export interface CMVData {
  estoqueInicial: number;
  compras: ComprasMes;
  estoqueFinal: EstoqueFinal;
  cmv: number;
  faturamento: Faturamento;
  percentualCMV: number;
  margemBruta: number;
  lucroBruto: number;
  classificacao: Classificacao;
  alertas: Alerta[];
}

export const useCMVGlobal = (mesAno: DadosMes) => {
  const [movimentacoes] = useLocalStorage<any[]>("movimentacoes_estoque", []);
  const [estoqueAtual] = useLocalStorage<any[]>("estoque_atual", []);
  const [contasReceber] = useLocalStorage<any[]>("sugarbox_contas_receber", []);
  const [orders] = useLocalStorage<any[]>("orders", []);
  const [isLoading, setIsLoading] = useState(true);
  const [cmvData, setCmvData] = useState<CMVData | null>(null);

  const calcularEstoqueInicial = (mesAno: DadosMes): number => {
    const ultimoDiaMesAnterior = new Date(mesAno.ano, mesAno.mes - 1, 0);
    const dataLimite = format(ultimoDiaMesAnterior, 'yyyy-MM-dd');
    
    let estoqueInicial = 0;
    movimentacoes.forEach(mov => {
      if (mov.data <= dataLimite) {
        if (mov.tipo === 'ENTRADA') {
          estoqueInicial += mov.custo_total || 0;
        } else {
          estoqueInicial -= mov.custo_total || 0;
        }
      }
    });
    
    return Math.max(0, estoqueInicial);
  };

  const calcularComprasMes = (mesAno: DadosMes): ComprasMes => {
    const primeiroDia = new Date(mesAno.ano, mesAno.mes - 1, 1);
    const ultimoDia = new Date(mesAno.ano, mesAno.mes, 0);
    
    const dataInicio = format(primeiroDia, 'yyyy-MM-dd');
    const dataFim = format(ultimoDia, 'yyyy-MM-dd');
    
    const entradas = movimentacoes.filter(m => 
      m.tipo === 'ENTRADA' && 
      m.data >= dataInicio && 
      m.data <= dataFim
    );
    
    const totalCompras = entradas.reduce((sum, e) => sum + (e.custo_total || 0), 0);
    const porCategoria: Record<string, number> = {};
    
    entradas.forEach(entrada => {
      const categoria = entrada.categoria || 'Sem Categoria';
      if (!porCategoria[categoria]) {
        porCategoria[categoria] = 0;
      }
      porCategoria[categoria] += entrada.custo_total || 0;
    });
    
    const maiorCompra = entradas.length > 0 
      ? Math.max(...entradas.map(e => e.custo_total || 0))
      : 0;
    
    return {
      total: totalCompras,
      quantidade: entradas.length,
      porCategoria,
      maiorCompra
    };
  };

  const calcularEstoqueFinal = (mesAno: DadosMes): EstoqueFinal => {
    let valorTotal = 0;
    let itensAtivos = 0;
    let itensAbaixoMinimo = 0;
    
    estoqueAtual.forEach(item => {
      const custoMedio = item.custo_medio || item.custo_unitario || 0;
      valorTotal += (item.quantidade_atual || 0) * custoMedio;
      
      if ((item.quantidade_atual || 0) > 0) {
        itensAtivos++;
      }
      
      if ((item.quantidade_atual || 0) < (item.estoque_minimo || 0)) {
        itensAbaixoMinimo++;
      }
    });
    
    return {
      valor: valorTotal,
      detalhes: {
        totalItens: estoqueAtual.length,
        itensAtivos,
        itensAbaixoMinimo,
        itensVencendo: 0 // TODO: calcular com base nas validades
      }
    };
  };

  const calcularFaturamento = (mesAno: DadosMes): Faturamento => {
    const primeiroDia = new Date(mesAno.ano, mesAno.mes - 1, 1);
    const ultimoDia = new Date(mesAno.ano, mesAno.mes, 0);
    
    const dataInicio = format(primeiroDia, 'yyyy-MM-dd');
    const dataFim = format(ultimoDia, 'yyyy-MM-dd');
    
    const receitasRecebidas = contasReceber.filter(c => 
      c.status === 'recebido' && 
      c.dataRecebimento && 
      c.dataRecebimento >= dataInicio && 
      c.dataRecebimento <= dataFim
    );
    
    const faturamentoBruto = receitasRecebidas.reduce((sum, r) => sum + (r.valor || 0), 0);
    
    const pedidos = orders.filter(o => {
      const deliveryDate = o.deliveryDate ? format(new Date(o.deliveryDate), 'yyyy-MM-dd') : '';
      return deliveryDate >= dataInicio && 
             deliveryDate <= dataFim && 
             o.status !== 'Cancelado';
    }).length;
    
    return {
      valor: faturamentoBruto,
      pedidos
    };
  };

  const classificarCMV = (percentualCMV: number): Classificacao => {
    if (percentualCMV < 30) {
      return {
        status: 'EXCELENTE',
        emoji: '🟢',
        cor: 'green',
        mensagem: 'Parabéns! Seu CMV está EXCELENTE. Continue com a boa gestão de custos e controle de estoque. Sua margem bruta é muito saudável para o negócio.'
      };
    }
    
    if (percentualCMV >= 30 && percentualCMV < 40) {
      return {
        status: 'BOM',
        emoji: '🟡',
        cor: 'yellow',
        mensagem: 'Seu CMV está BOM, dentro da média do mercado. Há espaço para otimização, mas você está no caminho certo.'
      };
    }
    
    if (percentualCMV >= 40 && percentualCMV < 50) {
      return {
        status: 'ATENÇÃO',
        emoji: '🟠',
        cor: 'orange',
        mensagem: 'ATENÇÃO! Seu CMV está acima do ideal. É importante revisar custos e precificação para melhorar a margem.'
      };
    }
    
    return {
      status: 'CRÍTICO',
      emoji: '🔴',
      cor: 'red',
      mensagem: 'CRÍTICO! Seu CMV está muito alto. Ação urgente necessária: revisar precificação, negociar com fornecedores e reduzir desperdícios.'
    };
  };

  const gerarAlertas = (dados: {
    percentualCMV: number;
    estoqueInicial: number;
    estoqueFinal: number;
    compras: number;
  }): Alerta[] => {
    const alertas: Alerta[] = [];
    
    if (dados.percentualCMV > 50) {
      alertas.push({
        tipo: 'CRITICO',
        titulo: 'CMV acima de 50%',
        mensagem: 'Ações recomendadas:\n• Revisar precificação urgentemente\n• Negociar com fornecedores\n• Analisar desperdícios\n• Verificar ficha técnica',
        icone: '🔴'
      });
    }
    
    if (dados.percentualCMV > 40 && dados.percentualCMV <= 50) {
      alertas.push({
        tipo: 'ATENCAO',
        titulo: 'CMV acima do ideal',
        mensagem: 'Recomendamos revisar custos e precificação para melhorar a margem de lucro.',
        icone: '⚠️'
      });
    }
    
    const proporcao = dados.estoqueInicial > 0 
      ? dados.estoqueFinal / dados.estoqueInicial 
      : 0;
    
    if (proporcao > 1.5) {
      alertas.push({
        tipo: 'ATENCAO',
        titulo: 'Estoque final muito alto',
        mensagem: `Estoque final (R$ ${dados.estoqueFinal.toFixed(2)}) é ${(proporcao * 100).toFixed(0)}% do estoque inicial. Risco de perdas por validade. Considere reduzir compras.`,
        icone: '⚠️'
      });
    }
    
    const proporcaoCompras = dados.estoqueInicial > 0 
      ? dados.compras / dados.estoqueInicial 
      : 0;
    
    if (proporcaoCompras < 0.5 && dados.estoqueFinal < dados.estoqueInicial) {
      alertas.push({
        tipo: 'INFO',
        titulo: 'Compras abaixo do normal',
        mensagem: 'As compras deste mês foram menores que o habitual. Verifique se há estoque suficiente para a produção.',
        icone: 'ℹ️'
      });
    }
    
    if (alertas.length === 0) {
      alertas.push({
        tipo: 'SUCESSO',
        titulo: 'Nenhum alerta crítico',
        mensagem: 'Tudo está funcionando bem! Continue com a boa gestão.',
        icone: '✅'
      });
    }
    
    return alertas;
  };

  const calcularCMV = () => {
    setIsLoading(true);
    
    try {
      const estoqueInicial = calcularEstoqueInicial(mesAno);
      const compras = calcularComprasMes(mesAno);
      const estoqueFinal = calcularEstoqueFinal(mesAno);
      const faturamento = calcularFaturamento(mesAno);
      
      const cmv = estoqueInicial + compras.total - estoqueFinal.valor;
      
      const percentualCMV = faturamento.valor > 0 
        ? (cmv / faturamento.valor) * 100 
        : 0;
      
      const margemBruta = 100 - percentualCMV;
      const lucroBruto = faturamento.valor - cmv;
      
      const classificacao = classificarCMV(percentualCMV);
      const alertas = gerarAlertas({
        percentualCMV,
        estoqueInicial,
        estoqueFinal: estoqueFinal.valor,
        compras: compras.total
      });
      
      setCmvData({
        estoqueInicial,
        compras,
        estoqueFinal,
        cmv,
        faturamento,
        percentualCMV,
        margemBruta,
        lucroBruto,
        classificacao,
        alertas
      });
    } catch (error) {
      console.error('Erro ao calcular CMV:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    calcularCMV();
  }, [mesAno.mes, mesAno.ano, movimentacoes, estoqueAtual, contasReceber, orders]);

  return {
    cmvData,
    isLoading,
    refetch: calcularCMV
  };
};
