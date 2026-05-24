import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface EncomendaItem {
  id: string;
  encomenda_id: string;
  receita_id: string;
  produto: string;
  quantidade: number;
  unidade_medida: string;
  valor_unitario: number;
  subtotal: number;
  usuario_id: string;
  created_at?: string;
  updated_at?: string;
}

export function useEncomendaItens(encomendaId: string | null) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const userId = user?.id;

  const queryKey = ['encomenda_itens', encomendaId, userId];

  const { data: itens = [], isLoading: loading, refetch } = useQuery<EncomendaItem[]>({
    queryKey,
    enabled: !!userId && !!encomendaId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('encomenda_itens')
        .select('*')
        .eq('usuario_id', userId!)
        .eq('encomenda_id', encomendaId!)
        .order('created_at', { ascending: true });
      if (error) {
        toast.error('Erro ao carregar itens: ' + error.message);
        throw error;
      }
      return (data || []) as EncomendaItem[];
    },
  });

  const createMutation = useMutation({
    mutationFn: async (item: Omit<EncomendaItem, 'id' | 'usuario_id' | 'created_at' | 'updated_at'>) => {
      if (!userId) throw new Error('Usuário não autenticado');
      const { data, error } = await supabase
        .from('encomenda_itens')
        .insert({ ...item, usuario_id: userId })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['encomenda_itens', variables.encomenda_id, userId] });
      toast.success('Produto adicionado!');
    },
    onError: (err: any) => {
      toast.error('Erro ao adicionar produto: ' + err.message);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      if (!userId) throw new Error('Usuário não autenticado');
      const { error } = await supabase
        .from('encomenda_itens')
        .delete()
        .eq('id', id)
        .eq('usuario_id', userId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['encomenda_itens', encomendaId, userId] });
      toast.success('Produto removido!');
    },
    onError: (err: any) => {
      toast.error('Erro ao remover produto: ' + err.message);
    },
  });

  return {
    itens,
    loading,
    createItem: (item: Omit<EncomendaItem, 'id' | 'usuario_id' | 'created_at' | 'updated_at'>) =>
      createMutation.mutateAsync(item),
    deleteItem: (id: string) => deleteMutation.mutateAsync(id),
    refetch,
  };
}
