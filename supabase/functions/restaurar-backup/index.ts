// Edge Function: restaurar-backup
// Restaura um snapshot JSON para o owner_group_id do usuário autenticado,
// com dupla confirmação (palavra-chave revalidada server-side).
//
// Aceita:
//   - { backup_id: string, confirmacao: string }              → restaura do histórico do usuário
//   - { dados: object, nome: string, confirmacao: string }    → restaura de arquivo .json
//   - { cofre_id: string, confirmacao: string }               → MOTHER restaura via cofre
//
// Segurança:
//   - Valida JWT do chamador.
//   - Revalida `confirmacao === "RESTAURAR " + nome`.
//   - Restringe quais tabelas podem ser tocadas (lista permitida).
//   - Nunca apaga profiles / groups / user_*_roles / admin_logs / auth.*.
//   - Apenas opera dentro do owner_group_id do chamador (ou do snapshot, se MOTHER via cofre).

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

// Tabelas permitidas para DELETE/INSERT, em ordem de FK (pais → filhos).
// Espelha src/lib/backupCatalog.ts. INSERT segue esta ordem; DELETE segue a ordem reversa.
const TABELAS_PERMITIDAS_ORDEM: string[] = [
  // Operação - cadastros
  "categorias", "unidades_medida", "tipos_insumos",
  "ingredientes", "embalagens",
  "mao_obra_perfis", "mao_obra_perfis_historico",
  // Cardápio - pais primeiro
  "pre_preparos", "pre_preparos_ingredientes", "pre_preparos_mao_obra",
  "receitas", "receitas_ingredientes", "receitas_embalagens",
  "receitas_mao_obra", "receitas_despesas_venda", "receitas_imagens",
  // Estoque
  "estoque", "estoque_movimentacoes",
  // Comercial - pais primeiro
  "clientes", "cliente_familiares",
  "fornecedores", "fornecedor_contatos",
  "contratos_templates",
  "propostas", "contratos",
  "tags", "tags_encomendas",
  "encomendas", "encomenda_itens", "encomendas_tags",
  // Financeiro
  "bancos", "saldos_iniciais_bancos", "transferencias_bancos",
  "categorias_plano_contas", "plano_contas",
  "tipos_documento",
  "contas_receber", "contas_receber_parcelas", "contas_receber_pagamentos", "contas_receber_comprovantes",
  "contas_pagar", "contas_pagar_parcelas", "contas_pagar_pagamentos", "contas_pagar_comprovantes",
  "custos_fixos", "configuracoes_juros",
  // Fechamentos
  "fechamentos_mensais", "fechamento_logs", "fechamento_checklist_itens",
  // Meu Salário / Conversa Doce
  "meu_salario_retiradas", "conversa_doce_favoritos",
  // Histórico (não relacional pesado)
  "historico_planos",
];

// Tabelas explicitamente bloqueadas para restauração (perigo de quebrar acesso/auth/governança).
const TABELAS_BLOQUEADAS = new Set<string>([
  "profiles",
  "groups",
  "user_group_roles",
  "user_global_roles",
  "user_roles",
  "admin_logs",
  "admin_audit_log",
  "backups",
  "backups_cofre",
  "backup_agendamentos",
]);

