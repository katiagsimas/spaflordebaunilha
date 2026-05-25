
CREATE POLICY "Usuários podem enviar seus próprios comprovantes a receber"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'comprovantes-receber'
  AND (storage.foldername(name))[1] = (auth.uid())::text
);

CREATE POLICY "Usuários podem deletar seus próprios comprovantes a receber"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'comprovantes-receber'
  AND (storage.foldername(name))[1] = (auth.uid())::text
);
