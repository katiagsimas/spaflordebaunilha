import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface CustoFixo {
  id: string;
  usuario_id: string;
  nome: string;
  valor: number;
  created_at?: string;
  updated_at?: string;
}

export function useCustosFixos() {
  const { user } = useAuth();
  const [custosFixos, setCustosFixos] = useState<CustoFixo[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchCustosFixos = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('custos_fixos')
        .select('*')
        .eq('usuario_id', user.id)
        .order('nome');

      if (error) throw error;
      setCustosFixos(data || []);
    } catch (err: any) {
      console.error('Erro ao buscar custos fixos:', err);
      toast.error('Erro ao carregar custos fixos: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const createCustoFixo = async (custo: Omit<CustoFixo, 'id' | 'usuario_id' | 'created_at' | 'updated_at'>) => {
    if (!user) throw new Error('Usuário não autenticado');

    const { data, error } = await supabase
      .from('custos_fixos')
      .insert({ ...custo, usuario_id: user.id })
      .select()
      .single();

    if (error) throw error;
    setCustosFixos([...custosFixos, data]);
    toast.success('Custo fixo criado com sucesso!');
    return data;
  };

  const updateCustoFixo = async (id: string, updates: Partial<CustoFixo>) => {
    if (!user) throw new Error('Usuário não autenticado');

    const { data, error } = await supabase
      .from('custos_fixos')
      .update(updates)
      .eq('id', id)
      .eq('usuario_id', user.id)
      .select()
      .single();

    if (error) throw error;
    setCustosFixos(custosFixos.map(c => c.id === id ? data : c));
    toast.success('Custo fixo atualizado!');
    return data;
  };

  const deleteCustoFixo = async (id: string) => {
    if (!user) throw new Error('Usuário não autenticado');

    const { error } = await supabase
      .from('custos_fixos')
      .delete()
      .eq('id', id)
      .eq('usuario_id', user.id);

    if (error) throw error;
    setCustosFixos(custosFixos.filter(c => c.id !== id));
    toast.success('Custo fixo deletado!');
  };

  useEffect(() => {
    if (user) fetchCustosFixos();
  }, [user]);

  return {
    custosFixos,
    loading,
    createCustoFixo,
    updateCustoFixo,
    deleteCustoFixo,
    refetch: fetchCustosFixos,
  };
}
