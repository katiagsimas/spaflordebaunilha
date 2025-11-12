-- Remover a constraint duplicada e antiga que não inclui 'pago_em_atraso'
ALTER TABLE contas_receber_parcelas 
DROP CONSTRAINT IF EXISTS contas_receber_parcelas_status_check;