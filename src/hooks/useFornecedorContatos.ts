import { useState, useEffect } from 'react';
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
  const [contatos, setContatos] = useState<FornecedorContato[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchContatos = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      let query = supabase
        .from('fornecedor_contatos')
        .select('*')
        .eq('usuario_id', user.id)
        .order('nome');

      if (fornecedorId) {
        query = query.eq('fornecedor_id', fornecedorId);
      }

      const { data, error } = await query;

      if (error) throw error;
      setContatos(data || []);
    } catch (err: any) {
      console.error('Erro ao buscar contatos:', err);
      toast.error('Erro ao carregar contatos: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const createContato = async (contato: Omit<FornecedorContato, 'id' | 'usuario_id' | 'created_at' | 'updated_at'>) => {
    if (!user) throw new Error('Usuário não autenticado');

    const { data, error } = await supabase
      .from('fornecedor_contatos')
      .insert({ ...contato, usuario_id: user.id })
      .select()
      .single();

    if (error) throw error;
    setContatos([...contatos, data]);
    toast.success('Contato criado com sucesso!');
    return data;
  };

  const updateContato = async (id: string, updates: Partial<FornecedorContato>) => {
    if (!user) throw new Error('Usuário não autenticado');

    const { data, error } = await supabase
      .from('fornecedor_contatos')
      .update(updates)
      .eq('id', id)
      .eq('usuario_id', user.id)
      .select()
      .single();

    if (error) throw error;
    setContatos(contatos.map(c => c.id === id ? data : c));
    toast.success('Contato atualizado!');
    return data;
  };

  const deleteContato = async (id: string) => {
    if (!user) throw new Error('Usuário não autenticado');

    const { error } = await supabase
      .from('fornecedor_contatos')
      .delete()
      .eq('id', id)
      .eq('usuario_id', user.id);

    if (error) throw error;
    setContatos(contatos.filter(c => c.id !== id));
    toast.success('Contato deletado!');
  };

  useEffect(() => {
    if (user) fetchContatos();
  }, [user, fornecedorId]);

  return {
    contatos,
    loading,
    createContato,
    updateContato,
    deleteContato,
    refetch: fetchContatos,
  };
}
