-- Remove a constraint de validação do tempo_preparo que não é mais necessária
ALTER TABLE pre_preparos DROP CONSTRAINT IF EXISTS pre_preparos_tempo_preparo_check;