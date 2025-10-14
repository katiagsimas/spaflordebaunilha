import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface Ingrediente {
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

export function useIngredientes() {
  const { user } = useAuth();
  const [ingredientes, setIngredientes] = useState<Ingrediente[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchIngredientes = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('ingredientes')
        .select('*')
        .eq('usuario_id', user.id)
        .order('nome');

      if (error) throw error;
      setIngredientes(data || []);
    } catch (err: any) {
      console.error('Erro ao buscar ingredientes:', err);
      toast.error('Erro ao carregar ingredientes: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const createIngrediente = async (ingrediente: Omit<Ingrediente, 'id' | 'usuario_id' | 'created_at' | 'updated_at'>) => {
    if (!user) throw new Error('Usuário não autenticado');

    const { data, error } = await supabase
      .from('ingredientes')
      .insert({ ...ingrediente, usuario_id: user.id })
      .select()
      .single();

    if (error) throw error;
    setIngredientes([...ingredientes, data]);
    toast.success('Ingrediente criado com sucesso!');
    return data;
  };

  const updateIngrediente = async (id: string, updates: Partial<Ingrediente>) => {
    if (!user) throw new Error('Usuário não autenticado');

    const { data, error } = await supabase
      .from('ingredientes')
      .update(updates)
      .eq('id', id)
      .eq('usuario_id', user.id)
      .select()
      .single();

    if (error) throw error;
    setIngredientes(ingredientes.map(i => i.id === id ? data : i));
    toast.success('Ingrediente atualizado!');
    return data;
  };

  const deleteIngrediente = async (id: string) => {
    if (!user) throw new Error('Usuário não autenticado');

    const { error } = await supabase
      .from('ingredientes')
      .delete()
      .eq('id', id)
      .eq('usuario_id', user.id);

    if (error) throw error;
    setIngredientes(ingredientes.filter(i => i.id !== id));
    toast.success('Ingrediente deletado!');
  };

  useEffect(() => {
    if (user) fetchIngredientes();
  }, [user]);

  return {
    ingredientes,
    loading,
    createIngrediente,
    updateIngrediente,
    deleteIngrediente,
    refetch: fetchIngredientes,
  };
}
