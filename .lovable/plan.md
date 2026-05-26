# Plano: Tabela `sso_token_log` anti-replay

## Objetivo
Impedir reprodução (replay) de tokens SSO registrando cada `jti` consumido, com expiração e limpeza automática.

## Migração SQL (1 arquivo)

```sql
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

-- 3. GRANTs (somente service_role — sem anon/authenticated)
GRANT ALL ON public.sso_token_log TO service_role;

-- 4. RLS habilitado, sem policies (bloqueia todos exceto service_role/bypass)
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

-- 6. Extensão pg_cron (no schema 'extensions' do Supabase)
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA extensions;

-- 7. Agendamento diário 03:00 UTC
SELECT cron.schedule(
  'cleanup-expired-sso-tokens',
  '0 3 * * *',
  $$ SELECT public.cleanup_expired_sso_tokens(); $$
);
```

## Notas técnicas
- `direction` aceita apenas `'saida'` / `'entrada'` (sem acento, evita problemas de encoding em JWTs).
- RLS ON sem policies = nenhum acesso para `anon`/`authenticated`. `service_role` faz bypass de RLS e tem GRANT ALL para inserir/consultar via edge functions.
- A função é `SECURITY DEFINER` com `search_path` fixo para rodar via pg_cron sem depender do role do job.
- O cron chama a função SQL diretamente (não usa `net.http_post`), por isso é seguro versionar no migration (não contém secrets nem URL específica do projeto).

## Documentação
Após aplicar:
- `docs/AUDITORIA.md`: registrar criação da proteção anti-replay SSO.
- `docs/PENDENCIAS_SEGURANCA.md`: remover pendência correspondente, se houver.

## Próximo passo (fora deste plano)
Integrar `sso_token_log` nas edge functions que emitem/consomem tokens SSO (insert do `jti` na emissão e check de unicidade na entrada). Isso será feito em uma etapa separada quando você indicar quais funções devem ser ajustadas.