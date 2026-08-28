import { supabase } from '@/integrations/supabase/client';

export interface UsoTipoInsumo {
  emUso: boolean;
  detalhes: string[];
}

/**
 * Varre o sistema para saber se um tipo base (tipos_insumos) está sendo
 * utilizado antes de permitir sua exclusão.
 *
 * Cobertura da varredura:
 *  - Cadastros derivados: ingredientes / embalagens (marcas e preços)
 *  - Fichas Técnicas (Serviços): receitas_ingredientes / receitas_embalagens
 *  - Receitas (pré-preparos): pre_preparos_ingredientes
 *  - Estoque: estoque (ingrediente_id / embalagem_id)
 */
export async function verificarUsoTipoInsumo(tipoId: string): Promise<UsoTipoInsumo> {
  const detalhes: string[] = [];

  const [{ data: ingredientes }, { data: embalagens }] = await Promise.all([
    supabase.from('ingredientes').select('id').eq('tipo_insumo_id', tipoId),
    supabase.from('embalagens').select('id').eq('tipo_insumo_id', tipoId),
  ]);

  const ingredienteIds = (ingredientes || []).map((i: any) => i.id);
  const embalagemIds = (embalagens || []).map((e: any) => e.id);

  const contar = async (
    fn: () => Promise<{ count: number | null; error: any }>,
    rotulo: string,
  ) => {
    const { count, error } = await fn();
    if (error) throw error;
    if (count && count > 0) detalhes.push(`${rotulo}: ${count} registro(s)`);
  };

  if (ingredienteIds.length > 0) {
    await contar(
      () =>
        supabase
          .from('receitas_ingredientes')
          .select('id', { count: 'exact', head: true })
          .in('ingrediente_id', ingredienteIds) as any,
      'Serviços / Fichas Técnicas',
    );
    await contar(
      () =>
        supabase
          .from('pre_preparos_ingredientes')
          .select('id', { count: 'exact', head: true })
          .in('ingrediente_id', ingredienteIds) as any,
      'Receitas',
    );
    await contar(
      () =>
        supabase
          .from('estoque')
          .select('id', { count: 'exact', head: true })
          .in('ingrediente_id', ingredienteIds) as any,
      'Estoque',
    );
  }

  if (embalagemIds.length > 0) {
    await contar(
      () =>
        supabase
          .from('receitas_embalagens')
          .select('id', { count: 'exact', head: true })
          .in('embalagem_id', embalagemIds) as any,
      'Serviços / Fichas Técnicas (embalagens)',
    );
    await contar(
      () =>
        supabase
          .from('estoque')
          .select('id', { count: 'exact', head: true })
          .in('embalagem_id', embalagemIds) as any,
      'Estoque (embalagens)',
    );
  }

  if (ingredienteIds.length > 0) {
    detalhes.push(`Cadastro de Insumos: ${ingredienteIds.length} item(ns) com marca/preço`);
  }
  if (embalagemIds.length > 0) {
    detalhes.push(`Cadastro de Embalagens: ${embalagemIds.length} item(ns) com marca/preço`);
  }

  return { emUso: detalhes.length > 0, detalhes };
}
