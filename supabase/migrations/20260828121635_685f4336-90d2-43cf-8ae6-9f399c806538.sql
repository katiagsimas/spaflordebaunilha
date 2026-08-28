CREATE TABLE public.utensilios (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id uuid NOT NULL,
  owner_group_id uuid NOT NULL,
  data_compra date NOT NULL DEFAULT CURRENT_DATE,
  descricao text NOT NULL,
  quantidade numeric NOT NULL DEFAULT 1,
  valor_compra numeric NOT NULL DEFAULT 0,
  observacoes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.utensilios TO authenticated;
GRANT ALL ON public.utensilios TO service_role;

ALTER TABLE public.utensilios ENABLE ROW LEVEL SECURITY;

CREATE POLICY "utensilios_select" ON public.utensilios FOR SELECT TO authenticated
  USING (usuario_id = auth.uid());
CREATE POLICY "utensilios_insert" ON public.utensilios FOR INSERT TO authenticated
  WITH CHECK (usuario_id = auth.uid());
CREATE POLICY "utensilios_update" ON public.utensilios FOR UPDATE TO authenticated
  USING (usuario_id = auth.uid()) WITH CHECK (usuario_id = auth.uid());
CREATE POLICY "utensilios_delete" ON public.utensilios FOR DELETE TO authenticated
  USING (usuario_id = auth.uid());

CREATE TRIGGER update_utensilios_updated_at
  BEFORE UPDATE ON public.utensilios
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_utensilios_group ON public.utensilios (owner_group_id);