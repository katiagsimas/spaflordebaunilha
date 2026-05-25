import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useGroup } from '@/contexts/GroupContext';
import { toast } from 'sonner';

export interface EstoqueItem {
  id: string;
  usuario_id: string;
  owner_group_id: string | null;
  tipo: 'ingrediente' | 'embalagem';
  ingrediente_id: string | null;
  embalagem_id: string | null;
  quantidade_atual: number;
  custo_medio: number;
  estoque_minimo: number | null;
  created_at: string;
  updated_at: string;
  // Joined
  nome_insumo?: string;
  unidade?: string;
}

export interface EstoqueMovimentacao {
  id: string;
  estoque_id: string;
  usuario_id: string;
  owner_group_id: string | null;
  tipo_movimentacao: 'entrada' | 'saida_producao' | 'saida_manual' | 'ajuste';
  quantidade: number;
  custo_unitario: number | null;
  custo_total: number | null;
  referencia_tipo: string | null;
  referencia_id: string | null;
  observacao: string | null;
  created_at: string;
}

export function useEstoque() {
  const { user } = useAuth();
  const { activeGroupId } = useGroup();
  const [itens, setItens] = useState<EstoqueItem[]>([]);
  const [movimentacoes, setMovimentacoes] = useState<EstoqueMovimentacao[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMov, setLoadingMov] = useState(false);

  const fetchEstoque = useCallback(async () => {
    if (!activeGroupId) { setItens([]); setLoading(false); return; }
    try {
      setLoading(true);
      // Fetch estoque items
      const { data, error } = await supabase
        .from('estoque' as any)
        .select('*')
        .eq('owner_group_id', activeGroupId)
        .order('updated_at', { ascending: false });

      if (error) throw error;

      // Enrich with insumo names
      const items = (data || []) as any[];
      const ingredienteIds = items.filter(i => i.ingrediente_id).map(i => i.ingrediente_id);
      const embalagemIds = items.filter(i => i.embalagem_id).map(i => i.embalagem_id);

      let ingredientesMap: Record<string, { nome: string; unidade: string }> = {};
      let embalagensMap: Record<string, { nome: string; unidade: string }> = {};

      if (ingredienteIds.length > 0) {
        const { data: ingredientes } = await supabase
          .from('ingredientes')
          .select('id, tipo_insumo_id, tipos_insumos:tipo_insumo_id(descricao, unidade_medida_id, unidades_medida:unidade_medida_id(sigla))')
          .in('id', ingredienteIds) as any;
        (ingredientes || []).forEach((ing: any) => {
          ingredientesMap[ing.id] = {
            nome: ing.tipos_insumos?.descricao || 'Ingrediente',
            unidade: ing.tipos_insumos?.unidades_medida?.sigla || '',
          };
        });
      }

      if (embalagemIds.length > 0) {
        const { data: embalagens } = await supabase
          .from('embalagens')
          .select('id, tipo_insumo_id, tipos_insumos:tipo_insumo_id(descricao, unidade_medida_id, unidades_medida:unidade_medida_id(sigla))')
          .in('id', embalagemIds) as any;
        (embalagens || []).forEach((emb: any) => {
          embalagensMap[emb.id] = {
            nome: emb.tipos_insumos?.descricao || 'Embalagem',
            unidade: emb.tipos_insumos?.unidades_medida?.sigla || '',
          };
        });
      }

      const enriched: EstoqueItem[] = items.map(item => ({
        ...item,
        nome_insumo: item.tipo === 'ingrediente'
          ? ingredientesMap[item.ingrediente_id]?.nome || 'Ingrediente'
          : embalagensMap[item.embalagem_id]?.nome || 'Embalagem',
        unidade: item.tipo === 'ingrediente'
          ? ingredientesMap[item.ingrediente_id]?.unidade || ''
          : embalagensMap[item.embalagem_id]?.unidade || '',
      }));

      setItens(enriched);
    } catch (err: any) {
      console.error('Erro ao carregar estoque:', err);
      toast.error('Erro ao carregar estoque');
    } finally {
      setLoading(false);
    }
  }, [activeGroupId]);

  const fetchMovimentacoes = useCallback(async (estoqueId?: string) => {
    if (!activeGroupId) { setMovimentacoes([]); return; }
    try {
      setLoadingMov(true);
      let query = (supabase.from('estoque_movimentacoes' as any) as any)
        .select('*')
        .eq('owner_group_id', activeGroupId)
        .order('created_at', { ascending: false })
        .limit(200);

      if (estoqueId) {
        query = query.eq('estoque_id', estoqueId);
      }

      const { data, error } = await query;
      if (error) throw error;
      setMovimentacoes((data || []) as EstoqueMovimentacao[]);
    } catch (err: any) {
      console.error('Erro ao carregar movimentações:', err);
    } finally {
      setLoadingMov(false);
    }
  }, [activeGroupId]);

  const registrarEntrada = async (params: {
    tipo: 'ingrediente' | 'embalagem';
    ingrediente_id?: string;
    embalagem_id?: string;
    quantidade: number;
    custo_total: number;
    observacao?: string;
  }) => {
    if (!user || !activeGroupId) return;

    const custoUnitario = params.quantidade > 0 ? params.custo_total / params.quantidade : 0;

    // Find or create estoque item
    const filterCol = params.tipo === 'ingrediente' ? 'ingrediente_id' : 'embalagem_id';
    const filterVal = params.tipo === 'ingrediente' ? params.ingrediente_id : params.embalagem_id;

    let { data: existing } = await (supabase.from('estoque' as any) as any)
      .select('*')
      .eq('owner_group_id', activeGroupId)
      .eq(filterCol, filterVal)
      .maybeSingle();

    let estoqueId: string;

    if (existing) {
      // Update custo medio ponderado
      const qtdAtual = Number(existing.quantidade_atual) || 0;
      const custoMedioAtual = Number(existing.custo_medio) || 0;
      const novaQtd = qtdAtual + params.quantidade;
      const novoCustoMedio = novaQtd > 0
        ? (qtdAtual * custoMedioAtual + params.quantidade * custoUnitario) / novaQtd
        : 0;

      const { error } = await (supabase.from('estoque' as any) as any)
        .update({
          quantidade_atual: novaQtd,
          custo_medio: Math.round(novoCustoMedio * 100) / 100,
        })
        .eq('id', existing.id);

      if (error) throw error;
      estoqueId = existing.id;
    } else {
      const insertData: any = {
        usuario_id: user.id,
        owner_group_id: activeGroupId,
        tipo: params.tipo,
        ingrediente_id: params.ingrediente_id || null,
        embalagem_id: params.embalagem_id || null,
        quantidade_atual: params.quantidade,
        custo_medio: Math.round(custoUnitario * 100) / 100,
      };

      const { data: created, error } = await (supabase.from('estoque' as any) as any)
        .insert(insertData)
        .select('id')
        .single();

      if (error) throw error;
      estoqueId = created.id;
    }

    // Register movimentação
    const { error: movError } = await (supabase.from('estoque_movimentacoes' as any) as any)
      .insert({
        estoque_id: estoqueId,
        usuario_id: user.id,
        owner_group_id: activeGroupId,
        tipo_movimentacao: 'entrada',
        quantidade: params.quantidade,
        custo_unitario: Math.round(custoUnitario * 100) / 100,
        custo_total: Math.round(params.custo_total * 100) / 100,
        observacao: params.observacao || null,
      });

    if (movError) throw movError;
    toast.success('Entrada registrada com sucesso!');
    await fetchEstoque();
  };

  const registrarSaidaManual = async (params: {
    estoque_id: string;
    quantidade: number;
    motivo: string;
    tipo_ajuste: string;
  }) => {
    if (!user || !activeGroupId) return;

    const item = itens.find(i => i.id === params.estoque_id);
    if (!item) throw new Error('Item não encontrado');

    const novaQtd = item.quantidade_atual - params.quantidade;

    const { error } = await (supabase.from('estoque' as any) as any)
      .update({ quantidade_atual: Math.max(0, novaQtd) })
      .eq('id', params.estoque_id);
    if (error) throw error;

    const { error: movError } = await (supabase.from('estoque_movimentacoes' as any) as any)
      .insert({
        estoque_id: params.estoque_id,
        usuario_id: user.id,
        owner_group_id: activeGroupId,
        tipo_movimentacao: params.tipo_ajuste === 'correcao' ? 'ajuste' : 'saida_manual',
        quantidade: params.quantidade,
        custo_unitario: Math.round(item.custo_medio * 100) / 100,
        custo_total: Math.round(item.custo_medio * params.quantidade * 100) / 100,
        observacao: params.motivo,
      });
    if (movError) throw movError;

    toast.success('Ajuste registrado com sucesso!');
    await fetchEstoque();
  };

  const atualizarEstoqueMinimo = async (estoqueId: string, minimo: number | null) => {
    const { error } = await (supabase.from('estoque' as any) as any)
      .update({ estoque_minimo: minimo })
      .eq('id', estoqueId);
    if (error) throw error;
    toast.success('Estoque mínimo atualizado!');
    await fetchEstoque();
  };

  useEffect(() => {
    fetchEstoque();
  }, [fetchEstoque]);

  const valorTotal = itens.reduce((acc, item) => acc + (item.quantidade_atual * item.custo_medio), 0);
  const itensAbaixoMinimo = itens.filter(i => i.estoque_minimo != null && i.quantidade_atual < (i.estoque_minimo || 0));

  return {
    itens,
    movimentacoes,
    loading,
    loadingMov,
    valorTotal,
    itensAbaixoMinimo,
    fetchEstoque,
    fetchMovimentacoes,
    registrarEntrada,
    registrarSaidaManual,
    atualizarEstoqueMinimo,
  };
}
