import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface Embalagem {
  id: string;
  usuario_id: string;
  nome: string;
  marca?: string;
  quantidade: number;
  unidade_medida: string;
  preco: number;
  data_atualizacao: string;
  created_at?: string;
  updated_at?: string;
}

export function useEmbalagens() {
  const { user } = useAuth();
  const [embalagens, setEmbalagens] = useState<Embalagem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchEmbalagens = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('embalagens')
        .select('*')
        .eq('usuario_id', user.id)
        .order('nome');

      if (error) throw error;
      setEmbalagens(data || []);
    } catch (err: any) {
      console.error('Erro ao buscar embalagens:', err);
      toast.error('Erro ao carregar embalagens: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const createEmbalagem = async (embalagem: Omit<Embalagem, 'id' | 'usuario_id' | 'created_at' | 'updated_at'>) => {
    if (!user) throw new Error('Usuário não autenticado');

    const { data, error } = await supabase
      .from('embalagens')
      .insert({ ...embalagem, usuario_id: user.id })
      .select()
      .single();

    if (error) throw error;
    setEmbalagens([...embalagens, data]);
    toast.success('Embalagem criada com sucesso!');
    return data;
  };

  const updateEmbalagem = async (id: string, updates: Partial<Embalagem>) => {
    if (!user) throw new Error('Usuário não autenticado');

    const { data, error } = await supabase
      .from('embalagens')
      .update(updates)
      .eq('id', id)
      .eq('usuario_id', user.id)
      .select()
      .single();

    if (error) throw error;
    setEmbalagens(embalagens.map(e => e.id === id ? data : e));
    toast.success('Embalagem atualizada!');
    return data;
  };

  const deleteEmbalagem = async (id: string) => {
    if (!user) throw new Error('Usuário não autenticado');

    const { error } = await supabase
      .from('embalagens')
      .delete()
      .eq('id', id)
      .eq('usuario_id', user.id);

    if (error) throw error;
    setEmbalagens(embalagens.filter(e => e.id !== id));
    toast.success('Embalagem deletada!');
  };

  useEffect(() => {
    if (user) fetchEmbalagens();
  }, [user]);

  return {
    embalagens,
    loading,
    createEmbalagem,
    updateEmbalagem,
    deleteEmbalagem,
    refetch: fetchEmbalagens,
  };
}
