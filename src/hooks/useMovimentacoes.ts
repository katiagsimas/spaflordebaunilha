import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface FiltrosMovimentacoes {
  dataInicio: Date;
  dataFim: Date;
  itemId?: string;
  categoriaId?: string;
  tipo?: 'ENTRADA' | 'SAIDA' | 'todos';
  tipoItem?: 'INSUMO' | 'EMBALAGEM' | 'todos';
  motivo?: string;
}

export const useMovimentacoes = (filtros: FiltrosMovimentacoes) => {
  const [movimentacoes, setMovimentacoes] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [resumo, setResumo] = useState<any>(null);
  const { toast } = useToast();

  const fetchMovimentacoes = async () => {
    try {
      setIsLoading(true);
      
      let query = supabase
        .from('movimentacoes_estoque')
        .select('*')
        .gte('data', filtros.dataInicio.toISOString().split('T')[0])
        .lte('data', filtros.dataFim.toISOString().split('T')[0])
        .order('data', { ascending: false })
        .order('created_at', { ascending: false });

      if (filtros.itemId) {
        query = query.eq('item_id', filtros.itemId);
      }

      if (filtros.tipo && filtros.tipo !== 'todos') {
        query = query.eq('tipo', filtros.tipo);
      }

      if (filtros.tipoItem && filtros.tipoItem !== 'todos') {
        query = query.eq('tipo_item', filtros.tipoItem);
      }

      if (filtros.motivo && filtros.motivo !== 'todos') {
        query = query.eq('motivo', filtros.motivo);
      }

      const { data, error } = await query;

      if (error) throw error;

      const movimentacoesProcessadas = data || [];
      
      // Calcular resumo
      const entradas = movimentacoesProcessadas.filter(m => m.tipo === 'ENTRADA');
      const saidas = movimentacoesProcessadas.filter(m => m.tipo === 'SAIDA');

      const totalEntradas = entradas.reduce((sum, m) => sum + Number(m.custo_total), 0);
      const totalSaidas = saidas.reduce((sum, m) => sum + Number(m.custo_total), 0);

      setResumo({
        totalEntradas: {
          valor: totalEntradas,
          quantidade: entradas.length,
        },
        totalSaidas: {
          valor: totalSaidas,
          quantidade: saidas.length,
        },
        saldo: totalEntradas - totalSaidas,
        totalMovimentacoes: movimentacoesProcessadas.length,
      });

      setMovimentacoes(movimentacoesProcessadas);
    } catch (error: any) {
      console.error('Erro ao buscar movimentações:', error);
      toast({
        title: "Erro ao carregar movimentações",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMovimentacoes();
  }, [
    filtros.dataInicio,
    filtros.dataFim,
    filtros.itemId,
    filtros.categoriaId,
    filtros.tipo,
    filtros.tipoItem,
    filtros.motivo,
  ]);

  return {
    movimentacoes,
    isLoading,
    refetch: fetchMovimentacoes,
    resumo,
  };
};
