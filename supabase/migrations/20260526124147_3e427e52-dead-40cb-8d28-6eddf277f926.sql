CREATE INDEX IF NOT EXISTS idx_backups_usuario_created
  ON public.backups (usuario_id, created_at DESC);

DROP INDEX IF EXISTS public.idx_backups_usuario_id;