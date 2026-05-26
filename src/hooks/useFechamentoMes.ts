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

/**
 * Calcula o detalhamento de linhas do DRE para um único mês (regime de caixa),
 * usando exatamente a mesma lógica de DRE.tsx — filtrado por usuario_id.
 * Retorna um objeto de campos escalares (uma "fatia" mensal de LinhasDRE).
 */
export async function calcularLinhasDreMes(userId: string, refIso: string) {
  const { inicio, fim } = intervaloMes(refIso);

  const [pagamentosReceberRes, pagamentosPagarRes] = await Promise.all([
    supabase
      .from("contas_receber_pagamentos")
      .select(`
        valor_pago, juros, desconto, data_pagamento,
        contas_receber_parcelas!inner (
          contas_receber!inner (
            usuario_id,
            plano_contas!plano_conta_id (
              categorias_plano_contas ( codigo, faixa_dre )
            )
          )
        )
      `)
      .eq("estornado", false)
      .eq("contas_receber_parcelas.contas_receber.usuario_id", userId)
      .gte("data_pagamento", inicio)
      .lte("data_pagamento", fim),
    supabase
      .from("contas_pagar_pagamentos")
      .select(`
        valor_pago, juros, desconto, data_pagamento,
        contas_pagar_parcelas!inner (
          contas_pagar!inner (
            usuario_id,
            plano_contas!plano_contas_id (
              categorias_plano_contas ( codigo, faixa_dre )
            )
          )
        )
      `)
      .eq("estornado", false)
      .eq("contas_pagar_parcelas.contas_pagar.usuario_id", userId)
      .gte("data_pagamento", inicio)
      .lte("data_pagamento", fim),
  ]);

  const planosReceita: Record<string, number> = {};
  const planosDespesa: Record<string, number> = {};
  const faixasReceber: Record<string, number> = {};
  const faixasPagar: Record<string, number> = {};

  ((pagamentosReceberRes.data as any[]) || []).forEach((pag) => {
    const valor = (pag.valor_pago || 0) + (pag.juros || 0) - (pag.desconto || 0);
    const cat = pag?.contas_receber_parcelas?.contas_receber?.plano_contas?.categorias_plano_contas;
    if (cat?.codigo) planosReceita[cat.codigo] = (planosReceita[cat.codigo] || 0) + valor;
    if (cat?.faixa_dre) faixasReceber[cat.faixa_dre] = (faixasReceber[cat.faixa_dre] || 0) + valor;
  });

  ((pagamentosPagarRes.data as any[]) || []).forEach((pag) => {
    const valor = (pag.valor_pago || 0) + (pag.juros || 0) - (pag.desconto || 0);
    const cat = pag?.contas_pagar_parcelas?.contas_pagar?.plano_contas?.categorias_plano_contas;
    if (cat?.codigo) planosDespesa[cat.codigo] = (planosDespesa[cat.codigo] || 0) + valor;
    if (cat?.faixa_dre) faixasPagar[cat.faixa_dre] = (faixasPagar[cat.faixa_dre] || 0) + valor;
  });

  const receitaVendas = planosReceita['1'] || 0;
  let receitasFinanceiras = planosReceita['106'] || 0;
  const receitasNaoOperacionais = planosReceita['9'] || 0;

  const impostosSobreVendas = planosDespesa['2'] || 0;
  const outrasDeducoes = planosDespesa['99'] || 0;
  const cmv = planosDespesa['3'] || 0;
  const despesasComerciais = planosDespesa['8'] || 0;
  const despesaOperacionalVariavel = planosDespesa['103'] || 0;
  const campanhasSazonais = planosDespesa['112'] || 0;
  const despesasPessoal = planosDespesa['5'] || 0;
  const despesasOcupacao = planosDespesa['6'] || 0;
  const despesasAdministrativas = planosDespesa['7'] || 0;
  let despesasFinanceiras = planosDespesa['107'] || 0;
  const gastosNaoOperacionais = planosDespesa['10'] || 0;

  const receitaBruta = faixasReceber['Receitas'] || 0;
  const totalDeducoes = faixasPagar['Deduções sobre vendas'] || 0;
  const receitaLiquida = receitaBruta - totalDeducoes;

  const totalCustosVariaveis = faixasPagar['Custos variáveis'] || 0;
  const margemContribuicao = receitaLiquida - totalCustosVariaveis;
  const margemContribuicaoPerc = receitaBruta !== 0 ? (margemContribuicao / receitaBruta) * 100 : 0;

  const totalCustosFixos = faixasPagar['Custos fixos'] || 0;
  const resultadoOperacional = margemContribuicao - totalCustosFixos;

  const receitasNaoOpFaixa = faixasReceber['Resultado não operacional'] || 0;
  const gastosNaoOpFaixa = faixasPagar['Resultado não operacional'] || 0;
  const resultadoNaoOperacional = receitasNaoOpFaixa - gastosNaoOpFaixa;

  const receitasFinFaixa = faixasReceber['Resultado financeiro'] || 0;
  const despesasFinFaixa = faixasPagar['Resultado financeiro'] || 0;
  if (receitasFinFaixa > receitasFinanceiras) receitasFinanceiras = receitasFinFaixa;
  if (despesasFinFaixa > despesasFinanceiras) despesasFinanceiras = despesasFinFaixa;

  const lair = resultadoOperacional + receitasFinanceiras - despesasFinanceiras + resultadoNaoOperacional;
  const impostoRenda = 0;
  const lucroLiquido = lair - impostoRenda;
  const margemLiquidaPerc = receitaBruta !== 0 ? (lucroLiquido / receitaBruta) * 100 : 0;

  return {
    receitaBruta, receitaVendas, impostosSobreVendas, outrasDeducoes, totalDeducoes, receitaLiquida,
    cmv, despesasComerciais, despesaOperacionalVariavel, campanhasSazonais, totalCustosVariaveis,
    margemContribuicao, margemContribuicaoPerc,
    despesasPessoal, despesasOcupacao, despesasAdministrativas, totalCustosFixos,
    resultadoOperacional, receitasFinanceiras, despesasFinanceiras,
    receitasNaoOperacionais, gastosNaoOperacionais, resultadoNaoOperacional,
    lair, impostoRenda, lucroLiquido, margemLiquidaPerc,
  };
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

      // Snapshot continua sendo montado no cliente (regra preservada)
      const { data: f } = await (supabase.from("fechamentos_mensais" as any) as any)
        .select("mes_referencia")
        .eq("id", input.id)
        .single();
      const valores = await calcularValores(activeGroupId, f.mes_referencia);
      const linhasDre = await calcularLinhasDreMes(user.id, f.mes_referencia);
      const snapshot = { ...valores, linhas_dre: linhasDre, gerado_em: new Date().toISOString() };

      // Fechamento + validação de checklist agora 100% no banco via RPC SECURITY DEFINER.
      // Códigos de erro: P0001 acesso negado, P0002 checklist pendente, P0003 não encontrado, P0004 já fechado.
      const { error } = await (supabase.rpc as any)("fechar_mes", {
        p_fechamento_id: input.id,
        p_observacoes: input.observacoes ?? null,
        p_snapshot: snapshot,
        p_faturamento: valores.faturamento ?? 0,
        p_custos: valores.custos ?? 0,
        p_margem_seguranca: valores.margem_seguranca ?? 0,
        p_pro_labore_saudavel: valores.pro_labore_saudavel ?? 0,
        p_retiradas: valores.retiradas ?? 0,
        p_saldo_restante: valores.saldo_restante ?? 0,
      });
      if (error) throw new Error(error.message);
    },

    onSuccess: () => {
      toast.success("Mês fechado com sucesso");
      qc.invalidateQueries({ queryKey: ["fechamento"] });
      qc.invalidateQueries({ queryKey: ["fechamentos-lista"] });
      qc.invalidateQueries({ queryKey: ["fechamento-logs"] });
      qc.invalidateQueries({ queryKey: ["meu-salario-resumo"] });
      qc.invalidateQueries({ queryKey: ["meu-salario-historico"] });
    },
    onError: (e: any) => toast.error(e.message ?? "Erro ao fechar mês"),
  });
}

