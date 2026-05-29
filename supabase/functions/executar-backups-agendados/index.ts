import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Catálogo de tabelas por módulo (espelho de src/lib/backupCatalog.ts)
const MODULO_TABELAS: Record<string, string[]> = {
  operacao: [
    // Cadastros
    "categorias", "ingredientes", "embalagens",
    "tipos_insumos", "unidades_medida",
    "mao_obra_perfis", "mao_obra_perfis_historico",
    // Cardápio
    "receitas", "receitas_ingredientes", "receitas_embalagens",
    "receitas_mao_obra", "receitas_despesas_venda", "receitas_imagens",
    "pre_preparos", "pre_preparos_ingredientes", "pre_preparos_mao_obra",
    // Estoque
    "estoque", "estoque_movimentacoes",
    // Organização Doce
    "organizacao_doce_state",
  ],
  comercial: [
    "clientes", "cliente_familiares",
    "fornecedores", "fornecedor_contatos",
    "propostas", "contratos", "contratos_templates",
    "encomendas", "encomenda_itens", "encomendas_tags", "tags_encomendas", "tags",
  ],
  negocio: [
    // Meu Dinheiro
    "bancos", "saldos_iniciais_bancos", "transferencias_bancos",
    "plano_contas", "categorias_plano_contas", "tipos_documento",
    "contas_receber", "contas_receber_parcelas", "contas_receber_pagamentos", "contas_receber_comprovantes",
    "contas_pagar", "contas_pagar_parcelas", "contas_pagar_pagamentos", "contas_pagar_comprovantes",
    "custos_fixos", "configuracoes_juros",
    // Fechamentos
    "fechamentos_mensais", "fechamento_logs", "fechamento_checklist_itens",
    // Meu Salário
    "meu_salario_retiradas",
    // Conversa Doce
    "conversa_doce_favoritos",
  ],
  // Sistema: Meus Dados (profiles)
  sistema: ["profiles"],
  // Governança: APENAS MOTHER. Tabelas globais, snapshot sem filtro de tenant.
  governanca: [
    "groups", "user_global_roles", "user_group_roles", "user_roles",
    "profiles", "historico_planos",
  ],
};

const MODULOS_MOTHER_ONLY = new Set(["governanca"]);
const GOVERNANCA_TABELAS = new Set([
  "groups", "user_global_roles", "user_group_roles", "user_roles",
  "historico_planos",
]);

// Tabelas que filtram por owner_group_id (multi-tenant) e que precisam filtrar via usuario_id na ausência.
// Como a edge function usa service role (sem RLS), filtramos por usuario_id quando a coluna existe.
function tabelasDosModulos(modulos: string[]): string[] {
  const set = new Set<string>();
  for (const m of modulos) (MODULO_TABELAS[m] ?? []).forEach((t) => set.add(t));
  return [...set];
}

function gerarIniciais(nome: string): string {
  if (!nome) return "USR";
  return nome.trim().split(/\s+/).map((p) => p.charAt(0).toUpperCase()).join("");
}

