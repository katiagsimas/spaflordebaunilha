import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface IngredienteDia {
  ingrediente_id: string;
  ingrediente_nome: string;
  quantidade_total: number;
  unidade: string;
  estoque_disponivel: number;
  faltam: number;
  tem_suficiente: boolean;
}

export function useIngredientesDia(data?: string) {
  const { user } = useAuth();
  const dataFinal = data || new Date().toISOString().split('T')[0];

  return useQuery({
    queryKey: ['ingredientes-dia', dataFinal],
    queryFn: async () => {
      if (!user) return [];
      
      const { data: result, error } = await supabase.rpc('calcular_ingredientes_dia' as any, {
        p_usuario_id: user.id,
        p_data: dataFinal,
      });
      
      if (error) throw error;
      return (result || []) as unknown as IngredienteDia[];
    },
    enabled: !!user,
    staleTime: 60000,
  });
}
