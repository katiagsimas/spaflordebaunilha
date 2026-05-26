import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useUserId } from "./useUserId";
import { toast } from "sonner";

export interface MaoObraPerfil {
  id: string;
  user_id: string;
  nome: string;
  valor_hora: number;
  ativo: boolean;
  padrao: boolean;
  criado_em: string;
  atualizado_em: string;
}

export function useMaoObraPerfis() {
  const userId = useUserId();
  const queryClient = useQueryClient();

  const { data: perfis = [], isLoading } = useQuery({
    queryKey: ["mao_obra_perfis", userId],
    queryFn: async () => {
      if (!userId) return [];
      
      const { data, error } = await supabase
        .from("mao_obra_perfis")
        .select("*")
        .eq("user_id", userId)
        .order("padrao", { ascending: false })
        .order("nome");

      if (error) throw error;
      return data as MaoObraPerfil[];
    },
    enabled: !!userId,
  });

  const perfilPadrao = perfis.find(p => p.padrao);

  const createPerfil = useMutation({
    mutationFn: async (data: Omit<MaoObraPerfil, "id" | "user_id" | "criado_em" | "atualizado_em">) => {
      if (!userId) throw new Error("User not authenticated");

      // Se é o primeiro perfil, forçar como padrão
      const isFirstPerfil = perfis.length === 0;
      
      const { data: newPerfil, error } = await supabase
        .from("mao_obra_perfis")
        .insert({
          user_id: userId,
          ...data,
          padrao: isFirstPerfil ? true : data.padrao,
        })
        .select()
        .single();

      if (error) throw error;
      return newPerfil;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["mao_obra_perfis"] });
      toast.success("Perfil de mão de obra criado com sucesso!");
    },
    onError: (error) => {
      console.error("Erro ao criar perfil:", error);
      toast.error("Erro ao criar perfil de mão de obra");
    },
  });

  const updatePerfil = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<MaoObraPerfil> & { id: string }) => {
      const { data, error } = await supabase
        .from("mao_obra_perfis")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["mao_obra_perfis"] });
      queryClient.invalidateQueries({ queryKey: ["calculos_receitas"] });
      toast.success("Perfil atualizado com sucesso!");
    },
    onError: (error) => {
      console.error("Erro ao atualizar perfil:", error);
      toast.error("Erro ao atualizar perfil");
    },
  });

  const deletePerfil = useMutation({
    mutationFn: async (id: string) => {
      // Verificar se o perfil está vinculado a alguma receita
      const { count, error: checkError } = await supabase
        .from("receitas_mao_obra")
        .select("id", { count: "exact", head: true })
        .eq("perfil_id", id);

      if (checkError) throw checkError;

      if (count && count > 0) {
        throw new Error(
          `Este perfil está vinculado a ${count} receita(s). Remova o vínculo antes de excluir.`
        );
      }

      const { error } = await supabase
        .from("mao_obra_perfis")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["mao_obra_perfis"] });
      toast.success("Perfil removido com sucesso!");
    },
    onError: (error: Error) => {
      console.error("Erro ao remover perfil:", error);
      toast.error(error.message || "Erro ao remover perfil");
    },
  });

  return {
    perfis,
    perfilPadrao,
    isLoading,
    createPerfil: createPerfil.mutate,
    updatePerfil: updatePerfil.mutate,
    deletePerfil: deletePerfil.mutate,
  };
}
