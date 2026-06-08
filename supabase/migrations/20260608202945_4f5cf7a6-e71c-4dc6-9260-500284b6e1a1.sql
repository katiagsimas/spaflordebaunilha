-- 1. Enable RLS on member_plan_sync_logs
ALTER TABLE public.member_plan_sync_logs ENABLE ROW LEVEL SECURITY;

-- MOTHER (system admin) can read all sync logs
CREATE POLICY "Mother can read sync logs"
ON public.member_plan_sync_logs FOR SELECT
TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.user_global_roles
  WHERE user_id = auth.uid() AND role_global = 'MOTHER' AND is_active = true
));

-- Only service_role / SECURITY DEFINER function can insert (no client INSERT policy)
-- Revoke direct INSERT from authenticated
REVOKE INSERT ON public.member_plan_sync_logs FROM authenticated;

-- 2. Fix function search_path
CREATE OR REPLACE FUNCTION public.log_member_plan_sync(
    p_member_id UUID,
    p_master_id UUID,
    p_group_id UUID,
    p_plano_id TEXT,
    p_inicio DATE,
    p_fim DATE,
    p_tipo TEXT,
    p_status TEXT DEFAULT 'success',
    p_error TEXT DEFAULT NULL
) RETURNS VOID 
LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    INSERT INTO public.member_plan_sync_logs (
        member_id, master_id, group_id, plano_id_aplicado, 
        vigencia_inicio_aplicada, vigencia_fim_aplicada, 
        plano_tipo_aplicado, status, error_message
    ) VALUES (
        p_member_id, p_master_id, p_group_id, p_plano_id, 
        p_inicio, p_fim, p_tipo, p_status, p_error
    );
    
    UPDATE public.user_group_roles 
    SET sync_status = p_status, 
        updated_at = now()
    WHERE user_id = p_member_id AND group_id = p_group_id;
END;
$$;

-- 3. Fix assinaturas bucket: INSERT/UPDATE/DELETE should be user-scoped (consistent with SELECT)
DROP POLICY IF EXISTS "Membros do grupo podem subir assinatura" ON storage.objects;
DROP POLICY IF EXISTS "Membros do grupo podem atualizar sua assinatura" ON storage.objects;
DROP POLICY IF EXISTS "Membros do grupo podem deletar sua assinatura" ON storage.objects;

CREATE POLICY "Assinaturas: dono faz upload"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'assinaturas' 
  AND (auth.uid())::text = (storage.foldername(name))[1]
);

CREATE POLICY "Assinaturas: dono atualiza"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'assinaturas' 
  AND (auth.uid())::text = (storage.foldername(name))[1]
);

CREATE POLICY "Assinaturas: dono deleta"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'assinaturas' 
  AND (auth.uid())::text = (storage.foldername(name))[1]
);