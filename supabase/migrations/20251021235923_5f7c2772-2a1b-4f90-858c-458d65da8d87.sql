-- ==========================================
-- PARTE 1: ESTRUTURA COMPLETA DO BANCO
-- ==========================================

-- ==========================================
-- 1. ATUALIZAR PARCELAS: Adicionar campos
-- ==========================================
ALTER TABLE contas_receber_parcelas
ADD COLUMN IF NOT EXISTS observacao_interna TEXT,
ADD COLUMN IF NOT EXISTS tags TEXT[];

COMMENT ON COLUMN contas_receber_parcelas.observacao_interna IS 'Observações internas da parcela';
COMMENT ON COLUMN contas_receber_parcelas.tags IS 'Array de tags/etiquetas';

-- ==========================================
-- 2. ATUALIZAR PAGAMENTOS: Adicionar campos
-- ==========================================
ALTER TABLE contas_receber_pagamentos
ADD COLUMN IF NOT EXISTS juros NUMERIC(15,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS desconto NUMERIC(15,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS estornado BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS data_estorno TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS motivo_estorno TEXT;

COMMENT ON COLUMN contas_receber_pagamentos.juros IS 'Valor de juros aplicado';
COMMENT ON COLUMN contas_receber_pagamentos.desconto IS 'Valor de desconto aplicado';
COMMENT ON COLUMN contas_receber_pagamentos.estornado IS 'Se o pagamento foi estornado';
COMMENT ON COLUMN contas_receber_pagamentos.data_estorno IS 'Data/hora do estorno';
COMMENT ON COLUMN contas_receber_pagamentos.motivo_estorno IS 'Motivo do estorno';

CREATE INDEX IF NOT EXISTS idx_pagamentos_estornado ON contas_receber_pagamentos(estornado);

-- ==========================================
-- 3. ATUALIZAR TABELA DE COMPROVANTES (já existente)
-- ==========================================
-- Renomear colunas para padronizar com o código fornecido
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'contas_receber_comprovantes' AND column_name = 'arquivo_nome') THEN
    ALTER TABLE contas_receber_comprovantes RENAME COLUMN arquivo_nome TO nome_arquivo;
    ALTER TABLE contas_receber_comprovantes RENAME COLUMN arquivo_url TO url_storage;
    ALTER TABLE contas_receber_comprovantes RENAME COLUMN arquivo_tamanho TO tamanho_bytes;
    ALTER TABLE contas_receber_comprovantes RENAME COLUMN arquivo_tipo TO tipo_arquivo;
  END IF;
END $$;

-- ==========================================
-- 4. CRIAR TABELA: Tags/Etiquetas
-- ==========================================
CREATE TABLE IF NOT EXISTS tags_contas_receber (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  
  nome VARCHAR(50) NOT NULL,
  cor VARCHAR(7) NOT NULL DEFAULT '#3B82F6',
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT unique_tag_por_user UNIQUE (usuario_id, nome)
);

CREATE INDEX IF NOT EXISTS idx_tags_user ON tags_contas_receber(usuario_id);

ALTER TABLE tags_contas_receber ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own tags" 
  ON tags_contas_receber FOR ALL
  USING (auth.uid() = usuario_id)
  WITH CHECK (auth.uid() = usuario_id);

COMMENT ON TABLE tags_contas_receber IS 'Tags/etiquetas para categorizar contas';

-- ==========================================
-- 5. ATUALIZAR/CRIAR TRIGGER: Considerar estornos
-- ==========================================
DROP TRIGGER IF EXISTS trigger_atualizar_parcela_pagamento ON contas_receber_pagamentos;

CREATE OR REPLACE FUNCTION atualizar_parcela_apos_pagamento()
RETURNS TRIGGER AS $$
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
      WHEN v_total_pago >= v_valor_parcela THEN
        CASE 
          WHEN v_ultimo_pagamento < v_data_vencimento THEN 'adiantado'
          ELSE 'pago'
        END
      WHEN v_total_pago > 0 THEN 'pagamento_parcial'
      WHEN v_data_vencimento < CURRENT_DATE THEN 'atrasado'
      ELSE 'aberto'
    END
  WHERE id = COALESCE(NEW.parcela_id, OLD.parcela_id);
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_atualizar_parcela_pagamento
  AFTER INSERT OR UPDATE OR DELETE ON contas_receber_pagamentos
  FOR EACH ROW
  EXECUTE FUNCTION atualizar_parcela_apos_pagamento();

-- ==========================================
-- 6. FUNÇÃO: Calcular juros por atraso
-- ==========================================
CREATE OR REPLACE FUNCTION calcular_juros_atraso(
  p_valor_parcela NUMERIC,
  p_data_vencimento DATE,
  p_data_pagamento DATE,
  p_taxa_juros_dia NUMERIC DEFAULT 0.033
)
RETURNS NUMERIC AS $$
DECLARE
  v_dias_atraso INTEGER;
  v_juros NUMERIC;
BEGIN
  -- Calcular dias de atraso
  v_dias_atraso := GREATEST(0, p_data_pagamento - p_data_vencimento);
  
  -- Calcular juros (taxa padrão: 1% ao mês = 0.033% ao dia)
  IF v_dias_atraso > 0 THEN
    v_juros := p_valor_parcela * (p_taxa_juros_dia / 100) * v_dias_atraso;
    RETURN ROUND(v_juros, 2);
  ELSE
    RETURN 0;
  END IF;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION calcular_juros_atraso IS 'Calcula juros por atraso (padrão 1% ao mês)';

-- ==========================================
-- 7. VIEW ATUALIZADA: Com novos campos
-- ==========================================
CREATE OR REPLACE VIEW vw_contas_receber_dashboard AS
SELECT 
  c.usuario_id,
  
  -- Total a receber (parcelas em aberto)
  COALESCE(SUM(
    CASE 
      WHEN p.status IN ('aberto', 'atrasado', 'pagamento_parcial') 
      THEN p.valor_parcela - COALESCE(p.valor_pago, 0)
      ELSE 0 
    END
  ), 0) AS total_a_receber,
  
  -- Total recebido
  COALESCE(SUM(
    CASE 
      WHEN p.status IN ('pago', 'adiantado') 
      THEN p.valor_pago
      WHEN p.status = 'pagamento_parcial'
      THEN p.valor_pago
      ELSE 0 
    END
  ), 0) AS total_recebido,
  
  -- Total em atraso
  COALESCE(SUM(
    CASE 
      WHEN p.status = 'atrasado' 
      THEN p.valor_parcela - COALESCE(p.valor_pago, 0)
      ELSE 0 
    END
  ), 0) AS total_atrasado,
  
  -- Vencendo hoje
  COALESCE(SUM(
    CASE 
      WHEN p.data_vencimento = CURRENT_DATE AND p.status IN ('aberto', 'pagamento_parcial')
      THEN p.valor_parcela - COALESCE(p.valor_pago, 0)
      ELSE 0 
    END
  ), 0) AS vencendo_hoje,
  
  -- Contadores
  COUNT(DISTINCT CASE WHEN p.status IN ('aberto', 'atrasado', 'pagamento_parcial') THEN p.id END) AS parcelas_abertas,
  COUNT(DISTINCT CASE WHEN p.status = 'atrasado' THEN p.id END) AS parcelas_atrasadas,
  COUNT(DISTINCT CASE WHEN p.status IN ('pago', 'adiantado') THEN p.id END) AS parcelas_pagas
  
FROM contas_receber c
INNER JOIN contas_receber_parcelas p ON p.conta_receber_id = c.id
GROUP BY c.usuario_id;

COMMENT ON VIEW vw_contas_receber_dashboard IS 'Dados para dashboard de contas a receber';

-- ==========================================
-- 8. BUCKET STORAGE: Atualizar nome do bucket
-- ==========================================
-- Atualizar nome do bucket para 'comprovantes-receber'
UPDATE storage.buckets 
SET name = 'comprovantes-receber'
WHERE id = 'comprovantes-pagamento';

UPDATE storage.buckets
SET id = 'comprovantes-receber'
WHERE id = 'comprovantes-pagamento';