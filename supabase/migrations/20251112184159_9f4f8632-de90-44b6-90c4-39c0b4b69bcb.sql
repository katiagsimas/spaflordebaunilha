-- Atualizar trigger para aceitar todos os status incluindo 'pago_em_atraso'
CREATE OR REPLACE FUNCTION public.trigger_atualizar_status_parcela()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
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
  ELSIF NEW.status = 'aberto' AND NEW.data_vencimento < CURRENT_DATE THEN
    NEW.status := 'atrasado';
  END IF;
  
  RETURN NEW;
END;
$function$;