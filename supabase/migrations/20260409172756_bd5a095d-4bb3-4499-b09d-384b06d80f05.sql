UPDATE public.profiles
SET plano_id = NULL,
    plano_tipo = NULL,
    plano_inicio = NULL,
    plano_fim = NULL,
    updated_at = now()
WHERE email = 'katiagsimas@gmail.com';