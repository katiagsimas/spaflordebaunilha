import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface EncomendaItem {
  id: string;
  encomenda_id: string;
  receita_id: string;
  produto: string;
  quantidade: number;
  unidade_medida: string;
  valor_unitario: number;
  subtotal: number;
  usuario_id: string;
  created_at?: string;
  updated_at?: string;
}

export function useEncomendaItens(encomendaId: string | null) {
  const { user } = useAuth();
  const [itens, setItens] = useState<EncomendaItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchItens = async () => {
    if (!user || !encomendaId) {
      setItens([]);
      setLoading(false);
      return;
    }
    
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('encomenda_itens')
        .select('*')
        .eq('usuario_id', user.id)
        .eq('encomenda_id', encomendaId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setItens(data || []);
    } catch (err: any) {
      console.error('Erro ao buscar itens:', err);
      toast.error('Erro ao carregar itens: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const createItem = async (item: Omit<EncomendaItem, 'id' | 'usuario_id' | 'created_at' | 'updated_at'>) => {
    if (!user) throw new Error('Usuário não autenticado');

    const { data, error } = await supabase
      .from('encomenda_itens')
      .insert({ ...item, usuario_id: user.id })
      .select()
      .single();

    if (error) throw error;
    setItens([...itens, data]);
    toast.success('Produto adicionado!');
    return data;
  };

  const deleteItem = async (id: string) => {
    if (!user) throw new Error('Usuário não autenticado');

    const { error } = await supabase
      .from('encomenda_itens')
      .delete()
      .eq('id', id)
      .eq('usuario_id', user.id);

    if (error) throw error;
    setItens(itens.filter(i => i.id !== id));
    toast.success('Produto removido!');
  };

  useEffect(() => {
    fetchItens();
  }, [user, encomendaId]);

  return {
    itens,
    loading,
    createItem,
    deleteItem,
    refetch: fetchItens,
  };
}