-- Tabela para log de auditoria de sincronização de planos
CREATE TABLE IF NOT EXISTS public.member_plan_sync_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    member_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    master_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    group_id UUID REFERENCES public.groups(id) ON DELETE CASCADE,
    plano_id_aplicado TEXT,
    vigencia_inicio_aplicada DATE,
    vigencia_fim_aplicada DATE,
    plano_tipo_aplicado TEXT,
    status TEXT NOT NULL DEFAULT 'success',
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Adicionar coluna de status de sincronização em user_group_roles
ALTER TABLE public.user_group_roles ADD COLUMN IF NOT EXISTS sync_status TEXT DEFAULT 'sincronizado';

-- Grant permissions
GRANT SELECT, INSERT ON public.member_plan_sync_logs TO authenticated;
GRANT ALL ON public.member_plan_sync_logs TO service_role;
GRANT UPDATE ON public.user_group_roles TO authenticated;
GRANT ALL ON public.user_group_roles TO service_role;

-- Função para registrar log de sincronização (pode ser chamada via RPC ou Trigger no futuro)
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
) RETURNS VOID AS $$
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
$$ LANGUAGE plpgsql SECURITY DEFINER;
