import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface CategoriaFinanceira {
  id: string;
  usuario_id: string;
  nome: string;
  tipo: string;
  cor?: string;
  icone?: string;
  created_at?: string;
  updated_at?: string;
}

export function useCategoriasFinanceiras() {
  const { user } = useAuth();
  const [categorias, setCategorias] = useState<CategoriaFinanceira[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchCategorias = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('categorias_financeiras')
        .select('*')
        .eq('usuario_id', user.id)
        .order('nome');

      if (error) throw error;
      setCategorias(data || []);
    } catch (err: any) {
      console.error('Erro ao buscar categorias financeiras:', err);
      toast.error('Erro ao carregar categorias: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const createCategoria = async (categoria: Omit<CategoriaFinanceira, 'id' | 'usuario_id' | 'created_at' | 'updated_at'>) => {
    if (!user) throw new Error('Usuário não autenticado');

    const { data, error } = await supabase
      .from('categorias_financeiras')
      .insert({ ...categoria, usuario_id: user.id })
      .select()
      .single();

    if (error) throw error;
    setCategorias([...categorias, data]);
    toast.success('Categoria criada com sucesso!');
    return data;
  };

  const updateCategoria = async (id: string, updates: Partial<CategoriaFinanceira>) => {
    if (!user) throw new Error('Usuário não autenticado');

    const { data, error } = await supabase
      .from('categorias_financeiras')
      .update(updates)
      .eq('id', id)
      .eq('usuario_id', user.id)
      .select()
      .single();

    if (error) throw error;
    setCategorias(categorias.map(c => c.id === id ? data : c));
    toast.success('Categoria atualizada!');
    return data;
  };

  const deleteCategoria = async (id: string) => {
    if (!user) throw new Error('Usuário não autenticado');

    const { error } = await supabase
      .from('categorias_financeiras')
      .delete()
      .eq('id', id)
      .eq('usuario_id', user.id);

    if (error) throw error;
    setCategorias(categorias.filter(c => c.id !== id));
    toast.success('Categoria deletada!');
  };

  useEffect(() => {
    if (user) fetchCategorias();
  }, [user]);

  return {
    categorias,
    loading,
    createCategoria,
    updateCategoria,
    deleteCategoria,
    refetch: fetchCategorias,
  };
}
