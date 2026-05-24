import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useGroup } from "@/contexts/GroupContext";
import { toast } from "sonner";
import { MARGEM_SEGURANCA } from "./useMeuSalario";

export interface FechamentoMensal {
  id: string;
  owner_group_id: string;
  mes_referencia: string; // YYYY-MM-01
  status: "aberto" | "fechado";
  faturamento: number;
  custos: number;
  margem_seguranca: number;
  pro_labore_saudavel: number;
  retiradas: number;
  saldo_restante: number;
  snapshot: any;
  observacoes: string | null;
  fechado_em: string | null;
  fechado_por: string | null;
  reaberto_em: string | null;
  reaberto_por: string | null;
  created_at: string;
  updated_at: string;
}

export interface ChecklistItem {
  id: string;
  fechamento_id: string;
  ordem: number;
  titulo: string;
  descricao: string | null;
  concluido: boolean;
  concluido_em: string | null;
  concluido_por: string | null;
}

const CHECKLIST_PADRAO: Array<{ titulo: string; descricao: string }> = [
  { titulo: "Conferir saldos bancários", descricao: "Confirme que o saldo de cada banco bate com o extrato real." },
  { titulo: "Dar baixa em todas as contas a receber pagas", descricao: "Nenhum recebimento do mês pode estar pendente." },
  { titulo: "Dar baixa em todas as contas a pagar quitadas", descricao: "Confirme que todos os pagamentos do mês foram registrados." },
  { titulo: "Registrar pró-labore/retiradas do mês", descricao: "Garanta que as retiradas pessoais já foram lançadas em Meu Salário." },
  { titulo: "Revisar lançamentos sem categoria", descricao: "Verifique se há contas sem plano de contas associado." },
  { titulo: "Conferir DRE e Fluxo de Caixa", descricao: "Compare o resultado do mês com sua expectativa." },
];

