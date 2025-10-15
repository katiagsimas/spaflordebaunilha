-- Adicionar campo data_emissao na tabela contas_receber
ALTER TABLE public.contas_receber 
ADD COLUMN IF NOT EXISTS data_emissao DATE DEFAULT CURRENT_DATE;