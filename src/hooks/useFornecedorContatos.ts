import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useGroup } from '@/contexts/GroupContext';
import { toast } from 'sonner';

interface FornecedorContato {
  id: string;
  fornecedor_id: string;
  usuario_id: string;
  owner_group_id?: string;
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

export function useFornecedorContatos(fornecedorId: string) {
  const { user } = useAuth();
  const { activeGroupId } = useGroup();
  const queryClient = useQueryClient();

  const { data: contatos = [], isLoading, refetch } = useQuery({
    queryKey: ['fornecedor_contatos', fornecedorId, activeGroupId],
    queryFn: async () => {
      if (!activeGroupId || !fornecedorId) return [];
      const { data, error } = await (supabase
        .from('fornecedor_contatos') as any)
        .select('*')
        .eq('owner_group_id', activeGroupId)
        .eq('fornecedor_id', fornecedorId)
        .order('nome');

      if (error) throw error;
      return (data || []) as FornecedorContato[];
    },
    enabled: !!fornecedorId && !!activeGroupId,
  });

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: ['fornecedor_contatos'] });

  const createMutation = useMutation({
    mutationFn: async (contato: Omit<FornecedorContato, 'id' | 'usuario_id' | 'owner_group_id' | 'created_at' | 'updated_at'>) => {
      if (!user?.id || !activeGroupId) throw new Error('Sem contexto de grupo');
      const { data, error } = await (supabase
        .from('fornecedor_contatos') as any)
        .insert({ ...contato, usuario_id: user.id, owner_group_id: activeGroupId })
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
      if (!activeGroupId) throw new Error('Sem contexto de grupo');
      const { data, error } = await (supabase
        .from('fornecedor_contatos') as any)
        .update(updates)
        .eq('id', id)
        .eq('owner_group_id', activeGroupId)
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
      if (!activeGroupId) throw new Error('Sem contexto de grupo');
      const { error } = await (supabase
        .from('fornecedor_contatos') as any)
        .delete()
        .eq('id', id)
        .eq('owner_group_id', activeGroupId);
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
    createContato: (contato: Omit<FornecedorContato, 'id' | 'usuario_id' | 'owner_group_id' | 'created_at' | 'updated_at'>) =>
      createMutation.mutateAsync(contato),
    updateContato: (id: string, updates: Partial<FornecedorContato>) =>
      updateMutation.mutateAsync({ id, updates }),
    deleteContato: (id: string) => deleteMutation.mutateAsync(id),
    refetch,
  };
}
