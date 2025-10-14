import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface Banco {
  id: string;
  usuario_id: string;
  nome: string;
  tipo: string;
  saldo_inicial: number;
  created_at?: string;
  updated_at?: string;
}

export function useBancos() {
  const { user } = useAuth();
  const [bancos, setBancos] = useState<Banco[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchBancos = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('bancos')
        .select('*')
        .eq('usuario_id', user.id)
        .order('nome');

      if (error) throw error;
      setBancos(data || []);
    } catch (err: any) {
      console.error('Erro ao buscar bancos:', err);
      toast.error('Erro ao carregar bancos: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const createBanco = async (banco: Omit<Banco, 'id' | 'usuario_id' | 'created_at' | 'updated_at'>) => {
    if (!user) throw new Error('Usuário não autenticado');

    const { data, error } = await supabase
      .from('bancos')
      .insert({ ...banco, usuario_id: user.id })
      .select()
      .single();

    if (error) throw error;
    setBancos([...bancos, data]);
    toast.success('Banco criado com sucesso!');
    return data;
  };

  const updateBanco = async (id: string, updates: Partial<Banco>) => {
    if (!user) throw new Error('Usuário não autenticado');

    const { data, error } = await supabase
      .from('bancos')
      .update(updates)
      .eq('id', id)
      .eq('usuario_id', user.id)
      .select()
      .single();

    if (error) throw error;
    setBancos(bancos.map(b => b.id === id ? data : b));
    toast.success('Banco atualizado!');
    return data;
  };

  const deleteBanco = async (id: string) => {
    if (!user) throw new Error('Usuário não autenticado');

    const { error } = await supabase
      .from('bancos')
      .delete()
      .eq('id', id)
      .eq('usuario_id', user.id);

    if (error) throw error;
    setBancos(bancos.filter(b => b.id !== id));
    toast.success('Banco deletado!');
  };

  useEffect(() => {
    if (user) fetchBancos();
  }, [user]);

  return {
    bancos,
    loading,
    createBanco,
    updateBanco,
    deleteBanco,
    refetch: fetchBancos,
  };
}
