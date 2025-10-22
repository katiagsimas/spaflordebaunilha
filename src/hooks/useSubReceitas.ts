import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export interface SubReceitaIngrediente {
  id: string;
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
        .select(`
          *,
          ingredientes:sub_receitas_ingredientes(*)
        `)
        .eq('usuario_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as SubReceita[];
    },
    enabled: !!user,
  });

  const createMutation = useMutation({
    mutationFn: async (subReceita: Omit<SubReceita, 'id' | 'usuario_id' | 'created_at' | 'updated_at'>) => {
      if (!user) throw new Error('Usuário não autenticado');

      const { data: newSubReceita, error: subReceitaError } = await supabase
        .from('sub_receitas')
        .insert({
          usuario_id: user.id,
          nome: subReceita.nome,
          tempo_preparo: subReceita.tempo_preparo,
          unidade_tempo: subReceita.unidade_tempo,
          rendimento: subReceita.rendimento,
          unidade_rendimento_id: subReceita.unidade_rendimento_id,
          modo_preparo: subReceita.modo_preparo,
          custo_total: subReceita.custo_total,
          imagem_1_url: subReceita.imagem_1_url,
          imagem_2_url: subReceita.imagem_2_url,
        })
        .select()
        .single();

      if (subReceitaError) throw subReceitaError;

      // Inserir ingredientes
      if (subReceita.ingredientes && subReceita.ingredientes.length > 0) {
        const ingredientesData = subReceita.ingredientes.map(ing => ({
          sub_receita_id: newSubReceita.id,
          ingrediente_id: ing.ingrediente_id,
          quantidade_utilizada: ing.quantidade_utilizada,
          custo_ingrediente: ing.custo_ingrediente,
          ordem: ing.ordem,
        }));

        const { error: ingredientesError } = await supabase
          .from('sub_receitas_ingredientes')
          .insert(ingredientesData);

        if (ingredientesError) throw ingredientesError;
      }

      return newSubReceita;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sub_receitas'] });
      toast.success('Sub-receita criada com sucesso!');
    },
    onError: (error) => {
      console.error('Erro ao criar sub-receita:', error);
      toast.error('Erro ao criar sub-receita');
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, ...subReceita }: Partial<SubReceita> & { id: string }) => {
      if (!user) throw new Error('Usuário não autenticado');

      // Atualizar sub-receita
      const { error: subReceitaError } = await supabase
        .from('sub_receitas')
        .update({
          nome: subReceita.nome,
          tempo_preparo: subReceita.tempo_preparo,
          unidade_tempo: subReceita.unidade_tempo,
          rendimento: subReceita.rendimento,
          unidade_rendimento_id: subReceita.unidade_rendimento_id,
          modo_preparo: subReceita.modo_preparo,
          imagem_1_url: subReceita.imagem_1_url,
          imagem_2_url: subReceita.imagem_2_url,
        })
        .eq('id', id)
        .eq('usuario_id', user.id);

      if (subReceitaError) throw subReceitaError;

      // Atualizar ingredientes se fornecidos
      if (subReceita.ingredientes) {
        // Remover ingredientes existentes
        await supabase
          .from('sub_receitas_ingredientes')
          .delete()
          .eq('sub_receita_id', id);

        // Inserir novos ingredientes
        if (subReceita.ingredientes.length > 0) {
          const ingredientesData = subReceita.ingredientes.map(ing => ({
            sub_receita_id: id,
            ingrediente_id: ing.ingrediente_id,
            quantidade_utilizada: ing.quantidade_utilizada,
            custo_ingrediente: ing.custo_ingrediente,
            ordem: ing.ordem,
          }));

          const { error: ingredientesError } = await supabase
            .from('sub_receitas_ingredientes')
            .insert(ingredientesData);

          if (ingredientesError) throw ingredientesError;
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sub_receitas'] });
      toast.success('Sub-receita atualizada com sucesso!');
    },
    onError: (error) => {
      console.error('Erro ao atualizar sub-receita:', error);
      toast.error('Erro ao atualizar sub-receita');
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
      toast.success('Sub-receita excluída com sucesso!');
    },
    onError: (error) => {
      console.error('Erro ao excluir sub-receita:', error);
      toast.error('Erro ao excluir sub-receita');
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
