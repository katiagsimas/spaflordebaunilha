import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
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
  unidade_medida_id?: string;
  tipo_insumo_id?: string;
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

async function fetchEstoqueItens(activeGroupId: string): Promise<EstoqueItem[]> {
  const { data, error } = await supabase
    .from('estoque' as any)
    .select('*')
    .eq('owner_group_id', activeGroupId)
    .order('updated_at', { ascending: false });

  if (error) throw error;

  const items = (data || []) as any[];
  const ingredienteIds = items.filter(i => i.ingrediente_id).map(i => i.ingrediente_id);
  const embalagemIds = items.filter(i => i.embalagem_id).map(i => i.embalagem_id);

  const ingredientesMap: Record<string, { nome: string; unidade: string; unidade_medida_id: string; tipo_insumo_id: string }> = {};
  const embalagensMap: Record<string, { nome: string; unidade: string; unidade_medida_id: string; tipo_insumo_id: string }> = {};

  const buscarIngredientes = async () => {
    const { data: ingredientes } = await supabase
      .from('ingredientes')
      .select('id, tipo_insumo_id, tipos_insumos:tipo_insumo_id(descricao, unidade_medida_id, unidades_medida:unidade_medida_id(sigla))')
      .in('id', ingredienteIds) as any;
    (ingredientes || []).forEach((ing: any) => {
      ingredientesMap[ing.id] = {
        nome: ing.tipos_insumos?.descricao || 'Insumo',
        unidade: ing.tipos_insumos?.unidades_medida?.sigla || '',
        unidade_medida_id: ing.tipos_insumos?.unidade_medida_id || '',
        tipo_insumo_id: ing.tipo_insumo_id || '',
      };
    });
  };

  const buscarEmbalagens = async () => {
    const { data: embalagens } = await supabase
      .from('embalagens')
      .select('id, tipo_insumo_id, tipos_insumos:tipo_insumo_id(descricao, unidade_medida_id, unidades_medida:unidade_medida_id(sigla))')
      .in('id', embalagemIds) as any;
    (embalagens || []).forEach((emb: any) => {
      embalagensMap[emb.id] = {
        nome: emb.tipos_insumos?.descricao || 'Embalagem',
        unidade: emb.tipos_insumos?.unidades_medida?.sigla || '',
        unidade_medida_id: emb.tipos_insumos?.unidade_medida_id || '',
        tipo_insumo_id: emb.tipo_insumo_id || '',
      };
    });
  };

  const promises: Promise<void>[] = [];
  if (ingredienteIds.length > 0) promises.push(buscarIngredientes());
  if (embalagemIds.length > 0) promises.push(buscarEmbalagens());
  await Promise.all(promises);

  return items.map(item => ({
    ...item,
    nome_insumo: item.tipo === 'ingrediente'
      ? ingredientesMap[item.ingrediente_id]?.nome || 'Insumo'
      : embalagensMap[item.embalagem_id]?.nome || 'Embalagem',
    unidade: item.tipo === 'ingrediente'
      ? ingredientesMap[item.ingrediente_id]?.unidade || ''
      : embalagensMap[item.embalagem_id]?.unidade || '',
    unidade_medida_id: item.tipo === 'ingrediente'
      ? ingredientesMap[item.ingrediente_id]?.unidade_medida_id || ''
      : embalagensMap[item.embalagem_id]?.unidade_medida_id || '',
    tipo_insumo_id: item.tipo === 'ingrediente'
      ? ingredientesMap[item.ingrediente_id]?.tipo_insumo_id || ''
      : embalagensMap[item.embalagem_id]?.tipo_insumo_id || '',
  })) as EstoqueItem[];
}

async function fetchEstoqueMovimentacoes(
  activeGroupId: string,
  estoqueId?: string,
): Promise<EstoqueMovimentacao[]> {
  let query = (supabase.from('estoque_movimentacoes' as any) as any)
    .select('*')
    .eq('owner_group_id', activeGroupId)
    .order('created_at', { ascending: false })
    .limit(500);

  if (estoqueId) {
    query = query.eq('estoque_id', estoqueId);
  }

  const { data, error } = await query;
  if (error) throw error;
  return (data || []) as EstoqueMovimentacao[];
}

