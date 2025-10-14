-- Add new columns to encomendas table
ALTER TABLE public.encomendas 
ADD COLUMN IF NOT EXISTS telefone character varying,
ADD COLUMN IF NOT EXISTS endereco text,
ADD COLUMN IF NOT EXISTS numero character varying,
ADD COLUMN IF NOT EXISTS bairro character varying,
ADD COLUMN IF NOT EXISTS hora_entrega time;