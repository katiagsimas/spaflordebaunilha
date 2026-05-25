
CREATE POLICY "Deny all access to orphan logos bucket"
ON storage.objects AS RESTRICTIVE
FOR ALL
TO public
USING (bucket_id <> 'logos')
WITH CHECK (bucket_id <> 'logos');
