CREATE OR REPLACE FUNCTION public.protect_plan_fields()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- Allow service role (edge functions) - auth.uid() is NULL
  IF auth.uid() IS NULL THEN
    RETURN NEW;
  END IF;

  -- Allow admins to change plan fields
  IF public.has_role(auth.uid(), 'admin') THEN
    RETURN NEW;
  END IF;

  -- For non-admin users, preserve original plan values
  NEW.plano_id := OLD.plano_id;
  NEW.plano_tipo := OLD.plano_tipo;
  NEW.plano_inicio := OLD.plano_inicio;
  NEW.plano_fim := OLD.plano_fim;

  RETURN NEW;
END;
$function$;