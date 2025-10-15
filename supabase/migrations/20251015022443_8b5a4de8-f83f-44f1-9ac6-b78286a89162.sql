-- Adicionar campos de cliente na tabela contas_receber
ALTER TABLE public.contas_receber 
ADD COLUMN IF NOT EXISTS cliente_nome VARCHAR(100),
ADD COLUMN IF NOT EXISTS cliente_documento VARCHAR(20),
ADD COLUMN IF NOT EXISTS cliente_id UUID REFERENCES public.clientes(id);

-- Adicionar índice para melhor performance
CREATE INDEX IF NOT EXISTS idx_contas_receber_cliente_id ON public.contas_receber(cliente_id);