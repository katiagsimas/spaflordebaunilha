-- Criar tabela para histórico de pagamentos parciais
CREATE TABLE IF NOT EXISTS public.contas_receber_pagamentos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  parcela_id UUID NOT NULL REFERENCES public.contas_receber_parcelas(id) ON DELETE CASCADE,
  data_pagamento DATE NOT NULL,
  valor_pago NUMERIC NOT NULL,
  banco_id UUID NOT NULL REFERENCES public.bancos(id),
  tipo_documento_id UUID NOT NULL REFERENCES public.tipos_documento(id),
  observacao TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.contas_receber_pagamentos ENABLE ROW LEVEL SECURITY;

-- Políticas de acesso
CREATE POLICY "Users can view own pagamentos"
ON public.contas_receber_pagamentos
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM contas_receber_parcelas p
    JOIN contas_receber c ON c.id = p.conta_receber_id
    WHERE p.id = contas_receber_pagamentos.parcela_id
    AND c.usuario_id = auth.uid()
  )
);

CREATE POLICY "Users can insert own pagamentos"
ON public.contas_receber_pagamentos
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM contas_receber_parcelas p
    JOIN contas_receber c ON c.id = p.conta_receber_id
    WHERE p.id = contas_receber_pagamentos.parcela_id
    AND c.usuario_id = auth.uid()
  )
);

CREATE POLICY "Users can update own pagamentos"
ON public.contas_receber_pagamentos
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM contas_receber_parcelas p
    JOIN contas_receber c ON c.id = p.conta_receber_id
    WHERE p.id = contas_receber_pagamentos.parcela_id
    AND c.usuario_id = auth.uid()
  )
);

CREATE POLICY "Users can delete own pagamentos"
ON public.contas_receber_pagamentos
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM contas_receber_parcelas p
    JOIN contas_receber c ON c.id = p.conta_receber_id
    WHERE p.id = contas_receber_pagamentos.parcela_id
    AND c.usuario_id = auth.uid()
  )
);

-- Índices para melhor performance
CREATE INDEX idx_pagamentos_parcela ON contas_receber_pagamentos(parcela_id);
CREATE INDEX idx_pagamentos_data ON contas_receber_pagamentos(data_pagamento);