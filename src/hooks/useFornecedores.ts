import { useState, useEffect } from 'react';
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
  contato?: string;
  observacoes?: string;
  created_at?: string;
  updated_at?: string;
}

export function useFornecedores() {
  const { user } = useAuth();
  const [fornecedores, setFornecedores] = useState<Fornecedor[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchFornecedores = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('fornecedores')
        .select('*')
        .eq('usuario_id', user.id)
        .order('nome');

      if (error) throw error;
      setFornecedores(data || []);
    } catch (err: any) {
      console.error('Erro ao buscar fornecedores:', err);
      toast.error('Erro ao carregar fornecedores: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const createFornecedor = async (fornecedor: Omit<Fornecedor, 'id' | 'usuario_id' | 'created_at' | 'updated_at'>) => {
    if (!user) throw new Error('Usuário não autenticado');

    const { data, error } = await supabase
      .from('fornecedores')
      .insert({ ...fornecedor, usuario_id: user.id })
      .select()
      .single();

    if (error) throw error;
    setFornecedores([...fornecedores, data]);
    toast.success('Fornecedor criado com sucesso!');
    return data;
  };

  const updateFornecedor = async (id: string, updates: Partial<Fornecedor>) => {
    if (!user) throw new Error('Usuário não autenticado');

    const { data, error } = await supabase
      .from('fornecedores')
      .update(updates)
      .eq('id', id)
      .eq('usuario_id', user.id)
      .select()
      .single();

    if (error) throw error;
    setFornecedores(fornecedores.map(f => f.id === id ? data : f));
    toast.success('Fornecedor atualizado!');
    return data;
  };

  const deleteFornecedor = async (id: string) => {
    if (!user) throw new Error('Usuário não autenticado');

    const { error } = await supabase
      .from('fornecedores')
      .delete()
      .eq('id', id)
      .eq('usuario_id', user.id);

    if (error) throw error;
    setFornecedores(fornecedores.filter(f => f.id !== id));
    toast.success('Fornecedor deletado!');
  };

  useEffect(() => {
    if (user) fetchFornecedores();
  }, [user]);

  return {
    fornecedores,
    loading,
    createFornecedor,
    updateFornecedor,
    deleteFornecedor,
    refetch: fetchFornecedores,
  };
}
