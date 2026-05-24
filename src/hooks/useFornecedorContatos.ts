import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface FornecedorContato {
  id: string;
  fornecedor_id: string;
  usuario_id: string;
  nome: string;
  cargo?: string;
  data_aniversario?: string;
  telefone?: string;
  email?: string;
  observacoes?: string;
  ativo?: boolean;
  created_at?: string;
  updated_at?: string;
}

export function useFornecedorContatos(fornecedorId?: string) {
  const { user } = useAuth();
  const userId = user?.id;
  const queryClient = useQueryClient();

  const { data: contatos = [], isLoading, refetch } = useQuery({
    queryKey: ['fornecedor_contatos', fornecedorId ?? 'all', userId],
    queryFn: async () => {
      if (!userId) return [];
      let query = supabase
        .from('fornecedor_contatos')
        .select('*')
        .eq('usuario_id', userId)
        .order('nome');

      if (fornecedorId) {
        query = query.eq('fornecedor_id', fornecedorId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data || []) as FornecedorContato[];
    },
    enabled: !!userId,
  });

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: ['fornecedor_contatos'] });

  const createMutation = useMutation({
    mutationFn: async (contato: Omit<FornecedorContato, 'id' | 'usuario_id' | 'created_at' | 'updated_at'>) => {
      if (!userId) throw new Error('Usuário não autenticado');
      const { data, error } = await supabase
        .from('fornecedor_contatos')
        .insert({ ...contato, usuario_id: userId })
        .select()
        .single();
      if (error) throw error;
      return data as FornecedorContato;
    },
    onSuccess: () => {
      invalidate();
      toast.success('Contato criado com sucesso!');
    },
    onError: (err: any) => {
      console.error('Erro ao criar contato:', err);
      toast.error('Erro ao criar contato: ' + err.message);
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<FornecedorContato> }) => {
      if (!userId) throw new Error('Usuário não autenticado');
      const { data, error } = await supabase
        .from('fornecedor_contatos')
        .update(updates)
        .eq('id', id)
        .eq('usuario_id', userId)
        .select()
        .single();
      if (error) throw error;
      return data as FornecedorContato;
    },
    onSuccess: () => {
      invalidate();
      toast.success('Contato atualizado!');
    },
    onError: (err: any) => {
      console.error('Erro ao atualizar contato:', err);
      toast.error('Erro ao atualizar contato: ' + err.message);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      if (!userId) throw new Error('Usuário não autenticado');
      const { error } = await supabase
        .from('fornecedor_contatos')
        .delete()
        .eq('id', id)
        .eq('usuario_id', userId);
      if (error) throw error;
    },
    onSuccess: () => {
      invalidate();
      toast.success('Contato deletado!');
    },
    onError: (err: any) => {
      console.error('Erro ao deletar contato:', err);
      toast.error('Erro ao deletar contato: ' + err.message);
    },
  });

  return {
    contatos,
    loading: isLoading,
    createContato: (contato: Omit<FornecedorContato, 'id' | 'usuario_id' | 'created_at' | 'updated_at'>) =>
      createMutation.mutateAsync(contato),
    updateContato: (id: string, updates: Partial<FornecedorContato>) =>
      updateMutation.mutateAsync({ id, updates }),
    deleteContato: (id: string) => deleteMutation.mutateAsync(id),
    refetch,
  };
}
