import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useGroup } from '@/contexts/GroupContext';
import { toast } from 'sonner';

interface Fornecedor {
  id: string;
  usuario_id: string;
  owner_group_id?: string;
  nome: string;
  tipo?: string;
  cpf_cnpj?: string;
  telefone?: string;
  email?: string;
  observacoes?: string;
  created_at?: string;
  updated_at?: string;
}

export function useFornecedores() {
  const { user } = useAuth();
  const { activeGroupId } = useGroup();
  const queryClient = useQueryClient();

  const { data: fornecedores = [], isLoading, refetch } = useQuery({
    queryKey: ['fornecedores', activeGroupId],
    queryFn: async () => {
      if (!activeGroupId) return [];
      const { data, error } = await supabase
        .from('fornecedores')
        .select('*')
        .eq('owner_group_id', activeGroupId)
        .order('nome');
      if (error) throw error;
      return (data || []) as Fornecedor[];
    },
    enabled: !!activeGroupId,
  });

  const createMutation = useMutation({
    mutationFn: async (fornecedor: Omit<Fornecedor, 'id' | 'usuario_id' | 'owner_group_id' | 'created_at' | 'updated_at'>) => {
      if (!user?.id || !activeGroupId) throw new Error('Sem contexto de grupo');
      const { data, error } = await supabase
        .from('fornecedores')
        .insert({ ...fornecedor, usuario_id: user.id, owner_group_id: activeGroupId })
        .select()
        .single();
      if (error) throw error;
      return data as Fornecedor;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fornecedores'] });
      toast.success('Fornecedor criado com sucesso!');
    },
    onError: (err: any) => {
      console.error('Erro ao criar fornecedor:', err);
      toast.error('Erro ao criar fornecedor: ' + err.message);
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<Fornecedor> }) => {
      if (!activeGroupId) throw new Error('Sem contexto de grupo');
      const { data, error } = await supabase
        .from('fornecedores')
        .update(updates)
        .eq('id', id)
        .eq('owner_group_id', activeGroupId)
        .select()
        .single();
      if (error) throw error;
      return data as Fornecedor;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fornecedores'] });
      toast.success('Fornecedor atualizado!');
    },
    onError: (err: any) => {
      console.error('Erro ao atualizar fornecedor:', err);
      toast.error('Erro ao atualizar fornecedor: ' + err.message);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      if (!activeGroupId) throw new Error('Sem contexto de grupo');
      const { error } = await supabase
        .from('fornecedores')
        .delete()
        .eq('id', id)
        .eq('owner_group_id', activeGroupId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fornecedores'] });
      toast.success('Fornecedor deletado!');
    },
    onError: (err: any) => {
      console.error('Erro ao deletar fornecedor:', err);
      toast.error('Erro ao deletar fornecedor: ' + err.message);
    },
  });

  return {
    fornecedores,
    loading: isLoading,
    createFornecedor: (fornecedor: Omit<Fornecedor, 'id' | 'usuario_id' | 'owner_group_id' | 'created_at' | 'updated_at'>) =>
      createMutation.mutateAsync(fornecedor),
    updateFornecedor: (id: string, updates: Partial<Fornecedor>) =>
      updateMutation.mutateAsync({ id, updates }),
    deleteFornecedor: (id: string) => deleteMutation.mutateAsync(id),
    refetch,
  };
}
