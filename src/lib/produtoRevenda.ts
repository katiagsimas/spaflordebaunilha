import { supabase } from '@/integrations/supabase/client';
import { getActiveGroupId } from '@/lib/activeGroup';

export interface InsumoImportado {
  id: string;
  usuario_id: string;
  marca: string | null;
  preco: number;
  tipo_insumo: {
    id: string;
    descricao: string;
    quantidade_embalagem: number;
    pre_preparo_id: string | null;
    unidade_medida: { nome: string; sigla: string };
  };
}

const LABEL_MARCA: Record<string, string> = {
  natura: 'Natura',
  avon: 'Avon',
};

/**
 * Busca um produto de revenda (Natura/Avon) pelo código dentro do grupo ativo.
 */
export async function buscarProdutoRevendaPorCodigo(codigo: string, userId: string) {
  const groupId = await getActiveGroupId(userId);
  const { data, error } = await supabase
    .from('produtos_revenda')
    .select('*')
    .eq('owner_group_id', groupId)
    .eq('codigo', codigo.trim())
    .in('marca', ['natura', 'avon'])
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  return { produto: data as any | null, groupId };
}

/**
 * Garante que exista uma unidade de medida "un" para o usuário e retorna seu id.
 */
async function garantirUnidadeUn(userId: string, groupId: string) {
  const { data: existente } = await supabase
    .from('unidades_medida')
    .select('id, nome, sigla')
    .eq('usuario_id', userId)
    .eq('sigla', 'un')
    .limit(1)
    .maybeSingle();

  if (existente) return existente;

  const { data, error } = await supabase
    .from('unidades_medida')
    .insert({ usuario_id: userId, owner_group_id: groupId, nome: 'Unidades', sigla: 'un', ativo: true })
    .select('id, nome, sigla')
    .single();

  if (error) throw error;
  return data;
}

/**
 * Converte um produto de revenda em um insumo (tipos_insumos + ingredientes),
 * reaproveitando o registro caso já exista. Retorna o insumo no mesmo formato
 * usado pela Ficha Técnica e pelo Estoque.
 */
export async function importarProdutoRevendaComoInsumo(
  codigo: string,
  userId: string,
): Promise<InsumoImportado> {
  const { produto, groupId } = await buscarProdutoRevendaPorCodigo(codigo, userId);
  if (!produto) {
    throw new Error(`Nenhum produto Natura/Avon encontrado com o código "${codigo}".`);
  }

  const unidade = await garantirUnidadeUn(userId, groupId);
  const marcaLabel = LABEL_MARCA[produto.marca] || produto.marca;
  const descricao = String(produto.descricao).slice(0, 255);
  const preco = Number(produto.preco) || 0;

  if (preco <= 0) {
    throw new Error(
      `O produto "${descricao}" está sem preço. Informe o preço em Serviços › Produtos para Revenda › ${marcaLabel} antes de usá-lo.`,
    );
  }


  // tipo_insumo (produto de revenda entra como "ingrediente" para uso nas fichas)
  const { data: tipoExistente } = await supabase
    .from('tipos_insumos')
    .select('id, descricao, quantidade_embalagem, pre_preparo_id, unidade_medida:unidades_medida(nome, sigla)')
    .eq('usuario_id', userId)
    .eq('tipo', 'ingrediente')
    .eq('descricao', descricao)
    .eq('unidade_medida_id', unidade.id)
    .limit(1)
    .maybeSingle();

  let tipoInsumo: any = tipoExistente;

  if (!tipoInsumo) {
    const { data, error } = await supabase
      .from('tipos_insumos')
      .insert({
        usuario_id: userId,
        owner_group_id: groupId,
        tipo: 'ingrediente',
        descricao,
        quantidade_embalagem: 1,
        unidade_medida_id: unidade.id,
      })
      .select('id, descricao, quantidade_embalagem, pre_preparo_id, unidade_medida:unidades_medida(nome, sigla)')
      .single();
    if (error) throw error;
    tipoInsumo = data;
  }

  // ingrediente vinculado (marca = Natura/Avon)
  const { data: ingExistente } = await supabase
    .from('ingredientes')
    .select('id, usuario_id, marca, preco')
    .eq('usuario_id', userId)
    .eq('tipo_insumo_id', tipoInsumo.id)
    .eq('marca', marcaLabel)
    .limit(1)
    .maybeSingle();

  let ingrediente: any = ingExistente;

  if (ingrediente) {
    if (preco > 0 && Number(ingrediente.preco) !== preco) {
      const { data, error } = await supabase
        .from('ingredientes')
        .update({ preco, data_atualizacao: new Date().toISOString().split('T')[0] })
        .eq('id', ingrediente.id)
        .select('id, usuario_id, marca, preco')
        .single();
      if (error) throw error;
      ingrediente = data;
    }
  } else {
    const { data, error } = await supabase
      .from('ingredientes')
      .insert({
        usuario_id: userId,
        owner_group_id: groupId,
        tipo_insumo_id: tipoInsumo.id,
        marca: marcaLabel,
        preco,
        data_atualizacao: new Date().toISOString().split('T')[0],
      })
      .select('id, usuario_id, marca, preco')
      .single();
    if (error) throw error;
    ingrediente = data;
  }

  return {
    id: ingrediente.id,
    usuario_id: ingrediente.usuario_id,
    marca: ingrediente.marca,
    preco: Number(ingrediente.preco) || 0,
    tipo_insumo: {
      id: tipoInsumo.id,
      descricao: tipoInsumo.descricao,
      quantidade_embalagem: Number(tipoInsumo.quantidade_embalagem) || 1,
      pre_preparo_id: tipoInsumo.pre_preparo_id ?? null,
      unidade_medida: {
        nome: tipoInsumo.unidade_medida?.nome || 'Unidades',
        sigla: tipoInsumo.unidade_medida?.sigla || 'un',
      },
    },
  };
}
