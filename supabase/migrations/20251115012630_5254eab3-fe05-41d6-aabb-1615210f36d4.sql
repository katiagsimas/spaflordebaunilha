-- Adicionar coluna valor_hora na tabela profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS valor_hora NUMERIC(10,2) DEFAULT 0;