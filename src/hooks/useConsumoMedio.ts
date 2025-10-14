import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface FiltrosConsumo {
  dias: number;
  categoriaId?: string;
  tipoItem?: 'INSUMO' | 'EMBALAGEM' | 'todos';
  mostrar?: 'todos' | 'com_consumo' | 'ativos';
}

interface AnaliseConsumo {
  item: any;
  consumoTotal: number;
  mediaDiaria: number;
  diasParaZerar: number;
  diasAteMinimo: number;
  comprarEm: string;
  valorConsumido: number;
  status: {
    status: string;
    cor: string;
    emoji: string;
    prioridade: number;
  };
  sugestao: {
    comprar: number;
    paraAtingir: number;
    coberturaDias: number;
  };
}

export const useConsumoMedio = (filtros: FiltrosConsumo) => {
  const [analises, setAnalises] = useState<AnaliseConsumo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [resumo, setResumo] = useState<any>(null);
  const { toast } = useToast();

  const calcularStatus = (analise: any, item: any) => {
    if (analise.mediaDiaria === 0) {
      return {
        status: 'BAIXO_USO',
        cor: 'gray',
        emoji: '⚪',
        prioridade: 4,
      };
    }

    if (analise.diasParaZerar <= 3 || item.quantidade_atual < (item.estoque_minimo || 0)) {
      return {
        status: 'URGENTE',
        cor: 'red',
        emoji: '🔴',
        prioridade: 1,
      };
    }

    if (analise.diasParaZerar <= 7) {
      return {
        status: 'EM_BREVE',
        cor: 'yellow',
        emoji: '🟡',
        prioridade: 2,
      };
    }

    return {
      status: 'OK',
      cor: 'green',
      emoji: '🟢',
      prioridade: 3,
    };
  };

  const arredondarParaUnidadePratica = (quantidade: number, unidade: string) => {
    if (unidade === 'kg') {
      return Math.ceil(quantidade / 5) * 5;
    }
    if (unidade === 'un') {
      if (quantidade >= 12) {
        return Math.ceil(quantidade / 12) * 12;
      }
      return Math.ceil(quantidade / 10) * 10;
    }
    return Math.ceil(quantidade);
  };

  const calcularSugestaoCompra = (item: any, analise: any, diasCobertura = 14) => {
    const quantidadeIdeal = analise.mediaDiaria * diasCobertura;
    const quantidadeComprar = Math.max(0, quantidadeIdeal - item.quantidade_atual);
    const quantidadeArredondada = arredondarParaUnidadePratica(quantidadeComprar, item.unidade);

    return {
      comprar: quantidadeArredondada,
      paraAtingir: quantidadeIdeal,
      coberturaDias: diasCobertura,
    };
  };

  const fetchConsumoMedio = async () => {
    try {
      setIsLoading(true);

      const dataInicio = new Date();
      dataInicio.setDate(dataInicio.getDate() - filtros.dias);

      // Buscar estoque atual
      let queryEstoque = supabase.from('estoque_atual').select('*');

      if (filtros.tipoItem && filtros.tipoItem !== 'todos') {
        queryEstoque = queryEstoque.eq('tipo_item', filtros.tipoItem);
      }

      const { data: estoqueData, error: estoqueError } = await queryEstoque;
      if (estoqueError) throw estoqueError;

      const itensEstoque = estoqueData || [];

      // Para cada item, buscar saídas do período
      const analisesPromises = itensEstoque.map(async (item) => {
        const { data: saidas } = await supabase
          .from('movimentacoes_estoque')
          .select('*')
          .eq('item_id', item.item_id)
          .eq('tipo_item', item.tipo_item)
          .eq('tipo', 'SAIDA')
          .gte('data', dataInicio.toISOString().split('T')[0]);

        const consumoTotal = (saidas || []).reduce((sum, s) => sum + Number(s.quantidade), 0);
        const valorConsumido = (saidas || []).reduce((sum, s) => sum + Number(s.custo_total), 0);
        const mediaDiaria = consumoTotal / filtros.dias;

        const diasParaZerar = mediaDiaria > 0 
          ? Number(item.quantidade_atual) / mediaDiaria 
          : Infinity;

        const diasAteMinimo = mediaDiaria > 0
          ? (Number(item.quantidade_atual) - 10) / mediaDiaria
          : Infinity;

        const analiseBase = {
          consumoTotal,
          mediaDiaria,
          diasParaZerar: Math.ceil(diasParaZerar),
          diasAteMinimo: Math.ceil(diasAteMinimo),
          comprarEm: diasAteMinimo <= 0 ? 'HOJE' : `${Math.ceil(diasAteMinimo)} dias`,
          valorConsumido,
        };

        const status = calcularStatus(analiseBase, item);
        const sugestao = calcularSugestaoCompra(item, analiseBase);

        return {
          item,
          ...analiseBase,
          status,
          sugestao,
        };
      });

      const analisesCompletas = await Promise.all(analisesPromises);

      // Aplicar filtros de exibição
      let analisesFiltered = analisesCompletas;

      if (filtros.mostrar === 'com_consumo') {
        analisesFiltered = analisesFiltered.filter(a => a.consumoTotal > 0);
      } else if (filtros.mostrar === 'ativos') {
        analisesFiltered = analisesFiltered.filter(a => a.item.quantidade_atual > 0);
      }

      // Ordenar por prioridade (urgentes primeiro)
      analisesFiltered.sort((a, b) => a.status.prioridade - b.status.prioridade);

      setAnalises(analisesFiltered);

      // Calcular resumo geral
      const maisConsumido = analisesFiltered.reduce((max, a) => 
        a.consumoTotal > (max?.consumoTotal || 0) ? a : max
      , analisesFiltered[0]);

      const consumoTotalGeral = analisesFiltered.reduce((sum, a) => sum + a.consumoTotal, 0);
      const valorTotalConsumido = analisesFiltered.reduce((sum, a) => sum + a.valorConsumido, 0);
      const itensAtencao = analisesFiltered.filter(a => a.diasParaZerar <= 7).length;

      setResumo({
        maisConsumido,
        consumoTotalGeral,
        valorTotalConsumido,
        itensAtencao,
      });

    } catch (error: any) {
      console.error('Erro ao calcular consumo médio:', error);
      toast({
        title: "Erro ao calcular consumo",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchConsumoMedio();
  }, [filtros.dias, filtros.categoriaId, filtros.tipoItem, filtros.mostrar]);

  return {
    analises,
    isLoading,
    refetch: fetchConsumoMedio,
    resumo,
  };
};
