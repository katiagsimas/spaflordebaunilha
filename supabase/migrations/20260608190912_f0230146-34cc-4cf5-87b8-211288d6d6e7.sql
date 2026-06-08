ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS onboarding_concluido_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS onboarding_step_status JSONB DEFAULT '{"meus_dados": false, "mao_obra": false, "backup": false}'::jsonb;

-- Grant access to authenticated users to update their own onboarding status
-- (RLS is already enabled on profiles, usually allowing users to update their own row)
GRANT SELECT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;