
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS conversa_doce_ativo BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS conversa_doce_inicio DATE,
  ADD COLUMN IF NOT EXISTS conversa_doce_fim DATE;

COMMENT ON COLUMN public.profiles.conversa_doce_ativo IS 'Acesso manual ao módulo Conversa Doce, gerenciado pela admin-mãe.';
COMMENT ON COLUMN public.profiles.conversa_doce_inicio IS 'Início do acesso ao Conversa Doce.';
COMMENT ON COLUMN public.profiles.conversa_doce_fim IS 'Fim do acesso ao Conversa Doce.';
