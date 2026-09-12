CREATE TABLE public.contas_receber_itens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conta_receber_id uuid NOT NULL REFERENCES public.contas_receber(id) ON DELETE CASCADE,
  produto_revenda_id uuid REFERENCES public.produtos_revenda(id) ON DELETE SET NULL,
  usuario_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  owner_group_id uuid NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  codigo text NOT NULL,
  descricao text NOT NULL,
  marca text,
  quantidade numeric(12,3) NOT NULL CHECK (quantidade > 0),
  valor_custo_unitario numeric(14,2) NOT NULL DEFAULT 0 CHECK (valor_custo_unitario >= 0),
  valor_venda_unitario numeric(14,2) NOT NULL DEFAULT 0 CHECK (valor_venda_unitario >= 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.contas_receber_itens TO authenticated;
GRANT ALL ON public.contas_receber_itens TO service_role;

ALTER TABLE public.contas_receber_itens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "group_members_select_contas_receber_itens"
ON public.contas_receber_itens FOR SELECT TO authenticated
USING (
  user_belongs_to_group(auth.uid(), owner_group_id)
  AND EXISTS (
    SELECT 1 FROM public.contas_receber cr
    WHERE cr.id = conta_receber_id AND cr.owner_group_id = contas_receber_itens.owner_group_id
  )
);

CREATE POLICY "group_members_insert_contas_receber_itens"
ON public.contas_receber_itens FOR INSERT TO authenticated
WITH CHECK (
  auth.uid() = usuario_id
  AND user_belongs_to_group(auth.uid(), owner_group_id)
  AND EXISTS (
    SELECT 1 FROM public.contas_receber cr
    WHERE cr.id = conta_receber_id AND cr.owner_group_id = contas_receber_itens.owner_group_id
  )
);

CREATE POLICY "group_members_update_contas_receber_itens"
ON public.contas_receber_itens FOR UPDATE TO authenticated
USING (user_belongs_to_group(auth.uid(), owner_group_id))
WITH CHECK (auth.uid() = usuario_id AND user_belongs_to_group(auth.uid(), owner_group_id));

CREATE POLICY "group_members_delete_contas_receber_itens"
ON public.contas_receber_itens FOR DELETE TO authenticated
USING (user_belongs_to_group(auth.uid(), owner_group_id));

CREATE INDEX idx_contas_receber_itens_conta ON public.contas_receber_itens(conta_receber_id);
CREATE INDEX idx_contas_receber_itens_grupo ON public.contas_receber_itens(owner_group_id);

CREATE TRIGGER update_contas_receber_itens_updated_at
BEFORE UPDATE ON public.contas_receber_itens
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();