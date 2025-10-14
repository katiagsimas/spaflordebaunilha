-- Remove bairro column and add cep column to encomendas table
ALTER TABLE public.encomendas 
DROP COLUMN IF EXISTS bairro,
ADD COLUMN IF NOT EXISTS cep character varying;