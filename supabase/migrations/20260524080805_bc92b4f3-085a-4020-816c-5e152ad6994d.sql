
CREATE TABLE IF NOT EXISTS public.fechamento_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fechamento_id UUID NOT NULL REFERENCES public.fechamentos_mensais(id) ON DELETE CASCADE,
  owner_group_id UUID NOT NULL,
  acao TEXT NOT NULL CHECK (acao IN ('fechado','reaberto','iniciado')),
  motivo TEXT,
  snapshot JSONB,
  usuario_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_fechamento_logs_fechamento ON public.fechamento_logs(fechamento_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_fechamento_logs_grupo ON public.fechamento_logs(owner_group_id);

ALTER TABLE public.fechamento_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "fechamento_logs_select_grupo"
ON public.fechamento_logs FOR SELECT
TO authenticated
USING (public.user_belongs_to_group(auth.uid(), owner_group_id));

CREATE POLICY "fechamento_logs_insert_grupo"
ON public.fechamento_logs FOR INSERT
TO authenticated
WITH CHECK (
  public.user_belongs_to_group(auth.uid(), owner_group_id)
  AND usuario_id = auth.uid()
);
