
-- Etapa 2: criar schema private (se não existir) e função auxiliar que lê o secret do Vault
CREATE SCHEMA IF NOT EXISTS private;

REVOKE ALL ON SCHEMA private FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION private.get_anon_key()
RETURNS text
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = ''
AS $$
  SELECT decrypted_secret
  FROM vault.decrypted_secrets
  WHERE name = 'anon_key_cron'
  LIMIT 1;
$$;

REVOKE ALL ON FUNCTION private.get_anon_key() FROM PUBLIC, anon, authenticated;

-- Etapa 3: atualizar o job pg_cron 'executar-backups-agendados' para usar private.get_anon_key()
SELECT cron.alter_job(
  job_id := (SELECT jobid FROM cron.job WHERE jobname = 'executar-backups-agendados'),
  command := $cmd$
    SELECT net.http_post(
      url := 'https://lypifrxdzjfdgkcacubl.supabase.co/functions/v1/executar-backups-agendados',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || private.get_anon_key()
      ),
      body := '{}'::jsonb
    );
  $cmd$
);
