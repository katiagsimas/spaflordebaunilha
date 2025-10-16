import { supabase } from '@/integrations/supabase/client';

/**
 * Valida duplicata para Tipos de Insumos/Embalagens
 * Considera COMBINAÇÃO COMPLETA: descrição + quantidade + unidade
 */
export async function validarDuplicataTipoInsumo(options: {
  tabela: 'tipos_insumos' | 'tipos_embalagens';
  descricao: string;
  quantidade_embalagem: number;
  unidade_medida_id: string;
  idAtual?: string;
}): Promise<void> {
  const {
    tabela,
    descricao,
    quantidade_embalagem,
    unidade_medida_id,
    idAtual
  } = options;
  
  try {
    // Buscar registros com COMBINAÇÃO IDÊNTICA
    let query: any = supabase
      .from(tabela as any)
      .select(`
        id,
        descricao,
        quantidade_embalagem,
        unidade_medida_id,
        unidades_medida!inner(nome, sigla)
      `)
      .ilike('descricao', descricao.trim())
      .eq('quantidade_embalagem', quantidade_embalagem)
      .eq('unidade_medida_id', unidade_medida_id);
    
    if (idAtual) {
      query = query.neq('id', idAtual);
    }
    
    const { data: duplicata, error } = await query;
    
    if (error) {
      console.error('Erro ao validar duplicata:', error);
      throw new Error('Erro ao validar dados. Tente novamente.');
    }
    
    // Se encontrou combinação idêntica, bloquear
    if (duplicata && duplicata.length > 0) {
      const item = duplicata[0];
      const unidadeAbrev = item.unidades_medida?.sigla || '';
      
      // Formatar quantidade
      const qtdFormatada = quantidade_embalagem.toLocaleString('pt-BR', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 3
      });
      
      throw new Error(
        `Já existe um cadastro idêntico:\n` +
        `"${item.descricao}" - ${qtdFormatada} ${unidadeAbrev}\n\n` +
        `Se for uma embalagem diferente, altere a quantidade ou a unidade de medida.`
      );
    }
    
  } catch (error) {
    throw error;
  }
}

/**
 * Valida duplicata para Unidades de Medida
 */
export async function validarDuplicataUnidadeMedida(options: {
  nome: string;
  sigla: string;
  idAtual?: string;
}): Promise<void> {
  const { nome, sigla, idAtual } = options;
  
  // Validar nome duplicado
  let queryNome: any = supabase
    .from('unidades_medida' as any)
    .select('*')
    .ilike('nome', nome.trim());
  
  if (idAtual) {
    queryNome = queryNome.neq('id', idAtual);
  }

  const { data: nomeDuplicado, error: erroNome } = await queryNome;

  if (erroNome) {
    console.error('Erro ao validar nome:', erroNome);
    throw new Error('Erro ao validar dados. Tente novamente.');
  }

  if (nomeDuplicado && nomeDuplicado.length > 0) {
    const nomeExistente = nomeDuplicado[0].nome;
    throw new Error(
      `Já existe uma unidade com o nome "${nomeExistente}". ` +
      `Por favor, escolha outro nome.`
    );
  }

  // Validar sigla duplicada
  let querySigla: any = supabase
    .from('unidades_medida' as any)
    .select('*')
    .ilike('sigla', sigla.trim());
  
  if (idAtual) {
    querySigla = querySigla.neq('id', idAtual);
  }

  const { data: siglaDuplicada, error: erroSigla } = await querySigla;

  if (erroSigla) {
    console.error('Erro ao validar sigla:', erroSigla);
    throw new Error('Erro ao validar dados. Tente novamente.');
  }

  if (siglaDuplicada && siglaDuplicada.length > 0) {
    const siglaExistente = siglaDuplicada[0].sigla;
    throw new Error(
      `Já existe uma unidade com a abreviação "${siglaExistente}". ` +
      `Por favor, escolha outra abreviação.`
    );
  }
}
