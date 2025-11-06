import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface CategoriaTag {
  id: string;
  nome: string;
  descricao: string;
  icone: string;
  ordem: number;
  ativo: boolean;
}

export interface Tag {
  id: string;
  categoria_id: string;
  nome: string;
  cor: string;
  ordem: number;
  ativo: boolean;
}

export function useTags() {
  const [categorias, setCategorias] = useState<CategoriaTag[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    carregarDados();
  }, []);

  const carregarDados = async () => {
    try {
      setLoading(true);

      // Buscar categorias
      const { data: categoriasData, error: erroCat } = await supabase
        .from('categorias_tags')
        .select('*')
        .eq('ativo', true)
        .order('ordem');

      if (erroCat) throw erroCat;

      // Buscar tags
      const { data: tagsData, error: erroTags } = await supabase
        .from('tags')
        .select('*')
        .eq('ativo', true)
        .order('ordem');

      if (erroTags) throw erroTags;

      setCategorias(categoriasData || []);
      setTags(tagsData || []);
    } catch (error: any) {
      console.error('Erro ao carregar tags:', error);
      toast.error('Erro ao carregar tags');
    } finally {
      setLoading(false);
    }
  };

  const getTagsPorCategoria = (categoriaId: string) => {
    return tags.filter(tag => tag.categoria_id === categoriaId);
  };

  const getTagById = (tagId: string) => {
    return tags.find(tag => tag.id === tagId);
  };

  const getCategoriaById = (categoriaId: string) => {
    return categorias.find(cat => cat.id === categoriaId);
  };

  return {
    categorias,
    tags,
    loading,
    carregarDados,
    getTagsPorCategoria,
    getTagById,
    getCategoriaById,
  };
}
