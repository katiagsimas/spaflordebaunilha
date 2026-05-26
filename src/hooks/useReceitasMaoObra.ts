import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useUserId } from "./useUserId";
import { toast } from "sonner";

export interface ReceitaMaoObra {
  id: string;
  receita_id: string;
  perfil_id: string | null;
  usar_valor_padrao: boolean;
  horas: number;
}

export function useReceitasMaoObra(receitaId?: string) {
  const userId = useUserId();
  const queryClient = useQueryClient();

  const { data: maosObra = [], isLoading } = useQuery({
    queryKey: ["receitas_mao_obra", receitaId, userId],
    queryFn: async () => {
      if (!receitaId || !userId) return [];

      const { data, error } = await supabase
        .from("receitas_mao_obra")
        .select("id, receita_id, perfil_id, usar_valor_padrao, horas, receitas!inner(usuario_id)")
        .eq("receita_id", receitaId)
        .eq("receitas.usuario_id", userId);

      if (error) throw error;
      return (data ?? []).map(({ receitas, ...rest }: any) => rest) as ReceitaMaoObra[];
    },
    enabled: !!receitaId && !!userId,
  });

  const salvarMaosObra = useMutation({
    mutationFn: async ({ receitaId, maosObra }: { receitaId: string; maosObra: Omit<ReceitaMaoObra, "id" | "receita_id">[] }) => {
      // Primeiro, deletar todas as linhas antigas
      const { error: deleteError } = await supabase
        .from("receitas_mao_obra")
        .delete()
        .eq("receita_id", receitaId);

      if (deleteError) throw deleteError;

      // Depois, inserir as novas linhas
      if (maosObra.length > 0) {
        const { error: insertError } = await supabase
          .from("receitas_mao_obra")
          .insert(
            maosObra.map(mo => ({
              receita_id: receitaId,
              perfil_id: mo.perfil_id,
              usar_valor_padrao: mo.usar_valor_padrao,
              horas: mo.horas,
            }))
          );

        if (insertError) throw insertError;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["receitas_mao_obra"] });
      queryClient.invalidateQueries({ queryKey: ["calculos_receitas"] });
      toast.success("Mão de obra salva com sucesso!");
    },
    onError: (error) => {
      console.error("Erro ao salvar mãos de obra:", error);
      toast.error("Erro ao salvar mãos de obra da receita");
    },
  });

  return {
    maosObra,
    isLoading,
    salvarMaosObra: salvarMaosObra.mutateAsync,
  };
}
