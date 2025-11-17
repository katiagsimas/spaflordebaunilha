import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface Categoria {
  id: string;
  usuario_id: string;
  nome: string;
  ativo: boolean;
  padrao_sistema: boolean;
  created_at?: string;
  updated_at?: string;
}

export function useCategorias() {
  const { user } = useAuth();
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchCategorias = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('categorias')
        .select('*')
        .eq('usuario_id', user.id)
        .order('nome');

      if (error) throw error;
      setCategorias(data || []);
    } catch (err: any) {
      console.error('Erro ao buscar categorias:', err);
      toast.error('Erro ao carregar categorias: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Função para buscar apenas categorias ativas (para uso em formulários)
  const fetchCategoriasAtivas = async () => {
    if (!user) return [];
    
    try {
      const { data, error } = await supabase
        .from('categorias')
        .select('*')
        .eq('usuario_id', user.id)
        .eq('ativo', true)
        .order('nome');

      if (error) throw error;
      return data || [];
    } catch (err: any) {
      console.error('Erro ao buscar categorias ativas:', err);
      return [];
    }
  };


  const updateCategoria = async (id: string, updates: Partial<Categoria>) => {
    if (!user) throw new Error('Usuário não autenticado');

    const { data, error } = await supabase
      .from('categorias')
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


  useEffect(() => {
    if (user) fetchCategorias();
  }, [user]);

  return {
    categorias,
    loading,
    updateCategoria,
    refetch: fetchCategorias,
    fetchCategoriasAtivas,
  };
}
