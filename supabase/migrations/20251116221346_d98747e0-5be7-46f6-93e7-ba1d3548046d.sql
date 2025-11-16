-- Remover módulo de Sub-Receitas
-- Etapa 1: Dropar função relacionada a sub-receitas (se existir)
DROP FUNCTION IF EXISTS calcular_custo_sub_receita CASCADE;

-- Etapa 2: Dropar tabela de ingredientes de sub-receitas
DROP TABLE IF EXISTS sub_receitas_ingredientes CASCADE;

-- Etapa 3: Dropar tabela principal de sub-receitas
DROP TABLE IF EXISTS sub_receitas CASCADE;