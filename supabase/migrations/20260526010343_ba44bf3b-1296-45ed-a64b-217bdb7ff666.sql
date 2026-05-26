
CREATE OR REPLACE FUNCTION public.fechar_mes(
  p_fechamento_id uuid,
  p_observacoes   text,
  p_snapshot      jsonb,
  p_faturamento         numeric,
  p_custos              numeric,
  p_margem_seguranca    numeric,
  p_pro_labore_saudavel numeric,
  p_retiradas           numeric,
  p_saldo_restante      numeric
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_owner_group uuid;
  v_status      text;
  v_pendentes   int;
BEGIN
  -- 1. Carrega fechamento + valida existência
  SELECT owner_group_id, status
    INTO v_owner_group, v_status
  FROM public.fechamentos_mensais
  WHERE id = p_fechamento_id;

  IF v_owner_group IS NULL THEN
    RAISE EXCEPTION 'Fechamento não encontrado'
      USING ERRCODE = 'P0003';
  END IF;

  -- 2. Autorização: usuário deve pertencer ao grupo do fechamento
  IF NOT public.user_belongs_to_group(auth.uid(), v_owner_group) THEN
    RAISE EXCEPTION 'Acesso negado'
      USING ERRCODE = 'P0001';
  END IF;

  -- 3. Já fechado? idempotência defensiva
  IF v_status = 'fechado' THEN
    RAISE EXCEPTION 'Este mês já está fechado'
      USING ERRCODE = 'P0004';
  END IF;

  -- 4. Conta pendências do checklist (regra que estava no cliente)
  SELECT count(*)
    INTO v_pendentes
  FROM public.fechamento_checklist_itens
  WHERE fechamento_id = p_fechamento_id
    AND concluido = false;

  IF v_pendentes > 0 THEN
    RAISE EXCEPTION 'Existem % item(ns) do checklist pendente(s). Conclua todos antes de fechar o mês.', v_pendentes
      USING ERRCODE = 'P0002';
  END IF;

  -- 5. Grava o fechamento
  UPDATE public.fechamentos_mensais
  SET status              = 'fechado',
      fechado_em          = now(),
      fechado_por         = auth.uid(),
      observacoes         = p_observacoes,
      snapshot            = COALESCE(p_snapshot, '{}'::jsonb),
      faturamento         = COALESCE(p_faturamento, 0),
      custos              = COALESCE(p_custos, 0),
      margem_seguranca    = COALESCE(p_margem_seguranca, 0),
      pro_labore_saudavel = COALESCE(p_pro_labore_saudavel, 0),
      retiradas           = COALESCE(p_retiradas, 0),
      saldo_restante      = COALESCE(p_saldo_restante, 0),
      updated_at          = now()
  WHERE id = p_fechamento_id;

  -- 6. Log
  INSERT INTO public.fechamento_logs (fechamento_id, owner_group_id, acao, motivo, snapshot, usuario_id)
  VALUES (p_fechamento_id, v_owner_group, 'fechado', p_observacoes, COALESCE(p_snapshot, '{}'::jsonb), auth.uid());
END;
$$;

REVOKE ALL ON FUNCTION public.fechar_mes(uuid, text, jsonb, numeric, numeric, numeric, numeric, numeric, numeric) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.fechar_mes(uuid, text, jsonb, numeric, numeric, numeric, numeric, numeric, numeric) TO authenticated;
