ALTER TABLE public.backup_agendamentos ADD COLUMN IF NOT EXISTS dia_semana integer;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.backup_agendamentos TO authenticated;
GRANT ALL ON public.backup_agendamentos TO service_role;