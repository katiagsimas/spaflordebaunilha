UPDATE profiles
SET
  plano_tipo = 'mensal',
  plano_inicio = created_at::date,
  plano_fim = (created_at::date + interval '30 days')::date,
  updated_at = now()
WHERE plano_inicio IS NULL;