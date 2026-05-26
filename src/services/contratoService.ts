import { supabase } from "@/integrations/supabase/client";
import type { Contrato, ContratoStats, ContratoStatus, TemplateContrato } from "@/types/contrato";

export const contratoService = {
  async listTemplates(): Promise<TemplateContrato[]> {
    const { data, error } = await supabase
      .from("contratos_templates")
      .select("*")
      .eq("ativo", true)
      .order("ordem", { ascending: true });
    if (error) throw error;
    return (data ?? []) as unknown as TemplateContrato[];
  },

  async list(groupId: string): Promise<Contrato[]> {
    const { data, error } = await supabase
      .from("contratos")
      .select("*")
      .eq("owner_group_id", groupId)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return (data ?? []) as unknown as Contrato[];
  },

  async getById(id: string): Promise<Contrato | null> {
    const { data, error } = await supabase.from("contratos").select("*").eq("id", id).maybeSingle();
    if (error) throw error;
    return (data ?? null) as unknown as Contrato | null;
  },

  async stats(groupId: string): Promise<ContratoStats> {
    const all = await this.list(groupId);
    const stats: ContratoStats = {
      total: all.length, rascunhos: 0, enviados: 0, assinados: 0, cancelados: 0, valor_total: 0,
    };
    for (const c of all) {
      if (c.status === "rascunho") stats.rascunhos++;
      else if (c.status === "enviado") stats.enviados++;
      else if (c.status === "assinado") stats.assinados++;
      else if (c.status === "cancelado") stats.cancelados++;
      stats.valor_total += Number(c.valor_total ?? 0);
    }
    return stats;
  },

  async create(input: {
    owner_group_id: string;
    created_by: string;
    template_id: string | null;
    template_nome: string;
    cliente_nome: string;
    cliente_telefone?: string | null;
    cliente_email?: string | null;
    cliente_documento?: string | null;
    valor_total?: number;
    data_evento?: string | null;
    form_data?: Record<string, unknown>;
    observacoes?: string | null;
    status?: ContratoStatus;
    proposta_id?: string | null;
  }) {
    const { data: numData, error: numErr } = await supabase.rpc("proximo_numero_contrato", { _group_id: input.owner_group_id });
    if (numErr) throw numErr;
    const payload = {
      ...input,
      numero: numData as number,
      status: input.status ?? "rascunho",
      valor_total: input.valor_total ?? 0,
      form_data: (input.form_data ?? {}) as unknown as never,
    };
    const { data, error } = await supabase.from("contratos").insert(payload).select().single();
    if (error) throw error;
    return data as unknown as Contrato;
  },

  async update(id: string, input: Partial<Contrato>) {
    const patch: Record<string, unknown> = { ...input };
    delete patch.id; delete patch.owner_group_id; delete patch.created_by; delete patch.numero;
    if (input.form_data) patch.form_data = input.form_data as unknown as never;
    const { data, error } = await supabase.from("contratos").update(patch).eq("id", id).select().single();
    if (error) throw error;
    return data as unknown as Contrato;
  },

  async remove(id: string) {
    const { error } = await supabase.from("contratos").delete().eq("id", id);
    if (error) throw error;
  },
};
