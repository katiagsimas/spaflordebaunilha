-- Habilitar tipos de documento padrão que estavam desabilitados
UPDATE public.tipos_documento 
SET habilitado = true 
WHERE e_padrao = true AND (habilitado = false OR habilitado IS NULL);

-- Garantir GRANTs para que o authenticated possa ver os dados
GRANT SELECT, INSERT, UPDATE, DELETE ON public.tipos_documento TO authenticated;
GRANT ALL ON public.tipos_documento TO service_role;
