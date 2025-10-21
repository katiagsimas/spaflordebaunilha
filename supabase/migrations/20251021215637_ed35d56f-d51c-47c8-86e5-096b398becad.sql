-- Corrigir view para usar SECURITY INVOKER explicitamente
-- Isso garante que a view execute com as permissões do usuário que a consulta
DROP VIEW IF EXISTS vw_contas_receber_parcelas;

CREATE VIEW vw_contas_receber_parcelas 
WITH (security_invoker = true) AS
SELECT 
  p.*,
  c.cliente_id,
  c.tipo_documento_id,
  c.plano_conta_id,
  c.banco_id,
  c.tipo_lancamento,
  c.numero_parcelas,
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

COMMENT ON VIEW vw_contas_receber_parcelas IS 'View de parcelas com SECURITY INVOKER - respeita RLS do usuário atual';

-- Habilitar RLS na view também
ALTER VIEW vw_contas_receber_parcelas SET (security_invoker = true);