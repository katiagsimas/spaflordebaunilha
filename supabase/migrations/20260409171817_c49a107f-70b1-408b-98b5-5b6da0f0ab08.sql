-- Temporarily disable the protection trigger
ALTER TABLE public.profiles DISABLE TRIGGER protect_profiles_plan_fields;

-- Update all profiles that don't have plan dates
UPDATE public.profiles
SET plano_tipo = 'mensal',
    plano_inicio = created_at::date,
    plano_fim = (created_at::date + 30)
WHERE plano_inicio IS NULL;

-- Re-enable the protection trigger
ALTER TABLE public.profiles ENABLE TRIGGER protect_profiles_plan_fields;