-- Make encomendas bucket private
UPDATE storage.buckets SET public = false WHERE id = 'encomendas';

-- Drop existing overly permissive SELECT policy
DROP POLICY IF EXISTS "Imagens de encomendas são publicamente acessíveis" ON storage.objects;
DROP POLICY IF EXISTS "Usuários podem visualizar suas próprias imagens de encomendas" ON storage.objects;

-- Add owner-scoped SELECT policy
CREATE POLICY "Users can view own encomendas images"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'encomendas'
    AND (storage.foldername(name))[1] = 'encomendas'
    AND (storage.foldername(name))[2] = auth.uid()::text
  );