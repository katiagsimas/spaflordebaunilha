/**
 * Utilitários para Categorias de Planos de Contas
 * Funções auxiliares para integração com outros módulos do sistema
 */

export interface CategoriaPlanoContas {
  id: string;
  codigo: string;
  descricao: string;
  indicador: 'receita' | 'despesa' | 'ativo' | 'passivo';
  faixaDRE: string;
  nivel: number;
  categoriaPai?: string;
  ativo: boolean;
  editavel: boolean;
  createdAt: string;
  updatedAt: string;
}

const STORAGE_KEY = 'sugarbox_categorias_plano';

/**
 * Obtém todas as categorias do localStorage
 */
export function getCategorias(): CategoriaPlanoContas[] {
  const str = localStorage.getItem(STORAGE_KEY);
  return str ? JSON.parse(str) : [];
}

/**
 * Salva categorias no localStorage
 */
export function setCategorias(categorias: CategoriaPlanoContas[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(categorias));
}

/**
 * Obtém uma categoria por ID
 */
export function getCategoriaPorId(id: string): CategoriaPlanoContas | undefined {
  const categorias = getCategorias();
  return categorias.find(c => c.id === id);
}

/**
 * Obtém uma categoria por código
 */
export function getCategoriaPorCodigo(codigo: string): CategoriaPlanoContas | undefined {
  const categorias = getCategorias();
  return categorias.find(c => c.codigo === codigo);
}

/**
 * Obtém apenas categorias ativas
 */
export function getCategoriasAtivas(): CategoriaPlanoContas[] {
  return getCategorias().filter(c => c.ativo);
}

/**
 * Obtém categorias por indicador (receita, despesa, ativo, passivo)
 */
export function getCategoriasPorIndicador(
  indicador: 'receita' | 'despesa' | 'ativo' | 'passivo'
): CategoriaPlanoContas[] {
  return getCategorias().filter(c => c.indicador === indicador && c.ativo);
}

/**
 * Obtém categorias filhas de uma categoria pai
 */
export function getCategoriasFilhas(categoriaPaiId: string): CategoriaPlanoContas[] {
  return getCategorias().filter(c => c.categoriaPai === categoriaPaiId);
}

/**
 * Obtém apenas categorias de último nível (sem filhos) para usar em lançamentos
 * Filtra também as que têm faixaDRE !== 'nao_aplicavel'
 */
export function getCategoriasParaLancamento(
  indicador?: 'receita' | 'despesa'
): CategoriaPlanoContas[] {
  const categorias = getCategoriasAtivas();
  const todasCategorias = getCategorias();
  
  return categorias.filter(cat => {
    // Filtrar por indicador se especificado
    if (indicador && cat.indicador !== indicador) return false;
    
    // Filtrar categorias com faixaDRE = 'nao_aplicavel' (geralmente categorias pai)
    if (cat.faixaDRE === 'nao_aplicavel') return false;
    
    // Verificar se não tem filhos
    const temFilhos = todasCategorias.some(c => c.categoriaPai === cat.id);
    return !temFilhos;
  });
}

/**
 * Formata a descrição completa da categoria (código + descrição)
 */
export function formatarCategoriaCompleta(categoria: CategoriaPlanoContas): string {
  return `${categoria.codigo} - ${categoria.descricao}`;
}

/**
 * Obtém o caminho completo da categoria (incluindo pais)
 */
export function getCaminhoCategoria(categoriaId: string): string {
  const categorias = getCategorias();
  const categoria = categorias.find(c => c.id === categoriaId);
  
  if (!categoria) return '';
  
  const caminho: string[] = [categoria.descricao];
  let atual = categoria;
  
  while (atual.categoriaPai) {
    const pai = categorias.find(c => c.id === atual.categoriaPai);
    if (!pai) break;
    caminho.unshift(pai.descricao);
    atual = pai;
  }
  
  return caminho.join(' > ');
}

/**
 * Agrupa lançamentos por faixa DRE para geração de relatórios
 */
export function agruparPorFaixaDRE(
  lancamentos: Array<{ categoriaId: string; valor: number; tipo: 'receita' | 'despesa' }>
): Record<string, number> {
  const categorias = getCategorias();
  const dre: Record<string, number> = {
    receita_bruta: 0,
    deducoes: 0,
    receita_liquida: 0,
    cmv: 0,
    lucro_bruto: 0,
    despesas_operacionais: 0,
    despesas_administrativas: 0,
    despesas_vendas: 0,
    despesas_financeiras: 0,
    outras_receitas: 0,
    outras_despesas: 0,
    lucro_operacional: 0,
    lucro_liquido: 0
  };
  
  lancamentos.forEach(lancamento => {
    const categoria = categorias.find(c => c.id === lancamento.categoriaId);
    if (!categoria || categoria.faixaDRE === 'nao_aplicavel') return;
    
    const faixa = categoria.faixaDRE;
    
    if (lancamento.tipo === 'receita') {
      dre[faixa] = (dre[faixa] || 0) + lancamento.valor;
    } else if (lancamento.tipo === 'despesa') {
      dre[faixa] = (dre[faixa] || 0) + lancamento.valor;
    }
  });
  
  // Calcular valores derivados
  dre.receita_liquida = dre.receita_bruta - dre.deducoes;
  dre.lucro_bruto = dre.receita_liquida - dre.cmv;
  dre.lucro_operacional = 
    dre.lucro_bruto - 
    (dre.despesas_operacionais + dre.despesas_administrativas + 
     dre.despesas_vendas + dre.despesas_financeiras) +
    dre.outras_receitas - dre.outras_despesas;
  dre.lucro_liquido = dre.lucro_operacional;
  
  return dre;
}
