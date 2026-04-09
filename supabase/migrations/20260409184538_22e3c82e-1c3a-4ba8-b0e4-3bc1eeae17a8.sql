
CREATE TABLE public.backups (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  usuario_id UUID NOT NULL,
  owner_group_id UUID REFERENCES public.groups(id),
  nome TEXT NOT NULL,
  tamanho TEXT,
  dados JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.backups ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own backups"
  ON public.backups FOR SELECT
  USING (auth.uid() = usuario_id);

CREATE POLICY "Users can create own backups"
  ON public.backups FOR INSERT
  WITH CHECK (auth.uid() = usuario_id);

CREATE POLICY "Users can delete own backups"
  ON public.backups FOR DELETE
  USING (auth.uid() = usuario_id);

CREATE INDEX idx_backups_usuario_id ON public.backups(usuario_id);