function mesIso(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-01`;
}

function intervaloMes(refIso: string) {
  const [y, m] = refIso.split("-").map(Number);
  const inicio = `${y}-${String(m).padStart(2, "0")}-01`;
  const fimDate = new Date(y, m, 0);
  const fim = `${y}-${String(m).padStart(2, "0")}-${String(fimDate.getDate()).padStart(2, "0")}`;
  return { inicio, fim };
}

async function calcularValores(ownerGroupId: string, refIso: string) {
  const { inicio, fim } = intervaloMes(refIso);
  const [recRes, pagRes, retRes] = await Promise.all([
    supabase
      .from("contas_receber_pagamentos")
      .select("valor_pago, estornado, parcela:contas_receber_parcelas!inner(conta_receber:contas_receber!inner(owner_group_id))")
      .eq("parcela.conta_receber.owner_group_id", ownerGroupId)
      .gte("data_pagamento", inicio)
      .lte("data_pagamento", fim),
    supabase
      .from("contas_pagar_pagamentos")
      .select("valor_pago, estornado, parcela:contas_pagar_parcelas!inner(conta_pagar:contas_pagar!inner(owner_group_id))")
      .eq("parcela.conta_pagar.owner_group_id", ownerGroupId)
      .gte("data_pagamento", inicio)
      .lte("data_pagamento", fim),
    (supabase.from("meu_salario_retiradas" as any) as any)
      .select("valor")
      .eq("owner_group_id", ownerGroupId)
      .gte("data_retirada", inicio)
      .lte("data_retirada", fim),
  ]);

  const faturamento = (recRes.data ?? []).filter((p: any) => !p.estornado).reduce((s: number, r: any) => s + Number(r.valor_pago || 0), 0);
  const custos = (pagRes.data ?? []).filter((p: any) => !p.estornado).reduce((s: number, r: any) => s + Number(r.valor_pago || 0), 0);
  const retiradas = (retRes.data ?? []).reduce((s: number, r: any) => s + Number(r.valor || 0), 0);
  const margem = faturamento * MARGEM_SEGURANCA;
  const proLabore = Math.max(0, faturamento - custos - margem);
  const saldo = proLabore - retiradas;

  return { faturamento, custos, margem_seguranca: margem, pro_labore_saudavel: proLabore, retiradas, saldo_restante: saldo };
}

export function useFechamentoMes(refIso: string) {
  const { activeGroupId } = useGroup();

  const fechamentoQuery = useQuery({
    queryKey: ["fechamento", activeGroupId, refIso],
    queryFn: async () => {
      const { data, error } = await (supabase.from("fechamentos_mensais" as any) as any)
        .select("*")
        .eq("owner_group_id", activeGroupId)
        .eq("mes_referencia", refIso)
        .maybeSingle();
      if (error) throw error;
      return data as FechamentoMensal | null;
    },
    enabled: !!activeGroupId && !!refIso,
  });

  const previaQuery = useQuery({
    queryKey: ["fechamento-previa", activeGroupId, refIso],
    queryFn: () => calcularValores(activeGroupId!, refIso),
    enabled: !!activeGroupId && !!refIso,
  });

  const checklistQuery = useQuery({
    queryKey: ["fechamento-checklist", fechamentoQuery.data?.id],
    queryFn: async () => {
      if (!fechamentoQuery.data?.id) return [] as ChecklistItem[];
      const { data, error } = await (supabase.from("fechamento_checklist_itens" as any) as any)
        .select("*")
        .eq("fechamento_id", fechamentoQuery.data.id)
        .order("ordem");
      if (error) throw error;
      return (data ?? []) as ChecklistItem[];
    },
    enabled: !!fechamentoQuery.data?.id,
  });

  return { fechamento: fechamentoQuery.data, previa: previaQuery.data, checklist: checklistQuery.data ?? [], isLoading: fechamentoQuery.isLoading || previaQuery.isLoading };
}

export function useListaFechamentos() {
  const { activeGroupId } = useGroup();
  return useQuery({
    queryKey: ["fechamentos-lista", activeGroupId],
    queryFn: async () => {
      const { data, error } = await (supabase.from("fechamentos_mensais" as any) as any)
        .select("*")
        .eq("owner_group_id", activeGroupId)
        .order("mes_referencia", { ascending: false })
        .limit(24);
      if (error) throw error;
      return (data ?? []) as FechamentoMensal[];
    },
    enabled: !!activeGroupId,
  });
}

export function useAbrirOuCriarFechamento() {
  const qc = useQueryClient();
  const { user } = useAuth();
  const { activeGroupId } = useGroup();

  return useMutation({
    mutationFn: async (refIso: string) => {
      if (!user || !activeGroupId) throw new Error("Sem contexto");
      const valores = await calcularValores(activeGroupId, refIso);
      const { data, error } = await (supabase.from("fechamentos_mensais" as any) as any)
        .upsert(
          {
            owner_group_id: activeGroupId,
            mes_referencia: refIso,
            status: "aberto",
            ...valores,
          },
          { onConflict: "owner_group_id,mes_referencia", ignoreDuplicates: true }
        )
        .select()
        .maybeSingle();
      if (error && error.code !== "23505") throw error;

      // Buscar existente
      const { data: existente } = await (supabase.from("fechamentos_mensais" as any) as any)
        .select("*")
        .eq("owner_group_id", activeGroupId)
        .eq("mes_referencia", refIso)
        .single();

      // Criar checklist padrão se não houver
      const { data: existemItens } = await (supabase.from("fechamento_checklist_itens" as any) as any)
        .select("id")
        .eq("fechamento_id", existente.id)
        .limit(1);

      if (!existemItens || existemItens.length === 0) {
        await (supabase.from("fechamento_checklist_itens" as any) as any).insert(
          CHECKLIST_PADRAO.map((item, idx) => ({
            fechamento_id: existente.id,
            ordem: idx,
            titulo: item.titulo,
            descricao: item.descricao,
          }))
        );
      }
      return existente as FechamentoMensal;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["fechamento"] });
      qc.invalidateQueries({ queryKey: ["fechamento-checklist"] });
      qc.invalidateQueries({ queryKey: ["fechamentos-lista"] });
    },
    onError: (e: any) => toast.error(e.message ?? "Erro ao iniciar fechamento"),
  });
}

export function useFecharMes() {
  const qc = useQueryClient();
  const { user } = useAuth();
  const { activeGroupId } = useGroup();

  return useMutation({
    mutationFn: async (input: { id: string; observacoes?: string }) => {
      if (!user || !activeGroupId) throw new Error("Sem contexto");
      const { data: f } = await (supabase.from("fechamentos_mensais" as any) as any)
        .select("mes_referencia")
        .eq("id", input.id)
        .single();
      const valores = await calcularValores(activeGroupId, f.mes_referencia);
      const { error } = await (supabase.from("fechamentos_mensais" as any) as any)
        .update({
          status: "fechado",
          fechado_em: new Date().toISOString(),
          fechado_por: user.id,
          observacoes: input.observacoes ?? null,
          snapshot: { ...valores, gerado_em: new Date().toISOString() },
          ...valores,
        })
        .eq("id", input.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Mês fechado com sucesso");
      qc.invalidateQueries({ queryKey: ["fechamento"] });
      qc.invalidateQueries({ queryKey: ["fechamentos-lista"] });
      qc.invalidateQueries({ queryKey: ["meu-salario-resumo"] });
      qc.invalidateQueries({ queryKey: ["meu-salario-historico"] });
    },
    onError: (e: any) => toast.error(e.message ?? "Erro ao fechar mês"),
  });
}

export function useReabrirMes() {
  const qc = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (id: string) => {
      if (!user) throw new Error("Sem contexto");
      const { error } = await (supabase.from("fechamentos_mensais" as any) as any)
        .update({
          status: "aberto",
          reaberto_em: new Date().toISOString(),
          reaberto_por: user.id,
        })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Mês reaberto");
      qc.invalidateQueries({ queryKey: ["fechamento"] });
      qc.invalidateQueries({ queryKey: ["fechamentos-lista"] });
    },
    onError: (e: any) => toast.error(e.message ?? "Erro ao reabrir mês"),
  });
}

export function useToggleChecklistItem() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (input: { id: string; concluido: boolean }) => {
      const { error } = await (supabase.from("fechamento_checklist_itens" as any) as any)
        .update({
          concluido: input.concluido,
          concluido_em: input.concluido ? new Date().toISOString() : null,
          concluido_por: input.concluido ? user?.id ?? null : null,
        })
        .eq("id", input.id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["fechamento-checklist"] }),
    onError: (e: any) => toast.error(e.message ?? "Erro"),
  });
}

export function mesAnteriorIso(): string {
  const hoje = new Date();
  const ref = new Date(hoje.getFullYear(), hoje.getMonth() - 1, 1);
  return mesIso(ref);
}

export function listaMesesRecentes(qtd = 12): Array<{ iso: string; rotulo: string }> {
  const meses = ["janeiro", "fevereiro", "março", "abril", "maio", "junho", "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"];
  const hoje = new Date();
  const lista: Array<{ iso: string; rotulo: string }> = [];
  for (let i = 0; i < qtd; i++) {
    const d = new Date(hoje.getFullYear(), hoje.getMonth() - i, 1);
    lista.push({ iso: mesIso(d), rotulo: `${meses[d.getMonth()]} de ${d.getFullYear()}` });
  }
  return lista;
}
