import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface Cliente {
  id: string;
  usuario_id: string;
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
  const userId = user?.id;
  const queryClient = useQueryClient();

  const { data: clientes = [], isLoading, refetch } = useQuery({
    queryKey: ['clientes', userId],
    queryFn: async () => {
      if (!userId) return [];
      const { data, error } = await supabase
        .from('clientes')
        .select('*')
        .eq('usuario_id', userId)
        .order('nome');
      if (error) throw error;
      return (data || []) as Cliente[];
    },
    enabled: !!userId,
  });

  const createMutation = useMutation({
    mutationFn: async (cliente: Omit<Cliente, 'id' | 'usuario_id' | 'created_at' | 'updated_at'>) => {
      if (!userId) throw new Error('Usuário não autenticado');
      const { data, error } = await supabase
        .from('clientes')
        .insert({ ...cliente, usuario_id: userId })
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
      if (!userId) throw new Error('Usuário não autenticado');
      const { data, error } = await supabase
        .from('clientes')
        .update(updates)
        .eq('id', id)
        .eq('usuario_id', userId)
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
      if (!userId) throw new Error('Usuário não autenticado');
      const { error } = await supabase
        .from('clientes')
        .delete()
        .eq('id', id)
        .eq('usuario_id', userId);
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
    createCliente: (cliente: Omit<Cliente, 'id' | 'usuario_id' | 'created_at' | 'updated_at'>) =>
      createMutation.mutateAsync(cliente),
    updateCliente: (id: string, updates: Partial<Cliente>) =>
      updateMutation.mutateAsync({ id, updates }),
    deleteCliente: (id: string) => deleteMutation.mutateAsync(id),
    refetch,
  };
}
