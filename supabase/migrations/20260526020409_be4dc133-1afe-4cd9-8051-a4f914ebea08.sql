-- 1. Coluna storage_path e dados nullable
ALTER TABLE public.backups ADD COLUMN IF NOT EXISTS storage_path text;
ALTER TABLE public.backups ALTER COLUMN dados DROP NOT NULL;

-- 2. Bucket privado
INSERT INTO storage.buckets (id, name, public)
VALUES ('backups', 'backups', false)
ON CONFLICT (id) DO NOTHING;

-- 3. RLS owner-scoped (pasta = auth.uid())
DROP POLICY IF EXISTS "backups_select_own" ON storage.objects;
CREATE POLICY "backups_select_own" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'backups' AND auth.uid()::text = (storage.foldername(name))[1]);

DROP POLICY IF EXISTS "backups_insert_own" ON storage.objects;
CREATE POLICY "backups_insert_own" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'backups' AND auth.uid()::text = (storage.foldername(name))[1]);

DROP POLICY IF EXISTS "backups_update_own" ON storage.objects;
CREATE POLICY "backups_update_own" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'backups' AND auth.uid()::text = (storage.foldername(name))[1]);

DROP POLICY IF EXISTS "backups_delete_own" ON storage.objects;
CREATE POLICY "backups_delete_own" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'backups' AND auth.uid()::text = (storage.foldername(name))[1]);