
CREATE TABLE IF NOT EXISTS public.ai_usage_quotas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  periodo text NOT NULL,
  requests_count integer NOT NULL DEFAULT 0,
  tokens_in bigint NOT NULL DEFAULT 0,
  tokens_out bigint NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, periodo)
);

CREATE INDEX IF NOT EXISTS idx_ai_usage_quotas_user_periodo
  ON public.ai_usage_quotas (user_id, periodo);

ALTER TABLE public.ai_usage_quotas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_select_own_quota"
  ON public.ai_usage_quotas FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "mother_select_all_quotas"
  ON public.ai_usage_quotas FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_global_roles ugr
      WHERE ugr.user_id = auth.uid()
        AND ugr.is_active = true
        AND ugr.role_global = 'MOTHER'::role_global
    )
  );

CREATE OR REPLACE FUNCTION public.check_and_increment_ai_quota(
  p_user_id uuid,
  p_plano_id text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_periodo text := to_char(now(), 'YYYY-MM');
  v_limite integer;
  v_anterior integer;
  v_atual integer;
  v_is_mother boolean;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM public.user_global_roles
    WHERE user_id = p_user_id
      AND is_active = true
      AND role_global = 'MOTHER'::role_global
  ) INTO v_is_mother;

  IF v_is_mother THEN
    INSERT INTO public.ai_usage_quotas (user_id, periodo, requests_count)
    VALUES (p_user_id, v_periodo, 1)
    ON CONFLICT (user_id, periodo)
    DO UPDATE SET requests_count = ai_usage_quotas.requests_count + 1,
                  updated_at = now()
    RETURNING requests_count INTO v_atual;

    RETURN jsonb_build_object(
      'allowed', true, 'unlimited', true,
      'requests_used', v_atual, 'periodo', v_periodo
    );
  END IF;

  v_limite := CASE
    WHEN p_plano_id = 'negocio' THEN 500
    ELSE 50
  END;

  SELECT requests_count INTO v_anterior
  FROM public.ai_usage_quotas
  WHERE user_id = p_user_id AND periodo = v_periodo;

  v_anterior := COALESCE(v_anterior, 0);

  IF v_anterior >= v_limite THEN
    RETURN jsonb_build_object(
      'allowed', false, 'unlimited', false,
      'requests_used', v_anterior, 'limit', v_limite, 'periodo', v_periodo
    );
  END IF;

  INSERT INTO public.ai_usage_quotas (user_id, periodo, requests_count)
  VALUES (p_user_id, v_periodo, 1)
  ON CONFLICT (user_id, periodo)
  DO UPDATE SET requests_count = ai_usage_quotas.requests_count + 1,
                updated_at = now()
  RETURNING requests_count INTO v_atual;

  IF v_atual > v_limite THEN
    -- corrida concorrente: estourou. Reverter incremento.
    UPDATE public.ai_usage_quotas
    SET requests_count = requests_count - 1
    WHERE user_id = p_user_id AND periodo = v_periodo;
    RETURN jsonb_build_object(
      'allowed', false, 'unlimited', false,
      'requests_used', v_limite, 'limit', v_limite, 'periodo', v_periodo
    );
  END IF;

  RETURN jsonb_build_object(
    'allowed', true, 'unlimited', false,
    'requests_used', v_atual, 'limit', v_limite, 'periodo', v_periodo
  );
END;
$$;

REVOKE ALL ON FUNCTION public.check_and_increment_ai_quota(uuid, text) FROM public, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.check_and_increment_ai_quota(uuid, text) TO service_role;

CREATE OR REPLACE FUNCTION public.record_ai_tokens(
  p_user_id uuid,
  p_tokens_in integer,
  p_tokens_out integer
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_periodo text := to_char(now(), 'YYYY-MM');
BEGIN
  UPDATE public.ai_usage_quotas
  SET tokens_in = tokens_in + COALESCE(p_tokens_in, 0),
      tokens_out = tokens_out + COALESCE(p_tokens_out, 0),
      updated_at = now()
  WHERE user_id = p_user_id AND periodo = v_periodo;
END;
$$;

REVOKE ALL ON FUNCTION public.record_ai_tokens(uuid, integer, integer) FROM public, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.record_ai_tokens(uuid, integer, integer) TO service_role;
