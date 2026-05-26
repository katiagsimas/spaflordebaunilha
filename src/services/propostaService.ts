import { supabase } from "@/integrations/supabase/client";
import type { Proposta, PropostaProduto, PropostaStats, PropostaStatus } from "@/types/proposta";

function recalcularTotais(produtos: PropostaProduto[], desconto: number, frete: number) {
  const subtotal = produtos.reduce((acc, p) => acc + p.quantidade * p.preco_unitario, 0);
  const valor_total = Math.max(0, subtotal - desconto + frete);
  return { subtotal, valor_total };
}

export const propostaService = {
  async list(groupId: string): Promise<Proposta[]> {
    const { data, error } = await supabase
      .from("propostas")
      .select("*")
      .eq("owner_group_id", groupId)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return (data ?? []) as unknown as Proposta[];
  },

  async getById(id: string): Promise<Proposta | null> {
    const { data, error } = await supabase.from("propostas").select("*").eq("id", id).maybeSingle();
    if (error) throw error;
    return (data ?? null) as unknown as Proposta | null;
  },

  async stats(groupId: string): Promise<PropostaStats> {
    const all = await this.list(groupId);
    const stats: PropostaStats = {
      total: all.length,
      rascunho: 0, enviada: 0, aceita: 0, rejeitada: 0, expirada: 0,
      valor_total_aceitas: 0,
      ticket_medio: 0,
    };
    let aceitasCount = 0;
    for (const p of all) {
      stats[p.status]++;
      if (p.status === "aceita") {
        stats.valor_total_aceitas += Number(p.valor_total);
        aceitasCount++;
      }
    }
    stats.ticket_medio = aceitasCount > 0 ? stats.valor_total_aceitas / aceitasCount : 0;
    return stats;
  },

  async create(input: Partial<Proposta> & { owner_group_id: string; created_by: string; cliente_nome: string }) {
    const produtos = (input.produtos ?? []) as PropostaProduto[];
    const desconto = input.desconto ?? 0;
    const frete = input.frete ?? 0;
    const { subtotal, valor_total } = recalcularTotais(produtos, desconto, frete);

    const { data: numData, error: numErr } = await supabase.rpc("proximo_numero_proposta", { _group_id: input.owner_group_id });
    if (numErr) throw numErr;

    const payload = {
      owner_group_id: input.owner_group_id,
      created_by: input.created_by,
      numero: numData as number,
      status: (input.status ?? "rascunho") as PropostaStatus,
      cliente_nome: input.cliente_nome,
      cliente_telefone: input.cliente_telefone ?? null,
      cliente_email: input.cliente_email ?? null,
      cliente_documento: input.cliente_documento ?? null,
      cliente_endereco_cep: input.cliente_endereco_cep ?? null,
      cliente_endereco_rua: input.cliente_endereco_rua ?? null,
      cliente_endereco_numero: input.cliente_endereco_numero ?? null,
      cliente_endereco_complemento: input.cliente_endereco_complemento ?? null,
      cliente_endereco_bairro: input.cliente_endereco_bairro ?? null,
      cliente_endereco_cidade: input.cliente_endereco_cidade ?? null,
      cliente_endereco_estado: input.cliente_endereco_estado ?? null,
      produtos: produtos as unknown as never,
      subtotal,
      desconto,
      frete,
      valor_total,
      data_emissao: input.data_emissao ?? new Date().toISOString().slice(0, 10),
      data_validade: input.data_validade ?? null,
      data_entrega: input.data_entrega ?? null,
      forma_pagamento: input.forma_pagamento ?? null,
      observacoes: input.observacoes ?? null,
    };

    const { data, error } = await supabase.from("propostas").insert(payload).select().single();
    if (error) throw error;
    return data as unknown as Proposta;
  },

  async update(id: string, input: Partial<Proposta>) {
    const patch: Record<string, unknown> = { ...input };
    if (input.produtos) {
      const { subtotal, valor_total } = recalcularTotais(
        input.produtos,
        input.desconto ?? 0,
        input.frete ?? 0
      );
      patch.subtotal = subtotal;
      patch.valor_total = valor_total;
      patch.produtos = input.produtos as unknown as never;
    }
    delete (patch as Record<string, unknown>).id;
    delete (patch as Record<string, unknown>).owner_group_id;
    delete (patch as Record<string, unknown>).created_by;
    delete (patch as Record<string, unknown>).numero;
    const { data, error } = await supabase.from("propostas").update(patch).eq("id", id).select().single();
    if (error) throw error;
    return data as unknown as Proposta;
  },

  async remove(id: string) {
    const { error } = await supabase.from("propostas").delete().eq("id", id);
    if (error) throw error;
  },
};
