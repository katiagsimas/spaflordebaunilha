-- Removendo tabelas de planos
DROP TABLE IF EXISTS public.member_plan_sync_logs CASCADE;
DROP TABLE IF EXISTS public.historico_planos CASCADE;
DROP TABLE IF EXISTS public.planos CASCADE;

-- Removendo colunas de planos de profiles
ALTER TABLE public.profiles 
DROP COLUMN IF EXISTS plano_id,
DROP COLUMN IF EXISTS plano_inicio,
DROP COLUMN IF EXISTS plano_fim,
DROP COLUMN IF EXISTS plano_tipo,
DROP COLUMN IF EXISTS plano_pendente_id,
DROP COLUMN IF EXISTS plano_pendente_tipo,
DROP COLUMN IF EXISTS plano_pendente_inicio,
DROP COLUMN IF EXISTS plano_pendente_fim;

-- Removendo colunas de planos de hotmart_produtos
ALTER TABLE public.hotmart_produtos
DROP COLUMN IF EXISTS plano_id,
DROP COLUMN IF EXISTS plano_tipo;
