import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useUserId } from './useUserId';
import { useGroup } from '@/contexts/GroupContext';
import { toast } from 'sonner';

export interface ProdutoRevenda {
  id: string;
  codigo: string | null;
  descricao: string;
  marca: 'natura' | 'avon';
  linha: string | null;
  quantidade_ml: string | null;
  quantidade_pontos: number;
  preco: number;
  preco_venda: number;
  categoria_id: string | null;
  status: 'Ativo' | 'Pausado';
  owner_group_id: string | null;
  usuario_id: string;
  created_at?: string;
  updated_at?: string;
}

export function useProdutosRevenda(marca?: 'natura' | 'avon') {
  const userId = useUserId();
  const { activeGroupId } = useGroup();
  const queryClient = useQueryClient();

  const { data: produtos = [], isLoading: loading } = useQuery({
    queryKey: ['produtos_revenda', userId, activeGroupId, marca],
    queryFn: async () => {
      if (!userId || !activeGroupId) return [];

      let query = supabase
        .from('produtos_revenda')
        .select('*')
        .eq('owner_group_id', activeGroupId);
      
      if (marca) {
        query = query.eq('marca', marca);
      }

      const { data, error } = await query.order('descricao');

      if (error) throw error;
      return (data || []) as ProdutoRevenda[];
    },
    enabled: !!userId && !!activeGroupId,
  });

  const createMutation = useMutation({
    mutationFn: async (produto: Omit<ProdutoRevenda, 'id' | 'usuario_id' | 'owner_group_id'>) => {
      if (!activeGroupId || !userId) throw new Error('Sem contexto de grupo ou usuário para cadastrar o produto');
      
      const payload = { 
        ...produto,
        usuario_id: userId,
        owner_group_id: activeGroupId
      };

      console.log('Criando produto revenda:', payload);

      const { data, error } = await supabase
        .from('produtos_revenda')
        .insert(payload)
        .select()
        .single();

      if (error) {
        console.error('Erro ao inserir produto revenda:', error);
        throw error;
      }
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['produtos_revenda'] });
      toast.success('Produto salvo com sucesso!');
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<ProdutoRevenda> }) => {
      if (!activeGroupId) throw new Error('Sem contexto de grupo ativo');

      // Garantir que não estamos tentando atualizar campos sensíveis ou IDs incorretos
      const { id: _, created_at: __, updated_at: ___, ...cleanUpdates } = updates as any;

      const { data, error } = await supabase
        .from('produtos_revenda')
        .update(cleanUpdates)
        .eq('id', id)
        .eq('owner_group_id', activeGroupId)
        .select()
        .single();

      if (error) {
        console.error('Erro ao atualizar produto revenda:', error);
        throw error;
      }
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['produtos_revenda'] });
      toast.success('Produto atualizado!');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('produtos_revenda')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['produtos_revenda'] });
      toast.success('Produto removido!');
    },
  });

  return {
    produtos,
    loading,
    createProduto: createMutation.mutateAsync,
    updateProduto: (id: string, updates: Partial<ProdutoRevenda>) => updateMutation.mutateAsync({ id, updates }),
    deleteProduto: deleteMutation.mutateAsync,
  };
}
