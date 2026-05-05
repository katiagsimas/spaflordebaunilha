REVOKE EXECUTE ON FUNCTION public.realizar_transferencia FROM anon;
REVOKE EXECUTE ON FUNCTION public.realizar_transferencia FROM public;
GRANT EXECUTE ON FUNCTION public.realizar_transferencia TO authenticated;