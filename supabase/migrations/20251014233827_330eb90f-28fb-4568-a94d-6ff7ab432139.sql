-- Adicionar colunas para controle de pagamentos na tabela encomendas
ALTER TABLE public.encomendas 
ADD COLUMN IF NOT EXISTS pagamentos JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS saldo_restante NUMERIC DEFAULT 0;