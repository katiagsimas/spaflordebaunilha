-- Remover cron job de limpeza de tokens SSO (se existir)
DO $$
DECLARE
  v_jobid bigint;
BEGIN
  SELECT jobid INTO v_jobid FROM cron.job
   WHERE command ILIKE '%cleanup_expired_sso_tokens%'
      OR jobname ILIKE '%sso%'
   LIMIT 1;
  IF v_jobid IS NOT NULL THEN
    PERFORM cron.unschedule(v_jobid);
  END IF;
EXCEPTION WHEN OTHERS THEN
  -- Schema cron pode não existir; ignorar silenciosamente
  NULL;
END $$;

-- Remover função de limpeza
DROP FUNCTION IF EXISTS public.cleanup_expired_sso_tokens() CASCADE;

-- Remover tabela de anti-replay
DROP TABLE IF EXISTS public.sso_token_log CASCADE;
