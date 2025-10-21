-- ==========================================
-- MIGRAÇÃO: Sistema de Contas a Receber Completo
-- ==========================================

-- Adicionar colunas necessárias à tabela contas_receber existente
ALTER TABLE contas_receber
ADD COLUMN IF NOT EXISTS numero_parcelas INTEGER NOT NULL DEFAULT 1 CHECK (numero_parcelas > 0),
ADD COLUMN IF NOT EXISTS e_recorrente BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS dia_vencimento_recorrente INTEGER CHECK (dia_vencimento_recorrente >= 1 AND dia_vencimento_recorrente <= 31);

-- ==========================================
-- TABELA: contas_receber_parcelas
-- ==========================================
CREATE TABLE IF NOT EXISTS contas_receber_parcelas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conta_receber_id UUID NOT NULL REFERENCES contas_receber(id) ON DELETE CASCADE,
  
  numero_parcela INTEGER NOT NULL,
  data_vencimento DATE NOT NULL,
  valor_parcela NUMERIC(15,2) NOT NULL CHECK (valor_parcela > 0),
  
  data_recebimento DATE,
  valor_recebido NUMERIC(15,2),
  juros NUMERIC(15,2) DEFAULT 0,
  desconto NUMERIC(15,2) DEFAULT 0,
  
  status VARCHAR(20) NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente', 'recebida', 'vencida', 'cancelada')),
  observacao TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT unique_parcela_por_conta UNIQUE (conta_receber_id, numero_parcela)
);

CREATE INDEX IF NOT EXISTS idx_parcelas_receber_conta ON contas_receber_parcelas(conta_receber_id);
CREATE INDEX IF NOT EXISTS idx_parcelas_receber_vencimento ON contas_receber_parcelas(data_vencimento);
CREATE INDEX IF NOT EXISTS idx_parcelas_receber_status ON contas_receber_parcelas(status);

ALTER TABLE contas_receber_parcelas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own parcelas_receber" 
  ON contas_receber_parcelas FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM contas_receber 
      WHERE contas_receber.id = contas_receber_parcelas.conta_receber_id 
      AND contas_receber.usuario_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own parcelas_receber" 
  ON contas_receber_parcelas FOR INSERT 
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM contas_receber 
      WHERE contas_receber.id = contas_receber_parcelas.conta_receber_id 
      AND contas_receber.usuario_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own parcelas_receber" 
  ON contas_receber_parcelas FOR UPDATE 
  USING (
    EXISTS (
      SELECT 1 FROM contas_receber 
      WHERE contas_receber.id = contas_receber_parcelas.conta_receber_id 
      AND contas_receber.usuario_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete own parcelas_receber" 
  ON contas_receber_parcelas FOR DELETE 
  USING (
    EXISTS (
      SELECT 1 FROM contas_receber 
      WHERE contas_receber.id = contas_receber_parcelas.conta_receber_id 
      AND contas_receber.usuario_id = auth.uid()
    )
  );

CREATE TRIGGER update_parcelas_receber_updated_at 
  BEFORE UPDATE ON contas_receber_parcelas 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

COMMENT ON TABLE contas_receber_parcelas IS 'Parcelas individuais das contas a receber';

-- ==========================================
-- FUNÇÃO: Atualizar status parcelas vencidas
-- ==========================================
CREATE OR REPLACE FUNCTION atualizar_status_parcelas_vencidas()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE contas_receber_parcelas
  SET status = 'vencida'
  WHERE status = 'pendente'
    AND data_vencimento < CURRENT_DATE;
END;
$$;

COMMENT ON FUNCTION atualizar_status_parcelas_vencidas IS 'Atualiza status de parcelas pendentes que venceram';

-- ==========================================
-- TRIGGER: Atualizar status ao inserir/atualizar
-- ==========================================
CREATE OR REPLACE FUNCTION trigger_atualizar_status_parcela()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.data_recebimento IS NOT NULL THEN
    NEW.status := 'recebida';
  ELSIF NEW.status = 'pendente' AND NEW.data_vencimento < CURRENT_DATE THEN
    NEW.status := 'vencida';
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER before_insert_parcela_receber
BEFORE INSERT ON contas_receber_parcelas
FOR EACH ROW EXECUTE FUNCTION trigger_atualizar_status_parcela();

CREATE TRIGGER before_update_parcela_receber
BEFORE UPDATE ON contas_receber_parcelas
FOR EACH ROW EXECUTE FUNCTION trigger_atualizar_status_parcela();