import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

export interface MaoDeObra {
  id: string;
  user_id: string;
  nome: string;
  valor_hora: number;
  descricao?: string;
  cor: string;
  ativo: boolean;
  padrao: boolean;
  created_at: string;
  updated_at: string;
}

export function useMaoObra() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: valores = [], isLoading } = useQuery({
    queryKey: ["mao-obra", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const { data, error } = await supabase
        .from("configuracao_mao_obra")
        .select("*")
        .eq("user_id", user.id)
        .order("padrao", { ascending: false })
        .order("nome");

      if (error) throw error;
      return data as MaoDeObra[];
    },
    enabled: !!user?.id,
  });

  const createMutation = useMutation({
    mutationFn: async (data: Omit<MaoDeObra, "id" | "user_id" | "created_at" | "updated_at">) => {
      if (!user?.id) throw new Error("Usuário não autenticado");

      // Se está marcando como padrão, remove o padrão dos outros
      if (data.padrao) {
        await supabase
          .from("configuracao_mao_obra")
          .update({ padrao: false })
          .eq("user_id", user.id);
      }

      const { data: newData, error } = await supabase
        .from("configuracao_mao_obra")
        .insert({
          ...data,
          user_id: user.id,
        })
        .select()
        .single();

      if (error) throw error;
      return newData;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["mao-obra"] });
      toast({
        title: "Sucesso!",
        description: "Valor de mão de obra cadastrado com sucesso",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao cadastrar",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, ...data }: Partial<MaoDeObra> & { id: string }) => {
      if (!user?.id) throw new Error("Usuário não autenticado");

      // Se está marcando como padrão, remove o padrão dos outros
      if (data.padrao) {
        await supabase
          .from("configuracao_mao_obra")
          .update({ padrao: false })
          .eq("user_id", user.id)
          .neq("id", id);
      }

      const { data: updatedData, error } = await supabase
        .from("configuracao_mao_obra")
        .update(data)
        .eq("id", id)
        .eq("user_id", user.id)
        .select()
        .single();

      if (error) throw error;
      return updatedData;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["mao-obra"] });
      toast({
        title: "Atualizado!",
        description: "Valor de mão de obra atualizado com sucesso",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao atualizar",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      if (!user?.id) throw new Error("Usuário não autenticado");

      // Verificar se está em uso
      const { count } = await supabase
        .from("receitas")
        .select("id", { count: "exact", head: true })
        .eq("tipo_mao_obra_id", id);

      if (count && count > 0) {
        throw new Error(`Este valor está sendo usado em ${count} receita(s). Desative ao invés de excluir.`);
      }

      const { error } = await supabase
        .from("configuracao_mao_obra")
        .delete()
        .eq("id", id)
        .eq("user_id", user.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["mao-obra"] });
      toast({
        title: "Excluído!",
        description: "Valor de mão de obra excluído com sucesso",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao excluir",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return {
    valores,
    isLoading,
    createMaoObra: createMutation.mutate,
    updateMaoObra: updateMutation.mutate,
    deleteMaoObra: deleteMutation.mutate,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
}
