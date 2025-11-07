-- Remover completamente o sistema de proteção usando CASCADE

DROP FUNCTION IF EXISTS public.proteger_contas_padrao() CASCADE;
DROP FUNCTION IF EXISTS public.impedir_exclusao_padrao() CASCADE;
DROP FUNCTION IF EXISTS public.proteger_categorias_padrao() CASCADE;