-- Remove mão de obra do sistema

-- 1. Remove colunas relacionadas a mão de obra da tabela receitas
ALTER TABLE receitas 
DROP COLUMN IF EXISTS tipo_mao_obra_id,
DROP COLUMN IF EXISTS custo_mao_obra;

-- 2. Remove colunas relacionadas a mão de obra da tabela sub_receitas (se existirem)
ALTER TABLE sub_receitas 
DROP COLUMN IF EXISTS mao_obra_ids CASCADE;

-- 3. Remove a tabela de histórico de alterações de mão de obra
DROP TABLE IF EXISTS mao_obra_historico CASCADE;

-- 4. Remove a tabela de configuração de mão de obra
DROP TABLE IF EXISTS configuracao_mao_obra CASCADE;