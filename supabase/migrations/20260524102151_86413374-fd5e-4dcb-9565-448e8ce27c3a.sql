-- 1) Função que desativa em massa todos os perfis com plano vencido
CREATE OR REPLACE FUNCTION public.expire_overdue_plans()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count integer;
BEGIN
  UPDATE public.profiles
     SET ativo = false,
         updated_at = now()
   WHERE plano_fim IS NOT NULL
     AND plano_fim < CURRENT_DATE
     AND ativo IS DISTINCT FROM false;
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$;

-- Permitir chamada via RPC pelos usuários autenticados (apenas admins efetivamente fazem algo útil)
GRANT EXECUTE ON FUNCTION public.expire_overdue_plans() TO authenticated;

-- 2) Trigger em profiles: se plano_fim < hoje, forçar ativo = false
CREATE OR REPLACE FUNCTION public.enforce_plan_expiration()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.plano_fim IS NOT NULL AND NEW.plano_fim < CURRENT_DATE THEN
    NEW.ativo := false;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_enforce_plan_expiration ON public.profiles;
CREATE TRIGGER trg_enforce_plan_expiration
BEFORE INSERT OR UPDATE OF plano_fim, ativo ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.enforce_plan_expiration();

-- 3) Varredura inicial
SELECT public.expire_overdue_plans();