-- Adicionar coluna banco_id na tabela contas_pagar
ALTER TABLE public.contas_pagar 
ADD COLUMN IF NOT EXISTS banco_id uuid REFERENCES public.bancos(id);