-- 1) Remover políticas órfãs referenciando bucket inexistente 'comprovantes-pagamento'
DROP POLICY IF EXISTS "Users can delete own comprovantes" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload own comprovantes" ON storage.objects;
DROP POLICY IF EXISTS "Users can view own comprovantes" ON storage.objects;

-- 2) Permitir que o dono atualize/remova suas próprias imagens no bucket 'pre-preparos'
CREATE POLICY "Users can update own pre-preparo images"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'pre-preparos'
  AND (auth.uid())::text = (storage.foldername(name))[1]
)
WITH CHECK (
  bucket_id = 'pre-preparos'
  AND (auth.uid())::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete own pre-preparo images"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'pre-preparos'
  AND (auth.uid())::text = (storage.foldername(name))[1]
);