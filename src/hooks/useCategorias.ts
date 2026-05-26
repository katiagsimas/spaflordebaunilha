import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useUserId } from './useUserId';
import { toast } from 'sonner';

interface Categoria {
  id: string;
  usuario_id: string;
  nome: string;
  ativo: boolean;
  padrao_sistema: boolean;
  created_at?: string;
  updated_at?: string;
}

export function useCategorias() {
  const userId = useUserId();
  const queryClient = useQueryClient();

  const { data: categorias = [], isLoading: loading } = useQuery({
    queryKey: ['categorias', userId],
    queryFn: async () => {
      if (!userId) return [];

      const { data, error } = await supabase
        .from('categorias')
        .select('*')
        .eq('usuario_id', userId)
        .order('nome');

      if (error) throw error;
      return (data || []) as Categoria[];
    },
    enabled: !!userId,
  });

  const categoriasAtivas = categorias.filter(c => c.ativo);

  const createCategoriaMutation = useMutation({
    mutationFn: async (nome: string) => {
      const { data, error } = await supabase
        .from('categorias')
        .insert({ nome, usuario_id: userId, ativo: true, padrao_sistema: false })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categorias'] });
      toast.success('Categoria criada!');
    },
    onError: (err: any) => {
      console.error('Erro ao criar categoria:', err);
      toast.error('Erro ao criar categoria: ' + err.message);
    },
  });

  const updateCategoriaMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<Categoria> }) => {
      const categoria = categorias.find(c => c.id === id);
      let finalUpdates = updates;
      if (categoria?.padrao_sistema) {
        const { nome, padrao_sistema, ...allowedUpdates } = updates;
        finalUpdates = allowedUpdates;
      }

      const { data, error } = await supabase
        .from('categorias')
        .update(finalUpdates)
        .eq('id', id)
        .eq('usuario_id', userId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categorias'] });
      toast.success('Categoria atualizada!');
    },
    onError: (err: any) => {
      console.error('Erro ao atualizar categoria:', err);
      toast.error('Erro ao atualizar categoria: ' + err.message);
    },
  });

  const deleteCategoriaMutation = useMutation({
    mutationFn: async (id: string) => {
      const categoria = categorias.find(c => c.id === id);
      if (categoria?.padrao_sistema) {
        throw new Error('Categorias padrão do sistema não podem ser removidas.');
      }

      const { data: receitasCount, error: checkError } = await (supabase as any)
        .from('receitas')
        .select('id')
        .eq('categoria_id', id);

      if (checkError) throw checkError;

      if (receitasCount && receitasCount.length > 0) {
        throw new Error(
          `Esta categoria está vinculada a ${receitasCount.length} receita(s). Remova o vínculo antes de excluir.`
        );
      }

      const { error } = await supabase
        .from('categorias')
        .delete()
        .eq('id', id)
        .eq('usuario_id', userId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categorias'] });
      toast.success('Categoria removida!');
    },
    onError: (err: any) => {
      console.error('Erro ao remover categoria:', err);
      toast.error(err.message || 'Erro ao remover categoria');
    },
  });

  // Wrappers preservando assinatura usada pelos consumidores
  const createCategoria = (nome: string) => createCategoriaMutation.mutateAsync(nome);
  const updateCategoria = (id: string, updates: Partial<Categoria>) =>
    updateCategoriaMutation.mutateAsync({ id, updates });
  const deleteCategoria = (id: string) => deleteCategoriaMutation.mutateAsync(id);

  const refetch = () =>
    queryClient.invalidateQueries({ queryKey: ['categorias', userId] });

  return {
    categorias,
    categoriasAtivas,
    loading,
    isLoading: loading,
    updateCategoria,
    createCategoria,
    deleteCategoria,
    refetch,
  };
}
