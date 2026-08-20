
-- Excluir a função que cria os tipos padrão
DROP FUNCTION IF EXISTS public.criar_tipos_documento_padrao_para_usuario(uuid);

-- Deletar apenas os marcados como padrão
DELETE FROM public.tipos_documento WHERE e_padrao = true;
