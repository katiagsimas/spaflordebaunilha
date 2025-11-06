-- Adicionar campo de percentual de lucro selecionado na tabela planejamento_vendas
ALTER TABLE planejamento_vendas 
ADD COLUMN IF NOT EXISTS pct_lucro_selecionado NUMERIC(5,2) CHECK (pct_lucro_selecionado IN (35, 45, 50));

COMMENT ON COLUMN planejamento_vendas.pct_lucro_selecionado IS 'Percentual de lucro selecionado: 35%, 45% ou 50%';