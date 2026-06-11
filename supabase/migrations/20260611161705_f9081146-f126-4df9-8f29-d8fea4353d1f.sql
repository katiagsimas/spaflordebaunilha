-- Remover tabelas do módulo Planejamento
DROP TABLE IF EXISTS public.planejamento_descanso CASCADE;
DROP TABLE IF EXISTS public.planejamento_datas_comemorativas CASCADE;
DROP TABLE IF EXISTS public.planejamento_tarefas CASCADE;
DROP TABLE IF EXISTS public.planejamento_metas CASCADE;

-- Remover colunas de profile relacionadas ao Planejamento
ALTER TABLE public.profiles 
DROP COLUMN IF EXISTS meta_faturamento_mensal,
DROP COLUMN IF EXISTS meta_faturamento_anual,
DROP COLUMN IF EXISTS custo_fixo_mensal,
DROP COLUMN IF EXISTS planejamento_banner_dismissed;

-- Remover tipos ENUM relacionados
DROP TYPE IF EXISTS public.planejamento_area CASCADE;
DROP TYPE IF EXISTS public.planejamento_data_tipo CASCADE;
DROP TYPE IF EXISTS public.planejamento_descanso_tipo CASCADE;
DROP TYPE IF EXISTS public.planejamento_prioridade CASCADE;
DROP TYPE IF EXISTS public.planejamento_status CASCADE;