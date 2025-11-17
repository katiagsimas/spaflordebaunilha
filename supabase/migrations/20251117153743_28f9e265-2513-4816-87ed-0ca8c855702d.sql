-- Criar bucket público para logotipos
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'logotipos',
  'logotipos',
  true,
  5242880, -- 5MB
  ARRAY['image/png', 'image/jpeg', 'image/jpg', 'image/webp']
);

-- Política: Qualquer usuário autenticado pode fazer upload de sua própria logo
CREATE POLICY "Users can upload their own logo"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'logotipos' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Política: Qualquer usuário autenticado pode atualizar sua própria logo
CREATE POLICY "Users can update their own logo"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'logotipos' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Política: Qualquer usuário autenticado pode deletar sua própria logo
CREATE POLICY "Users can delete their own logo"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'logotipos' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Política: Logos são publicamente acessíveis para leitura
CREATE POLICY "Logos are publicly accessible"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'logotipos');