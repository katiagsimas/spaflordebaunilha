-- Criar bucket para comprovantes de contas a pagar (se não existir)
INSERT INTO storage.buckets (id, name, public)
VALUES ('comprovantes-pagar', 'comprovantes-pagar', false)
ON CONFLICT (id) DO NOTHING;

-- RLS Policies para o bucket
CREATE POLICY "Users can upload own comprovantes_pagar"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'comprovantes-pagar'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can view own comprovantes_pagar"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'comprovantes-pagar'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete own comprovantes_pagar"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'comprovantes-pagar'
  AND auth.uid()::text = (storage.foldername(name))[1]
);