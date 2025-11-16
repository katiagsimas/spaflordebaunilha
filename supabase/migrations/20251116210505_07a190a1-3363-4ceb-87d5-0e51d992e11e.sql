-- Limpeza segura: Remoção de tabelas não utilizadas (risco zero)
-- Removendo tabelas de backup antigas de migração
DROP TABLE IF EXISTS public._backup_embalagens CASCADE;
DROP TABLE IF EXISTS public._backup_ingredientes CASCADE;
DROP TABLE IF EXISTS public._backup_tipos_insumos CASCADE;

-- Removendo tabela de NPS não implementada
DROP TABLE IF EXISTS public.cliente_nps CASCADE;