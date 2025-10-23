-- Criar bucket para logos (público)
INSERT INTO storage.buckets (id, name, public)
VALUES ('logos', 'logos', true)
ON CONFLICT (id) DO NOTHING;

-- Políticas de acesso para o bucket de logos
-- Qualquer usuário autenticado pode visualizar logos
CREATE POLICY "Logos são públicos para visualização"
ON storage.objects FOR SELECT
USING (bucket_id = 'logos');

-- Apenas o dono pode fazer upload do próprio logo
CREATE POLICY "Usuários podem fazer upload de seus próprios logos"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'logos' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Apenas o dono pode atualizar o próprio logo
CREATE POLICY "Usuários podem atualizar seus próprios logos"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'logos' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Apenas o dono pode deletar o próprio logo
CREATE POLICY "Usuários podem deletar seus próprios logos"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'logos' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);