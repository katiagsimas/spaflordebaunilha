import { useState, useEffect } from "react";
import { format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

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
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [cmvData, setCmvData] = useState<CMVData | null>(null);

  const calcularCMV = async () => {
    if (!user) return;
    
    setIsLoading(true);
    
    try {
      const primeiroDia = new Date(mesAno.ano, mesAno.mes - 1, 1);
      const ultimoDia = new Date(mesAno.ano, mesAno.mes, 0);
      const ultimoDiaMesAnterior = new Date(mesAno.ano, mesAno.mes - 1, 0);
      
      const dataInicio = format(primeiroDia, 'yyyy-MM-dd');
      const dataFim = format(ultimoDia, 'yyyy-MM-dd');
      const dataLimiteMesAnterior = format(ultimoDiaMesAnterior, 'yyyy-MM-dd');
      
      // Buscar movimentações de estoque
      const { data: movimentacoes } = await supabase
        .from('movimentacoes_estoque')
        .select('*')
        .eq('usuario_id', user.id);
      
      // Buscar estoque atual
      const { data: estoqueAtual } = await supabase
        .from('estoque_atual')
        .select('*')
        .eq('usuario_id', user.id);
      
      // Buscar encomendas
      const { data: encomendas } = await supabase
        .from('encomendas')
        .select('*')
        .eq('usuario_id', user.id)
        .gte('data_entrega', dataInicio)
        .lte('data_entrega', dataFim)
        .neq('status', 'cancelado');

      // Calcular estoque inicial
      let estoqueInicial = 0;
      movimentacoes?.forEach(mov => {
        if (mov.data <= dataLimiteMesAnterior) {
          if (mov.tipo === 'ENTRADA') {
            estoqueInicial += mov.custo_total || 0;
          } else {
            estoqueInicial -= mov.custo_total || 0;
          }
        }
      });
      estoqueInicial = Math.max(0, estoqueInicial);
      
      // Calcular compras do mês
      const entradas = movimentacoes?.filter(m => 
        m.tipo === 'ENTRADA' && 
        m.data >= dataInicio && 
        m.data <= dataFim
      ) || [];
      
      const totalCompras = entradas.reduce((sum, e) => sum + (e.custo_total || 0), 0);
      const porCategoria: Record<string, number> = {};
      
      entradas.forEach(entrada => {
        const categoria = 'Sem Categoria'; // TODO: adicionar categoria às movimentações
        if (!porCategoria[categoria]) {
          porCategoria[categoria] = 0;
        }
        porCategoria[categoria] += entrada.custo_total || 0;
      });
      
      const maiorCompra = entradas.length > 0 
        ? Math.max(...entradas.map(e => e.custo_total || 0))
        : 0;
      
      const compras: ComprasMes = {
        total: totalCompras,
        quantidade: entradas.length,
        porCategoria,
        maiorCompra
      };
      
      // Calcular estoque final
      let valorTotal = 0;
      let itensAtivos = 0;
      let itensAbaixoMinimo = 0;
      
      estoqueAtual?.forEach(item => {
        const custoMedio = item.custo_medio || 0;
        valorTotal += (item.quantidade_atual || 0) * custoMedio;
        
        if ((item.quantidade_atual || 0) > 0) {
          itensAtivos++;
        }
        
        // TODO: implementar estoque mínimo
        // if ((item.quantidade_atual || 0) < (item.estoque_minimo || 0)) {
        //   itensAbaixoMinimo++;
        // }
      });
      
      const estoqueFinal: EstoqueFinal = {
        valor: valorTotal,
        detalhes: {
          totalItens: estoqueAtual?.length || 0,
          itensAtivos,
          itensAbaixoMinimo,
          itensVencendo: 0
        }
      };
      
      // Calcular faturamento
      const faturamentoBruto = encomendas?.reduce((sum, e) => sum + (e.valor || 0), 0) || 0;
      const faturamento: Faturamento = {
        valor: faturamentoBruto,
        pedidos: encomendas?.length || 0
      };
      
      // Calcular CMV
      const cmv = estoqueInicial + compras.total - estoqueFinal.valor;
      const percentualCMV = faturamento.valor > 0 ? (cmv / faturamento.valor) * 100 : 0;
      const margemBruta = 100 - percentualCMV;
      const lucroBruto = faturamento.valor - cmv;
      
      // Classificar CMV
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

  useEffect(() => {
    calcularCMV();
  }, [mesAno.mes, mesAno.ano, user]);

  return {
    cmvData,
    isLoading,
    refetch: calcularCMV
  };
};
