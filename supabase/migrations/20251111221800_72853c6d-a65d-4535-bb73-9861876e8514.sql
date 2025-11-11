-- Ajustar função para manter status "atrasado" em contas vencidas com pagamentos parciais
CREATE OR REPLACE FUNCTION public.atualizar_parcela_apos_pagamento()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_total_pago NUMERIC;
  v_valor_parcela NUMERIC;
  v_ultimo_pagamento DATE;
  v_data_vencimento DATE;
BEGIN
  -- Calcular total pago (soma apenas pagamentos NÃO estornados)
  SELECT COALESCE(SUM(valor_pago + COALESCE(juros, 0) - COALESCE(desconto, 0)), 0)
  INTO v_total_pago
  FROM contas_receber_pagamentos
  WHERE parcela_id = COALESCE(NEW.parcela_id, OLD.parcela_id)
    AND (estornado = false OR estornado IS NULL);
  
  -- Buscar valor da parcela e vencimento
  SELECT valor_parcela, data_vencimento
  INTO v_valor_parcela, v_data_vencimento
  FROM contas_receber_parcelas
  WHERE id = COALESCE(NEW.parcela_id, OLD.parcela_id);
  
  -- Buscar data do último pagamento não estornado
  SELECT MAX(data_pagamento)
  INTO v_ultimo_pagamento
  FROM contas_receber_pagamentos
  WHERE parcela_id = COALESCE(NEW.parcela_id, OLD.parcela_id)
    AND (estornado = false OR estornado IS NULL);
  
  -- Atualizar parcela
  UPDATE contas_receber_parcelas
  SET 
    valor_pago = v_total_pago,
    data_pagamento = v_ultimo_pagamento,
    status = CASE
      -- Totalmente paga
      WHEN v_total_pago >= v_valor_parcela THEN
        CASE 
          WHEN v_ultimo_pagamento < v_data_vencimento THEN 'adiantado'
          ELSE 'pago'
        END
      -- Pagamento parcial E vencida → ATRASADO
      WHEN v_total_pago > 0 AND v_data_vencimento < CURRENT_DATE THEN 'atrasado'
      -- Pagamento parcial E não vencida → PAGAMENTO PARCIAL
      WHEN v_total_pago > 0 THEN 'pagamento_parcial'
      -- Sem pagamento E vencida → ATRASADO
      WHEN v_data_vencimento < CURRENT_DATE THEN 'atrasado'
      -- Sem pagamento E não vencida → ABERTO
      ELSE 'aberto'
    END
  WHERE id = COALESCE(NEW.parcela_id, OLD.parcela_id);
  
  RETURN COALESCE(NEW, OLD);
END;
$function$;