import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useGroup } from "@/contexts/GroupContext";
import { toast } from "sonner";

export const MARGEM_SEGURANCA = 0.20;

export interface ResumoMes {
  mesReferencia: string; // YYYY-MM
  rotuloMes: string; // "abril/2026"
  faturamento: number;
  custos: number;
  margemSeguranca: number;
  proLaboreSaudavel: number;
  retiradas: number;
  saldoRestante: number;
  cenario: "abaixo" | "equilibrio" | "acima";
  inicio: string; // YYYY-MM-DD
  fim: string; // YYYY-MM-DD
}

export interface Retirada {
  id: string;
  owner_group_id: string;
  user_id: string;
  data_retirada: string;
  valor: number;
  descricao: string | null;
  created_at: string;
  updated_at: string;
}

function intervaloMes(year: number, month0: number) {
  const inicio = new Date(year, month0, 1);
  const fim = new Date(year, month0 + 1, 0);
  const fmt = (d: Date) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
      d.getDate()
    ).padStart(2, "0")}`;
  return { inicio: fmt(inicio), fim: fmt(fim) };
}

function rotuloMes(year: number, month0: number) {
  const meses = [
    "janeiro", "fevereiro", "março", "abril", "maio", "junho",
    "julho", "agosto", "setembro", "outubro", "novembro", "dezembro",
  ];
  return `${meses[month0]} de ${year}`;
}

function classificarCenario(saldo: number, proLabore: number): ResumoMes["cenario"] {
  if (proLabore <= 0) return saldo < 0 ? "acima" : "equilibrio";
  const tolerancia = Math.max(proLabore * 0.05, 1);
  if (Math.abs(saldo) <= tolerancia) return "equilibrio";
  return saldo > 0 ? "abaixo" : "acima";
}

async function calcularResumo(
  ownerGroupId: string,
  ano: number,
  mes0: number
): Promise<ResumoMes> {
  const { inicio, fim } = intervaloMes(ano, mes0);

  // Se houver fechamento consolidado para este mês, usar o snapshot
  const refIso = `${ano}-${String(mes0 + 1).padStart(2, "0")}-01`;
  const { data: fechamento } = await (supabase.from("fechamentos_mensais" as any) as any)
    .select("status, faturamento, custos, margem_seguranca, pro_labore_saudavel, retiradas, saldo_restante")
    .eq("owner_group_id", ownerGroupId)
    .eq("mes_referencia", refIso)
    .eq("status", "fechado")
    .maybeSingle();

  if (fechamento) {
    const faturamento = Number(fechamento.faturamento);
    const custos = Number(fechamento.custos);
    const margemSeguranca = Number(fechamento.margem_seguranca);
    const proLaboreSaudavel = Number(fechamento.pro_labore_saudavel);
    const retiradas = Number(fechamento.retiradas);
    const saldoRestante = Number(fechamento.saldo_restante);
    return {
      mesReferencia: `${ano}-${String(mes0 + 1).padStart(2, "0")}`,
      rotuloMes: rotuloMes(ano, mes0),
      faturamento, custos, margemSeguranca, proLaboreSaudavel, retiradas, saldoRestante,
      cenario: classificarCenario(saldoRestante, proLaboreSaudavel),
      inicio, fim,
    };
  }

  // Considera apenas valores efetivamente pagos/recebidos (não estornados),
  // usando as tabelas de pagamentos para refletir entradas/saídas reais de caixa.
  const [recPagRes, pagPagRes, retRes] = await Promise.all([
    supabase
      .from("contas_receber_pagamentos")
      .select("valor_pago, data_pagamento, estornado, parcela:contas_receber_parcelas!inner(conta_receber:contas_receber!inner(owner_group_id))")
      .eq("parcela.conta_receber.owner_group_id", ownerGroupId)
      .gte("data_pagamento", inicio)
      .lte("data_pagamento", fim),
    supabase
      .from("contas_pagar_pagamentos")
      .select("valor_pago, data_pagamento, estornado, parcela:contas_pagar_parcelas!inner(conta_pagar:contas_pagar!inner(owner_group_id))")
      .eq("parcela.conta_pagar.owner_group_id", ownerGroupId)
      .gte("data_pagamento", inicio)
      .lte("data_pagamento", fim),
    (supabase.from("meu_salario_retiradas" as any) as any)
      .select("valor, data_retirada")
      .eq("owner_group_id", ownerGroupId)
      .gte("data_retirada", inicio)
      .lte("data_retirada", fim),
  ]);

  if (recPagRes.error) throw new Error("Falha ao consultar recebimentos: " + recPagRes.error.message);
  if (pagPagRes.error) throw new Error("Falha ao consultar pagamentos: " + pagPagRes.error.message);
  if (retRes.error) throw new Error("Falha ao consultar retiradas: " + retRes.error.message);

  const faturamento = (recPagRes.data ?? [])
    .filter((p: any) => !p.estornado)
    .reduce((s: number, r: any) => s + Number(r.valor_pago || 0), 0);
  const custos = (pagPagRes.data ?? [])
    .filter((p: any) => !p.estornado)
    .reduce((s: number, r: any) => s + Number(r.valor_pago || 0), 0);
  const retiradas = (retRes.data ?? []).reduce(
    (s: number, r: any) => s + Number(r.valor || 0),
    0
  );

  const margemSeguranca = faturamento * MARGEM_SEGURANCA;
  const proLaboreSaudavel = Math.max(0, faturamento - custos - margemSeguranca);
  const saldoRestante = proLaboreSaudavel - retiradas;

  return {
    mesReferencia: `${ano}-${String(mes0 + 1).padStart(2, "0")}`,
    rotuloMes: rotuloMes(ano, mes0),
    faturamento,
    custos,
    margemSeguranca,
    proLaboreSaudavel,
    retiradas,
    saldoRestante,
    cenario: classificarCenario(saldoRestante, proLaboreSaudavel),
    inicio,
    fim,
  };
}

export function useResumoMesAnterior(params?: { ano?: number; mes0?: number }) {
  const { activeGroupId } = useGroup();
  const hoje = new Date();
  const anoDefault = hoje.getMonth() === 0 ? hoje.getFullYear() - 1 : hoje.getFullYear();
  const mes0Default = hoje.getMonth() === 0 ? 11 : hoje.getMonth() - 1;
  const ano = params?.ano ?? anoDefault;
  const mes0 = params?.mes0 ?? mes0Default;

  return useQuery({
    queryKey: ["meu-salario-resumo", activeGroupId, ano, mes0],
    queryFn: () => calcularResumo(activeGroupId!, ano, mes0),
    enabled: !!activeGroupId,
  });
}

export function useHistoricoMeuSalario(meses = 6) {
  const { activeGroupId } = useGroup();

  return useQuery({
    queryKey: ["meu-salario-historico", activeGroupId, meses],
    queryFn: async () => {
      const hoje = new Date();
      // Dispara todos os cálculos em paralelo
      const promessas = [];
      for (let i = 1; i <= meses; i++) {
        const d = new Date(hoje.getFullYear(), hoje.getMonth() - i, 1);
        promessas.push(calcularResumo(activeGroupId!, d.getFullYear(), d.getMonth()));
      }
      const resumos = await Promise.all(promessas);
      return resumos.reverse();
    },
    enabled: !!activeGroupId,
  });
}

export function useRetiradas(inicio: string, fim: string) {
  const { activeGroupId } = useGroup();

  return useQuery({
    queryKey: ["meu-salario-retiradas", activeGroupId, inicio, fim],
    queryFn: async () => {
      const { data, error } = await (supabase.from("meu_salario_retiradas" as any) as any)
        .select("*")
        .eq("owner_group_id", activeGroupId)
        .gte("data_retirada", inicio)
        .lte("data_retirada", fim)
        .order("data_retirada", { ascending: false });
      if (error) throw error;
      return (data ?? []) as Retirada[];
    },
    enabled: !!activeGroupId && !!inicio && !!fim,
  });
}

export function useCriarRetirada() {
  const qc = useQueryClient();
  const { user } = useAuth();
  const { activeGroupId } = useGroup();

  return useMutation({
    mutationFn: async (input: { data_retirada: string; valor: number; descricao?: string }) => {
      if (!user || !activeGroupId) throw new Error("Sem contexto de grupo");
      const { error } = await (supabase.from("meu_salario_retiradas" as any) as any).insert({
        owner_group_id: activeGroupId,
        user_id: user.id,
        data_retirada: input.data_retirada,
        valor: input.valor,
        descricao: input.descricao ?? null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Retirada registrada");
      qc.invalidateQueries({ queryKey: ["meu-salario-retiradas"] });
      qc.invalidateQueries({ queryKey: ["meu-salario-resumo"] });
      qc.invalidateQueries({ queryKey: ["meu-salario-historico"] });
    },
    onError: (e: any) => toast.error(e.message ?? "Erro ao registrar retirada"),
  });
}

export function useExcluirRetirada() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase.from("meu_salario_retiradas" as any) as any)
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Retirada removida");
      qc.invalidateQueries({ queryKey: ["meu-salario-retiradas"] });
      qc.invalidateQueries({ queryKey: ["meu-salario-resumo"] });
      qc.invalidateQueries({ queryKey: ["meu-salario-historico"] });
    },
    onError: (e: any) => toast.error(e.message ?? "Erro ao remover"),
  });
}

