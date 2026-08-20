
-- Remove onboarding columns from public.profiles
ALTER TABLE public.profiles 
DROP COLUMN IF EXISTS onboarding_iniciado,
DROP COLUMN IF EXISTS onboarding_concluido,
DROP COLUMN IF EXISTS onboarding_concluido_at,
DROP COLUMN IF EXISTS onboarding_step_status;

-- Drop onboarding exception logs table
DROP TABLE IF EXISTS public.onboarding_exception_logs;
