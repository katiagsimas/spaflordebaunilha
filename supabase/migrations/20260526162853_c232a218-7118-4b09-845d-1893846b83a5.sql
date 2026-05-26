REVOKE EXECUTE ON FUNCTION public.cleanup_expired_sso_tokens() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.cleanup_expired_sso_tokens() TO service_role;