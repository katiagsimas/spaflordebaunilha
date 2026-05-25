import { supabase } from '@/integrations/supabase/client';

/**
 * Realiza a baixa automática do estoque quando uma encomenda
 * muda para status "entregue".
 *
 * Estratégia em batch:
 * 1. Busca itens da encomenda;
 * 2. Busca em paralelo receitas_ingredientes e receitas_embalagens (in receita_ids);
 * 3. Busca em paralelo estoque de todos os ingrediente_ids e embalagem_ids únicos;
 * 4. Calcula deduções em memória, acumulando updates e movimentações;
 * 5. Persiste updates e insert de movimentações em batch.
 */
export async function executarBaixaEstoqueEncomenda(
  encomendaId: string,
  userId: string,
  ownerGroupId?: string | null,
): Promise<{ sucesso: boolean; itensProcessados: number; avisos: string[] }> {
  const avisos: string[] = [];
  let itensProcessados = 0;

  try {
    // 0. Proteção contra duplo clique / stale state
    const { data: encomendaCheck } = await (supabase.from('encomendas') as any)
      .select('estoque_baixa_realizada')
      .eq('id', encomendaId)
      .maybeSingle();

    if (encomendaCheck?.estoque_baixa_realizada) {
      return { sucesso: true, itensProcessados: 0, avisos: ['Baixa de estoque já foi realizada para esta encomenda.'] };
    }

    // 1. Itens da encomenda
    const { data: itensEncomenda, error: errItens } = await supabase
      .from('encomenda_itens')
      .select('receita_id, quantidade')
      .eq('encomenda_id', encomendaId)
      .eq('owner_group_id', ownerGroupId);

    if (errItens) throw errItens;
    if (!itensEncomenda || itensEncomenda.length === 0) {
      avisos.push('Encomenda sem itens — nenhuma baixa realizada.');
      return { sucesso: true, itensProcessados: 0, avisos };
    }

    const receitaIds = Array.from(new Set(itensEncomenda.map(i => i.receita_id).filter(Boolean)));

    // 2. Buscar receitas_ingredientes e receitas_embalagens em paralelo
    const [resIng, resEmb] = await Promise.all([
      supabase
        .from('receitas_ingredientes')
        .select('receita_id, ingrediente_id, quantidade_utilizada')
        .in('receita_id', receitaIds),
      supabase
        .from('receitas_embalagens')
        .select('receita_id, embalagem_id, quantidade_utilizada')
        .in('receita_id', receitaIds),
    ]);

    const receitasIngredientes = resIng.data || [];
    const receitasEmbalagens = resEmb.data || [];

    // 3. IDs únicos
    const ingredienteIds = Array.from(new Set(receitasIngredientes.map((r: any) => r.ingrediente_id).filter(Boolean)));
    const embalagemIds = Array.from(new Set(receitasEmbalagens.map((r: any) => r.embalagem_id).filter(Boolean)));

    // 4. Carregar estoque + nomes legíveis em paralelo
    const estoqueIngPromise = ingredienteIds.length
      ? (supabase.from('estoque' as any) as any)
          .select('*')
          .eq('owner_group_id', ownerGroupId)
          .in('ingrediente_id', ingredienteIds)
      : Promise.resolve({ data: [] });

    const estoqueEmbPromise = embalagemIds.length
      ? (supabase.from('estoque' as any) as any)
          .select('*')
          .eq('owner_group_id', ownerGroupId)
          .in('embalagem_id', embalagemIds)
      : Promise.resolve({ data: [] });

    const nomesIngPromise = ingredienteIds.length
      ? supabase
          .from('ingredientes')
          .select('id, tipos_insumos:tipo_insumo_id(descricao)')
          .in('id', ingredienteIds)
      : Promise.resolve({ data: [] });

    const nomesEmbPromise = embalagemIds.length
      ? supabase
          .from('embalagens')
          .select('id, tipos_insumos:tipo_insumo_id(descricao)')
          .in('id', embalagemIds)
      : Promise.resolve({ data: [] });

    const [estoqueIngRes, estoqueEmbRes, nomesIngRes, nomesEmbRes] = await Promise.all([
      estoqueIngPromise,
      estoqueEmbPromise,
      nomesIngPromise,
      nomesEmbPromise,
    ]);

    const estoquePorIngrediente = new Map<string, any>();
    (estoqueIngRes.data || []).forEach((e: any) => {
      if (e.ingrediente_id) estoquePorIngrediente.set(e.ingrediente_id, e);
    });
    const estoquePorEmbalagem = new Map<string, any>();
    (estoqueEmbRes.data || []).forEach((e: any) => {
      if (e.embalagem_id) estoquePorEmbalagem.set(e.embalagem_id, e);
    });
    const nomePorIngrediente = new Map<string, string>();
    (nomesIngRes.data || []).forEach((i: any) => {
      nomePorIngrediente.set(i.id, i?.tipos_insumos?.descricao || 'Ingrediente');
    });
    const nomePorEmbalagem = new Map<string, string>();
    (nomesEmbRes.data || []).forEach((e: any) => {
      nomePorEmbalagem.set(e.id, e?.tipos_insumos?.descricao || 'Embalagem');
    });

    // Index receitas → insumos
    const ingredientesPorReceita = new Map<string, Array<{ ingrediente_id: string; quantidade_utilizada: number }>>();
    receitasIngredientes.forEach((r: any) => {
      const arr = ingredientesPorReceita.get(r.receita_id) || [];
      arr.push({ ingrediente_id: r.ingrediente_id, quantidade_utilizada: Number(r.quantidade_utilizada) || 0 });
      ingredientesPorReceita.set(r.receita_id, arr);
    });
    const embalagensPorReceita = new Map<string, Array<{ embalagem_id: string; quantidade_utilizada: number }>>();
    receitasEmbalagens.forEach((r: any) => {
      const arr = embalagensPorReceita.get(r.receita_id) || [];
      arr.push({ embalagem_id: r.embalagem_id, quantidade_utilizada: Number(r.quantidade_utilizada) || 0 });
      embalagensPorReceita.set(r.receita_id, arr);
    });

    // 5. Acumular deduções em memória (consolidar por estoque_id)
    type Acumulado = { estoqueItem: any; quantidadeTotal: number; nome: string };
    const acumulados = new Map<string, Acumulado>();

    const acumular = (
      tipo: 'ingrediente' | 'embalagem',
      insumoId: string,
      quantidade: number,
    ) => {
      if (quantidade <= 0) return;
      const estoqueItem = tipo === 'ingrediente'
        ? estoquePorIngrediente.get(insumoId)
        : estoquePorEmbalagem.get(insumoId);
      const nome = tipo === 'ingrediente'
        ? (nomePorIngrediente.get(insumoId) || 'Ingrediente')
        : (nomePorEmbalagem.get(insumoId) || 'Embalagem');

      if (!estoqueItem) {
        avisos.push(`Insumo (${tipo}) não encontrado no estoque — baixa ignorada.`);
        return;
      }

      const existente = acumulados.get(estoqueItem.id);
      if (existente) {
        existente.quantidadeTotal += quantidade;
      } else {
        acumulados.set(estoqueItem.id, { estoqueItem, quantidadeTotal: quantidade, nome });
      }
      itensProcessados++;
    };

    for (const item of itensEncomenda) {
      const qtdPedida = Number(item.quantidade) || 1;
      const ings = ingredientesPorReceita.get(item.receita_id) || [];
      for (const ing of ings) {
        acumular('ingrediente', ing.ingrediente_id, ing.quantidade_utilizada * qtdPedida);
      }
      const embs = embalagensPorReceita.get(item.receita_id) || [];
      for (const emb of embs) {
        acumular('embalagem', emb.embalagem_id, emb.quantidade_utilizada * qtdPedida);
      }
    }

    // 6. Persistir: updates (um por estoque_id, pois quantidades diferem) + insert único em movimentações
    const movimentacoes: any[] = [];
    const updatePromises: Promise<any>[] = [];

    for (const { estoqueItem, quantidadeTotal, nome } of acumulados.values()) {
      const qtdAtual = Number(estoqueItem.quantidade_atual) || 0;
      const novaQtd = Math.max(0, qtdAtual - quantidadeTotal);

      updatePromises.push(
        (supabase.from('estoque' as any) as any)
          .update({ quantidade_atual: novaQtd })
          .eq('id', estoqueItem.id),
      );

      movimentacoes.push({
        estoque_id: estoqueItem.id,
        usuario_id: userId,
        owner_group_id: ownerGroupId || null,
        tipo_movimentacao: 'saida_producao',
        quantidade: quantidadeTotal,
        referencia_tipo: 'encomenda',
        referencia_id: encomendaId,
        observacao: 'Baixa automática — encomenda entregue',
      });

      if (qtdAtual < quantidadeTotal) {
        avisos.push(`Estoque de ${nome} ficou insuficiente — quantidade zerada.`);
      }
    }

    await Promise.all(updatePromises);

    if (movimentacoes.length > 0) {
      await (supabase.from('estoque_movimentacoes' as any) as any).insert(movimentacoes);
    }

    // 7. Marcar encomenda como baixada
    await (supabase.from('encomendas') as any)
      .update({ estoque_baixa_realizada: true })
      .eq('id', encomendaId);

    return { sucesso: true, itensProcessados, avisos };
  } catch (err: any) {
    console.error('Erro na baixa automática de estoque:', err);
    return { sucesso: false, itensProcessados, avisos: [...avisos, err.message] };
  }
}
