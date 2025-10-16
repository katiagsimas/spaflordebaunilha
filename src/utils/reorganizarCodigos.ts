import { supabase } from '@/integrations/supabase/client';

export interface ResultadoReorganizacao {
  sucesso: boolean;
  total: number;
  mensagem: string;
}

/**
 * Reorganiza códigos de uma tabela, gerando sequência 001, 002, 003...
 * Remove "buracos" de itens deletados e gera códigos para itens sem código
 */
export async function reorganizarCodigos(
  tabela: 'unidades_medida' | 'tipos_insumos' | 'tipos_embalagens',
  campoOrdenacao: string = 'nome'
): Promise<ResultadoReorganizacao> {
  try {
    console.log(`🔄 Reorganizando códigos de ${tabela}...`);
    
    // 1. Buscar TODOS os itens (ativos e inativos) ordenados alfabeticamente
    const { data: itens, error: erroLeitura } = await (supabase as any)
      .from(tabela)
      .select('*')
      .order(campoOrdenacao, { ascending: true });
    
    if (erroLeitura) throw erroLeitura;
    
    if (!itens || itens.length === 0) {
      return {
        sucesso: true,
        total: 0,
        mensagem: 'Nenhum item encontrado'
      };
    }
    
    console.log(`📋 Encontrados ${itens.length} itens em ${tabela}`);
    
    // 2. Gerar códigos sequenciais (001, 002, 003...)
    const atualizacoes = itens.map((item, index) => {
      const novoCodigo = (index + 1).toString().padStart(3, '0');
      return {
        id: item.id,
        codigo: novoCodigo
      };
    });
    
    // 3. Atualizar cada item com novo código
    let sucessos = 0;
    let erros = 0;
    
    for (const atualizacao of atualizacoes) {
      const { error: erroUpdate } = await (supabase as any)
        .from(tabela)
        .update({ codigo: atualizacao.codigo })
        .eq('id', atualizacao.id);
      
      if (erroUpdate) {
        console.error(`❌ Erro ao atualizar ${atualizacao.id}:`, erroUpdate);
        erros++;
      } else {
        sucessos++;
      }
    }
    
    console.log(`✅ ${sucessos} códigos reorganizados com sucesso`);
    if (erros > 0) {
      console.warn(`⚠️ ${erros} erros durante reorganização`);
    }
    
    return {
      sucesso: erros === 0,
      total: sucessos,
      mensagem: `${sucessos} códigos reorganizados${erros > 0 ? ` (${erros} erros)` : ''}`
    };
    
  } catch (error: any) {
    console.error('❌ Erro ao reorganizar códigos:', error);
    return {
      sucesso: false,
      total: 0,
      mensagem: `Erro: ${error.message}`
    };
  }
}

/**
 * Verifica se há itens sem código em uma tabela
 */
export async function verificarItensSemCodigo(
  tabela: 'unidades_medida' | 'tipos_insumos' | 'tipos_embalagens'
): Promise<number> {
  const { count, error } = await (supabase as any)
    .from(tabela)
    .select('id', { count: 'exact' })
    .or('codigo.is.null,codigo.eq.');
  
  if (error) {
    console.error('Erro ao verificar itens sem código:', error);
    return 0;
  }
  
  return count || 0;
}

/**
 * Verifica se há "buracos" na sequência de códigos
 */
export async function verificarBuracosSequencia(
  tabela: 'unidades_medida' | 'tipos_insumos' | 'tipos_embalagens'
): Promise<boolean> {
  const { data, error } = await (supabase as any)
    .from(tabela)
    .select('codigo')
    .not('codigo', 'is', null)
    .order('codigo', { ascending: true });
  
  if (error || !data || data.length === 0) return false;
  
  // Verificar se há buracos na sequência
  for (let i = 0; i < data.length; i++) {
    const codigoEsperado = (i + 1).toString().padStart(3, '0');
    const codigoAtual = (data[i] as any).codigo;
    
    if (codigoAtual !== codigoEsperado) {
      console.log(`🔍 Buraco detectado: esperado ${codigoEsperado}, encontrado ${codigoAtual}`);
      return true; // Há buraco
    }
  }
  
  return false; // Sequência está OK
}
