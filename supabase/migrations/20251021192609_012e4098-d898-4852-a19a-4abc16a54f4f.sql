-- Limpar dados existentes incompatíveis
TRUNCATE TABLE contas_receber_parcelas CASCADE;
TRUNCATE TABLE contas_receber CASCADE;

-- Remover constraint de banco opcional
ALTER TABLE contas_receber 
ALTER COLUMN banco_id SET NOT NULL;

-- Adicionar campo tipo_lancamento
ALTER TABLE contas_receber
ADD COLUMN IF NOT EXISTS tipo_lancamento VARCHAR(20) NOT NULL DEFAULT 'unico' 
CHECK (tipo_lancamento IN ('unico', 'parcelado', 'recorrente'));

COMMENT ON COLUMN contas_receber.tipo_lancamento IS 'Tipo: unico, parcelado ou recorrente';

-- Adicionar novos campos em contas_receber_parcelas
ALTER TABLE contas_receber_parcelas
ADD COLUMN IF NOT EXISTS data_emissao DATE NOT NULL DEFAULT CURRENT_DATE,
ADD COLUMN IF NOT EXISTS valor_total NUMERIC(15,2) NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS valor_pago NUMERIC(15,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS data_pagamento DATE;

-- Atualizar status
ALTER TABLE contas_receber_parcelas
DROP CONSTRAINT IF EXISTS contas_receber_parcelas_status_check;

ALTER TABLE contas_receber_parcelas
ADD CONSTRAINT contas_receber_parcelas_status_check 
CHECK (status IN ('aberto', 'pago', 'pagamento_parcial', 'atrasado', 'adiantado'));

ALTER TABLE contas_receber_parcelas
ALTER COLUMN status SET DEFAULT 'aberto';

COMMENT ON COLUMN contas_receber_parcelas.data_emissao IS 'Data de emissão da parcela (recorrente = dia 01 do mês)';
COMMENT ON COLUMN contas_receber_parcelas.valor_total IS 'Valor total original (parcelado = valor/parcelas, recorrente = valor cheio)';
COMMENT ON COLUMN contas_receber_parcelas.valor_pago IS 'Valor efetivamente pago';
COMMENT ON COLUMN contas_receber_parcelas.data_pagamento IS 'Data do pagamento';

-- Função atualizada
CREATE OR REPLACE FUNCTION trigger_atualizar_status_parcela()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.data_pagamento IS NOT NULL THEN
    IF NEW.valor_pago >= NEW.valor_parcela THEN
      IF NEW.data_pagamento < NEW.data_vencimento THEN
        NEW.status := 'adiantado';
      ELSE
        NEW.status := 'pago';
      END IF;
    ELSIF NEW.valor_pago > 0 THEN
      NEW.status := 'pagamento_parcial';
    END IF;
  ELSIF NEW.status = 'aberto' AND NEW.data_vencimento < CURRENT_DATE THEN
    NEW.status := 'atrasado';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- View completa
CREATE OR REPLACE VIEW vw_contas_receber_parcelas AS
SELECT 
  p.*,
  c.cliente_id,
  c.tipo_documento_id,
  c.plano_conta_id,
  c.banco_id,
  c.tipo_lancamento,
  c.usuario_id AS user_id,
  cli.nome AS cliente_nome,
  td.descricao AS tipo_documento_descricao,
  pc.codigo_estruturado AS plano_contas_codigo,
  pc.descricao AS plano_contas_descricao,
  b.nome AS banco_nome
FROM contas_receber_parcelas p
INNER JOIN contas_receber c ON c.id = p.conta_receber_id
LEFT JOIN clientes cli ON cli.id = c.cliente_id
LEFT JOIN tipos_documento td ON td.id = c.tipo_documento_id
LEFT JOIN plano_contas pc ON pc.id = c.plano_conta_id
LEFT JOIN bancos b ON b.id = c.banco_id;

COMMENT ON VIEW vw_contas_receber_parcelas IS 'View completa de parcelas com todos os dados';