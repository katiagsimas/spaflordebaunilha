
CREATE TABLE IF NOT EXISTS public.hotmart_produtos (
  product_id text PRIMARY KEY,
  plano_id text NOT NULL REFERENCES public.planos(id),
  plano_tipo text NOT NULL CHECK (plano_tipo IN ('mensal', 'anual')),
  descricao text,
  ativo boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.hotmart_produtos ENABLE ROW LEVEL SECURITY;

-- Leitura: usuários autenticados (catálogo não é sensível)
CREATE POLICY "authenticated_read_hotmart_produtos"
  ON public.hotmart_produtos FOR SELECT TO authenticated
  USING (true);

-- Escrita: apenas MOTHER
CREATE POLICY "mother_manage_hotmart_produtos"
  ON public.hotmart_produtos FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_global_roles
      WHERE user_id = auth.uid()
        AND is_active = true
        AND role_global = 'MOTHER'::role_global
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_global_roles
      WHERE user_id = auth.uid()
        AND is_active = true
        AND role_global = 'MOTHER'::role_global
    )
  );

-- Trigger de updated_at (reaproveita função existente)
CREATE TRIGGER trg_hotmart_produtos_updated_at
  BEFORE UPDATE ON public.hotmart_produtos
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Seed: Caixa Lite Anual
INSERT INTO public.hotmart_produtos (product_id, plano_id, plano_tipo, descricao)
VALUES ('7449074', 'base', 'anual', 'Caixa Lite — Plano Anual')
ON CONFLICT (product_id) DO NOTHING;
