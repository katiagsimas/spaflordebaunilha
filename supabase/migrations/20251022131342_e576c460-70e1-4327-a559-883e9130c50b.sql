-- Permitir que a coluna data_entrega seja NULL na tabela encomendas
ALTER TABLE encomendas ALTER COLUMN data_entrega DROP NOT NULL;