function nomeBackup(nomeCompleto: string): string {
  const d = new Date();
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = d.getFullYear();
  return `CAIXA${gerarIniciais(nomeCompleto)}${dd}${mm}${yyyy}`;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const cronSecret = Deno.env.get("CRON_SECRET");
  const callerSecret = req.headers.get("x-cron-secret");
  const authHeader = req.headers.get("authorization") || "";
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY") || "";
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
  const bearer = authHeader.toLowerCase().startsWith("bearer ")
    ? authHeader.slice(7).trim()
    : "";

  const autorizadoPorSecret = !!cronSecret && callerSecret === cronSecret;
  const autorizadoPorServiceKey = !!bearer && bearer === serviceKey;
  const autorizadoPorAnonKey = !!bearer && !!anonKey && bearer === anonKey;

  if (!autorizadoPorSecret && !autorizadoPorServiceKey && !autorizadoPorAnonKey) {
    return new Response(JSON.stringify({ error: "Não autorizado" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const admin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  try {
    const agora = new Date().toISOString();
    const { data: pendentes, error } = await admin
      .from("backup_agendamentos")
      .select("*")
      .eq("ativo", true)
      .lte("proximo_execucao_em", agora);

    if (error) throw error;

    const resultados: any[] = [];

    for (const ag of pendentes ?? []) {
      try {
        const { data: profile } = await admin
          .from("profiles")
          .select("nome_completo, owner_group_id")
          .eq("id", ag.usuario_id)
          .single();

        // Verifica se o usuário é MOTHER (necessário para incluir módulo governanca)
        const { data: globalRole } = await admin
          .from("user_global_roles")
          .select("role_global")
          .eq("user_id", ag.usuario_id)
          .eq("role_global", "MOTHER")
          .maybeSingle();
        const isMother = !!globalRole;

        let modulos: string[] = (ag.modulos && ag.modulos.length > 0)
          ? ag.modulos
          : ["operacao", "comercial", "negocio", "sistema"];

        // Filtra módulos motherOnly se o usuário não for MOTHER
        if (!isMother) {
          modulos = modulos.filter((m) => !MODULOS_MOTHER_ONLY.has(m));
        }

        const tabelas = tabelasDosModulos(modulos);
        const dados: Record<string, any[]> = {};

        for (const t of tabelas) {
          // Tabelas de governança: snapshot global (apenas MOTHER chega aqui).
          if (GOVERNANCA_TABELAS.has(t) && isMother) {
            const res = await admin.from(t).select("*");
            if (!res.error && res.data) dados[t] = res.data;
            continue;
          }
          // profiles: se MOTHER e módulo governanca incluído → todos os perfis; senão apenas o do usuário.
          if (t === "profiles") {
            const q = (isMother && modulos.includes("governanca"))
              ? admin.from("profiles").select("*")
              : admin.from("profiles").select("*").eq("id", ag.usuario_id);
            const res = await q;
            if (!res.error && res.data) dados[t] = res.data;
            continue;
          }
          // Tenta filtrar por owner_group_id quando disponível, senão por usuario_id, senão por user_id.
          let rows: any[] | null = null;
          if (profile?.owner_group_id) {
            const res = await admin.from(t).select("*").eq("owner_group_id", profile.owner_group_id);
            if (!res.error) rows = res.data;
          }
          if (!rows) {
            const res = await admin.from(t).select("*").eq("usuario_id", ag.usuario_id);
            if (!res.error) rows = res.data;
          }
          if (!rows) {
            const res = await admin.from(t).select("*").eq("user_id", ag.usuario_id);
            if (!res.error) rows = res.data;
          }
          if (rows) dados[t] = rows;
        }

        const nome = nomeBackup(profile?.nome_completo || "");
        const json = JSON.stringify(dados);
        const tamanhoBytes = new Blob([json]).size;
        const tamanho = `${(tamanhoBytes / 1024).toFixed(1)} KB`;

        const storagePath = `${ag.usuario_id}/${nome}-${Date.now()}.json`;
        const { error: upErr } = await admin.storage
          .from("backups")
          .upload(storagePath, new Blob([json], { type: "application/json" }), {
            contentType: "application/json",
            upsert: false,
          });
        if (upErr) throw upErr;

        const { data: novoBackup } = await admin.from("backups").insert({
          usuario_id: ag.usuario_id,
          nome,
          tamanho,
          storage_path: storagePath,
          modulos,
          origem: "agendado",
        }).select("id").single();

        // === COFRE: espelhamento automático + retenção (dia 1 do mês + 5 últimos) ===
        try {
          if (profile?.owner_group_id) {
            const cofrePath = `${profile.owner_group_id}/${nome}-${Date.now()}.json`;
            const ehMensal = new Date().getDate() === 1;
            const { error: cofreUpErr } = await admin.storage
              .from("backups-cofre")
              .upload(cofrePath, new Blob([json], { type: "application/json" }), {
                contentType: "application/json",
                upsert: false,
              });
            if (!cofreUpErr) {
              await admin.from("backups_cofre").insert({
                owner_group_id: profile.owner_group_id,
                usuario_id_origem: ag.usuario_id,
                backup_id_origem: novoBackup?.id ?? null,
                nome,
                modulos,
                storage_path: cofrePath,
                tamanho,
                tamanho_bytes: tamanhoBytes,
                origem: "agendado",
                eh_mensal: ehMensal,
              });

              // Retenção do cofre: manter eh_mensal + 5 mais recentes do grupo
              const { data: doGrupo } = await admin
                .from("backups_cofre")
                .select("id, storage_path, eh_mensal, criado_em")
                .eq("owner_group_id", profile.owner_group_id)
                .order("criado_em", { ascending: false });

              if (doGrupo && doGrupo.length > 0) {
                const top5Ids = new Set(doGrupo.slice(0, 5).map((r: any) => r.id));
                const remover = doGrupo.filter((r: any) => !r.eh_mensal && !top5Ids.has(r.id));
                if (remover.length > 0) {
                  const paths = remover.map((r: any) => r.storage_path).filter(Boolean);
                  if (paths.length > 0) await admin.storage.from("backups-cofre").remove(paths);
                  await admin.from("backups_cofre").delete().in("id", remover.map((r: any) => r.id));
                }
              }
            }
          }
        } catch (cofreErr) {
          console.error("Falha ao espelhar no cofre:", cofreErr);
        }

        // Aplica retenção: SOMENTE após o novo backup ter sido salvo com sucesso (linhas acima).
        // Default = 30 dias quando o agendamento não definir retenção própria.
        const diasRetencao = (ag.retencao_dias && ag.retencao_dias > 0) ? ag.retencao_dias : 30;
        const limite = new Date(Date.now() - diasRetencao * 86400000).toISOString();
        const { data: velhos } = await admin
          .from("backups")
          .select("id, storage_path")
          .eq("usuario_id", ag.usuario_id)
          .lt("created_at", limite);

        if (velhos && velhos.length > 0) {
          const paths = velhos.map((v: any) => v.storage_path).filter(Boolean);
          if (paths.length > 0) await admin.storage.from("backups").remove(paths);
          await admin
            .from("backups")
            .delete()
            .in("id", velhos.map((v: any) => v.id));
          console.log(`Retenção: removidos ${velhos.length} backups > ${diasRetencao}d do usuário ${ag.usuario_id}`);
        }

        const { data: prox } = await admin.rpc("calcular_proxima_execucao_backup", {
          p_frequencia: ag.frequencia,
          p_horario: ag.horario,
          p_referencia: new Date().toISOString(),
        });

        await admin
          .from("backup_agendamentos")
          .update({
            ultimo_executado_em: new Date().toISOString(),
            proximo_execucao_em: prox,
          })
          .eq("id", ag.id);

        resultados.push({ usuario_id: ag.usuario_id, ok: true, nome, modulos });
      } catch (e: any) {
        resultados.push({ usuario_id: ag.usuario_id, ok: false, erro: e.message });
      }
    }

    return new Response(JSON.stringify({ executados: resultados.length, resultados }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
