import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useGroup } from '@/contexts/GroupContext';
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
  owner_group_id?: string | null;
  created_at?: string;
  updated_at?: string;
}

export function useEncomendaItens(encomendaId: string | null) {
  const { user } = useAuth();
  const { activeGroupId } = useGroup();
  const queryClient = useQueryClient();
  const userId = user?.id;

  const queryKey = ['encomenda_itens', encomendaId, activeGroupId];

  const { data: itens = [], isLoading: loading, refetch } = useQuery<EncomendaItem[]>({
    queryKey,
    enabled: !!activeGroupId && !!encomendaId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('encomenda_itens')
        .select('*')
        .eq('owner_group_id', activeGroupId!)
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
    mutationFn: async (item: Omit<EncomendaItem, 'id' | 'usuario_id' | 'owner_group_id' | 'created_at' | 'updated_at'>) => {
      if (!userId) throw new Error('Usuário não autenticado');
      if (!activeGroupId) throw new Error('Grupo não selecionado');
      const { data, error } = await supabase
        .from('encomenda_itens')
        .insert({ ...item, owner_group_id: activeGroupId, usuario_id: userId })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['encomenda_itens', variables.encomenda_id, activeGroupId] });
      toast.success('Produto adicionado!');
    },
    onError: (err: any) => {
      toast.error('Erro ao adicionar produto: ' + err.message);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      if (!activeGroupId) throw new Error('Grupo não selecionado');
      const { error } = await supabase
        .from('encomenda_itens')
        .delete()
        .eq('id', id)
        .eq('owner_group_id', activeGroupId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['encomenda_itens', encomendaId, activeGroupId] });
      toast.success('Produto removido!');
    },
    onError: (err: any) => {
      toast.error('Erro ao remover produto: ' + err.message);
    },
  });

  return {
    itens,
    loading,
    createItem: (item: Omit<EncomendaItem, 'id' | 'usuario_id' | 'owner_group_id' | 'created_at' | 'updated_at'>) =>
      createMutation.mutateAsync(item),
    deleteItem: (id: string) => deleteMutation.mutateAsync(id),
    refetch,
  };
}
