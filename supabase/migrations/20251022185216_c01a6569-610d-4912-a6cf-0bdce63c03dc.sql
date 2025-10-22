-- ==========================================
-- TABELA: saldos_iniciais_bancos
-- ==========================================
CREATE TABLE IF NOT EXISTS saldos_iniciais_bancos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  banco_id UUID NOT NULL REFERENCES bancos(id) ON DELETE CASCADE,
  
  mes_referencia INTEGER NOT NULL CHECK (mes_referencia >= 1 AND mes_referencia <= 12),
  ano_referencia INTEGER NOT NULL CHECK (ano_referencia >= 2000),
  saldo_inicial NUMERIC(15,2) NOT NULL DEFAULT 0,
  
  observacao TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT unique_saldo_banco_mes_ano UNIQUE (user_id, banco_id, mes_referencia, ano_referencia)
);

CREATE INDEX IF NOT EXISTS idx_saldos_iniciais_user ON saldos_iniciais_bancos(user_id);
CREATE INDEX IF NOT EXISTS idx_saldos_iniciais_banco ON saldos_iniciais_bancos(banco_id);
CREATE INDEX IF NOT EXISTS idx_saldos_iniciais_periodo ON saldos_iniciais_bancos(mes_referencia, ano_referencia);

ALTER TABLE saldos_iniciais_bancos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own saldos_iniciais"
  ON saldos_iniciais_bancos FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER update_saldos_iniciais_updated_at
  BEFORE UPDATE ON saldos_iniciais_bancos
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

COMMENT ON TABLE saldos_iniciais_bancos IS 'Saldos iniciais dos bancos por mês/ano para cálculo do fluxo de caixa';

-- ==========================================
-- VIEW: Resumo Financeiro
-- ==========================================
CREATE OR REPLACE VIEW vw_resumo_financeiro AS
WITH periodo_atual AS (
  SELECT 
    EXTRACT(MONTH FROM CURRENT_DATE)::INTEGER AS mes,
    EXTRACT(YEAR FROM CURRENT_DATE)::INTEGER AS ano
),
saldos_iniciais AS (
  SELECT 
    s.user_id,
    s.banco_id,
    b.codigo AS banco_codigo,
    b.nome AS banco_nome,
    s.saldo_inicial
  FROM saldos_iniciais_bancos s
  INNER JOIN bancos b ON b.id = s.banco_id
  CROSS JOIN periodo_atual p
  WHERE s.mes_referencia = p.mes
    AND s.ano_referencia = p.ano
),
entradas_mes AS (
  SELECT 
    c.usuario_id AS user_id,
    c.banco_id,
    COALESCE(SUM(pag.valor_pago + COALESCE(pag.juros, 0) - COALESCE(pag.desconto, 0)), 0) AS total_entradas
  FROM contas_receber c
  INNER JOIN contas_receber_parcelas p ON p.conta_receber_id = c.id
  INNER JOIN contas_receber_pagamentos pag ON pag.parcela_id = p.id
  CROSS JOIN periodo_atual per
  WHERE pag.estornado = false
    AND EXTRACT(MONTH FROM pag.data_pagamento) = per.mes
    AND EXTRACT(YEAR FROM pag.data_pagamento) = per.ano
  GROUP BY c.usuario_id, c.banco_id
),
saidas_mes AS (
  SELECT 
    c.usuario_id AS user_id,
    c.banco_id,
    COALESCE(SUM(pag.valor_pago + COALESCE(pag.juros, 0) - COALESCE(pag.desconto, 0)), 0) AS total_saidas
  FROM contas_pagar c
  INNER JOIN contas_pagar_parcelas p ON p.conta_pagar_id = c.id
  INNER JOIN contas_pagar_pagamentos pag ON pag.parcela_id = p.id
  CROSS JOIN periodo_atual per
  WHERE pag.estornado = false
    AND EXTRACT(MONTH FROM pag.data_pagamento) = per.mes
    AND EXTRACT(YEAR FROM pag.data_pagamento) = per.ano
  GROUP BY c.usuario_id, c.banco_id
)
SELECT 
  si.user_id,
  si.banco_id,
  si.banco_codigo,
  si.banco_nome,
  si.saldo_inicial,
  COALESCE(e.total_entradas, 0) AS entradas_mes,
  COALESCE(sa.total_saidas, 0) AS saidas_mes,
  si.saldo_inicial + COALESCE(e.total_entradas, 0) - COALESCE(sa.total_saidas, 0) AS saldo_atual
FROM saldos_iniciais si
LEFT JOIN entradas_mes e ON e.user_id = si.user_id AND e.banco_id = si.banco_id
LEFT JOIN saidas_mes sa ON sa.user_id = si.user_id AND sa.banco_id = si.banco_id;

COMMENT ON VIEW vw_resumo_financeiro IS 'Resumo financeiro por banco com saldos e movimentações do mês';