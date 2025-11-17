-- Remover coluna legada perfil_mao_obra_id da tabela receitas
-- Esta coluna não é mais utilizada, o sistema usa receitas_mao_obra para mão de obra

ALTER TABLE receitas DROP COLUMN IF EXISTS perfil_mao_obra_id;