import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface IngredientePrecificacao {
  id: string;
  usuario_id: string;
  tipo_insumo_id: string;
  marca: string | null;
  preco: number;
  data_atualizacao: string;
  created_at: string;
  updated_at: string;
  tipo_insumo?: {
    id: string;
    descricao: string;
    quantidade_embalagem: number;
    unidade_medida_id: string;
    unidade_medida: {
      nome: string;
      sigla: string;
    };
  };
}

export function useIngredientesPrecificacao() {
  const [ingredientes, setIngredientes] = useState<IngredientePrecificacao[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchIngredientes = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      const { data, error } = await supabase
        .from('ingredientes')
        .select(`
          *,
          tipo_insumo:tipos_insumos (
            id,
            descricao,
            quantidade_embalagem,
            unidade_medida_id,
            unidade_medida:unidades_medida (
              nome,
              sigla
            )
          )
        `)
        .eq('usuario_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setIngredientes(data || []);
    } catch (error) {
      console.error('Erro ao buscar ingredientes:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar os ingredientes.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const createIngrediente = async (dados: {
    tipo_insumo_id: string;
    marca?: string;
    preco: number;
  }) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      const { data, error } = await supabase
        .from('ingredientes')
        .insert([{
          usuario_id: user.id,
          tipo_insumo_id: dados.tipo_insumo_id,
          marca: dados.marca?.trim() || null,
          preco: dados.preco,
          data_atualizacao: new Date().toISOString().split('T')[0],
          // Campos legados (manter compatibilidade com schema antigo)
          nome: '',
          quantidade: 0,
          unidade_medida: '',
        }])
        .select(`
          *,
          tipo_insumo:tipos_insumos (
            id,
            descricao,
            quantidade_embalagem,
            unidade_medida_id,
            unidade_medida:unidades_medida (
              nome,
              sigla
            )
          )
        `)
        .single();

      if (error) throw error;

      setIngredientes(prev => [data, ...prev]);

      toast({
        title: '✅ Sucesso',
        description: 'Ingrediente cadastrado com sucesso!',
      });

      return data;
    } catch (error: any) {
      console.error('Erro ao criar ingrediente:', error);
      
      if (error.code === '23505') {
        throw new Error('Este tipo de ingrediente já foi cadastrado!');
      }
      
      throw error;
    }
  };

  const updateIngrediente = async (
    id: string,
    dados: {
      marca?: string;
      preco: number;
    }
  ) => {
    try {
      const { error } = await supabase
        .from('ingredientes')
        .update({
          marca: dados.marca?.trim() || null,
          preco: dados.preco,
        })
        .eq('id', id);

      if (error) throw error;

      await fetchIngredientes();

      toast({
        title: '✅ Atualizado',
        description: 'Ingrediente atualizado com sucesso!',
      });
    } catch (error) {
      console.error('Erro ao atualizar ingrediente:', error);
      throw error;
    }
  };

  useEffect(() => {
    fetchIngredientes();
  }, []);

  return {
    ingredientes,
    loading,
    createIngrediente,
    updateIngrediente,
    refetch: fetchIngredientes,
  };
}
