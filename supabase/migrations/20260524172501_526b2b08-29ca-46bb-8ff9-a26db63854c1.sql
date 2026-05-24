
-- Add owner_group_id to fornecedor_contatos
ALTER TABLE public.fornecedor_contatos
  ADD COLUMN IF NOT EXISTS owner_group_id uuid;

CREATE INDEX IF NOT EXISTS idx_fornecedor_contatos_owner_group_id
  ON public.fornecedor_contatos(owner_group_id);

-- Backfill owner_group_id from active user_group_roles (clientes, fornecedores, fornecedor_contatos)
UPDATE public.clientes c SET owner_group_id = (
  SELECT ugr.group_id FROM public.user_group_roles ugr
  WHERE ugr.user_id = c.usuario_id AND ugr.is_active = true
  ORDER BY ugr.created_at ASC LIMIT 1
) WHERE owner_group_id IS NULL;

UPDATE public.fornecedores f SET owner_group_id = (
  SELECT ugr.group_id FROM public.user_group_roles ugr
  WHERE ugr.user_id = f.usuario_id AND ugr.is_active = true
  ORDER BY ugr.created_at ASC LIMIT 1
) WHERE owner_group_id IS NULL;

UPDATE public.fornecedor_contatos fc SET owner_group_id = (
  SELECT ugr.group_id FROM public.user_group_roles ugr
  WHERE ugr.user_id = fc.usuario_id AND ugr.is_active = true
  ORDER BY ugr.created_at ASC LIMIT 1
) WHERE owner_group_id IS NULL;

-- Update RLS policies on clientes for group-based sharing
DROP POLICY IF EXISTS "Users can view own clientes" ON public.clientes;
DROP POLICY IF EXISTS "Users can insert own clientes" ON public.clientes;
DROP POLICY IF EXISTS "Users can update own clientes" ON public.clientes;
DROP POLICY IF EXISTS "Users can delete own clientes" ON public.clientes;

CREATE POLICY "Group members can view clientes" ON public.clientes
  FOR SELECT USING (
    public.user_belongs_to_group(auth.uid(), owner_group_id)
    OR auth.uid() = usuario_id
  );
CREATE POLICY "Group members can insert clientes" ON public.clientes
  FOR INSERT WITH CHECK (
    auth.uid() = usuario_id
    AND public.user_belongs_to_group(auth.uid(), owner_group_id)
  );
CREATE POLICY "Group members can update clientes" ON public.clientes
  FOR UPDATE USING (
    public.user_belongs_to_group(auth.uid(), owner_group_id)
    OR auth.uid() = usuario_id
  ) WITH CHECK (
    public.user_belongs_to_group(auth.uid(), owner_group_id)
    OR auth.uid() = usuario_id
  );
CREATE POLICY "Group members can delete clientes" ON public.clientes
  FOR DELETE USING (
    public.user_belongs_to_group(auth.uid(), owner_group_id)
    OR auth.uid() = usuario_id
  );

-- Update RLS policies on fornecedores
DROP POLICY IF EXISTS "Users can view own fornecedores" ON public.fornecedores;
DROP POLICY IF EXISTS "Users can insert own fornecedores" ON public.fornecedores;
DROP POLICY IF EXISTS "Users can update own fornecedores" ON public.fornecedores;
DROP POLICY IF EXISTS "Users can delete own fornecedores" ON public.fornecedores;

CREATE POLICY "Group members can view fornecedores" ON public.fornecedores
  FOR SELECT USING (
    public.user_belongs_to_group(auth.uid(), owner_group_id)
    OR auth.uid() = usuario_id
  );
CREATE POLICY "Group members can insert fornecedores" ON public.fornecedores
  FOR INSERT WITH CHECK (
    auth.uid() = usuario_id
    AND public.user_belongs_to_group(auth.uid(), owner_group_id)
  );
CREATE POLICY "Group members can update fornecedores" ON public.fornecedores
  FOR UPDATE USING (
    public.user_belongs_to_group(auth.uid(), owner_group_id)
    OR auth.uid() = usuario_id
  ) WITH CHECK (
    public.user_belongs_to_group(auth.uid(), owner_group_id)
    OR auth.uid() = usuario_id
  );
CREATE POLICY "Group members can delete fornecedores" ON public.fornecedores
  FOR DELETE USING (
    public.user_belongs_to_group(auth.uid(), owner_group_id)
    OR auth.uid() = usuario_id
  );

-- Update RLS policies on fornecedor_contatos
DROP POLICY IF EXISTS "Usuários veem apenas seus contatos" ON public.fornecedor_contatos;
DROP POLICY IF EXISTS "Usuários inserem apenas seus contatos" ON public.fornecedor_contatos;
DROP POLICY IF EXISTS "Usuários atualizam apenas seus contatos" ON public.fornecedor_contatos;
DROP POLICY IF EXISTS "Usuários deletam apenas seus contatos" ON public.fornecedor_contatos;
DROP POLICY IF EXISTS "Users can view own fornecedor_contatos" ON public.fornecedor_contatos;
DROP POLICY IF EXISTS "Users can insert own fornecedor_contatos" ON public.fornecedor_contatos;
DROP POLICY IF EXISTS "Users can update own fornecedor_contatos" ON public.fornecedor_contatos;
DROP POLICY IF EXISTS "Users can delete own fornecedor_contatos" ON public.fornecedor_contatos;

CREATE POLICY "Group members can view fornecedor_contatos" ON public.fornecedor_contatos
  FOR SELECT USING (
    public.user_belongs_to_group(auth.uid(), owner_group_id)
    OR auth.uid() = usuario_id
  );
CREATE POLICY "Group members can insert fornecedor_contatos" ON public.fornecedor_contatos
  FOR INSERT WITH CHECK (
    auth.uid() = usuario_id
    AND public.user_belongs_to_group(auth.uid(), owner_group_id)
  );
CREATE POLICY "Group members can update fornecedor_contatos" ON public.fornecedor_contatos
  FOR UPDATE USING (
    public.user_belongs_to_group(auth.uid(), owner_group_id)
    OR auth.uid() = usuario_id
  ) WITH CHECK (
    public.user_belongs_to_group(auth.uid(), owner_group_id)
    OR auth.uid() = usuario_id
  );
CREATE POLICY "Group members can delete fornecedor_contatos" ON public.fornecedor_contatos
  FOR DELETE USING (
    public.user_belongs_to_group(auth.uid(), owner_group_id)
    OR auth.uid() = usuario_id
  );
