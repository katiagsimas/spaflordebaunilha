import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const TABELAS = [
  "categorias", "clientes", "fornecedores", "ingredientes", "embalagens",
  "receitas", "encomendas", "encomenda_itens", "custos_fixos", "unidades_medida",
  "tipos_insumos", "pre_preparos", "mao_obra_perfis", "bancos", "plano_contas",
  "categorias_plano_contas", "tipos_documento", "contas_receber",
  "contas_receber_parcelas", "contas_pagar", "contas_pagar_parcelas",
  "tags_encomendas", "configuracoes_juros",
];

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

  // Authorization: aceita CRON_SECRET (header x-cron-secret) OU Authorization Bearer
  // (anon/service key) — pg_cron envia Authorization Bearer.
  const cronSecret = Deno.env.get("CRON_SECRET");
  const callerSecret = req.headers.get("x-cron-secret");
  const authHeader = req.headers.get("authorization") || "";
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY") || "";
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
  const bearer = authHeader.toLowerCase().startsWith("bearer ")
    ? authHeader.slice(7).trim()
    : "";

  // Autorização: aceita CRON_SECRET (x-cron-secret), service role key OU anon key.
  // A função não recebe parâmetros do chamador — apenas processa agendamentos
  // vencidos no banco — então aceitar a anon key permite ao pg_cron interno
  // disparar a execução sem expor risco de manipulação de dados.
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
          .select("nome_completo")
          .eq("id", ag.usuario_id)
          .single();

        const dados: Record<string, any[]> = {};
        for (const t of TABELAS) {
          const { data } = await admin.from(t).select("*").eq("usuario_id", ag.usuario_id);
          if (data) dados[t] = data;
        }

        const nome = nomeBackup(profile?.nome_completo || "");
        const json = JSON.stringify(dados);
        const tamanho = `${(new Blob([json]).size / 1024).toFixed(1)} KB`;

        await admin.from("backups").insert({
          usuario_id: ag.usuario_id,
          nome,
          tamanho,
          dados,
        });

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

        resultados.push({ usuario_id: ag.usuario_id, ok: true, nome });
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
