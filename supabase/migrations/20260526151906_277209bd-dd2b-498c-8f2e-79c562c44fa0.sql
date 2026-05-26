ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS plano_pendente_id text,
  ADD COLUMN IF NOT EXISTS plano_pendente_tipo text,
  ADD COLUMN IF NOT EXISTS plano_pendente_inicio date,
  ADD COLUMN IF NOT EXISTS plano_pendente_fim date;

COMMENT ON COLUMN public.profiles.plano_pendente_id IS 'Plano que entrará em vigor quando o plano atual expirar (downgrade agendado).';
COMMENT ON COLUMN public.profiles.plano_pendente_tipo IS 'Tipo (anual/mensal) do plano pendente.';
COMMENT ON COLUMN public.profiles.plano_pendente_inicio IS 'Data em que o plano pendente passa a vigorar.';
COMMENT ON COLUMN public.profiles.plano_pendente_fim IS 'Data limite do plano pendente.';

CREATE INDEX IF NOT EXISTS idx_profiles_plano_pendente_inicio
  ON public.profiles (plano_pendente_inicio)
  WHERE plano_pendente_id IS NOT NULL;