
-- Tornar buckets 'assinaturas' e 'topo-bolo' privados
UPDATE storage.buckets SET public = false WHERE id IN ('assinaturas', 'topo-bolo');

-- Remover policy permissiva de SELECT em 'assinaturas' e criar owner-scoped
DROP POLICY IF EXISTS "Assinaturas são publicamente acessíveis" ON storage.objects;

CREATE POLICY "Assinaturas: dono lê via folder"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'assinaturas'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Migrar valores antigos de profiles.assinatura_url (URLs públicas) para path relativo
UPDATE public.profiles
SET assinatura_url = substring(assinatura_url FROM '/object/public/assinaturas/(.+)$')
WHERE assinatura_url LIKE '%/object/public/assinaturas/%';
