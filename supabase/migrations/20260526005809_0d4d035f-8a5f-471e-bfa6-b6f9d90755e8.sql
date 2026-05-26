
-- Tabela de configuração privada (schema private criado na migration anterior)
CREATE TABLE IF NOT EXISTS private.config (
  key   text PRIMARY KEY,
  value text NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- RLS habilitada sem policies → nenhuma role exposta (anon/authenticated) consegue ler.
-- Apenas funções SECURITY DEFINER de owner postgres podem acessar.
ALTER TABLE private.config ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE private.config FROM PUBLIC, anon, authenticated;

-- Seed do valor da anon_key (publicável; o ganho é centralizar a rotação)
INSERT INTO private.config (key, value)
VALUES (
  'anon_key_cron',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx5cGlmcnhkempmZGdrY2FjdWJsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAzOTc1ODksImV4cCI6MjA3NTk3MzU4OX0.mRZHTSP-e--k57vSgH7b8ZlPSoCr4WoK1NzKeHc9tXw'
)
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = now();

-- Reescreve a função para ler de private.config (substitui a versão que lia do Vault)
CREATE OR REPLACE FUNCTION private.get_anon_key()
RETURNS text
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = ''
AS $$
  SELECT value FROM private.config WHERE key = 'anon_key_cron' LIMIT 1;
$$;

REVOKE ALL ON FUNCTION private.get_anon_key() FROM PUBLIC, anon, authenticated;
