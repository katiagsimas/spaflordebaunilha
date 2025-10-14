import { useState, useEffect } from 'react';
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
  observacoes?: string;
  created_at?: string;
  updated_at?: string;
}

export function useClientes() {
  const { user } = useAuth();
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchClientes = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('clientes')
        .select('*')
        .eq('usuario_id', user.id)
        .order('nome');

      if (error) throw error;
      setClientes(data || []);
    } catch (err: any) {
      console.error('Erro ao buscar clientes:', err);
      toast.error('Erro ao carregar clientes: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const createCliente = async (cliente: Omit<Cliente, 'id' | 'usuario_id' | 'created_at' | 'updated_at'>) => {
    if (!user) throw new Error('Usuário não autenticado');

    const { data, error } = await supabase
      .from('clientes')
      .insert({ ...cliente, usuario_id: user.id })
      .select()
      .single();

    if (error) throw error;
    setClientes([...clientes, data]);
    toast.success('Cliente criado com sucesso!');
    return data;
  };

  const updateCliente = async (id: string, updates: Partial<Cliente>) => {
    if (!user) throw new Error('Usuário não autenticado');

    const { data, error } = await supabase
      .from('clientes')
      .update(updates)
      .eq('id', id)
      .eq('usuario_id', user.id)
      .select()
      .single();

    if (error) throw error;
    setClientes(clientes.map(c => c.id === id ? data : c));
    toast.success('Cliente atualizado!');
    return data;
  };

  const deleteCliente = async (id: string) => {
    if (!user) throw new Error('Usuário não autenticado');

    const { error } = await supabase
      .from('clientes')
      .delete()
      .eq('id', id)
      .eq('usuario_id', user.id);

    if (error) throw error;
    setClientes(clientes.filter(c => c.id !== id));
    toast.success('Cliente deletado!');
  };

  useEffect(() => {
    if (user) fetchClientes();
  }, [user]);

  return {
    clientes,
    loading,
    createCliente,
    updateCliente,
    deleteCliente,
    refetch: fetchClientes,
  };
}
