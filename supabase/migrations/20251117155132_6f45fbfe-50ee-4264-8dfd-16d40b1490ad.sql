-- Criar bucket para imagens de receitas
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'receitas',
  'receitas',
  true,
  5242880, -- 5MB
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO NOTHING;

-- Política: qualquer usuário autenticado pode fazer upload de suas próprias imagens
CREATE POLICY "Users can upload their recipe images"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'receitas' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Política: qualquer usuário autenticado pode atualizar suas próprias imagens
CREATE POLICY "Users can update their recipe images"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'receitas' AND
  (storage.foldername(name))[1] = auth.uid()::text
)
WITH CHECK (
  bucket_id = 'receitas' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Política: qualquer usuário autenticado pode deletar suas próprias imagens
CREATE POLICY "Users can delete their recipe images"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'receitas' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Política: qualquer um pode visualizar imagens de receitas (bucket público)
CREATE POLICY "Anyone can view recipe images"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'receitas');