-- Adiciona controle de retenção e módulos selecionados ao agendamento
ALTER TABLE public.backup_agendamentos
  ADD COLUMN IF NOT EXISTS retencao_dias integer NOT NULL DEFAULT 30,
  ADD COLUMN IF NOT EXISTS modulos text[] NOT NULL DEFAULT ARRAY['operacao','comercial','negocio','planejamento','sistema']::text[];

-- Adiciona metadados aos backups (quais módulos foram incluídos)
ALTER TABLE public.backups
  ADD COLUMN IF NOT EXISTS modulos text[],
  ADD COLUMN IF NOT EXISTS origem text NOT NULL DEFAULT 'manual';

-- Função para limpar backups antigos baseado em retencao_dias por usuário
CREATE OR REPLACE FUNCTION public.limpar_backups_antigos(p_usuario_id uuid, p_retencao_dias integer)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_removidos integer := 0;
BEGIN
  IF p_retencao_dias IS NULL OR p_retencao_dias <= 0 THEN
    RETURN 0;
  END IF;

  WITH del AS (
    DELETE FROM public.backups
    WHERE usuario_id = p_usuario_id
      AND created_at < now() - (p_retencao_dias || ' days')::interval
    RETURNING 1
  )
  SELECT count(*) INTO v_removidos FROM del;

  RETURN v_removidos;
END;
$$;

GRANT EXECUTE ON FUNCTION public.limpar_backups_antigos(uuid, integer) TO authenticated, service_role;