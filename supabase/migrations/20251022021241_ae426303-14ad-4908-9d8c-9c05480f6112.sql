-- Adicionar coluna conta_receber_id na tabela encomendas
ALTER TABLE encomendas
ADD COLUMN IF NOT EXISTS conta_receber_id UUID REFERENCES contas_receber(id) ON DELETE SET NULL;