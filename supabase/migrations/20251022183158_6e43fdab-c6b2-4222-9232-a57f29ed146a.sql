-- Criar tabela contas_pagar_pagamentos
CREATE TABLE IF NOT EXISTS public.contas_pagar_pagamentos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parcela_id UUID NOT NULL,
  data_pagamento DATE NOT NULL,
  valor_pago NUMERIC NOT NULL DEFAULT 0,
  juros NUMERIC DEFAULT 0,
  desconto NUMERIC DEFAULT 0,
  banco_id UUID NOT NULL,
  tipo_documento_id UUID NOT NULL,
  observacao TEXT,
  estornado BOOLEAN DEFAULT false,
  data_estorno TIMESTAMP WITH TIME ZONE,
  motivo_estorno TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.contas_pagar_pagamentos ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own pagamentos_pagar" 
ON public.contas_pagar_pagamentos
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM contas_pagar_parcelas p
    JOIN contas_pagar c ON c.id = p.conta_pagar_id
    WHERE p.id = contas_pagar_pagamentos.parcela_id
    AND c.usuario_id = auth.uid()
  )
);

CREATE POLICY "Users can insert own pagamentos_pagar" 
ON public.contas_pagar_pagamentos
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM contas_pagar_parcelas p
    JOIN contas_pagar c ON c.id = p.conta_pagar_id
    WHERE p.id = contas_pagar_pagamentos.parcela_id
    AND c.usuario_id = auth.uid()
  )
);

CREATE POLICY "Users can update own pagamentos_pagar" 
ON public.contas_pagar_pagamentos
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM contas_pagar_parcelas p
    JOIN contas_pagar c ON c.id = p.conta_pagar_id
    WHERE p.id = contas_pagar_pagamentos.parcela_id
    AND c.usuario_id = auth.uid()
  )
);

CREATE POLICY "Users can delete own pagamentos_pagar" 
ON public.contas_pagar_pagamentos
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM contas_pagar_parcelas p
    JOIN contas_pagar c ON c.id = p.conta_pagar_id
    WHERE p.id = contas_pagar_pagamentos.parcela_id
    AND c.usuario_id = auth.uid()
  )
);

-- Criar tabela contas_pagar_comprovantes
CREATE TABLE IF NOT EXISTS public.contas_pagar_comprovantes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pagamento_id UUID NOT NULL REFERENCES public.contas_pagar_pagamentos(id) ON DELETE CASCADE,
  nome_arquivo VARCHAR NOT NULL,
  tipo_arquivo VARCHAR,
  tamanho_bytes INTEGER,
  url_storage TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.contas_pagar_comprovantes ENABLE ROW LEVEL SECURITY;

-- RLS Policies para comprovantes
CREATE POLICY "Users can view own comprovantes_pagar" 
ON public.contas_pagar_comprovantes
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM contas_pagar_pagamentos pag
    JOIN contas_pagar_parcelas par ON par.id = pag.parcela_id
    JOIN contas_pagar c ON c.id = par.conta_pagar_id
    WHERE pag.id = contas_pagar_comprovantes.pagamento_id
    AND c.usuario_id = auth.uid()
  )
);

CREATE POLICY "Users can insert own comprovantes_pagar" 
ON public.contas_pagar_comprovantes
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM contas_pagar_pagamentos pag
    JOIN contas_pagar_parcelas par ON par.id = pag.parcela_id
    JOIN contas_pagar c ON c.id = par.conta_pagar_id
    WHERE pag.id = contas_pagar_comprovantes.pagamento_id
    AND c.usuario_id = auth.uid()
  )
);

CREATE POLICY "Users can delete own comprovantes_pagar" 
ON public.contas_pagar_comprovantes
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM contas_pagar_pagamentos pag
    JOIN contas_pagar_parcelas par ON par.id = pag.parcela_id
    JOIN contas_pagar c ON c.id = par.conta_pagar_id
    WHERE pag.id = contas_pagar_comprovantes.pagamento_id
    AND c.usuario_id = auth.uid()
  )
);

-- Função para atualizar parcela após pagamento
CREATE OR REPLACE FUNCTION public.atualizar_parcela_pagar_apos_pagamento()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  v_total_pago NUMERIC;
  v_valor_parcela NUMERIC;
  v_ultimo_pagamento DATE;
  v_data_vencimento DATE;
BEGIN
  -- Calcular total pago (soma apenas pagamentos NÃO estornados)
  SELECT COALESCE(SUM(valor_pago + COALESCE(juros, 0) - COALESCE(desconto, 0)), 0)
  INTO v_total_pago
  FROM contas_pagar_pagamentos
  WHERE parcela_id = COALESCE(NEW.parcela_id, OLD.parcela_id)
    AND (estornado = false OR estornado IS NULL);
  
  -- Buscar valor da parcela e vencimento
  SELECT valor_parcela, data_vencimento
  INTO v_valor_parcela, v_data_vencimento
  FROM contas_pagar_parcelas
  WHERE id = COALESCE(NEW.parcela_id, OLD.parcela_id);
  
  -- Buscar data do último pagamento não estornado
  SELECT MAX(data_pagamento)
  INTO v_ultimo_pagamento
  FROM contas_pagar_pagamentos
  WHERE parcela_id = COALESCE(NEW.parcela_id, OLD.parcela_id)
    AND (estornado = false OR estornado IS NULL);
  
  -- Atualizar parcela
  UPDATE contas_pagar_parcelas
  SET 
    valor_pago = v_total_pago,
    data_pagamento = v_ultimo_pagamento,
    status = CASE
      WHEN v_total_pago >= v_valor_parcela THEN 'pago'
      WHEN v_total_pago > 0 THEN 'pagamento_parcial'
      WHEN v_data_vencimento < CURRENT_DATE THEN 'atrasado'
      ELSE 'aberto'
    END
  WHERE id = COALESCE(NEW.parcela_id, OLD.parcela_id);
  
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Trigger para atualizar parcela após insert/update/delete de pagamento
DROP TRIGGER IF EXISTS trigger_atualizar_parcela_pagar ON contas_pagar_pagamentos;
CREATE TRIGGER trigger_atualizar_parcela_pagar
AFTER INSERT OR UPDATE OR DELETE ON contas_pagar_pagamentos
FOR EACH ROW
EXECUTE FUNCTION public.atualizar_parcela_pagar_apos_pagamento();