export function useReabrirMes() {
  const qc = useQueryClient();
  const { user } = useAuth();
  const { activeGroupId } = useGroup();

  return useMutation({
    mutationFn: async (input: { id: string; motivo: string }) => {
      if (!user || !activeGroupId) throw new Error("Sem contexto");
      const motivo = (input.motivo ?? "").trim();
      if (motivo.length < 3) throw new Error("Informe o motivo da reabertura (mínimo 3 caracteres).");

      const { data: atual } = await (supabase.from("fechamentos_mensais" as any) as any)
        .select("snapshot, faturamento, custos, margem_seguranca, pro_labore_saudavel, retiradas, saldo_restante")
        .eq("id", input.id)
        .single();

      const { error } = await (supabase.from("fechamentos_mensais" as any) as any)
        .update({
          status: "aberto",
          reaberto_em: new Date().toISOString(),
          reaberto_por: user.id,
        })
        .eq("id", input.id);
      if (error) throw error;

      await (supabase.from("fechamento_logs" as any) as any).insert({
        fechamento_id: input.id,
        owner_group_id: activeGroupId,
        acao: "reaberto",
        motivo,
        snapshot: atual?.snapshot ?? atual,
        usuario_id: user.id,
      });
    },
    onSuccess: () => {
      toast.success("Mês reaberto");
      qc.invalidateQueries({ queryKey: ["fechamento"] });
      qc.invalidateQueries({ queryKey: ["fechamentos-lista"] });
      qc.invalidateQueries({ queryKey: ["fechamento-logs"] });
    },
    onError: (e: any) => toast.error(e.message ?? "Erro ao reabrir mês"),
  });
}

export interface FechamentoLog {
  id: string;
  fechamento_id: string;
  acao: "fechado" | "reaberto" | "iniciado";
  motivo: string | null;
  snapshot: any;
  usuario_id: string | null;
  created_at: string;
  usuario_nome?: string | null;
  usuario_email?: string | null;
}

export function useFechamentoLogs(fechamentoId?: string) {
  return useQuery({
    queryKey: ["fechamento-logs", fechamentoId],
    queryFn: async () => {
      if (!fechamentoId) return [] as FechamentoLog[];
      const { data, error } = await (supabase.from("fechamento_logs" as any) as any)
        .select("*")
        .eq("fechamento_id", fechamentoId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      const logs = (data ?? []) as FechamentoLog[];
      const userIds = Array.from(new Set(logs.map(l => l.usuario_id).filter(Boolean))) as string[];
      if (userIds.length) {
        const { data: profs } = await supabase
          .from("profiles")
          .select("id, nome_completo, email")
          .in("id", userIds);
        const mapa = new Map((profs ?? []).map((p: any) => [p.id, p]));
        return logs.map(l => ({
          ...l,
          usuario_nome: l.usuario_id ? (mapa.get(l.usuario_id) as any)?.nome_completo ?? null : null,
          usuario_email: l.usuario_id ? (mapa.get(l.usuario_id) as any)?.email ?? null : null,
        }));
      }
      return logs;
    },
    enabled: !!fechamentoId,
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
