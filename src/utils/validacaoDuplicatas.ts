import { supabase } from '@/integrations/supabase/client';

interface ValidacaoDuplicataOptions {
  tabela: string;
  campoNome: string;
  valorNome: string;
  campoAbreviacao?: string;
  valorAbreviacao?: string;
  idAtual?: string;
}

/**
 * Valida se já existe registro com mesmo nome ou abreviação (case-insensitive)
 * @throws Error com mensagem amigável se encontrar duplicata
 */
export async function validarDuplicata(options: ValidacaoDuplicataOptions): Promise<void> {
  const {
    tabela,
    campoNome,
    valorNome,
    campoAbreviacao,
    valorAbreviacao,
    idAtual
  } = options;

  // 1. Validar nome duplicado (case-insensitive)
  let queryNome: any = supabase
    .from(tabela as any)
    .select('*')
    .ilike(campoNome, valorNome.trim());
  
  if (idAtual) {
    queryNome = queryNome.neq('id', idAtual);
  }

  const { data: nomeDuplicado, error: erroNome } = await queryNome;

  if (erroNome) {
    console.error('Erro ao validar nome:', erroNome);
    throw new Error('Erro ao validar dados. Tente novamente.');
  }

  if (nomeDuplicado && nomeDuplicado.length > 0) {
    const nomeExistente = nomeDuplicado[0][campoNome];
    throw new Error(
      `Já existe um registro com o nome "${nomeExistente}". ` +
      `Por favor, escolha outro nome.`
    );
  }

  // 2. Validar abreviação duplicada (se fornecida)
  if (campoAbreviacao && valorAbreviacao) {
    let queryAbrev: any = supabase
      .from(tabela as any)
      .select('*')
      .ilike(campoAbreviacao, valorAbreviacao.trim());
    
    if (idAtual) {
      queryAbrev = queryAbrev.neq('id', idAtual);
    }

    const { data: abrevDuplicada, error: erroAbrev } = await queryAbrev;

    if (erroAbrev) {
      console.error('Erro ao validar abreviação:', erroAbrev);
      throw new Error('Erro ao validar dados. Tente novamente.');
    }

    if (abrevDuplicada && abrevDuplicada.length > 0) {
      const abrevExistente = abrevDuplicada[0][campoAbreviacao];
      throw new Error(
        `Já existe um registro com a abreviação "${abrevExistente}". ` +
        `Por favor, escolha outra abreviação.`
      );
    }
  }
}
