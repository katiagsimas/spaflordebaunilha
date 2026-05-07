-- Add column to track if stock deduction was already done for an order
ALTER TABLE public.encomendas 
ADD COLUMN estoque_baixa_realizada boolean NOT NULL DEFAULT false;