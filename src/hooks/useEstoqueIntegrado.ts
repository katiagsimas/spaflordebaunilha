// ============================================
// HOOK CUSTOMIZADO - ESTOQUE INTEGRADO
// ============================================

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { 
  Item, 
  Preco, 
  MovimentoEstoque, 
  EstoqueAtual, 
  ItemComEstoque,
  StatusEstoque,
  FiltrosEstoque,
  ResumoEstoque
} from '@/types/estoque';

export function useEstoqueIntegrado(filtros?: FiltrosEstoque) {
  const [itens, setItens] = useState<ItemComEstoque[]>([]);
  const [loading, setLoading] = useState(true);
  const [resumo, setResumo] = useState<ResumoEstoque | null>(null);
  const { toast } = useToast();

  // Função para determinar status do estoque
  const getStatusEstoque = useCallback((saldo?: number, pontoMinimo?: number): StatusEstoque => {
    if (saldo === undefined || pontoMinimo === undefined) return 'sem_rastreio';
    if (saldo <= 0) return 'zerado';
    if (saldo <= pontoMinimo) return 'baixo';
    if (saldo <= pontoMinimo * 1.2) return 'atencao';
    return 'ok';
  }, []);

  // Carregar itens com estoque e preços
  const carregarItens = useCallback(async () => {
    try {
      setLoading(true);
      
      // Construir query de itens com filtros
      let queryItens = supabase
        .from('itens')
        .select('*')
        .eq('ativo', true)
        .order('nome');

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

      // Buscar estoque atual
      const { data: estoqueData, error: estoqueError } = await supabase
        .from('estoque_atual_v2')
        .select('*');
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
          ? getStatusEstoque(estoque?.saldo, item.ponto_de_pedido)
          : 'sem_rastreio';

        return {
          ...(item as any),
          estoque: estoque ? {
            ...estoque,
            tipo: estoque.tipo as any
          } : undefined,
          preco_ativo: preco,
          status
        } as ItemComEstoque;
      });

      // Aplicar filtro de status se fornecido
      let itensFiltrados = itensCompletos;
      if (filtros?.status) {
        itensFiltrados = itensCompletos.filter(item => item.status === filtros.status);
      }

      // Calcular resumo
      const totalItens = itensFiltrados.length;
      const itensRastreados = itensFiltrados.filter(i => i.rastrear_estoque).length;
      const alertasBaixo = itensFiltrados.filter(i => i.status === 'baixo').length;
      const alertasZerado = itensFiltrados.filter(i => i.status === 'zerado').length;
      const valorTotal = itensFiltrados.reduce((sum, i) => sum + (i.estoque?.valor_estoque || 0), 0);

      setResumo({
        total_itens: totalItens,
        itens_rastreados: itensRastreados,
        alertas_baixo: alertasBaixo,
        alertas_zerado: alertasZerado,
        valor_total: valorTotal
      });

      setItens(itensFiltrados);
    } catch (err: any) {
      console.error('Erro ao carregar itens:', err);
      toast({
        title: "Erro ao carregar dados",
        description: err.message || "Erro desconhecido",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [filtros, getStatusEstoque, toast]);

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
        title: "Item criado com sucesso!",
        description: `${item.nome} foi adicionado ao catálogo.`,
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

  // Criar/Atualizar preço
  const salvarPreco = useCallback(async (preco: Omit<Preco, 'id' | 'usuario_id' | 'custo_unitario' | 'criado_em'>) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      const { error } = await supabase
        .from('precos')
        .insert([{ ...preco, usuario_id: user.id }]);

      if (error) throw error;
      
      toast({
        title: "Preço atualizado!",
        description: "O novo preço foi registrado com sucesso.",
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

  // Registrar movimento
  const registrarMovimento = useCallback(async (movimento: Omit<MovimentoEstoque, 'id' | 'usuario_id' | 'criado_em'>) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      const { error } = await supabase
        .from('movimentos_estoque_v2')
        .insert([{ ...movimento, usuario_id: user.id }]);

      if (error) throw error;
      
      const tipoMsg = movimento.tipo === 'entrada' ? 'Entrada' : 
                     movimento.tipo === 'saida' ? 'Saída' :
                     movimento.tipo === 'perda' ? 'Perda' : 'Ajuste';

      toast({
        title: `${tipoMsg} registrada!`,
        description: `Movimentação de estoque registrada com sucesso.`,
      });

      await carregarItens();
      return { success: true };
    } catch (err: any) {
      console.error('Erro ao registrar movimento:', err);
      toast({
        title: "Erro ao registrar movimento",
        description: err.message,
        variant: "destructive",
      });
      return { success: false, error: err };
    }
  }, [carregarItens, toast]);

  // Ativar rastreamento de estoque
  const ativarRastreamento = useCallback(async (itemId: string, pontoMinimo: number) => {
    return atualizarItem(itemId, {
      rastrear_estoque: true,
      ponto_de_pedido: pontoMinimo
    });
  }, [atualizarItem]);

  // Desativar rastreamento de estoque
  const desativarRastreamento = useCallback(async (itemId: string) => {
    return atualizarItem(itemId, {
      rastrear_estoque: false
    });
  }, [atualizarItem]);

  useEffect(() => {
    carregarItens();
  }, [carregarItens]);

  return {
    itens,
    loading,
    resumo,
    carregarItens,
    criarItem,
    atualizarItem,
    salvarPreco,
    registrarMovimento,
    ativarRastreamento,
    desativarRastreamento
  };
}
