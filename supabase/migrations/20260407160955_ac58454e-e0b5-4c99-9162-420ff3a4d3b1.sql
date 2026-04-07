
-- Adicionar unique constraint que a função ON CONFLICT espera
CREATE UNIQUE INDEX IF NOT EXISTS unidades_medida_usuario_codigo_unique 
ON public.unidades_medida (usuario_id, codigo);
