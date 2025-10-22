import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useUserId } from "./useUserId";
import { toast } from "sonner";

export interface ProducaoTarefa {
  id: string;
  usuario_id: string;
  descricao: string;
  concluida: boolean;
  data: string;
  created_at: string;
  updated_at: string;
}

export function useProducaoTarefas() {
  const userId = useUserId();
  const queryClient = useQueryClient();

  const { data: tarefas = [], isLoading } = useQuery({
    queryKey: ["producao_tarefas", userId],
    queryFn: async () => {
      if (!userId) return [];
      
      const { data, error } = await supabase
        .from("producao_tarefas")
        .select("*")
        .eq("usuario_id", userId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as ProducaoTarefa[];
    },
    enabled: !!userId,
  });

  const createTarefa = useMutation({
    mutationFn: async (tarefa: { descricao: string; data?: string }) => {
      if (!userId) throw new Error("User not authenticated");

      const { data, error } = await supabase
        .from("producao_tarefas")
        .insert({
          usuario_id: userId,
          descricao: tarefa.descricao,
          data: tarefa.data || new Date().toISOString().split('T')[0],
          concluida: false,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["producao_tarefas"] });
      toast.success("✓ Tarefa adicionada");
    },
    onError: (error) => {
      console.error("Erro ao criar tarefa:", error);
      toast.error("Erro ao adicionar tarefa");
    },
  });

  const updateTarefa = useMutation({
    mutationFn: async ({
      id,
      updates,
    }: {
      id: string;
      updates: Partial<ProducaoTarefa>;
    }) => {
      const { data, error } = await supabase
        .from("producao_tarefas")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["producao_tarefas"] });
    },
    onError: (error) => {
      console.error("Erro ao atualizar tarefa:", error);
      toast.error("Erro ao atualizar tarefa");
    },
  });

  const deleteTarefa = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("producao_tarefas")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["producao_tarefas"] });
      toast.success("Tarefa removida");
    },
    onError: (error) => {
      console.error("Erro ao deletar tarefa:", error);
      toast.error("Erro ao remover tarefa");
    },
  });

  const deleteCompletedTarefas = useMutation({
    mutationFn: async () => {
      if (!userId) throw new Error("User not authenticated");

      const { error } = await supabase
        .from("producao_tarefas")
        .delete()
        .eq("usuario_id", userId)
        .eq("concluida", true);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["producao_tarefas"] });
      toast.success("Tarefas concluídas removidas");
    },
    onError: (error) => {
      console.error("Erro ao limpar tarefas:", error);
      toast.error("Erro ao limpar tarefas concluídas");
    },
  });

  return {
    tarefas,
    isLoading,
    createTarefa: createTarefa.mutate,
    updateTarefa: updateTarefa.mutate,
    deleteTarefa: deleteTarefa.mutate,
    deleteCompletedTarefas: deleteCompletedTarefas.mutate,
  };
}
