import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface TipoInsumo {
  id: string;
  codigo: number;
  descricao: string;
  quantidade_embalagem: number;
  unidade_medida_id: string;
  usuario_id: string;
  created_at: string;
  updated_at: string;
}

export const useTiposInsumos = () => {
  const queryClient = useQueryClient();

  const { data: tiposInsumos = [], isLoading } = useQuery({
    queryKey: ["tipos-insumos"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tipos_insumos")
        .select("*")
        .order("descricao", { ascending: true });

      if (error) throw error;
      return data as TipoInsumo[];
    },
  });

  const createTipoInsumo = useMutation({
    mutationFn: async (newTipo: Omit<TipoInsumo, "id" | "codigo" | "usuario_id" | "created_at" | "updated_at">) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      const { data, error } = await supabase
        .from("tipos_insumos")
        .insert([{ ...newTipo, usuario_id: user.id }])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tipos-insumos"] });
      toast.success("Tipo de insumo criado com sucesso!");
    },
    onError: (error) => {
      toast.error("Erro ao criar tipo de insumo: " + error.message);
    },
  });

  const updateTipoInsumo = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<TipoInsumo> & { id: string }) => {
      const { data, error } = await supabase
        .from("tipos_insumos")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tipos-insumos"] });
      toast.success("Tipo de insumo atualizado com sucesso!");
    },
    onError: (error) => {
      toast.error("Erro ao atualizar tipo de insumo: " + error.message);
    },
  });

  const deleteTipoInsumo = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("tipos_insumos")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tipos-insumos"] });
      toast.success("Tipo de insumo excluído com sucesso!");
    },
    onError: (error) => {
      toast.error("Erro ao excluir tipo de insumo: " + error.message);
    },
  });

  return {
    tiposInsumos,
    isLoading,
    createTipoInsumo,
    updateTipoInsumo,
    deleteTipoInsumo,
  };
};
