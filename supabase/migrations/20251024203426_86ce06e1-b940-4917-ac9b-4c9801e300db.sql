-- Adicionar colunas faltantes na tabela profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS razao_social VARCHAR,
ADD COLUMN IF NOT EXISTS bairro VARCHAR,
ADD COLUMN IF NOT EXISTS numero VARCHAR,
ADD COLUMN IF NOT EXISTS inscricao_estadual VARCHAR;