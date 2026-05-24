import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface Fornecedor {
  id: string;
  usuario_id: string;
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
  const userId = user?.id;
  const queryClient = useQueryClient();

  const { data: fornecedores = [], isLoading, refetch } = useQuery({
    queryKey: ['fornecedores', userId],
    queryFn: async () => {
      if (!userId) return [];
      const { data, error } = await supabase
        .from('fornecedores')
        .select('*')
        .eq('usuario_id', userId)
        .order('nome');
      if (error) throw error;
      return (data || []) as Fornecedor[];
    },
    enabled: !!userId,
  });

  const createMutation = useMutation({
    mutationFn: async (fornecedor: Omit<Fornecedor, 'id' | 'usuario_id' | 'created_at' | 'updated_at'>) => {
      if (!userId) throw new Error('Usuário não autenticado');
      const { data, error } = await supabase
        .from('fornecedores')
        .insert({ ...fornecedor, usuario_id: userId })
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
      if (!userId) throw new Error('Usuário não autenticado');
      const { data, error } = await supabase
        .from('fornecedores')
        .update(updates)
        .eq('id', id)
        .eq('usuario_id', userId)
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
      if (!userId) throw new Error('Usuário não autenticado');
      const { error } = await supabase
        .from('fornecedores')
        .delete()
        .eq('id', id)
        .eq('usuario_id', userId);
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
    createFornecedor: (fornecedor: Omit<Fornecedor, 'id' | 'usuario_id' | 'created_at' | 'updated_at'>) =>
      createMutation.mutateAsync(fornecedor),
    updateFornecedor: (id: string, updates: Partial<Fornecedor>) =>
      updateMutation.mutateAsync({ id, updates }),
    deleteFornecedor: (id: string) => deleteMutation.mutateAsync(id),
    refetch,
  };
}
