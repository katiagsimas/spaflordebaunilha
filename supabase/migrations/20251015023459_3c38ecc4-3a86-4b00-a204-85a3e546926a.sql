-- Adicionar campos faltantes na tabela contas_receber
ALTER TABLE public.contas_receber 
ADD COLUMN IF NOT EXISTS plano_conta_id UUID,
ADD COLUMN IF NOT EXISTS banco_id VARCHAR(50),
ADD COLUMN IF NOT EXISTS tipo_documento_id VARCHAR(50),
ADD COLUMN IF NOT EXISTS numero_documento VARCHAR(50);