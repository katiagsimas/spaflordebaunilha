-- Remove the overly permissive public SELECT policy
DROP POLICY IF EXISTS "Anyone can view order images" ON storage.objects;

-- Drop the incorrectly configured owner-scoped SELECT policy
DROP POLICY IF EXISTS "Users can view own encomendas images" ON storage.objects;

-- Create correct owner-scoped SELECT policy matching the INSERT/UPDATE/DELETE pattern
CREATE POLICY "Users can view own encomendas images"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'encomendas'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );