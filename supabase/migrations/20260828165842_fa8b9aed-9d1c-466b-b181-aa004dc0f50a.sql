ALTER TABLE public.estoque
  ADD COLUMN IF NOT EXISTS produto_revenda_id uuid REFERENCES public.produtos_revenda(id) ON DELETE SET NULL;

ALTER TABLE public.estoque DROP CONSTRAINT IF EXISTS estoque_tipo_check;
ALTER TABLE public.estoque ADD CONSTRAINT estoque_tipo_check
  CHECK (tipo = ANY (ARRAY['ingrediente'::text, 'embalagem'::text, 'revenda'::text]));

CREATE UNIQUE INDEX IF NOT EXISTS estoque_grupo_produto_revenda_uidx
  ON public.estoque (owner_group_id, produto_revenda_id)
  WHERE produto_revenda_id IS NOT NULL;