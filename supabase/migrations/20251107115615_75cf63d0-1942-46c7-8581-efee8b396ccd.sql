-- Functions para retornar views (workaround para RLS)

CREATE OR REPLACE FUNCTION get_admin_dashboard_metrics()
RETURNS TABLE (
  total_users bigint,
  active_users_today bigint,
  active_users_week bigint,
  total_storage_used bigint,
  recent_errors integer,
  pending_deletions integer
) 
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  -- Verificar se é admin
  IF NOT EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin') THEN
    RAISE EXCEPTION 'Apenas admins podem acessar métricas';
  END IF;
  
  RETURN QUERY
  SELECT * FROM admin_dashboard_metrics;
END;
$$;

CREATE OR REPLACE FUNCTION get_admin_recent_activity()
RETURNS TABLE (
  id uuid,
  created_at timestamptz,
  action text,
  module text,
  reason text,
  admin_email text,
  target_user_email text,
  admin_id uuid,
  target_user_id uuid
)
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  -- Verificar se é admin
  IF NOT EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin') THEN
    RAISE EXCEPTION 'Apenas admins podem acessar atividades';
  END IF;
  
  RETURN QUERY
  SELECT * FROM admin_recent_activity;
END;
$$;