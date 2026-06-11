
-- 1. backups_cofre: deny direct INSERT from clients (service_role bypasses RLS)
CREATE POLICY "Deny direct inserts on backups_cofre"
ON public.backups_cofre
FOR INSERT
TO authenticated, anon
WITH CHECK (false);

-- 2. clientes: allow solo users (no group) to insert their own clients
CREATE POLICY "Solo users can insert own clientes"
ON public.clientes
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = usuario_id AND owner_group_id IS NULL);

-- 3. storage.objects: UPDATE policy for topo-bolo bucket scoped to owner folder
CREATE POLICY "topo-bolo: dono atualiza"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'topo-bolo' AND (storage.foldername(name))[1] = auth.uid()::text)
WITH CHECK (bucket_id = 'topo-bolo' AND (storage.foldername(name))[1] = auth.uid()::text);
