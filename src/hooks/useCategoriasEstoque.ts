import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface CategoriaEstoque {
  id: string;
  nome: string;
  descricao: string;
  icone: string;
  cor: string;
  ordem: number;
  editavel: boolean;
  ativo: boolean;
  criado_em: string;
}

export function useCategoriasEstoque() {
  const [categorias, setCategorias] = useState<CategoriaEstoque[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchCategorias = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('categorias_estoque')
        .select('*')
        .eq('ativo', true)
        .order('ordem');

      if (error) throw error;
      setCategorias(data || []);
    } catch (err: any) {
      console.error('Erro ao buscar categorias de estoque:', err);
      toast.error('Erro ao carregar categorias de estoque: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategorias();
  }, []);

  return {
    categorias,
    loading,
    refetch: fetchCategorias,
  };
}
