UPDATE public.profiles
SET
  plano_tipo = 'mensal',
  plano_inicio = (created_at AT TIME ZONE 'UTC')::date,
  plano_fim = ((created_at AT TIME ZONE 'UTC')::date + 30),
  updated_at = now()
WHERE plano_fim IS NULL OR plano_inicio IS NULL;