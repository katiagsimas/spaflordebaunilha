-- ========================================
-- LIMPEZA: Remover dados de teste do sistema antigo
-- Ordem correta: deletar das tabelas filhas para as pais
-- ========================================

-- 1. Deletar referências em pré-preparos PRIMEIRO
DELETE FROM pre_preparos_ingredientes WHERE TRUE;

-- 2. Deletar referências em receitas (apenas se as tabelas existirem)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'receitas_ingredientes') THEN
        DELETE FROM receitas_ingredientes WHERE TRUE;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'receitas_embalagens') THEN
        DELETE FROM receitas_embalagens WHERE TRUE;
    END IF;
END $$;

-- 3. Agora deletar ingredientes e embalagens
DELETE FROM ingredientes WHERE TRUE;
DELETE FROM embalagens WHERE TRUE;

-- 4. Por último, deletar tipos_insumos
DELETE FROM tipos_insumos WHERE TRUE;