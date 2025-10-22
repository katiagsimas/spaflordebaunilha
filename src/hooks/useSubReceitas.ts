import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export interface SubReceitaIngrediente {
  ingrediente_id: string;
  quantidade_utilizada: number;
  custo_ingrediente: number;
  ordem: number;
}

export interface SubReceita {
  id: string;
  usuario_id: string;
  nome: string;
  tempo_preparo: number;
  unidade_tempo: 'minutos' | 'horas';
  rendimento: number;
  unidade_rendimento_id: string;
  modo_preparo?: string;
  custo_total: number;
  imagem_1_url?: string;
  imagem_2_url?: string;
  ingredientes?: SubReceitaIngrediente[];
  created_at?: string;
  updated_at?: string;
}

export function useSubReceitas() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: subReceitas = [], isLoading } = useQuery({
    queryKey: ['sub_receitas', user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      const { data, error } = await supabase
        .from('sub_receitas')
        .select(`*`)
        .eq('usuario_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as SubReceita[];
    },
    enabled: !!user,
  });

  const createMutation = useMutation({
    mutationFn: async (subReceita: any) => {
      if (!user) throw new Error('Usuário não autenticado');

      const { data: newSubReceita, error } = await supabase
        .from('sub_receitas')
        .insert({
          usuario_id: user.id,
          ...subReceita
        })
        .select()
        .single();

      if (error) throw error;
      return newSubReceita;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sub_receitas'] });
      toast.success('Sub-receita criada!');
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, ...data }: any) => {
      if (!user) throw new Error('Usuário não autenticado');

      const { error } = await supabase
        .from('sub_receitas')
        .update(data)
        .eq('id', id)
        .eq('usuario_id', user.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sub_receitas'] });
      toast.success('Sub-receita atualizada!');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      if (!user) throw new Error('Usuário não autenticado');

      const { error } = await supabase
        .from('sub_receitas')
        .delete()
        .eq('id', id)
        .eq('usuario_id', user.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sub_receitas'] });
      toast.success('Sub-receita excluída!');
    },
  });

  return {
    subReceitas,
    isLoading,
    createSubReceita: createMutation.mutateAsync,
    updateSubReceita: updateMutation.mutateAsync,
    deleteSubReceita: deleteMutation.mutateAsync,
  };
}
