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

  const createCategoria = async (nome: string) => {
    if (!user) throw new Error('Usuário não autenticado');

    const { data, error } = await supabase
      .from('categorias')
      .insert({ nome, usuario_id: user.id, ativo: true, padrao_sistema: false })
      .select()
      .single();

    if (error) throw error;
    setCategorias(prev => [...prev, data].sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR')));
    toast.success('Categoria criada!');
    return data;
  };

  const updateCategoria = async (id: string, updates: Partial<Categoria>) => {
    if (!user) throw new Error('Usuário não autenticado');

    const categoria = categorias.find(c => c.id === id);
    if (categoria?.padrao_sistema) {
      // Categorias padrão só permitem alteração de ativo
      const { nome, padrao_sistema, ...allowedUpdates } = updates;
      updates = allowedUpdates;
    }

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

  const deleteCategoria = async (id: string) => {
    if (!user) throw new Error('Usuário não autenticado');

    const categoria = categorias.find(c => c.id === id);
    if (categoria?.padrao_sistema) {
      toast.error('Categorias padrão do sistema não podem ser removidas.');
      return;
    }

    const { data: receitasCount, error: checkError } = await supabase
      .from('receitas')
      .select('id')
      .eq('categoria_id' as any, id);

    if (checkError) throw checkError;

    if (receitasCount && receitasCount.length > 0) {
      toast.error(`Esta categoria está vinculada a ${receitasCount.length} receita(s). Remova o vínculo antes de excluir.`);
      return;
    }

    const { error } = await supabase
      .from('categorias')
      .delete()
      .eq('id', id)
      .eq('usuario_id', user.id);

    if (error) throw error;
    setCategorias(prev => prev.filter(c => c.id !== id));
    toast.success('Categoria removida!');
  };

  useEffect(() => {
    if (user) fetchCategorias();
  }, [user]);

  return {
    categorias,
    loading,
    updateCategoria,
    createCategoria,
    deleteCategoria,
    refetch: fetchCategorias,
    fetchCategoriasAtivas,
  };
}
