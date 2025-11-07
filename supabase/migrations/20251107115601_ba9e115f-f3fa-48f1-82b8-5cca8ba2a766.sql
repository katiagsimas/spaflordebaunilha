-- PROMPT 2: Views de Auditoria para Dashboard Admin (CORRIGIDO)

-- View 1: Histórico de acesso admin por usuária (visível para a própria usuária)
CREATE OR REPLACE VIEW user_admin_access_history AS
SELECT 
  aal.created_at as access_date,
  au.email as admin_email,
  aal.reason,
  CASE 
    WHEN aat.revoked_at IS NOT NULL THEN 
      EXTRACT(EPOCH FROM (aat.revoked_at - aat.created_at)) / 60
    WHEN aat.expires_at < NOW() THEN
      EXTRACT(EPOCH FROM (aat.expires_at - aat.created_at)) / 60
    ELSE
      EXTRACT(EPOCH FROM (NOW() - aat.created_at)) / 60
  END::INTEGER || ' minutos' as duration,
  COALESCE(
    (SELECT json_agg(DISTINCT aal2.action) 
     FROM admin_audit_log aal2 
     WHERE aal2.admin_id = aal.admin_id 
       AND aal2.target_user_id = aal.target_user_id
       AND aal2.created_at BETWEEN aat.created_at AND COALESCE(aat.revoked_at, aat.expires_at)
       AND aal2.action NOT IN ('impersonate_start', 'impersonate_end')
    ), '[]'::json
  ) as actions_performed,
  aal.module
FROM admin_audit_log aal
LEFT JOIN admin_access_tokens aat ON aat.admin_id = aal.admin_id 
  AND aat.target_user_id = aal.target_user_id
  AND aal.created_at >= aat.created_at
  AND aal.created_at <= COALESCE(aat.revoked_at, aat.expires_at)
LEFT JOIN auth.users au ON au.id = aal.admin_id
WHERE aal.action = 'impersonate_start'
  AND aal.target_user_id = auth.uid()
ORDER BY aal.created_at DESC;

-- RLS para user_admin_access_history
ALTER VIEW user_admin_access_history SET (security_invoker = on);

-- View 2: Métricas do Dashboard Admin
CREATE OR REPLACE VIEW admin_dashboard_metrics AS
SELECT
  -- Total de usuárias
  (SELECT COUNT(DISTINCT id) FROM auth.users) as total_users,
  
  -- Usuárias ativas hoje (fizeram login)
  (SELECT COUNT(DISTINCT id) 
   FROM auth.users 
   WHERE last_sign_in_at::date = CURRENT_DATE) as active_users_today,
  
  -- Usuárias ativas na semana
  (SELECT COUNT(DISTINCT id) 
   FROM auth.users 
   WHERE last_sign_in_at >= CURRENT_DATE - INTERVAL '7 days') as active_users_week,
  
  -- Storage total usado (estimativa baseada em registros)
  (SELECT COALESCE(SUM(
    (SELECT COUNT(*) FROM encomendas WHERE usuario_id = u.id) +
    (SELECT COUNT(*) FROM receitas WHERE usuario_id = u.id) +
    (SELECT COUNT(*) FROM itens WHERE usuario_id = u.id)
  ) * 1024, 0)::bigint -- estimativa de 1KB por registro
   FROM auth.users u) as total_storage_used,
  
  -- Erros recentes (últimas 24h - baseado em logs)
  0::integer as recent_errors,
  
  -- Exclusões pendentes (usando deleted_data_backup)
  (SELECT COUNT(*) 
   FROM deleted_data_backup 
   WHERE deleted_at > NOW() - INTERVAL '30 days'
     AND permanent_delete_at > NOW())::integer as pending_deletions;

-- View 3: Atividades Recentes
CREATE OR REPLACE VIEW admin_recent_activity AS
SELECT 
  aal.id,
  aal.created_at,
  aal.action,
  aal.module,
  aal.reason,
  au_admin.email as admin_email,
  au_target.email as target_user_email,
  aal.admin_id,
  aal.target_user_id
FROM admin_audit_log aal
LEFT JOIN auth.users au_admin ON au_admin.id = aal.admin_id
LEFT JOIN auth.users au_target ON au_target.id = aal.target_user_id
ORDER BY aal.created_at DESC
LIMIT 50;

-- RLS para admin_recent_activity
ALTER VIEW admin_recent_activity SET (security_invoker = on);