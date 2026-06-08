-- Adiciona colunas se não existirem
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE table_name = 'profiles' AND column_name = 'onboarding_iniciado') THEN
        ALTER TABLE public.profiles ADD COLUMN onboarding_iniciado BOOLEAN DEFAULT false;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE table_name = 'profiles' AND column_name = 'onboarding_concluido') THEN
        ALTER TABLE public.profiles ADD COLUMN onboarding_concluido BOOLEAN DEFAULT false;
    END IF;
END $$;

-- Resetar status da Eliane para forçar onboarding (ajustando conforme necessidade)
UPDATE public.profiles 
SET onboarding_iniciado = false, 
    onboarding_concluido = false,
    primeiro_acesso = true
WHERE email = 'elianebrito959corena@gmail.com';
