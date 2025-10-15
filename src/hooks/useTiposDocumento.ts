import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface TipoDocumento {
  id: string;
  usuario_id: string;
  codigo: string;
  descricao: string;
  created_at?: string;
  updated_at?: string;
}

export function useTiposDocumento() {
  const { user } = useAuth();
  const [tiposDocumento, setTiposDocumento] = useState<TipoDocumento[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTiposDocumento = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('tipos_documento')
        .select('*')
        .eq('usuario_id', user.id)
        .order('codigo');

      if (error) throw error;
      setTiposDocumento(data || []);
    } catch (err: any) {
      console.error('Erro ao buscar tipos de documento:', err);
      toast.error('Erro ao carregar tipos de documento: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const createTipoDocumento = async (tipo: Omit<TipoDocumento, 'id' | 'usuario_id' | 'created_at' | 'updated_at'>) => {
    if (!user) throw new Error('Usuário não autenticado');

    const { data, error } = await supabase
      .from('tipos_documento')
      .insert({ ...tipo, usuario_id: user.id })
      .select()
      .single();

    if (error) throw error;
    setTiposDocumento([...tiposDocumento, data]);
    toast.success('Tipo de documento criado com sucesso!');
    return data;
  };

  const updateTipoDocumento = async (id: string, updates: Partial<TipoDocumento>) => {
    if (!user) throw new Error('Usuário não autenticado');

    const { data, error } = await supabase
      .from('tipos_documento')
      .update(updates)
      .eq('id', id)
      .eq('usuario_id', user.id)
      .select()
      .single();

    if (error) throw error;
    setTiposDocumento(tiposDocumento.map(t => t.id === id ? data : t));
    toast.success('Tipo de documento atualizado!');
    return data;
  };

  const deleteTipoDocumento = async (id: string) => {
    if (!user) throw new Error('Usuário não autenticado');

    const { error } = await supabase
      .from('tipos_documento')
      .delete()
      .eq('id', id)
      .eq('usuario_id', user.id);

    if (error) throw error;
    setTiposDocumento(tiposDocumento.filter(t => t.id !== id));
    toast.success('Tipo de documento deletado!');
  };

  useEffect(() => {
    if (user) fetchTiposDocumento();
  }, [user]);

  return {
    tiposDocumento,
    loading,
    createTipoDocumento,
    updateTipoDocumento,
    deleteTipoDocumento,
    refetch: fetchTiposDocumento,
  };
}
