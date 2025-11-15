import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useUserId } from "./useUserId";

export interface MaoObraHistorico {
  id: string;
  perfil_id: string;
  user_id: string;
  valor_antigo: number | null;
  valor_novo: number | null;
  acao: string;
  registrado_em: string;
  perfil_nome?: string;
}

export function useMaoObraHistorico(perfilId?: string, dataInicio?: string, dataFim?: string) {
  const userId = useUserId();

  const { data: historico = [], isLoading } = useQuery({
    queryKey: ["mao_obra_historico", userId, perfilId, dataInicio, dataFim],
    queryFn: async () => {
      if (!userId) return [];
      
      let query = supabase
        .from("mao_obra_perfis_historico")
        .select(`
          *,
          mao_obra_perfis!inner(nome)
        `)
        .eq("user_id", userId)
        .order("registrado_em", { ascending: false });

      // Filtrar por perfil se especificado
      if (perfilId && perfilId !== "todos") {
        query = query.eq("perfil_id", perfilId);
      }

      // Filtrar por data início
      if (dataInicio) {
        query = query.gte("registrado_em", dataInicio);
      }

      // Filtrar por data fim
      if (dataFim) {
        query = query.lte("registrado_em", dataFim);
      }

      const { data, error } = await query;

      if (error) throw error;

      // Mapear dados incluindo nome do perfil
      return (data || []).map(item => ({
        ...item,
        perfil_nome: (item.mao_obra_perfis as any)?.nome || "Perfil removido"
      })) as MaoObraHistorico[];
    },
    enabled: !!userId,
  });

  return {
    historico,
    isLoading,
  };
}
