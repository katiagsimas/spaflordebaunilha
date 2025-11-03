import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface CategoriaEstoque {
  id: string;
  usuario_id: string;
  nome: string;
  icone?: string;
  cor?: string;
  ativo: boolean;
  created_at?: string;
  updated_at?: string;
}

const CATEGORIAS_INICIAIS = [
  { nome: 'Secos/Farináceos', icone: '🌾', cor: '#D4A574' },
  { nome: 'Frios/Laticínios', icone: '🥚', cor: '#F5E6D3' },
  { nome: 'Chocolates/Cacau', icone: '🍫', cor: '#6B4423' },
  { nome: 'Confeitaria', icone: '🎨', cor: '#FF6B9D' },
  { nome: 'Embalagens', icone: '📦', cor: '#B8956A' },
  { nome: 'Decoração', icone: '🧁', cor: '#FFB4E5' },
];

export function useCategoriasEstoque() {
  const { user } = useAuth();
  const [categorias, setCategorias] = useState<CategoriaEstoque[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchCategorias = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('categorias_estoque')
        .select('*')
        .eq('usuario_id', user.id)
        .order('nome');

      if (error) throw error;

      // Se não houver categorias, criar as iniciais
      if (!data || data.length === 0) {
        await criarCategoriasIniciais();
        return;
      }

      setCategorias(data || []);
    } catch (err: any) {
      console.error('Erro ao buscar categorias de estoque:', err);
      toast.error('Erro ao carregar categorias de estoque: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const criarCategoriasIniciais = async () => {
    if (!user) return;

    try {
      const categoriasParaInserir = CATEGORIAS_INICIAIS.map(cat => ({
        ...cat,
        usuario_id: user.id,
        ativo: true,
      }));

      const { data, error } = await supabase
        .from('categorias_estoque')
        .insert(categoriasParaInserir)
        .select();

      if (error) throw error;
      setCategorias(data || []);
    } catch (err: any) {
      console.error('Erro ao criar categorias iniciais:', err);
      toast.error('Erro ao criar categorias iniciais');
    }
  };

  const createCategoria = async (categoria: Omit<CategoriaEstoque, 'id' | 'usuario_id' | 'created_at' | 'updated_at'>) => {
    if (!user) throw new Error('Usuário não autenticado');

    const { data, error } = await supabase
      .from('categorias_estoque')
      .insert({ ...categoria, usuario_id: user.id })
      .select()
      .single();

    if (error) throw error;
    setCategorias([...categorias, data]);
    toast.success('Categoria criada com sucesso!');
    return data;
  };

  const updateCategoria = async (id: string, updates: Partial<CategoriaEstoque>) => {
    if (!user) throw new Error('Usuário não autenticado');

    const { data, error } = await supabase
      .from('categorias_estoque')
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
      .from('categorias_estoque')
      .delete()
      .eq('id', id)
      .eq('usuario_id', user.id);

    if (error) throw error;
    setCategorias(categorias.filter(c => c.id !== id));
    toast.success('Categoria deletada!');
  };

  const toggleAtivo = async (id: string, ativo: boolean) => {
    return updateCategoria(id, { ativo });
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
    toggleAtivo,
    refetch: fetchCategorias,
  };
}
