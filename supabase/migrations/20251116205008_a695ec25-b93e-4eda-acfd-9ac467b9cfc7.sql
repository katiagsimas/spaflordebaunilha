-- Remover tabela cmv_mensal (não utilizada)
DROP TABLE IF EXISTS cmv_mensal CASCADE;

-- Remover função get_ponto_equilibrio_mes (não utilizada)
DROP FUNCTION IF EXISTS get_ponto_equilibrio_mes(uuid, integer, integer) CASCADE;