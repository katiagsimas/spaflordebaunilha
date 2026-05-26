-- 1. Tabela
CREATE TABLE public.sso_token_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  jti text NOT NULL UNIQUE,
  email text,
  direction text CHECK (direction IN ('saida', 'entrada')),
  used_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL,
  ip text,
  user_agent text
);

-- 2. Índices
CREATE INDEX idx_sso_token_log_jti ON public.sso_token_log (jti);
CREATE INDEX idx_sso_token_log_expires_at ON public.sso_token_log (expires_at);

-- 3. GRANTs (somente service_role)
GRANT ALL ON public.sso_token_log TO service_role;

-- 4. RLS habilitado, sem policies
ALTER TABLE public.sso_token_log ENABLE ROW LEVEL SECURITY;

-- 5. Função de limpeza
CREATE OR REPLACE FUNCTION public.cleanup_expired_sso_tokens()
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  DELETE FROM public.sso_token_log
  WHERE expires_at < now() - interval '1 day';
$$;

-- 6. Extensão pg_cron
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA extensions;

-- 7. Agendamento diário 03:00 UTC
SELECT cron.schedule(
  'cleanup-expired-sso-tokens',
  '0 3 * * *',
  $$ SELECT public.cleanup_expired_sso_tokens(); $$
);