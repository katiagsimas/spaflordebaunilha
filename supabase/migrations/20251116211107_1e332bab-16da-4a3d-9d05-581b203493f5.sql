-- ==========================================
-- LIMPEZA CIRÚRGICA: MÓDULO DE CONCILIAÇÃO BANCÁRIA + FUNÇÕES LEGADAS
-- ==========================================

-- ETAPA 1: Remover VIEW de conciliação bancária
DROP VIEW IF EXISTS public.vw_bank_differences CASCADE;

-- ETAPA 2: Remover FUNÇÕES SQL de conciliação bancária
-- (devem ser removidas antes das tabelas que referenciam)
DROP FUNCTION IF EXISTS public.fn_ingest_bank_csv(uuid, uuid) CASCADE;
DROP FUNCTION IF EXISTS public.fn_suggest_matches(uuid, date, date) CASCADE;
DROP FUNCTION IF EXISTS public.fn_split_match(uuid, jsonb) CASCADE;
DROP FUNCTION IF EXISTS public.fn_confirm_match(uuid, uuid, text, uuid) CASCADE;
DROP FUNCTION IF EXISTS public.fn_reconcile_import(uuid, uuid) CASCADE;
DROP FUNCTION IF EXISTS public.fn_reject_match(uuid) CASCADE;
DROP FUNCTION IF EXISTS public.fn_bank_entry_hash(date, numeric, text) CASCADE;
DROP FUNCTION IF EXISTS public.fn_parse_date(text, text) CASCADE;
DROP FUNCTION IF EXISTS public.fn_normalize_decimal(text, boolean) CASCADE;
DROP FUNCTION IF EXISTS public.fn_make_hash(text) CASCADE;

-- ETAPA 3: Remover TABELAS de conciliação bancária
-- (ordem: dependentes primeiro, principais depois)
DROP TABLE IF EXISTS public.bank_matches CASCADE;
DROP TABLE IF EXISTS public.bank_entries CASCADE;
DROP TABLE IF EXISTS public.bank_raw_entries CASCADE;
DROP TABLE IF EXISTS public.bank_rules CASCADE;
DROP TABLE IF EXISTS public.bank_imports CASCADE;

-- ETAPA 4: Remover FUNÇÕES SQL LEGADAS não utilizadas
-- Funções de tokens de admin não implementadas
DROP FUNCTION IF EXISTS public.generate_admin_access_token(uuid, uuid, text) CASCADE;
DROP FUNCTION IF EXISTS public.revoke_admin_token(text) CASCADE;

-- Função de soft delete não usada
DROP FUNCTION IF EXISTS public.soft_delete_user(uuid, uuid) CASCADE;

-- Funções de módulo de insights IA removido
DROP FUNCTION IF EXISTS public.get_insights_cruzados(uuid, integer) CASCADE;

-- Função de CMV anual potencialmente inativa
DROP FUNCTION IF EXISTS public.get_cmv_anual(uuid, integer) CASCADE;