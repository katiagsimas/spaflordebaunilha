-- ============================================
-- LIMPEZA DE ESTRUTURAS LEGADAS DO MÓDULO ADMIN
-- ============================================
-- Este script remove estruturas de banco identificadas como:
-- - Criadas mas nunca usadas no código da aplicação
-- - Campos decorativos não referenciados
--
-- Estruturas removidas:
-- 1. View user_statistics (nunca consultada)
-- 2. Tabela admin_audit_log (nunca usada, existe admin_logs)
-- 3. Coluna profiles.tags (nunca lida/escrita)
-- ============================================

-- Remover view de estatísticas de usuário nunca utilizada
DROP VIEW IF EXISTS user_statistics CASCADE;

-- Remover tabela de auditoria administrativa avançada, se existir
-- (existe admin_logs que é a tabela realmente usada)
DROP TABLE IF EXISTS admin_audit_log CASCADE;

-- Remover coluna decorativa de tags em perfis, nunca utilizada
ALTER TABLE profiles
DROP COLUMN IF EXISTS tags;