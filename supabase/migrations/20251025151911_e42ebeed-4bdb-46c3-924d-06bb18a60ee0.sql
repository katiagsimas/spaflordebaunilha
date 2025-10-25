-- Adicionar campo data_referencia na tabela saldos_iniciais_bancos
ALTER TABLE saldos_iniciais_bancos 
ADD COLUMN IF NOT EXISTS data_referencia DATE;

-- Preencher datas existentes com o primeiro dia do mês de referência
UPDATE saldos_iniciais_bancos 
SET data_referencia = make_date(ano_referencia, mes_referencia, 1)
WHERE data_referencia IS NULL;

-- Tornar o campo obrigatório após preencher dados existentes
ALTER TABLE saldos_iniciais_bancos 
ALTER COLUMN data_referencia SET NOT NULL;

-- Adicionar índice para melhorar performance nas consultas por data
CREATE INDEX IF NOT EXISTS idx_saldos_iniciais_data ON saldos_iniciais_bancos(user_id, data_referencia);