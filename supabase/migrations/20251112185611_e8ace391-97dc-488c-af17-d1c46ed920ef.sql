-- Remover view existente e recriá-la com cálculo correto do valor_pago
DROP VIEW IF EXISTS vw_contas_receber_parcelas CASCADE;

CREATE VIEW vw_contas_receber_parcelas AS
SELECT 
  p.id,
  p.conta_receber_id,
  p.numero_parcela,
  p.data_vencimento,
  p.valor_parcela,
  p.data_recebimento,
  p.valor_recebido,
  p.juros,
  p.desconto,
  p.status,
  p.observacao,
  p.created_at,
  p.updated_at,
  p.data_emissao,
  p.valor_total,
  COALESCE(pagamentos.total_pago, 0) as valor_pago,
  COALESCE(pagamentos.data_pagamento, p.data_pagamento) as data_pagamento,
  c.cliente_id,
  c.tipo_documento_id,
  c.plano_conta_id,
  c.banco_id,
  c.tipo_lancamento,
  c.numero_parcelas,
  c.usuario_id as user_id,
  cl.nome as cliente_nome,
  td.descricao as tipo_documento_descricao,
  pc.codigo_estruturado as plano_contas_codigo,
  pc.descricao as plano_contas_descricao,
  b.nome as banco_nome
FROM contas_receber_parcelas p
LEFT JOIN contas_receber c ON c.id = p.conta_receber_id
LEFT JOIN clientes cl ON cl.id = c.cliente_id
LEFT JOIN tipos_documento td ON td.id = c.tipo_documento_id
LEFT JOIN plano_contas pc ON pc.id = c.plano_conta_id
LEFT JOIN bancos b ON b.id = c.banco_id
LEFT JOIN (
  SELECT 
    parcela_id,
    SUM(valor_pago) as total_pago,
    MAX(data_pagamento) as data_pagamento
  FROM contas_receber_pagamentos
  GROUP BY parcela_id
) pagamentos ON pagamentos.parcela_id = p.id;