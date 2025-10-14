-- Add data_aniversario_contato column to fornecedores table
ALTER TABLE public.fornecedores 
ADD COLUMN IF NOT EXISTS data_aniversario_contato date;