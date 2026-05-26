// One-shot: limpa todos os objetos dos buckets de usuário
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const BUCKETS = ["backups", "receitas", "pre-preparos", "topo-bolo", "assinaturas", "comprovantes"];

Deno.serve(async () => {
  const sb = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );
  const report: Record<string, unknown> = {};
  for (const bucket of BUCKETS) {
    try {
      const all: string[] = [];
      async function walk(prefix = "") {
        const { data, error } = await sb.storage.from(bucket).list(prefix, { limit: 1000 });
        if (error) { report[bucket + ":list:" + prefix] = error.message; return; }
        for (const item of data ?? []) {
          const path = prefix ? `${prefix}/${item.name}` : item.name;
          if (item.id === null) await walk(path); // folder
          else all.push(path);
        }
      }
      await walk("");
      if (all.length) {
        const { error } = await sb.storage.from(bucket).remove(all);
        report[bucket] = error ? `error: ${error.message}` : `removed ${all.length}`;
      } else {
        report[bucket] = "empty";
      }
    } catch (e) {
      report[bucket] = `exception: ${(e as Error).message}`;
    }
  }
  return new Response(JSON.stringify(report), { headers: { "content-type": "application/json" } });
});
