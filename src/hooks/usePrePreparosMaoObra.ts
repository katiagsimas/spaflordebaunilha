import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useUserId } from "./useUserId";
import { toast } from "sonner";

export interface PrePreparoMaoObra {
  id: string;
  pre_preparo_id: string;
  perfil_id: string | null;
  usar_valor_padrao: boolean;
  horas: number;
}

export function usePrePreparosMaoObra(prePreparoId?: string) {
  const userId = useUserId();
  const queryClient = useQueryClient();

  const { data: maosObra = [], isLoading } = useQuery({
    queryKey: ["pre_preparos_mao_obra", prePreparoId, userId],
    queryFn: async () => {
      if (!prePreparoId) return [];
      
      const { data, error } = await supabase
        .from("pre_preparos_mao_obra")
        .select("*")
        .eq("pre_preparo_id", prePreparoId);

      if (error) throw error;
      return data as PrePreparoMaoObra[];
    },
    enabled: !!prePreparoId && !!userId,
  });

  const salvarMaosObra = useMutation({
    mutationFn: async ({ prePreparoId, maosObra }: { prePreparoId: string; maosObra: Omit<PrePreparoMaoObra, "id" | "pre_preparo_id">[] }) => {
      // Primeiro, deletar todas as linhas antigas
      const { error: deleteError } = await supabase
        .from("pre_preparos_mao_obra")
        .delete()
        .eq("pre_preparo_id", prePreparoId);

      if (deleteError) throw deleteError;

      // Depois, inserir as novas linhas
      if (maosObra.length > 0) {
        const { error: insertError } = await supabase
          .from("pre_preparos_mao_obra")
          .insert(
            maosObra.map(mo => ({
              pre_preparo_id: prePreparoId,
              perfil_id: mo.perfil_id,
              usar_valor_padrao: mo.usar_valor_padrao,
              horas: mo.horas,
            }))
          );

        if (insertError) throw insertError;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pre_preparos_mao_obra"] });
    },
    onError: (error) => {
      console.error("Erro ao salvar mãos de obra:", error);
      toast.error("Erro ao salvar mãos de obra do pré-preparo");
    },
  });

  return {
    maosObra,
    isLoading,
    salvarMaosObra: salvarMaosObra.mutateAsync,
  };
}
