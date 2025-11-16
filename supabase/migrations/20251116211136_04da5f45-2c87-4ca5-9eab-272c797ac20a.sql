-- Remover as funções que sobraram com assinaturas corretas
DROP FUNCTION IF EXISTS public.fn_confirm_match(uuid, text, uuid, uuid) CASCADE;
DROP FUNCTION IF EXISTS public.get_insights_cruzados(integer, uuid) CASCADE;