-- Remover tabelas legadas que não são mais utilizadas pelo módulo financeiro
-- Estas tabelas existiam mas não são mais consultadas ou usadas no frontend

DROP TABLE IF EXISTS tags_contas_receber CASCADE;
DROP TABLE IF EXISTS categorias_financeiras CASCADE;