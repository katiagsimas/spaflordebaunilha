// ============================================
// HOOK ESTOQUE SIMPLIFICADO V1
// ============================================

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { Item, ItemComEstoque, StatusEstoque, FiltrosEstoque } from '@/types/estoque';

export function useEstoqueSimplificado(filtros?: FiltrosEstoque) {
  const [itens, setItens] = useState<ItemComEstoque[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const getStatusEstoque = useCallback((saldo?: number, pontoMinimo?: number): StatusEstoque => {
    if (saldo === undefined || pontoMinimo === undefined) return 'sem_rastreio';
    if (saldo <= 0) return 'zerado';
    if (saldo <= pontoMinimo) return 'baixo';
    if (saldo <= pontoMinimo * 1.2) return 'atencao';
    return 'ok';
  }, []);

  const carregarItens = useCallback(async () => {
    try {
      setLoading(true);
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');
      
      // Buscar itens
      let queryItens = supabase
        .from('itens')
        .select('*')
        .eq('ativo', true)
        .order('nome');

      // Aplicar filtros se existirem
      if (filtros?.tipo) {
        queryItens = queryItens.eq('tipo', filtros.tipo);
      }
      if (filtros?.categoria) {
        queryItens = queryItens.eq('categoria', filtros.categoria);
      }
      if (filtros?.rastrear_estoque !== undefined) {
        queryItens = queryItens.eq('rastrear_estoque', filtros.rastrear_estoque);
      }
      if (filtros?.busca) {
        queryItens = queryItens.ilike('nome', `%${filtros.busca}%`);
      }

      const { data: itensData, error: itensError } = await queryItens;
      if (itensError) throw itensError;

      // Buscar estoque usando a VIEW simplificada - FILTRAR POR USUARIO
      const { data: estoqueData, error: estoqueError } = await supabase
        .from('estoque_simplificado')
        .select('*')
        .eq('usuario_id', user.id);
      if (estoqueError) throw estoqueError;

      // Buscar preços ativos
      const { data: precosData, error: precosError } = await supabase
        .from('precos')
        .select('*')
        .eq('ativo', true);
      if (precosError) throw precosError;

      // Combinar dados
      const itensCompletos: ItemComEstoque[] = (itensData || []).map(item => {
        const estoque = estoqueData?.find(e => e.item_id === item.id);
        const preco = precosData?.find(p => p.item_id === item.id);
        const status = item.rastrear_estoque
          ? getStatusEstoque(estoque?.saldo_atual, item.ponto_de_pedido)
          : 'sem_rastreio';

        return {
          ...item,
          estoque: estoque ? {
            item_id: estoque.item_id,
            usuario_id: estoque.usuario_id,
            nome: estoque.item_nome,
            tipo: estoque.tipo as any,
            categoria: estoque.categoria,
            unidade_base: estoque.unidade_base,
            ponto_de_pedido: estoque.ponto_de_pedido,
            saldo: estoque.saldo_atual,
            custo_medio: estoque.custo_medio,
            valor_estoque: estoque.valor_total_estoque,
            ultima_movimentacao: estoque.ultima_movimentacao
          } : undefined,
          preco_ativo: preco,
          status
        } as ItemComEstoque;
      });

      // Aplicar filtro de status se existir
      let itensFiltrados = itensCompletos;
      if (filtros?.status) {
        itensFiltrados = itensCompletos.filter(item => item.status === filtros.status);
      }

      setItens(itensFiltrados);
    } catch (err: any) {
      console.error('Erro ao carregar itens:', err);
      toast({
        title: "Erro ao carregar itens",
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast, getStatusEstoque]); // Removido 'filtros' das dependências

  // Registrar movimentação (ENTRADA, SAIDA, PERDA, AJUSTE)
  const registrarMovimentacao = useCallback(async (dados: {
    item_id: string;
    tipo: 'ENTRADA' | 'SAIDA' | 'PERDA' | 'AJUSTE';
    quantidade: number;
    custo_unitario?: number;
    custo_total?: number;
    data: string;
    motivo?: string;
    observacoes?: string;
    local_compra?: string;
    validade?: string;
  }) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      // Buscar o item para obter tipo e unidade
      const { data: item, error: itemError } = await supabase
        .from('itens')
        .select('tipo, unidade_base')
        .eq('id', dados.item_id)
        .single();

      if (itemError) throw itemError;
      if (!item) throw new Error('Item não encontrado');

      // Converter tipo do item para o enum correto
      let tipoItemEnum: 'INSUMO' | 'EMBALAGEM' | 'outros' = 'outros';
      if (item.tipo === 'ingrediente') tipoItemEnum = 'INSUMO';
      else if (item.tipo === 'embalagem') tipoItemEnum = 'EMBALAGEM';

      const { data, error } = await supabase
        .from('movimentacoes_estoque')
        .insert([{
          usuario_id: user.id,
          item_id: dados.item_id,
          tipo_item: tipoItemEnum,
          tipo: dados.tipo,
          quantidade: dados.quantidade,
          unidade: item.unidade_base,
          custo_unitario: dados.custo_unitario || null,
          custo_total: dados.custo_total || null,
          data: dados.data,
          motivo: dados.motivo || null,
          observacoes: dados.observacoes || null,
          local_compra: dados.local_compra || null,
          validade: dados.validade || null,
        }])
        .select()
        .single();

      if (error) throw error;

      const tipoMsg = dados.tipo === 'ENTRADA' ? 'Entrada' : 
                     dados.tipo === 'SAIDA' ? 'Saída' :
                     dados.tipo === 'PERDA' ? 'Perda' : 'Ajuste';

      toast({
        title: `${tipoMsg} registrada!`,
        description: `Movimentação de ${dados.quantidade} unidades registrada com sucesso.`,
      });

      await carregarItens();
      return { success: true, data };
    } catch (err: any) {
      console.error('Erro ao registrar movimentação:', err);
      toast({
        title: "Erro ao registrar movimentação",
        description: err.message,
        variant: "destructive",
      });
      return { success: false, error: err };
    }
  }, [carregarItens, toast]);

  // Criar item
  const criarItem = useCallback(async (item: Omit<Item, 'id' | 'usuario_id' | 'criado_em' | 'atualizado_em'>) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      const { data, error } = await supabase
        .from('itens')
        .insert([{ ...item, usuario_id: user.id }])
        .select()
        .single();

      if (error) throw error;
      
      toast({
        title: "Item criado!",
        description: "O item foi cadastrado com sucesso.",
      });

      await carregarItens();
      return { success: true, data };
    } catch (err: any) {
      console.error('Erro ao criar item:', err);
      toast({
        title: "Erro ao criar item",
        description: err.message,
        variant: "destructive",
      });
      return { success: false, error: err };
    }
  }, [carregarItens, toast]);

  // Atualizar item
  const atualizarItem = useCallback(async (id: string, updates: Partial<Item>) => {
    try {
      const { error } = await supabase
        .from('itens')
        .update(updates)
        .eq('id', id);

      if (error) throw error;
      
      toast({
        title: "Item atualizado!",
        description: "As alterações foram salvas com sucesso.",
      });

      await carregarItens();
      return { success: true };
    } catch (err: any) {
      console.error('Erro ao atualizar item:', err);
      toast({
        title: "Erro ao atualizar item",
        description: err.message,
        variant: "destructive",
      });
      return { success: false, error: err };
    }
  }, [carregarItens, toast]);

  // Salvar preço
  const salvarPreco = useCallback(async (preco: any) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      const { error } = await supabase
        .from('precos')
        .insert([{ ...preco, usuario_id: user.id }]);

      if (error) throw error;
      
      toast({
        title: "Preço salvo!",
        description: "O preço foi registrado com sucesso.",
      });

      await carregarItens();
      return { success: true };
    } catch (err: any) {
      console.error('Erro ao salvar preço:', err);
      toast({
        title: "Erro ao salvar preço",
        description: err.message,
        variant: "destructive",
      });
      return { success: false, error: err };
    }
  }, [carregarItens, toast]);

  // Ativar rastreamento
  const ativarRastreamento = useCallback(async (itemId: string, pontoMinimo?: number) => {
    const updates: any = { rastrear_estoque: true };
    if (pontoMinimo !== undefined) {
      updates.ponto_de_pedido = pontoMinimo;
    }
    return await atualizarItem(itemId, updates);
  }, [atualizarItem]);

  // Carregar na montagem
  useEffect(() => {
    carregarItens();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Recarregar quando filtros mudarem
  useEffect(() => {
    if (!loading) { // Evita recarregar durante o primeiro loading
      carregarItens();
    }
  }, [filtros?.busca, filtros?.tipo, filtros?.categoria, filtros?.status, filtros?.rastrear_estoque]); // eslint-disable-line react-hooks/exhaustive-deps

  return {
    itens,
    loading,
    carregarItens,
    registrarMovimentacao,
    criarItem,
    atualizarItem,
    salvarPreco,
    ativarRastreamento
  };
}
