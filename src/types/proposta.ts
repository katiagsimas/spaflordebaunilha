export type PropostaStatus = "rascunho" | "enviada" | "aceita" | "rejeitada" | "expirada";

export interface PropostaProduto {
  id: string;
  nome: string;
  descricao?: string;
  quantidade: number;
  preco_unitario: number;
  observacoes?: string;
}

export interface Proposta {
  id: string;
  owner_group_id: string;
  created_by: string;
  numero: number;
  status: PropostaStatus;
  cliente_nome: string;
  cliente_telefone: string | null;
  cliente_email: string | null;
  cliente_documento: string | null;
  cliente_endereco_cep: string | null;
  cliente_endereco_rua: string | null;
  cliente_endereco_numero: string | null;
  cliente_endereco_complemento: string | null;
  cliente_endereco_bairro: string | null;
  cliente_endereco_cidade: string | null;
  cliente_endereco_estado: string | null;
  produtos: PropostaProduto[];
  subtotal: number;
  desconto: number;
  frete: number;
  valor_total: number;
  data_emissao: string;
  data_validade: string | null;
  data_entrega: string | null;
  forma_pagamento: string | null;
  observacoes: string | null;
  created_at: string;
  updated_at: string;
}

export interface PropostaStats {
  total: number;
  rascunho: number;
  enviada: number;
  aceita: number;
  rejeitada: number;
  expirada: number;
  valor_total_aceitas: number;
  ticket_medio: number;
}

export const STATUS_LABELS: Record<PropostaStatus, string> = {
  rascunho: "Rascunho",
  enviada: "Enviada",
  aceita: "Aceita",
  rejeitada: "Rejeitada",
  expirada: "Expirada",
};
