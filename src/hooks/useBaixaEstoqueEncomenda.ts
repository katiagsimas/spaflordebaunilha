import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

/**
 * Realiza a baixa automática do estoque quando uma encomenda
 * muda para status "entregue".
 *
 * Para cada item da encomenda (que aponta para uma receita),
 * busca os ingredientes e embalagens da receita, multiplica
 * pela quantidade pedida e registra saída de produção no estoque.
 */
export async function executarBaixaEstoqueEncomenda(
  encomendaId: string,
  userId: string,
  ownerGroupId?: string | null,
): Promise<{ sucesso: boolean; itensProcessados: number; avisos: string[] }> {
  const avisos: string[] = [];
  let itensProcessados = 0;

  try {
    // 1. Buscar itens da encomenda
    const { data: itensEncomenda, error: errItens } = await supabase
      .from('encomenda_itens')
      .select('receita_id, quantidade')
      .eq('encomenda_id', encomendaId)
      .eq('usuario_id', userId);

    if (errItens) throw errItens;
    if (!itensEncomenda || itensEncomenda.length === 0) {
      avisos.push('Encomenda sem itens — nenhuma baixa realizada.');
      return { sucesso: true, itensProcessados: 0, avisos };
    }

    // 2. Para cada item, buscar ingredientes e embalagens da receita
    for (const item of itensEncomenda) {
      const receitaId = item.receita_id;
      const qtdPedida = Number(item.quantidade) || 1;

      // Ingredientes
      const { data: ingredientesReceita } = await supabase
        .from('receitas_ingredientes')
        .select('ingrediente_id, quantidade_utilizada')
        .eq('receita_id', receitaId);

      for (const ing of ingredientesReceita || []) {
        const qtdDeducao = (Number(ing.quantidade_utilizada) || 0) * qtdPedida;
        if (qtdDeducao <= 0) continue;

        const resultado = await deduzirEstoque({
          userId,
          ownerGroupId,
          tipo: 'ingrediente',
          insumoId: ing.ingrediente_id,
          quantidade: qtdDeducao,
          encomendaId,
        });

        if (resultado.aviso) avisos.push(resultado.aviso);
        if (resultado.processado) itensProcessados++;
      }

      // Embalagens
      const { data: embalagensReceita } = await supabase
        .from('receitas_embalagens')
        .select('embalagem_id, quantidade_utilizada')
        .eq('receita_id', receitaId);

      for (const emb of embalagensReceita || []) {
        const qtdDeducao = (Number(emb.quantidade_utilizada) || 0) * qtdPedida;
        if (qtdDeducao <= 0) continue;

        const resultado = await deduzirEstoque({
          userId,
          ownerGroupId,
          tipo: 'embalagem',
          insumoId: emb.embalagem_id,
          quantidade: qtdDeducao,
          encomendaId,
        });

        if (resultado.aviso) avisos.push(resultado.aviso);
        if (resultado.processado) itensProcessados++;
      }
    }

    // 3. Marcar encomenda como baixada
    await (supabase.from('encomendas') as any)
      .update({ estoque_baixa_realizada: true })
      .eq('id', encomendaId);

    return { sucesso: true, itensProcessados, avisos };
  } catch (err: any) {
    console.error('Erro na baixa automática de estoque:', err);
    return { sucesso: false, itensProcessados, avisos: [...avisos, err.message] };
  }
}

// ---- helpers ----

async function deduzirEstoque(params: {
  userId: string;
  ownerGroupId?: string | null;
  tipo: 'ingrediente' | 'embalagem';
  insumoId: string;
  quantidade: number;
  encomendaId: string;
}): Promise<{ processado: boolean; aviso?: string }> {
  const filterCol = params.tipo === 'ingrediente' ? 'ingrediente_id' : 'embalagem_id';

  // Buscar item no estoque
  const { data: estoqueItem } = await (supabase.from('estoque' as any) as any)
    .select('*')
    .eq('usuario_id', params.userId)
    .eq(filterCol, params.insumoId)
    .maybeSingle();

  if (!estoqueItem) {
    return {
      processado: false,
      aviso: `Insumo (${params.tipo}) não encontrado no estoque — baixa ignorada.`,
    };
  }

  const qtdAtual = Number(estoqueItem.quantidade_atual) || 0;
  const novaQtd = Math.max(0, qtdAtual - params.quantidade);

  // Atualizar quantidade
  await (supabase.from('estoque' as any) as any)
    .update({ quantidade_atual: novaQtd })
    .eq('id', estoqueItem.id);

  // Registrar movimentação
  await (supabase.from('estoque_movimentacoes' as any) as any)
    .insert({
      estoque_id: estoqueItem.id,
      usuario_id: params.userId,
      owner_group_id: params.ownerGroupId || null,
      tipo_movimentacao: 'saida_producao',
      quantidade: params.quantidade,
      referencia_tipo: 'encomenda',
      referencia_id: params.encomendaId,
      observacao: `Baixa automática — encomenda entregue`,
    });

  if (qtdAtual < params.quantidade) {
    return {
      processado: true,
      aviso: `Estoque de "${estoqueItem.id}" ficou negativo (zerado). Quantidade insuficiente.`,
    };
  }

  return { processado: true };
}
