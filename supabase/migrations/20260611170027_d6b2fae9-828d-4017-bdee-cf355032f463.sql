-- Primeiro, mover usuários que estão no plano de imersão para o plano base para evitar erro de FK
UPDATE public.profiles SET plano_id = 'base' WHERE plano_id = 'aluna_imersao';

-- Remover tabela de logs
DROP TABLE IF EXISTS public.imersao_notificacoes_log;

-- Remover coluna específica
ALTER TABLE public.profiles DROP COLUMN IF EXISTS imersao_turma;

-- Agora sim deletar o plano
DELETE FROM public.planos WHERE id = 'aluna_imersao';