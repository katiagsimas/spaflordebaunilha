import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useGroup } from '@/contexts/GroupContext';
import { toast } from 'sonner';

interface Cliente {
  id: string;
  usuario_id: string;
  owner_group_id?: string;
  nome: string;
  tipo?: string;
  email?: string;
  telefone?: string;
  endereco?: string;
  numero?: string;
  cidade?: string;
  estado?: string;
  cep?: string;
  cpf_cnpj?: string;
  data_aniversario?: string;
  observacoes?: string;
  created_at?: string;
  updated_at?: string;
}

export function useClientes() {
  const { user } = useAuth();
  const { activeGroupId } = useGroup();
  const queryClient = useQueryClient();

  const { data: clientes = [], isLoading, refetch } = useQuery({
    queryKey: ['clientes', activeGroupId],
    queryFn: async () => {
      if (!activeGroupId) return [];
      const { data, error } = await supabase
        .from('clientes')
        .select('*')
        .eq('owner_group_id', activeGroupId)
        .order('nome');
      if (error) throw error;
      return (data || []) as Cliente[];
    },
    enabled: !!activeGroupId,
  });

  const createMutation = useMutation({
    mutationFn: async (cliente: Omit<Cliente, 'id' | 'usuario_id' | 'owner_group_id' | 'created_at' | 'updated_at'>) => {
      if (!user?.id || !activeGroupId) throw new Error('Sem contexto de grupo');
      const { data, error } = await supabase
        .from('clientes')
        .insert({ ...cliente, usuario_id: user.id, owner_group_id: activeGroupId })
        .select()
        .single();
      if (error) throw error;
      return data as Cliente;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clientes'] });
      toast.success('Cliente criado com sucesso!');
    },
    onError: (err: any) => {
      console.error('Erro ao criar cliente:', err);
      toast.error('Erro ao criar cliente: ' + err.message);
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<Cliente> }) => {
      if (!activeGroupId) throw new Error('Sem contexto de grupo');
      const { data, error } = await supabase
        .from('clientes')
        .update(updates)
        .eq('id', id)
        .eq('owner_group_id', activeGroupId)
        .select()
        .single();
      if (error) throw error;
      return data as Cliente;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clientes'] });
      toast.success('Cliente atualizado!');
    },
    onError: (err: any) => {
      console.error('Erro ao atualizar cliente:', err);
      toast.error('Erro ao atualizar cliente: ' + err.message);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      if (!activeGroupId) throw new Error('Sem contexto de grupo');
      const { error } = await supabase
        .from('clientes')
        .delete()
        .eq('id', id)
        .eq('owner_group_id', activeGroupId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clientes'] });
      toast.success('Cliente deletado!');
    },
    onError: (err: any) => {
      console.error('Erro ao deletar cliente:', err);
      toast.error('Erro ao deletar cliente: ' + err.message);
    },
  });

  return {
    clientes,
    loading: isLoading,
    createCliente: (cliente: Omit<Cliente, 'id' | 'usuario_id' | 'owner_group_id' | 'created_at' | 'updated_at'>) =>
      createMutation.mutateAsync(cliente),
    updateCliente: (id: string, updates: Partial<Cliente>) =>
      updateMutation.mutateAsync({ id, updates }),
    deleteCliente: (id: string) => deleteMutation.mutateAsync(id),
    refetch,
  };
}
