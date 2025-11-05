-- Adicionar coluna marca na tabela itens
ALTER TABLE public.itens 
ADD COLUMN IF NOT EXISTS marca text;