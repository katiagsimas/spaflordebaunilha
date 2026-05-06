-- Fix: Remove broad SELECT policy on encomendas_tags that leaks all users' tags
DROP POLICY IF EXISTS "Encomendas_tags visíveis para autenticados" ON public.encomendas_tags;

-- Fix: Add SELECT policy for comprovantes-receber storage bucket (owner-scoped)
CREATE POLICY "Owner can view own comprovantes-receber"
ON storage.objects
FOR SELECT
USING (bucket_id = 'comprovantes-receber' AND auth.uid()::text = (storage.foldername(name))[1]);