import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface UseEstoqueProps {
  searchTerm?: string;
  categoriaFiltro?: string;
  statusFiltro?: string;
  tipoFiltro?: string;
}

export const useEstoque = (props?: UseEstoqueProps) => {
  const [items, setItems] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [resumo, setResumo] = useState<any>(null);
  const { toast } = useToast();

  const fetchEstoque = async () => {
    try {
      setIsLoading(true);
      
      // Buscar estoque atual
      let query = supabase
        .from('estoque_atual')
        .select('*');

      // Aplicar filtros
      if (props?.tipoFiltro && props.tipoFiltro !== 'todos') {
        query = query.eq('tipo_item', props.tipoFiltro as 'INSUMO' | 'EMBALAGEM');
      }

      const { data, error } = await query;

      if (error) throw error;

      // Processar dados e aplicar filtros adicionais
      let processedItems = data || [];

      // Filtro de busca
      if (props?.searchTerm) {
        processedItems = processedItems.filter((item: any) =>
          item.nome?.toLowerCase().includes(props.searchTerm!.toLowerCase())
        );
      }

      // Filtro de status
      if (props?.statusFiltro && props.statusFiltro !== 'todos') {
        processedItems = processedItems.filter((item: any) => {
          switch (props.statusFiltro) {
            case 'zerado':
              return item.quantidade_atual === 0;
            case 'baixo':
              return item.quantidade_atual < (item.estoque_minimo || 0);
            case 'atencao':
              return item.quantidade_atual >= (item.estoque_minimo || 0) && 
                     item.quantidade_atual < (item.estoque_minimo || 0) * 1.2;
            case 'ok':
              return item.quantidade_atual >= (item.estoque_minimo || 0) * 1.2;
            default:
              return true;
          }
        });
      }

      // Calcular resumo
      const alertas = processedItems.filter(
        (item: any) => item.quantidade_atual < (item.estoque_minimo || 0)
      ).length;

      const vencendo = 0; // TODO: Implementar quando tiver validades

      const valorTotal = processedItems.reduce(
        (sum: number, item: any) => sum + (item.valor_total || 0), 
        0
      );

      const itensAtivos = processedItems.filter(
        (item: any) => item.quantidade_atual > 0
      ).length;

      setResumo({ alertas, vencendo, valorTotal, itensAtivos });
      setItems(processedItems);
    } catch (error: any) {
      console.error('Erro ao buscar estoque:', error);
      toast({
        title: "Erro ao carregar estoque",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchEstoque();
  }, [props?.searchTerm, props?.categoriaFiltro, props?.statusFiltro, props?.tipoFiltro]);

  return {
    items,
    isLoading,
    refetch: fetchEstoque,
    resumo,
  };
};
