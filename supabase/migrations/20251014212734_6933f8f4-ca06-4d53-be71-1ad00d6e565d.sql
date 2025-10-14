-- Add tipo_fornecedor column to fornecedores table
ALTER TABLE public.fornecedores 
ADD COLUMN IF NOT EXISTS tipo_fornecedor character varying;