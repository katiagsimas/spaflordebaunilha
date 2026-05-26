-- Mover anon key de private.config para vault
DO $$
DECLARE
  v_value text;
  v_existing_id uuid;
BEGIN
  SELECT value INTO v_value FROM private.config WHERE key = 'anon_key_cron' LIMIT 1;
  IF v_value IS NULL THEN
    RAISE EXCEPTION 'anon_key_cron não encontrada em private.config';
  END IF;

  SELECT id INTO v_existing_id FROM vault.secrets WHERE name = 'cron_anon_key';
  IF v_existing_id IS NULL THEN
    PERFORM vault.create_secret(v_value, 'cron_anon_key', 'Anon key usada pelo pg_cron para invocar edge functions');
  ELSE
    PERFORM vault.update_secret(v_existing_id, v_value, 'cron_anon_key', 'Anon key usada pelo pg_cron para invocar edge functions');
  END IF;
END $$;

-- Recriar função para ler do vault
CREATE OR REPLACE FUNCTION private.get_anon_key()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'cron_anon_key' LIMIT 1;
$$;

-- Remover tabela legada
DROP TABLE IF EXISTS private.config;