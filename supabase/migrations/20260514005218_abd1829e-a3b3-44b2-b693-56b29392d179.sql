CREATE TABLE public.meu_salario_retiradas (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  owner_group_id UUID NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  data_retirada DATE NOT NULL,
  valor NUMERIC(12,2) NOT NULL CHECK (valor > 0),
  descricao TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_meu_salario_retiradas_group_data
  ON public.meu_salario_retiradas (owner_group_id, data_retirada);

ALTER TABLE public.meu_salario_retiradas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own group retiradas"
  ON public.meu_salario_retiradas FOR SELECT TO authenticated
  USING (owner_group_id IN (
    SELECT ugr.group_id FROM public.user_group_roles ugr WHERE ugr.user_id = auth.uid()
  ));

CREATE POLICY "Users can insert own group retiradas"
  ON public.meu_salario_retiradas FOR INSERT TO authenticated
  WITH CHECK (
    user_id = auth.uid() AND
    owner_group_id IN (
      SELECT ugr.group_id FROM public.user_group_roles ugr WHERE ugr.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own group retiradas"
  ON public.meu_salario_retiradas FOR UPDATE TO authenticated
  USING (owner_group_id IN (
    SELECT ugr.group_id FROM public.user_group_roles ugr WHERE ugr.user_id = auth.uid()
  ));

CREATE POLICY "Users can delete own group retiradas"
  ON public.meu_salario_retiradas FOR DELETE TO authenticated
  USING (owner_group_id IN (
    SELECT ugr.group_id FROM public.user_group_roles ugr WHERE ugr.user_id = auth.uid()
  ));

CREATE TRIGGER update_meu_salario_retiradas_updated_at
  BEFORE UPDATE ON public.meu_salario_retiradas
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();