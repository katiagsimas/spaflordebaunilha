REVOKE EXECUTE ON FUNCTION public.expire_overdue_plans() FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.expire_overdue_plans() FROM anon;
REVOKE EXECUTE ON FUNCTION public.expire_overdue_plans() FROM public;
GRANT EXECUTE ON FUNCTION public.expire_overdue_plans() TO service_role;