CREATE OR REPLACE FUNCTION public.gerar_proximo_codigo_tipo_documento(p_user_id uuid, p_owner_group_id uuid)
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  ultimo_codigo INTEGER;
BEGIN
  SELECT COALESCE(MAX(codigo), 0) INTO ultimo_codigo
  FROM tipos_documento
  WHERE owner_group_id = p_owner_group_id;
  
  RETURN ultimo_codigo + 1;
END;
$function$;

GRANT EXECUTE ON FUNCTION public.gerar_proximo_codigo_tipo_documento(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.gerar_proximo_codigo_tipo_documento(uuid, uuid) TO service_role;
