
-- Remover estruturas legadas não utilizadas do módulo de Encomendas
-- Auditoria confirmou que não há uso no código da aplicação

-- 1. Remover VIEW vw_encomendas_com_tags
-- Esta view não é usada no código. O módulo Encomendas faz JOIN manual.
DROP VIEW IF EXISTS vw_encomendas_com_tags CASCADE;

-- 2. Remover tabela categorias_tags  
-- Esta tabela não é usada. A organização de tags é feita via constantes no frontend.
DROP TABLE IF EXISTS categorias_tags CASCADE;
