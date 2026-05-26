-- Tabela de estado do ritual Organização Doce (per-user)
CREATE TABLE public.organizacao_doce_state (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  owner_group_id UUID,
  data JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT organizacao_doce_state_user_unique UNIQUE (user_id)
);

ALTER TABLE public.organizacao_doce_state ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own organizacao_doce_state"
  ON public.organizacao_doce_state FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own organizacao_doce_state"
  ON public.organizacao_doce_state FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own organizacao_doce_state"
  ON public.organizacao_doce_state FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own organizacao_doce_state"
  ON public.organizacao_doce_state FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

CREATE TRIGGER trg_organizacao_doce_state_updated
  BEFORE UPDATE ON public.organizacao_doce_state
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_organizacao_doce_state_user ON public.organizacao_doce_state(user_id);