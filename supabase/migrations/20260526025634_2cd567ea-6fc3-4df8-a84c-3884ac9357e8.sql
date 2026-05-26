CREATE TABLE public.conversa_doce_favoritos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_group_id uuid NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  texto text NOT NULL,
  rotulo text,
  mensagem_original text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_cd_favoritos_group ON public.conversa_doce_favoritos(owner_group_id, created_at DESC);
CREATE INDEX idx_cd_favoritos_user ON public.conversa_doce_favoritos(user_id);

ALTER TABLE public.conversa_doce_favoritos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Membros do grupo veem favoritos"
  ON public.conversa_doce_favoritos FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_group_roles ugr
      WHERE ugr.group_id = conversa_doce_favoritos.owner_group_id
        AND ugr.user_id = auth.uid()
        AND ugr.is_active = true
    )
  );

CREATE POLICY "Membros do grupo criam favoritos"
  ON public.conversa_doce_favoritos FOR INSERT TO authenticated
  WITH CHECK (
    user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.user_group_roles ugr
      WHERE ugr.group_id = conversa_doce_favoritos.owner_group_id
        AND ugr.user_id = auth.uid()
        AND ugr.is_active = true
    )
  );

CREATE POLICY "Criador ou admin atualiza favoritos"
  ON public.conversa_doce_favoritos FOR UPDATE TO authenticated
  USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.user_group_roles ugr
      WHERE ugr.group_id = conversa_doce_favoritos.owner_group_id
        AND ugr.user_id = auth.uid()
        AND ugr.is_active = true
        AND ugr.role_group = 'ADMIN'
    )
  );

CREATE POLICY "Criador ou admin remove favoritos"
  ON public.conversa_doce_favoritos FOR DELETE TO authenticated
  USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.user_group_roles ugr
      WHERE ugr.group_id = conversa_doce_favoritos.owner_group_id
        AND ugr.user_id = auth.uid()
        AND ugr.is_active = true
        AND ugr.role_group = 'ADMIN'
    )
  );

CREATE TRIGGER trg_conversa_doce_favoritos_updated_at
  BEFORE UPDATE ON public.conversa_doce_favoritos
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();