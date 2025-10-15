import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface ContaReceber {
  id: string;
  usuario_id: string;
  descricao: string;
  valor: number;
  data_emissao?: string;
  data_vencimento: string;
  data_recebimento?: string;
  status: string;
  categoria_id?: string;
  plano_conta_id?: string;
  banco_id?: string;
  tipo_documento_id?: string;
  numero_documento?: string;
  observacoes?: string;
  cliente_nome?: string;
  cliente_documento?: string;
  cliente_id?: string;
  created_at?: string;
  updated_at?: string;
}

export function useContasReceber() {
  const { user } = useAuth();
  const [items, setItems] = useState<ContaReceber[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchItems = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('contas_receber')
        .select('*')
        .eq('usuario_id', user.id)
        .order('data_vencimento', { ascending: true });

      if (error) throw error;
      setItems(data || []);
    } catch (err: any) {
      console.error('Erro ao buscar contas a receber:', err);
      toast.error('Erro ao carregar contas a receber: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const createItem = async (item: Omit<ContaReceber, 'id' | 'usuario_id' | 'created_at' | 'updated_at'>) => {
    if (!user) throw new Error('Usuário não autenticado');

    const { data, error } = await supabase
      .from('contas_receber')
      .insert({ ...item, usuario_id: user.id })
      .select()
      .single();

    if (error) throw error;
    
    // Recarregar a lista completa para manter a ordenação correta
    await fetchItems();
    
    return data;
  };

  const updateItem = async (id: string, updates: Partial<ContaReceber>) => {
    if (!user) throw new Error('Usuário não autenticado');

    const { data, error } = await supabase
      .from('contas_receber')
      .update(updates)
      .eq('id', id)
      .eq('usuario_id', user.id)
      .select()
      .maybeSingle();

    if (error) throw error;
    
    if (!data) {
      throw new Error('Registro não encontrado');
    }
    
    // Recarregar a lista completa para manter a ordenação correta
    await fetchItems();
    
    return data;
  };

  const deleteItem = async (id: string) => {
    if (!user) throw new Error('Usuário não autenticado');

    const { error } = await supabase
      .from('contas_receber')
      .delete()
      .eq('id', id)
      .eq('usuario_id', user.id);

    if (error) throw error;
    setItems(items.filter(i => i.id !== id));
    toast.success('Conta a receber deletada!');
  };

  useEffect(() => {
    if (user) fetchItems();
  }, [user]);

  return {
    items,
    loading,
    createItem,
    updateItem,
    deleteItem,
    refetch: fetchItems,
  };
}