type RestoreBody =
  | { backup_id: string; confirmacao: string }
  | { dados: Record<string, any[]>; nome: string; confirmacao: string }
  | { cofre_id: string; confirmacao: string };

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Método não permitido" }), {
      status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const authHeader = req.headers.get("Authorization") || "";
  if (!authHeader.toLowerCase().startsWith("bearer ")) {
    return new Response(JSON.stringify({ error: "Não autenticado" }), {
      status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

  // Cliente autenticado para identificar o usuário chamador.
  const userClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authHeader } },
  });
  const { data: userRes, error: userErr } = await userClient.auth.getUser();
  if (userErr || !userRes?.user) {
    return new Response(JSON.stringify({ error: "Sessão inválida" }), {
      status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
  const userId = userRes.user.id;

  // Cliente admin com service_role.
  const admin = createClient(supabaseUrl, serviceKey);

  let body: RestoreBody;
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: "JSON inválido" }), {
      status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const confirmacao = (body as any).confirmacao;
  if (typeof confirmacao !== "string" || confirmacao.trim().length === 0) {
    return new Response(JSON.stringify({ error: "Confirmação obrigatória" }), {
      status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // Identifica o tipo de origem e carrega o snapshot.
  let nomeBackup = "";
  let dados: Record<string, any[]> = {};
  let ownerGroupAlvo: string | null = null;
  let backupIdLog: string | null = null;
  let origemLog = "historico";

  try {
    if ("backup_id" in body && body.backup_id) {
      backupIdLog = body.backup_id;
      const { data: bk, error } = await admin
        .from("backups")
        .select("id, usuario_id, owner_group_id, nome, storage_path, dados")
        .eq("id", body.backup_id)
        .single();
      if (error || !bk) throw new Error("Backup não encontrado");
      if (bk.usuario_id !== userId) {
        // Só MOTHER pode restaurar backup de outro usuário pelo histórico (uso interno)
        const { data: mother } = await admin
          .from("user_global_roles").select("role_global")
          .eq("user_id", userId).eq("role_global", "MOTHER").maybeSingle();
        if (!mother) throw new Error("Sem permissão para este backup");
      }
      nomeBackup = bk.nome;
      ownerGroupAlvo = bk.owner_group_id || null;
      if (bk.storage_path) {
        const { data: file, error: dlErr } = await admin.storage.from("backups").download(bk.storage_path);
        if (dlErr || !file) throw new Error("Arquivo do backup não encontrado");
        dados = JSON.parse(await file.text());
      } else {
        dados = (bk.dados as any) || {};
      }
    } else if ("cofre_id" in body && body.cofre_id) {
      origemLog = "cofre";
      // Apenas MOTHER pode restaurar do cofre
      const { data: mother } = await admin
        .from("user_global_roles").select("role_global")
        .eq("user_id", userId).eq("role_global", "MOTHER").maybeSingle();
      if (!mother) throw new Error("Apenas MOTHER pode restaurar do cofre");

      const { data: cf, error } = await admin
        .from("backups_cofre")
        .select("id, owner_group_id, nome, storage_path, backup_id_origem")
        .eq("id", body.cofre_id).single();
      if (error || !cf) throw new Error("Backup do cofre não encontrado");
      nomeBackup = cf.nome;
      ownerGroupAlvo = cf.owner_group_id;
      backupIdLog = cf.backup_id_origem ?? cf.id;
      const { data: file, error: dlErr } = await admin.storage.from("backups-cofre").download(cf.storage_path);
      if (dlErr || !file) throw new Error("Arquivo do cofre não encontrado");
      dados = JSON.parse(await file.text());
    } else if ("dados" in body && body.dados) {
      origemLog = "upload";
      nomeBackup = body.nome || "upload.json";
      dados = body.dados;
    } else {
      throw new Error("Payload inválido");
    }
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e.message }), {
      status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // Resolve owner_group_id alvo se ainda nulo (upload ou backup antigo): usa o do chamador.
  if (!ownerGroupAlvo) {
    const { data: prof } = await admin.from("profiles").select("owner_group_id").eq("id", userId).single();
    ownerGroupAlvo = prof?.owner_group_id || null;
  }
  if (!ownerGroupAlvo) {
    return new Response(JSON.stringify({ error: "Grupo do usuário não encontrado" }), {
      status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // Revalida palavra-chave server-side.
  const esperado = `RESTAURAR ${nomeBackup}`;
  if (confirmacao.trim() !== esperado) {
    return new Response(JSON.stringify({ error: "Palavra-chave de confirmação inválida" }), {
      status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // Filtra tabelas: somente as permitidas e que existem no snapshot.
  const tabelasSnapshot = Object.keys(dados).filter((t) => !TABELAS_BLOQUEADAS.has(t));
  const tabelasAcionaveis = TABELAS_PERMITIDAS_ORDEM.filter((t) => tabelasSnapshot.includes(t));
  const tabelasIgnoradas = tabelasSnapshot.filter((t) => !tabelasAcionaveis.includes(t));

  const t0 = Date.now();
  const resumo: Record<string, { deletados: number | null; inseridos: number; erros?: string }> = {};

  // 1) DELETE em ordem reversa (filhos antes dos pais), filtrando por owner_group_id quando possível.
  for (const tabela of [...tabelasAcionaveis].reverse()) {
    try {
      // Tenta DELETE por owner_group_id; se a tabela não tiver, tenta usuario_id; senão user_id.
      let del = await admin.from(tabela).delete({ count: "exact" }).eq("owner_group_id", ownerGroupAlvo);
      if (del.error && del.error.message?.includes("owner_group_id")) {
        del = await admin.from(tabela).delete({ count: "exact" }).eq("usuario_id", userId);
        if (del.error && del.error.message?.includes("usuario_id")) {
          del = await admin.from(tabela).delete({ count: "exact" }).eq("user_id", userId);
        }
      }
      resumo[tabela] = { deletados: del.count ?? 0, inseridos: 0 };
      if (del.error) resumo[tabela].erros = `delete: ${del.error.message}`;
    } catch (e: any) {
      resumo[tabela] = { deletados: null, inseridos: 0, erros: `delete: ${e.message}` };
    }
  }

  // 2) INSERT em ordem natural (pais → filhos), em lotes de 500.
  for (const tabela of tabelasAcionaveis) {
    const rows = (dados[tabela] as any[]) || [];
    if (rows.length === 0) continue;
    // Força owner_group_id correto onde aplicável (segurança).
    const sanitized = rows.map((r) => {
      if (r && typeof r === "object" && "owner_group_id" in r) {
        return { ...r, owner_group_id: ownerGroupAlvo };
      }
      return r;
    });
    const batchSize = 500;
    let inseridos = 0;
    let erroBatch: string | undefined;
    for (let i = 0; i < sanitized.length; i += batchSize) {
      const batch = sanitized.slice(i, i + batchSize);
      const { error } = await admin.from(tabela).insert(batch);
      if (error) {
        erroBatch = error.message;
        break;
      }
      inseridos += batch.length;
    }
    resumo[tabela] = {
      ...(resumo[tabela] || { deletados: 0, inseridos: 0 }),
      inseridos,
      ...(erroBatch ? { erros: `${resumo[tabela]?.erros ?? ""} insert: ${erroBatch}`.trim() } : {}),
    };
  }

  const duracaoMs = Date.now() - t0;

  // Log em admin_logs (best-effort).
  try {
    await admin.from("admin_logs").insert({
      admin_id: userId,
      admin_email: userRes.user.email ?? "",
      acao: origemLog === "cofre" ? "restaurar_backup_cofre" : "restaurar_backup",
      detalhes: {
        backup_id: backupIdLog,
        nome: nomeBackup,
        owner_group_id: ownerGroupAlvo,
        origem: origemLog,
        duracao_ms: duracaoMs,
        tabelas: resumo,
        tabelas_ignoradas: tabelasIgnoradas,
      },
    });
  } catch { /* best-effort */ }

  return new Response(JSON.stringify({
    ok: true,
    nome: nomeBackup,
    owner_group_id: ownerGroupAlvo,
    duracao_ms: duracaoMs,
    tabelas: resumo,
    tabelas_ignoradas: tabelasIgnoradas,
  }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
