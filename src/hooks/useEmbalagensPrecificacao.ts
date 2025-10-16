import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface EmbalagemPrecificacao {
  id: string;
  usuario_id: string;
  tipo_embalagem_id: string;
  marca: string | null;
  preco: number;
  data_atualizacao: string;
  created_at: string;
  updated_at: string;
  tipo_embalagem?: {
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

export function useEmbalagensPrecificacao() {
  const [embalagens, setEmbalagens] = useState<EmbalagemPrecificacao[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchEmbalagens = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      const { data, error } = await supabase
        .from('embalagens')
        .select(`
          *,
          tipo_embalagem:tipos_embalagens (
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
      setEmbalagens(data || []);
    } catch (error) {
      console.error('Erro ao buscar embalagens:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar as embalagens.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const createEmbalagem = async (dados: {
    tipo_embalagem_id: string;
    marca?: string;
    preco: number;
  }) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      const { data, error } = await supabase
        .from('embalagens')
        .insert([{
          usuario_id: user.id,
          tipo_embalagem_id: dados.tipo_embalagem_id,
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
          tipo_embalagem:tipos_embalagens (
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

      setEmbalagens(prev => [data, ...prev]);

      toast({
        title: '✅ Sucesso',
        description: 'Embalagem cadastrada com sucesso!',
      });

      return data;
    } catch (error: any) {
      console.error('Erro ao criar embalagem:', error);
      
      if (error.code === '23505') {
        throw new Error('Este tipo de embalagem já foi cadastrado!');
      }
      
      throw error;
    }
  };

  const updateEmbalagem = async (
    id: string,
    dados: {
      marca?: string;
      preco: number;
    }
  ) => {
    try {
      const { error } = await supabase
        .from('embalagens')
        .update({
          marca: dados.marca?.trim() || null,
          preco: dados.preco,
        })
        .eq('id', id);

      if (error) throw error;

      await fetchEmbalagens();

      toast({
        title: '✅ Atualizado',
        description: 'Embalagem atualizada com sucesso!',
      });
    } catch (error) {
      console.error('Erro ao atualizar embalagem:', error);
      throw error;
    }
  };

  useEffect(() => {
    fetchEmbalagens();
  }, []);

  return {
    embalagens,
    loading,
    createEmbalagem,
    updateEmbalagem,
    refetch: fetchEmbalagens,
  };
}
