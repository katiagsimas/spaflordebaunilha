// ============================================
// TYPES DO MÓDULO DE ESTOQUE - DONNA'S BOX
// ============================================

export type TipoItem = 'ingrediente' | 'embalagem';

export type UnidadeBase = 'g' | 'kg' | 'ml' | 'l' | 'un' | 'caixa' | 'pct';

export type TipoMovimento = 'entrada' | 'saida' | 'perda' | 'ajuste';

export type StatusEstoque = 'ok' | 'atencao' | 'baixo' | 'zerado' | 'sem_rastreio';

export interface Item {
  id: string;
  usuario_id: string;
  tipo: TipoItem;
  categoria?: string;
  nome: string;
  descricao?: string;
  unidade_base: UnidadeBase;
  quantidade_por_embalagem: number;
  conversoes?: Record<string, any>;
  rastrear_estoque: boolean;
  ponto_de_pedido?: number;
  localizacao?: string;
  fornecedor_padrao?: string;
  imagem_url?: string;
  ativo: boolean;
  observacoes?: string;
  criado_em: string;
  atualizado_em: string;
}

export interface Preco {
  id: string;
  item_id: string;
  usuario_id: string;
  marca: string;
  fornecedor?: string;
  preco_total_embalagem: number;
  quantidade_embalagem: number;
  custo_unitario: number;
  ativo: boolean;
  data_coleta: string;
  link_compra?: string;
  observacao?: string;
  criado_em: string;
}

export interface MovimentoEstoque {
  id: string;
  item_id: string;
  usuario_id: string;
  tipo: TipoMovimento;
  subtipo?: string;
  quantidade: number;
  custo_unitario?: number;
  valor_total?: number;
  data: string;
  referencia_id?: string;
  referencia_tipo?: string;
  responsavel?: string;
  observacao?: string;
  criado_em: string;
}

export interface EstoqueAtual {
  item_id: string;
  usuario_id: string;
  nome: string;
  tipo: TipoItem;
  categoria?: string;
  unidade_base: string;
  ponto_de_pedido?: number;
  saldo: number;
  custo_medio: number;
  valor_estoque: number;
  ultima_movimentacao?: string;
}

export interface ItemComEstoque extends Item {
  estoque?: EstoqueAtual;
  preco_ativo?: Preco;
  status?: StatusEstoque;
}

// Filtros e utilidades
export interface FiltrosEstoque {
  tipo?: TipoItem;
  categoria?: string;
  status?: StatusEstoque;
  rastrear_estoque?: boolean;
  busca?: string;
}

export interface ResumoEstoque {
  total_itens: number;
  itens_rastreados: number;
  alertas_baixo: number;
  alertas_zerado: number;
  valor_total: number;
}
