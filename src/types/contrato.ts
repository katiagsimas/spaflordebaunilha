export type ContratoStatus = "rascunho" | "enviado" | "assinado" | "cancelado";

export type CampoTipo = "text" | "textarea" | "number" | "date" | "currency" | "select" | "tel" | "email";

export interface CampoDefinicao {
  key: string;
  label: string;
  tipo: CampoTipo;
  required?: boolean;
  placeholder?: string;
  options?: { value: string; label: string }[];
  section?: string;
}

export interface TemplateContrato {
  id: string;
  nome: string;
  tipo: string;
  descricao: string | null;
  icone: string;
  campos: CampoDefinicao[];
  corpo: string;
  ativo: boolean;
  ordem: number;
}

export interface Contrato {
  id: string;
  owner_group_id: string;
  created_by: string;
  template_id: string | null;
  template_nome: string;
  numero: number;
  status: ContratoStatus;
  cliente_nome: string;
  cliente_telefone: string | null;
  cliente_email: string | null;
  cliente_documento: string | null;
  form_data: Record<string, unknown>;
  valor_total: number;
  data_evento: string | null;
  pdf_url: string | null;
  enviado_em: string | null;
  assinado_em: string | null;
  observacoes: string | null;
  proposta_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface ContratoStats {
  total: number;
  rascunhos: number;
  enviados: number;
  assinados: number;
  cancelados: number;
  valor_total: number;
}

export const CONTRATO_STATUS_LABELS: Record<ContratoStatus, string> = {
  rascunho: "Rascunho",
  enviado: "Enviado",
  assinado: "Assinado",
  cancelado: "Cancelado",
};
