-- Adicionar colunas de ajustes de valor na tabela encomendas
ALTER TABLE public.encomendas 
ADD COLUMN IF NOT EXISTS desconto_percentual NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS desconto_valor NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS taxa_entrega NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS topo_bolo NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS outros NUMERIC DEFAULT 0;