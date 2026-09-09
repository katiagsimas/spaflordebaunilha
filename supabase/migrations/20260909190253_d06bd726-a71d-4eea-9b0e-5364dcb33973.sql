CREATE OR REPLACE FUNCTION public.atualizar_parcela_pagar_apos_pagamento()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_total_pago NUMERIC;
  v_total_juros NUMERIC;
  v_total_desconto NUMERIC;
  v_valor_parcela NUMERIC;
  v_ultimo_pagamento DATE;
  v_data_vencimento DATE;
BEGIN
  SELECT COALESCE(SUM(valor_pago), 0),
         COALESCE(SUM(COALESCE(juros, 0)), 0),
         COALESCE(SUM(COALESCE(desconto, 0)), 0),
         MAX(data_pagamento)
  INTO v_total_pago, v_total_juros, v_total_desconto, v_ultimo_pagamento
  FROM contas_pagar_pagamentos
  WHERE parcela_id = COALESCE(NEW.parcela_id, OLD.parcela_id)
    AND (estornado = false OR estornado IS NULL);

  SELECT valor_parcela, data_vencimento
  INTO v_valor_parcela, v_data_vencimento
  FROM contas_pagar_parcelas
  WHERE id = COALESCE(NEW.parcela_id, OLD.parcela_id);

  UPDATE contas_pagar_parcelas
  SET
    valor_pago = v_total_pago,
    juros = v_total_juros,
    desconto = v_total_desconto,
    data_pagamento = v_ultimo_pagamento,
    status = CASE
      WHEN v_total_pago >= (v_valor_parcela - 0.005) THEN 'pago'
      WHEN v_total_pago > 0 THEN 'pagamento_parcial'
      WHEN v_data_vencimento < CURRENT_DATE THEN 'atrasado'
      ELSE 'aberto'
    END
  WHERE id = COALESCE(NEW.parcela_id, OLD.parcela_id);

  RETURN COALESCE(NEW, OLD);
END;
$$;

CREATE OR REPLACE FUNCTION public.atualizar_parcela_apos_pagamento()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_parcela_id UUID;
  v_total_pago NUMERIC;
  v_total_juros NUMERIC;
  v_total_desconto NUMERIC;
  v_valor_parcela NUMERIC;
  v_data_vencimento DATE;
  v_ultimo_pagamento DATE;
  novo_status TEXT;
BEGIN
  v_parcela_id := COALESCE(NEW.parcela_id, OLD.parcela_id);

  SELECT COALESCE(SUM(valor_pago), 0),
         COALESCE(SUM(COALESCE(juros, 0)), 0),
         COALESCE(SUM(COALESCE(desconto, 0)), 0),
         MAX(data_pagamento)
  INTO v_total_pago, v_total_juros, v_total_desconto, v_ultimo_pagamento
  FROM contas_receber_pagamentos
  WHERE parcela_id = v_parcela_id
    AND (estornado = false OR estornado IS NULL);

  SELECT valor_parcela, data_vencimento
  INTO v_valor_parcela, v_data_vencimento
  FROM contas_receber_parcelas
  WHERE id = v_parcela_id;

  IF v_total_pago >= (v_valor_parcela - 0.005) THEN
    IF v_ultimo_pagamento > v_data_vencimento THEN
      novo_status := 'pago_em_atraso';
    ELSIF v_ultimo_pagamento < v_data_vencimento THEN
      novo_status := 'adiantado';
    ELSE
      novo_status := 'pago';
    END IF;
  ELSIF v_total_pago > 0 THEN
    novo_status := CASE WHEN v_data_vencimento < CURRENT_DATE THEN 'atrasado' ELSE 'pagamento_parcial' END;
  ELSE
    novo_status := CASE WHEN v_data_vencimento < CURRENT_DATE THEN 'atrasado' ELSE 'aberto' END;
  END IF;

  UPDATE contas_receber_parcelas
  SET
    status = novo_status,
    valor_pago = v_total_pago,
    valor_recebido = v_total_pago,
    juros = v_total_juros,
    desconto = v_total_desconto,
    data_pagamento = CASE WHEN novo_status IN ('pago', 'pago_em_atraso', 'adiantado') THEN v_ultimo_pagamento ELSE data_pagamento END,
    data_recebimento = CASE WHEN novo_status IN ('pago', 'pago_em_atraso', 'adiantado') THEN v_ultimo_pagamento ELSE data_recebimento END
  WHERE id = v_parcela_id;

  RETURN COALESCE(NEW, OLD);
END;
$$;