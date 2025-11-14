import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface Encomenda {
  id: string;
  usuario_id: string;
  cliente: string;
  data_pedido: string;
  data_entrega: string;
  hora_entrega?: string;
  status: string;
  valor: number;
  observacoes?: string;
  telefone?: string;
  endereco?: string;
  numero?: string;
  cep?: string;
  desconto_percentual?: number;
  desconto_valor?: number;
  taxa_entrega?: number;
  topo_bolo?: number;
  outros?: number;
  topo_tema?: string;
  topo_aniversariante?: string;
  topo_idade?: string;
  topo_obs?: string;
  topo_imagens?: string[];
  pagamentos?: Array<{ valor: number; data: string; tipo_pagamento: string; pago?: boolean; banco_id?: string }>;
  saldo_restante?: number;
  conta_receber_id?: string | null;
  tags?: Array<{ id: string; nome: string; cor: string }>;
  created_at?: string;
  updated_at?: string;
}

export function useEncomendas() {
  const { user } = useAuth();
  const [encomendas, setEncomendas] = useState<Encomenda[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchEncomendas = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('encomendas')
        .select(`
          *,
          tags:encomendas_tags (
            tag:tags_encomendas (
              id,
              nome,
              cor
            )
          )
        `)
        .eq('usuario_id', user.id)
        .order('data_entrega', { ascending: false });

      if (error) throw error;
      
      // Converter topo_imagens, pagamentos e tags de JSON para arrays
      const encomendasFormatadas = (data || []).map(encomenda => ({
        ...encomenda,
        topo_imagens: Array.isArray(encomenda.topo_imagens) 
          ? encomenda.topo_imagens 
          : [],
        pagamentos: Array.isArray(encomenda.pagamentos)
          ? encomenda.pagamentos
          : [],
        tags: encomenda.tags?.map((t: any) => t.tag).filter(Boolean) || []
      }));
      
      setEncomendas(encomendasFormatadas as unknown as Encomenda[]);
    } catch (err: any) {
      console.error('Erro ao buscar encomendas:', err);
      toast.error('Erro ao carregar encomendas: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const createEncomenda = async (encomenda: Omit<Encomenda, 'id' | 'usuario_id' | 'created_at' | 'updated_at'>) => {
    if (!user) throw new Error('Usuário não autenticado');

    const { data, error } = await supabase
      .from('encomendas')
      .insert({ ...encomenda, usuario_id: user.id })
      .select()
      .single();

    if (error) throw error;
    
    const encomendaFormatada = {
      ...data,
      topo_imagens: Array.isArray(data.topo_imagens) ? data.topo_imagens : [],
      pagamentos: Array.isArray(data.pagamentos) ? data.pagamentos : []
    };
    
    setEncomendas([encomendaFormatada as unknown as Encomenda, ...encomendas]);
    toast.success('Encomenda criada!');
    return data;
  };

  const updateEncomenda = async (id: string, updates: Partial<Encomenda>) => {
    if (!user) throw new Error('Usuário não autenticado');

    const { data, error } = await supabase
      .from('encomendas')
      .update(updates)
      .eq('id', id)
      .eq('usuario_id', user.id)
      .select()
      .single();

    if (error) throw error;
    
    const encomendaFormatada = {
      ...data,
      topo_imagens: Array.isArray(data.topo_imagens) ? data.topo_imagens : [],
      pagamentos: Array.isArray(data.pagamentos) ? data.pagamentos : []
    };
    
    setEncomendas(encomendas.map(e => e.id === id ? encomendaFormatada as unknown as Encomenda : e));
    toast.success('Encomenda atualizada!');
    return data;
  };

  const deleteEncomenda = async (id: string) => {
    if (!user) throw new Error('Usuário não autenticado');

    const { error } = await supabase
      .from('encomendas')
      .delete()
      .eq('id', id)
      .eq('usuario_id', user.id);

    if (error) throw error;
    setEncomendas(encomendas.filter(e => e.id !== id));
    toast.success('Encomenda deletada!');
  };

  useEffect(() => {
    if (user) fetchEncomendas();
  }, [user]);

  return {
    encomendas,
    loading,
    createEncomenda,
    updateEncomenda,
    deleteEncomenda,
    refetch: fetchEncomendas,
  };
}
