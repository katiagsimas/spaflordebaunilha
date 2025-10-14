import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface ContaPagar {
  id: string;
  usuario_id: string;
  descricao: string;
  valor: number;
  data_vencimento: string;
  data_pagamento?: string;
  status: string;
  categoria_id?: string;
  observacoes?: string;
  created_at?: string;
  updated_at?: string;
}

export function useContasPagar() {
  const { user } = useAuth();
  const [items, setItems] = useState<ContaPagar[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchItems = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('contas_pagar')
        .select('*')
        .eq('usuario_id', user.id)
        .order('data_vencimento', { ascending: false });

      if (error) throw error;
      setItems(data || []);
    } catch (err: any) {
      console.error('Erro ao buscar contas a pagar:', err);
      toast.error('Erro ao carregar contas a pagar: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const createItem = async (item: Omit<ContaPagar, 'id' | 'usuario_id' | 'created_at' | 'updated_at'>) => {
    if (!user) throw new Error('Usuário não autenticado');

    const { data, error } = await supabase
      .from('contas_pagar')
      .insert({ ...item, usuario_id: user.id })
      .select()
      .single();

    if (error) throw error;
    setItems([data, ...items]);
    toast.success('Conta a pagar criada!');
    return data;
  };

  const updateItem = async (id: string, updates: Partial<ContaPagar>) => {
    if (!user) throw new Error('Usuário não autenticado');

    const { data, error } = await supabase
      .from('contas_pagar')
      .update(updates)
      .eq('id', id)
      .eq('usuario_id', user.id)
      .select()
      .single();

    if (error) throw error;
    setItems(items.map(i => i.id === id ? data : i));
    toast.success('Conta a pagar atualizada!');
    return data;
  };

  const deleteItem = async (id: string) => {
    if (!user) throw new Error('Usuário não autenticado');

    const { error } = await supabase
      .from('contas_pagar')
      .delete()
      .eq('id', id)
      .eq('usuario_id', user.id);

    if (error) throw error;
    setItems(items.filter(i => i.id !== id));
    toast.success('Conta a pagar deletada!');
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
