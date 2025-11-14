-- Criar função para atualizar status de parcelas de contas a pagar
CREATE OR REPLACE FUNCTION public.trigger_atualizar_status_parcela_pagar()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Se tem data de pagamento
  IF NEW.data_pagamento IS NOT NULL THEN
    IF NEW.valor_pago >= NEW.valor_parcela THEN
      -- Verifica se estava atrasada quando foi paga
      IF NEW.data_pagamento > NEW.data_vencimento THEN
        NEW.status := 'pago_em_atraso';
      ELSIF NEW.data_pagamento < NEW.data_vencimento THEN
        NEW.status := 'adiantado';
      ELSE
        NEW.status := 'pago';
      END IF;
    ELSIF NEW.valor_pago > 0 THEN
      NEW.status := 'pagamento_parcial';
    END IF;
  -- Se não tem pagamento, verifica se está vencida
  ELSIF NEW.status = 'aberto' AND NEW.data_vencimento < CURRENT_DATE THEN
    NEW.status := 'atrasado';
  END IF;
  
  RETURN NEW;
END;
$$;

-- Criar trigger para atualizar status antes de inserir/atualizar
DROP TRIGGER IF EXISTS trg_atualizar_status_parcela_pagar ON contas_pagar_parcelas;

CREATE TRIGGER trg_atualizar_status_parcela_pagar
  BEFORE INSERT OR UPDATE ON contas_pagar_parcelas
  FOR EACH ROW
  EXECUTE FUNCTION trigger_atualizar_status_parcela_pagar();

-- Atualizar parcelas existentes que estão vencidas
UPDATE contas_pagar_parcelas
SET status = 'atrasado'
WHERE status = 'aberto'
  AND data_vencimento < CURRENT_DATE
  AND (data_pagamento IS NULL OR valor_pago < valor_parcela);