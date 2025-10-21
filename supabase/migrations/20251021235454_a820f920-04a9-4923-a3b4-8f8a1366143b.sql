-- ==========================================
-- TABELA DE COMPROVANTES DE PAGAMENTO
-- ==========================================

-- Tabela de Comprovantes
CREATE TABLE IF NOT EXISTS contas_receber_comprovantes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pagamento_id UUID NOT NULL REFERENCES contas_receber_pagamentos(id) ON DELETE CASCADE,
  
  arquivo_nome VARCHAR(255) NOT NULL,
  arquivo_url TEXT NOT NULL,
  arquivo_tamanho INTEGER,
  arquivo_tipo VARCHAR(100),
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_comprovantes_pagamento ON contas_receber_comprovantes(pagamento_id);

ALTER TABLE contas_receber_comprovantes ENABLE ROW LEVEL SECURITY;

-- Policies para comprovantes
CREATE POLICY "Users can view own comprovantes" 
  ON contas_receber_comprovantes FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM contas_receber_pagamentos pag
      INNER JOIN contas_receber_parcelas par ON par.id = pag.parcela_id
      INNER JOIN contas_receber c ON c.id = par.conta_receber_id
      WHERE pag.id = contas_receber_comprovantes.pagamento_id 
      AND c.usuario_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own comprovantes" 
  ON contas_receber_comprovantes FOR INSERT 
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM contas_receber_pagamentos pag
      INNER JOIN contas_receber_parcelas par ON par.id = pag.parcela_id
      INNER JOIN contas_receber c ON c.id = par.conta_receber_id
      WHERE pag.id = contas_receber_comprovantes.pagamento_id 
      AND c.usuario_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete own comprovantes" 
  ON contas_receber_comprovantes FOR DELETE 
  USING (
    EXISTS (
      SELECT 1 FROM contas_receber_pagamentos pag
      INNER JOIN contas_receber_parcelas par ON par.id = pag.parcela_id
      INNER JOIN contas_receber c ON c.id = par.conta_receber_id
      WHERE pag.id = contas_receber_comprovantes.pagamento_id 
      AND c.usuario_id = auth.uid()
    )
  );

-- ==========================================
-- STORAGE BUCKET PARA COMPROVANTES
-- ==========================================

-- Criar bucket para comprovantes (privado)
INSERT INTO storage.buckets (id, name, public)
VALUES ('comprovantes-pagamento', 'comprovantes-pagamento', false)
ON CONFLICT (id) DO NOTHING;

-- Políticas de storage para comprovantes
CREATE POLICY "Users can upload own comprovantes"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'comprovantes-pagamento' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can view own comprovantes"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'comprovantes-pagamento' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can delete own comprovantes"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'comprovantes-pagamento' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );