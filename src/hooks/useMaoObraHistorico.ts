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

export function useMaoObraHistorico(perfilId?: string, dataInicial?: string, dataFinal?: string) {
  const userId = useUserId();

  const { data: historico = [], isLoading } = useQuery({
    queryKey: ["mao_obra_historico", userId, perfilId, dataInicial, dataFinal],
    queryFn: async () => {
      if (!userId) return [];
      
      let query = supabase
        .from("mao_obra_perfis_historico")
        .select("*, mao_obra_perfis!inner(nome)")
        .eq("user_id", userId)
        .order("registrado_em", { ascending: false });

      if (perfilId) {
        query = query.eq("perfil_id", perfilId);
      }

      if (dataInicial) {
        query = query.gte("registrado_em", dataInicial);
      }

      if (dataFinal) {
        query = query.lte("registrado_em", dataFinal + "T23:59:59");
      }

      const { data, error } = await query;

      if (error) {
        console.error("Erro ao buscar histórico:", error);
        throw error;
      }
      
      return (data || []).map((item: any) => ({
        id: item.id,
        perfil_id: item.perfil_id,
        user_id: item.user_id,
        valor_antigo: item.valor_antigo,
        valor_novo: item.valor_novo,
        acao: item.acao,
        registrado_em: item.registrado_em,
        perfil_nome: item.mao_obra_perfis?.nome || "Perfil removido"
      })) as MaoObraHistorico[];
    },
    enabled: !!userId,
  });

  return {
    historico,
    isLoading,
  };
}
