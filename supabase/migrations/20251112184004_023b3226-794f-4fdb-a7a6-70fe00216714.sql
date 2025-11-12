-- Remover constraint antiga e criar nova incluindo 'pago_em_atraso'
ALTER TABLE contas_receber_parcelas 
DROP CONSTRAINT IF EXISTS "contas-receber-parcelas-status_check";

ALTER TABLE contas_receber_parcelas
ADD CONSTRAINT "contas-receber-parcelas-status_check" 
CHECK (status IN ('aberto', 'pago', 'atrasado', 'pagamento_parcial', 'adiantado', 'pago_em_atraso'));