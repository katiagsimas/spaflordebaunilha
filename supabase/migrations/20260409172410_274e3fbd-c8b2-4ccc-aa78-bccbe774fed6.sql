-- negoanual: deveria ser negocio + anual
UPDATE public.profiles
SET plano_id = 'negocio',
    plano_tipo = 'anual',
    plano_fim = plano_inicio + 365
WHERE email = 'chefkasimas+negoanual@gmail.com';

-- baseanual: deveria ser base + anual
UPDATE public.profiles
SET plano_tipo = 'anual',
    plano_fim = plano_inicio + 365
WHERE email = 'chefkasimas+baseanual@gmail.com';