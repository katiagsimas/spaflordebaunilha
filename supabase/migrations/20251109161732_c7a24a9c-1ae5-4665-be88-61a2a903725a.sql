-- Fix security issue: Restrict access to admin views that expose auth.users
-- These views should only be accessible through RPC functions with admin checks

-- Revoke all public access to admin views
REVOKE ALL ON admin_dashboard_metrics FROM PUBLIC;
REVOKE ALL ON admin_dashboard_metrics FROM authenticated;
REVOKE ALL ON admin_dashboard_metrics FROM anon;

REVOKE ALL ON admin_recent_activity FROM PUBLIC;
REVOKE ALL ON admin_recent_activity FROM authenticated;
REVOKE ALL ON admin_recent_activity FROM anon;

REVOKE ALL ON user_admin_access_history FROM PUBLIC;
REVOKE ALL ON user_admin_access_history FROM authenticated;
REVOKE ALL ON user_admin_access_history FROM anon;

-- Grant SELECT only to the RPC functions (which already have admin checks)
-- The functions use SECURITY DEFINER so they can access the views
GRANT SELECT ON admin_dashboard_metrics TO postgres;
GRANT SELECT ON admin_recent_activity TO postgres;
GRANT SELECT ON user_admin_access_history TO postgres;

-- Add comments explaining the security model
COMMENT ON VIEW admin_dashboard_metrics IS 'Admin-only view. Access via get_admin_dashboard_metrics() RPC which enforces admin role check.';
COMMENT ON VIEW admin_recent_activity IS 'Admin-only view. Access via get_admin_recent_activity() RPC which enforces admin role check.';
COMMENT ON VIEW user_admin_access_history IS 'User can view their own admin access history. Restricted via security_invoker and auth.uid() filter in view definition.';