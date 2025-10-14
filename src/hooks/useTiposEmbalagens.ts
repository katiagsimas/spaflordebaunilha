import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface TipoEmbalagem {
  id: string;
  codigo: number;
  descricao: string;
  quantidade_embalagem: number;
  unidade_medida_id: string;
  usuario_id: string;
  created_at: string;
  updated_at: string;
}

export const useTiposEmbalagens = () => {
  const queryClient = useQueryClient();

  const { data: tiposEmbalagens = [], isLoading } = useQuery({
    queryKey: ["tipos-embalagens"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tipos_embalagens")
        .select("*")
        .order("descricao", { ascending: true });

      if (error) throw error;
      return data as TipoEmbalagem[];
    },
  });

  const createTipoEmbalagem = useMutation({
    mutationFn: async (newTipo: Omit<TipoEmbalagem, "id" | "codigo" | "usuario_id" | "created_at" | "updated_at">) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      const { data, error } = await supabase
        .from("tipos_embalagens")
        .insert([{ ...newTipo, usuario_id: user.id }])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tipos-embalagens"] });
      toast.success("Tipo de embalagem criado com sucesso!");
    },
    onError: (error) => {
      toast.error("Erro ao criar tipo de embalagem: " + error.message);
    },
  });

  const updateTipoEmbalagem = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<TipoEmbalagem> & { id: string }) => {
      const { data, error } = await supabase
        .from("tipos_embalagens")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tipos-embalagens"] });
      toast.success("Tipo de embalagem atualizado com sucesso!");
    },
    onError: (error) => {
      toast.error("Erro ao atualizar tipo de embalagem: " + error.message);
    },
  });

  const deleteTipoEmbalagem = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("tipos_embalagens")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tipos-embalagens"] });
      toast.success("Tipo de embalagem excluído com sucesso!");
    },
    onError: (error) => {
      toast.error("Erro ao excluir tipo de embalagem: " + error.message);
    },
  });

  return {
    tiposEmbalagens,
    isLoading,
    createTipoEmbalagem,
    updateTipoEmbalagem,
    deleteTipoEmbalagem,
  };
};
