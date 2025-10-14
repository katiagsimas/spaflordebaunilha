import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface Encomenda {
  id: string;
  usuario_id: string;
  cliente: string;
  data_pedido: string;
  data_entrega: string;
  status: string;
  valor: number;
  observacoes?: string;
  created_at?: string;
  updated_at?: string;
}

export function useEncomendas() {
  const { user } = useAuth();
  const [encomendas, setEncomendas] = useState<Encomenda[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchEncomendas = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('encomendas')
        .select('*')
        .eq('usuario_id', user.id)
        .order('data_entrega', { ascending: false });

      if (error) throw error;
      setEncomendas(data || []);
    } catch (err: any) {
      console.error('Erro ao buscar encomendas:', err);
      toast.error('Erro ao carregar encomendas: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const createEncomenda = async (encomenda: Omit<Encomenda, 'id' | 'usuario_id' | 'created_at' | 'updated_at'>) => {
    if (!user) throw new Error('Usuário não autenticado');

    const { data, error } = await supabase
      .from('encomendas')
      .insert({ ...encomenda, usuario_id: user.id })
      .select()
      .single();

    if (error) throw error;
    setEncomendas([data, ...encomendas]);
    toast.success('Encomenda criada!');
    return data;
  };

  const updateEncomenda = async (id: string, updates: Partial<Encomenda>) => {
    if (!user) throw new Error('Usuário não autenticado');

    const { data, error } = await supabase
      .from('encomendas')
      .update(updates)
      .eq('id', id)
      .eq('usuario_id', user.id)
      .select()
      .single();

    if (error) throw error;
    setEncomendas(encomendas.map(e => e.id === id ? data : e));
    toast.success('Encomenda atualizada!');
    return data;
  };

  const deleteEncomenda = async (id: string) => {
    if (!user) throw new Error('Usuário não autenticado');

    const { error } = await supabase
      .from('encomendas')
      .delete()
      .eq('id', id)
      .eq('usuario_id', user.id);

    if (error) throw error;
    setEncomendas(encomendas.filter(e => e.id !== id));
    toast.success('Encomenda deletada!');
  };

  useEffect(() => {
    if (user) fetchEncomendas();
  }, [user]);

  return {
    encomendas,
    loading,
    createEncomenda,
    updateEncomenda,
    deleteEncomenda,
    refetch: fetchEncomendas,
  };
}
