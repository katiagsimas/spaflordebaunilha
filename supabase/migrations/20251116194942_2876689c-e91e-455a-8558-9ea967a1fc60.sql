-- REMOÇÃO COMPLETA DO MÓDULO DE ESTOQUE

-- Remover triggers
DROP TRIGGER IF EXISTS trigger_atualizar_estoque_atual ON movimentacoes_estoque;
DROP TRIGGER IF EXISTS atualizar_updated_at ON itens;
DROP TRIGGER IF EXISTS atualizar_updated_at ON precos;

-- Remover funções
DROP FUNCTION IF EXISTS atualizar_estoque_atual();
DROP FUNCTION IF EXISTS calcular_custo_medio_fifo(UUID, NUMERIC, NUMERIC);

-- Remover tabelas do módulo de estoque
DROP TABLE IF EXISTS estoque_atual CASCADE;
DROP TABLE IF EXISTS movimentacoes_estoque CASCADE;
DROP TABLE IF EXISTS entradas_detalhadas CASCADE;
DROP TABLE IF EXISTS precos CASCADE;
DROP TABLE IF EXISTS itens CASCADE;
DROP TABLE IF EXISTS categorias_estoque CASCADE;