-- Remove tabela de favoritos e tudo dependente
DROP TABLE IF EXISTS public.conversa_doce_favoritos CASCADE;

-- Remove colunas de controle de acesso ao módulo
ALTER TABLE public.profiles
  DROP COLUMN IF EXISTS conversa_doce_ativo,
  DROP COLUMN IF EXISTS conversa_doce_inicio,
  DROP COLUMN IF EXISTS conversa_doce_fim;
