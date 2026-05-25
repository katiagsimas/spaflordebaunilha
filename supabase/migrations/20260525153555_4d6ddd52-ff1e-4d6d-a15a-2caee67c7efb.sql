
UPDATE storage.buckets SET public = false WHERE id IN ('pre-preparos', 'receitas');

DROP POLICY IF EXISTS "Anyone can view recipe images" ON storage.objects;
DROP POLICY IF EXISTS "Public can view images" ON storage.objects;

CREATE POLICY "Group members can view recipe images"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'receitas'
  AND EXISTS (
    SELECT 1 FROM public.profiles me, public.profiles uploader
    WHERE me.id = auth.uid()
      AND uploader.id::text = (storage.foldername(name))[1]
      AND me.owner_group_id IS NOT NULL
      AND me.owner_group_id = uploader.owner_group_id
  )
);

CREATE POLICY "Group members can view pre-preparo images"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'pre-preparos'
  AND EXISTS (
    SELECT 1 FROM public.profiles me, public.profiles uploader
    WHERE me.id = auth.uid()
      AND uploader.id::text = (storage.foldername(name))[1]
      AND me.owner_group_id IS NOT NULL
      AND me.owner_group_id = uploader.owner_group_id
  )
);
