-- Adicionar campo ativo na tabela categorias
ALTER TABLE categorias 
ADD COLUMN IF NOT EXISTS ativo BOOLEAN NOT NULL DEFAULT true;