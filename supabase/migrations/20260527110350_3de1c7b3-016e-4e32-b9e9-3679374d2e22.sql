ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS onboarding_iniciado boolean NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS onboarding_concluido boolean NOT NULL DEFAULT false;

-- Marca usuários já existentes que possuam dados completos e perfis criados como já tendo concluído onboarding
-- para evitar incomodá-los reabrindo o fluxo. Novos usuários terão false (default).
UPDATE public.profiles
SET onboarding_iniciado = true,
    onboarding_concluido = true
WHERE COALESCE(primeiro_acesso, false) = false
  AND nome_completo IS NOT NULL
  AND nome_confeitaria IS NOT NULL
  AND cpf IS NOT NULL
  AND whatsapp IS NOT NULL
  AND cep IS NOT NULL
  AND endereco IS NOT NULL
  AND cidade IS NOT NULL
  AND estado IS NOT NULL;