export function useEstoque() {
  const { user } = useAuth();
  const { activeGroupId } = useGroup();
  const queryClient = useQueryClient();
  const [movEstoqueId, setMovEstoqueId] = useState<string | undefined>(undefined);

  // ============ Itens ============
  const itensQuery = useQuery({
    queryKey: ['estoque', activeGroupId],
    queryFn: () => fetchEstoqueItens(activeGroupId as string),
    enabled: !!activeGroupId,
    meta: {
      onError: () => toast.error('Erro ao carregar estoque'),
    },
  });

  const itens = itensQuery.data ?? [];
  const loading = itensQuery.isLoading;

  // ============ Movimentações ============
  const movimentacoesQuery = useQuery({
    queryKey: ['estoque_movimentacoes', activeGroupId, movEstoqueId],
    queryFn: () => fetchEstoqueMovimentacoes(activeGroupId as string, movEstoqueId),
    enabled: false,
  });

  const movimentacoes = movimentacoesQuery.data ?? [];
  const loadingMov = movimentacoesQuery.isFetching;

  const fetchMovimentacoes = async (estoqueId?: string) => {
    if (!activeGroupId) return;
    setMovEstoqueId(estoqueId);
    await queryClient.fetchQuery({
      queryKey: ['estoque_movimentacoes', activeGroupId, estoqueId],
      queryFn: () => fetchEstoqueMovimentacoes(activeGroupId, estoqueId),
    });
  };

  const invalidateEstoque = () => {
    queryClient.invalidateQueries({ queryKey: ['estoque', activeGroupId] });
    queryClient.invalidateQueries({ queryKey: ['estoque_movimentacoes', activeGroupId] });
  };

  // ============ Mutations ============
  const registrarEntradaMutation = useMutation({
    mutationFn: async (params: {
      tipo: 'ingrediente' | 'embalagem';
      ingrediente_id?: string;
      embalagem_id?: string;
      quantidade: number;
      custo_total: number;
      estoque_minimo?: number | null;
      observacao?: string;
    }) => {
      if (!user || !activeGroupId) throw new Error('Sessão inválida');

      const custoUnitario = params.quantidade > 0 ? params.custo_total / params.quantidade : 0;

      const filterCol = params.tipo === 'ingrediente' ? 'ingrediente_id' : 'embalagem_id';
      const filterVal = params.tipo === 'ingrediente' ? params.ingrediente_id : params.embalagem_id;

      const { data: existing } = await (supabase.from('estoque' as any) as any)
        .select('*')
        .eq('owner_group_id', activeGroupId)
        .eq(filterCol, filterVal)
        .maybeSingle();

      let estoqueId: string;

      if (existing) {
        const qtdAtual = Number(existing.quantidade_atual) || 0;
        const custoMedioAtual = Number(existing.custo_medio) || 0;
        const novaQtd = qtdAtual + params.quantidade;
        const novoCustoMedio = novaQtd > 0
          ? (qtdAtual * custoMedioAtual + params.quantidade * custoUnitario) / novaQtd
          : 0;

        const { error } = await (supabase.from('estoque' as any) as any)
          .update({
            quantidade_atual: novaQtd,
            custo_medio: novoCustoMedio,
            estoque_minimo: params.estoque_minimo !== undefined ? params.estoque_minimo : existing.estoque_minimo,
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
          custo_medio: custoUnitario,
          estoque_minimo: params.estoque_minimo || null,
        };

        const { data: created, error } = await (supabase.from('estoque' as any) as any)
          .insert(insertData)
          .select('id')
          .single();

        if (error) throw error;
        estoqueId = created.id;
      }

      const { error: movError } = await (supabase.from('estoque_movimentacoes' as any) as any)
        .insert({
          estoque_id: estoqueId,
          usuario_id: user.id,
          owner_group_id: activeGroupId,
          tipo_movimentacao: 'entrada',
          quantidade: params.quantidade,
          custo_unitario: custoUnitario,
          custo_total: Math.round(params.custo_total * 100) / 100,
          observacao: params.observacao || null,
        });

      if (movError) throw movError;
    },
    onSuccess: () => {
      toast.success('Entrada registrada com sucesso!');
      invalidateEstoque();
    },
    onError: (err: any) => {
      console.error('Erro ao registrar entrada:', err);
      toast.error('Erro ao registrar entrada');
    },
  });

  const registrarSaidaManualMutation = useMutation({
    mutationFn: async (params: {
      estoque_id: string;
      quantidade: number;
      motivo: string;
      tipo_ajuste: string;
    }) => {
      if (!user || !activeGroupId) throw new Error('Sessão inválida');

      const item = (itensQuery.data ?? []).find(i => i.id === params.estoque_id);
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
          custo_unitario: item.custo_medio,
          custo_total: item.custo_medio * params.quantidade,
          observacao: params.motivo,
        });
      if (movError) throw movError;
    },
    onSuccess: () => {
      toast.success('Ajuste registrado com sucesso!');
      invalidateEstoque();
    },
    onError: (err: any) => {
      console.error('Erro ao registrar ajuste:', err);
      toast.error('Erro ao registrar ajuste');
    },
  });

  const atualizarEstoqueMinimoMutation = useMutation({
    mutationFn: async ({ estoqueId, minimo }: { estoqueId: string; minimo: number | null }) => {
      const { error } = await (supabase.from('estoque' as any) as any)
        .update({ estoque_minimo: minimo })
        .eq('id', estoqueId);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Estoque mínimo atualizado!');
      invalidateEstoque();
    },
    onError: (err: any) => {
      console.error('Erro ao atualizar estoque mínimo:', err);
      toast.error('Erro ao atualizar estoque mínimo');
    },
  });

  const updateEstoqueItemMutation = useMutation({
    mutationFn: async ({ 
      estoqueId, 
      quantidade, 
      custoMedio,
      estoqueMinimo 
    }: { 
      estoqueId: string; 
      quantidade: number;
      custoMedio?: number;
      estoqueMinimo?: number | null;
    }) => {
      const updateData: any = { 
        quantidade_atual: quantidade,
      };
      if (custoMedio !== undefined) updateData.custo_medio = custoMedio;
      if (estoqueMinimo !== undefined) updateData.estoque_minimo = estoqueMinimo;

      const { error } = await (supabase.from('estoque' as any) as any)
        .update(updateData)
        .eq('id', estoqueId);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Item atualizado com sucesso!');
      invalidateEstoque();
    },
    onError: (err: any) => {
      console.error('Erro ao atualizar item do estoque:', err);
      toast.error('Erro ao atualizar item');
    },
  });

  const deleteEstoqueItemMutation = useMutation({
    mutationFn: async (estoqueId: string) => {
      const { error } = await (supabase.from('estoque' as any) as any)
        .delete()
        .eq('id', estoqueId);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Item removido do estoque');
      invalidateEstoque();
    },
    onError: (err: any) => {
      console.error('Erro ao excluir item do estoque:', err);
      toast.error('Erro ao excluir item');
    },
  });

  const duplicateEstoqueItemMutation = useMutation({
    mutationFn: async (item: EstoqueItem) => {
      if (!user || !activeGroupId) throw new Error('Sessão inválida');
      
      const { id, created_at, updated_at, nome_insumo, unidade, ...insertData } = item as any;
      insertData.usuario_id = user.id;
      insertData.owner_group_id = activeGroupId;

      const { error } = await (supabase.from('estoque' as any) as any)
        .insert(insertData);
      
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Item duplicado com sucesso!');
      invalidateEstoque();
    },
    onError: (err: any) => {
      console.error('Erro ao duplicar item do estoque:', err);
      toast.error('Erro ao duplicar item');
    },
  });

  // Public wrappers preserve original signatures
  const registrarEntrada = (params: Parameters<typeof registrarEntradaMutation.mutateAsync>[0]) =>
    registrarEntradaMutation.mutateAsync(params);

  const registrarSaidaManual = (params: Parameters<typeof registrarSaidaManualMutation.mutateAsync>[0]) =>
    registrarSaidaManualMutation.mutateAsync(params);

  const atualizarEstoqueMinimo = (estoqueId: string, minimo: number | null) =>
    atualizarEstoqueMinimoMutation.mutateAsync({ estoqueId, minimo });

  const updateEstoqueItem = (params: Parameters<typeof updateEstoqueItemMutation.mutateAsync>[0]) =>
    updateEstoqueItemMutation.mutateAsync(params);

  const deleteEstoqueItem = (estoqueId: string) =>
    deleteEstoqueItemMutation.mutateAsync(estoqueId);

  const duplicateEstoqueItem = (item: EstoqueItem) =>
    duplicateEstoqueItemMutation.mutateAsync(item);

  const valorTotal = itens.reduce((acc, item) => acc + (item.quantidade_atual * item.custo_medio), 0);
  const itensAbaixoMinimo = itens.filter(i => i.estoque_minimo != null && i.quantidade_atual < (i.estoque_minimo || 0));

  return {
    itens,
    movimentacoes,
    loading,
    loadingMov,
    valorTotal,
    itensAbaixoMinimo,
    fetchEstoque: () => queryClient.invalidateQueries({ queryKey: ['estoque', activeGroupId] }),
    fetchMovimentacoes,
    registrarEntrada,
    registrarSaidaManual,
    atualizarEstoqueMinimo,
    updateEstoqueItem,
    deleteEstoqueItem,
    duplicateEstoqueItem,
  };
}
