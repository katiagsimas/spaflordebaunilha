-- =====================================================
-- TABELA: admin_audit_log
-- Registra todas as ações administrativas no sistema
-- =====================================================
CREATE TABLE IF NOT EXISTS public.admin_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  target_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action TEXT NOT NULL CHECK (action IN ('view', 'edit', 'delete', 'create', 'impersonate', 'impersonate_start', 'impersonate_end', 'soft_delete', 'hard_delete', 'suspend', 'unsuspend')),
  module TEXT,
  record_id UUID,
  old_value JSONB,
  new_value JSONB,
  reason TEXT,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- RLS para admin_audit_log
ALTER TABLE public.admin_audit_log ENABLE ROW LEVEL SECURITY;

-- Apenas admins podem ver logs
CREATE POLICY "Admin can view all audit logs"
  ON public.admin_audit_log
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
      AND role = 'admin'
    )
  );

-- Apenas admins podem inserir logs (via functions)
CREATE POLICY "Admin can insert audit logs"
  ON public.admin_audit_log
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
      AND role = 'admin'
    )
  );

-- =====================================================
-- TABELA: admin_access_tokens
-- Tokens temporários para impersonation (2 horas)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.admin_access_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  target_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  token TEXT NOT NULL UNIQUE,
  reason TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  revoked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- RLS para admin_access_tokens
ALTER TABLE public.admin_access_tokens ENABLE ROW LEVEL SECURITY;

-- Apenas admins podem gerenciar tokens
CREATE POLICY "Admin can manage access tokens"
  ON public.admin_access_tokens
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
      AND role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
      AND role = 'admin'
    )
  );

-- =====================================================
-- TABELA: deleted_data_backup
-- Backup de dados deletados (retenção 90 dias)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.deleted_data_backup (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  data JSONB NOT NULL,
  deleted_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  deleted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  permanent_delete_at TIMESTAMPTZ NOT NULL
);

-- RLS para deleted_data_backup
ALTER TABLE public.deleted_data_backup ENABLE ROW LEVEL SECURITY;

-- Apenas admins podem ver backups
CREATE POLICY "Admin can view deleted data backups"
  ON public.deleted_data_backup
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
      AND role = 'admin'
    )
  );

-- Apenas admins podem criar backups
CREATE POLICY "Admin can create deleted data backups"
  ON public.deleted_data_backup
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
      AND role = 'admin'
    )
  );

-- =====================================================
-- INDEXES para otimização de queries
-- =====================================================

-- Indexes para admin_audit_log
CREATE INDEX IF NOT EXISTS idx_admin_audit_log_admin_id_created_at 
  ON public.admin_audit_log(admin_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_admin_audit_log_target_user_id_created_at 
  ON public.admin_audit_log(target_user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_admin_audit_log_action 
  ON public.admin_audit_log(action);

CREATE INDEX IF NOT EXISTS idx_admin_audit_log_module 
  ON public.admin_audit_log(module);

-- Indexes para admin_access_tokens
CREATE INDEX IF NOT EXISTS idx_admin_access_tokens_token 
  ON public.admin_access_tokens(token);

CREATE INDEX IF NOT EXISTS idx_admin_access_tokens_expires_at 
  ON public.admin_access_tokens(expires_at);

CREATE INDEX IF NOT EXISTS idx_admin_access_tokens_admin_id 
  ON public.admin_access_tokens(admin_id);

CREATE INDEX IF NOT EXISTS idx_admin_access_tokens_target_user_id 
  ON public.admin_access_tokens(target_user_id);

-- Indexes para deleted_data_backup
CREATE INDEX IF NOT EXISTS idx_deleted_data_backup_user_id 
  ON public.deleted_data_backup(user_id);

CREATE INDEX IF NOT EXISTS idx_deleted_data_backup_deleted_by 
  ON public.deleted_data_backup(deleted_by);

CREATE INDEX IF NOT EXISTS idx_deleted_data_backup_permanent_delete_at 
  ON public.deleted_data_backup(permanent_delete_at);

-- =====================================================
-- COMENTÁRIOS para documentação
-- =====================================================

COMMENT ON TABLE public.admin_audit_log IS 'Registra todas as ações administrativas realizadas no sistema';
COMMENT ON TABLE public.admin_access_tokens IS 'Tokens temporários para acesso admin às contas de usuárias (impersonation)';
COMMENT ON TABLE public.deleted_data_backup IS 'Backup de dados de usuárias deletadas (retenção 90 dias)';