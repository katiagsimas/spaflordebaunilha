GRANT SELECT, INSERT, UPDATE, DELETE ON public.produtos_revenda TO authenticated;
GRANT ALL ON public.produtos_revenda TO service_role;

DROP POLICY IF EXISTS "Users can manage their own group products_revenda" ON public.produtos_revenda;
CREATE POLICY "Users can manage their own group products_revenda"
ON public.produtos_revenda
FOR ALL
TO authenticated
USING (owner_group_id = public.get_active_group_id(auth.uid()))
WITH CHECK (owner_group_id = public.get_active_group_id(auth.uid()) AND usuario_id = auth.uid());