-- Atualizar função para criar status "pago_em_atraso" quando parcela atrasada é paga
CREATE OR REPLACE FUNCTION atualizar_parcela_apos_pagamento()
RETURNS TRIGGER AS $$
DECLARE
  total_pago NUMERIC;
  valor_restante NUMERIC;
  novo_status TEXT;
  estava_atrasada BOOLEAN;
BEGIN
  -- Calcula o total pago para a parcela
  SELECT COALESCE(SUM(valor_pago), 0)
  INTO total_pago
  FROM contas_receber_pagamentos
  WHERE parcela_id = NEW.parcela_id;

  -- Calcula o valor restante
  SELECT (valor_parcela - total_pago)
  INTO valor_restante
  FROM contas_receber_parcelas
  WHERE id = NEW.parcela_id;

  -- Verifica se a parcela estava atrasada antes do pagamento
  SELECT (data_vencimento < NEW.data_pagamento::DATE)
  INTO estava_atrasada
  FROM contas_receber_parcelas
  WHERE id = NEW.parcela_id;

  -- Define o novo status baseado nas condições
  IF valor_restante <= 0 THEN
    -- Parcela totalmente paga
    IF estava_atrasada THEN
      novo_status := 'pago_em_atraso';
    ELSIF NEW.data_pagamento::DATE < (SELECT data_vencimento FROM contas_receber_parcelas WHERE id = NEW.parcela_id) THEN
      novo_status := 'adiantado';
    ELSE
      novo_status := 'pago';
    END IF;
  ELSIF total_pago > 0 THEN
    -- Pagamento parcial
    SELECT 
      CASE 
        WHEN data_vencimento < CURRENT_DATE THEN 'atrasado'
        ELSE 'pagamento_parcial'
      END
    INTO novo_status
    FROM contas_receber_parcelas
    WHERE id = NEW.parcela_id;
  ELSE
    -- Sem pagamento
    SELECT 
      CASE 
        WHEN data_vencimento < CURRENT_DATE THEN 'atrasado'
        ELSE 'aberto'
      END
    INTO novo_status
    FROM contas_receber_parcelas
    WHERE id = NEW.parcela_id;
  END IF;

  -- Atualiza o status e data de pagamento da parcela
  UPDATE contas_receber_parcelas
  SET 
    status = novo_status,
    data_pagamento = CASE 
      WHEN novo_status IN ('pago', 'pago_em_atraso', 'adiantado') THEN NEW.data_pagamento::DATE
      ELSE data_pagamento
    END
  WHERE id = NEW.parcela_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;