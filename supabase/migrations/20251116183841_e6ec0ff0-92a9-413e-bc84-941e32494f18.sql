-- Criar VIEW simplificada para calcular saldo atual
CREATE OR REPLACE VIEW estoque_simplificado AS
SELECT 
  i.id AS item_id,
  i.usuario_id,
  i.nome AS item_nome,
  i.tipo,
  i.categoria,
  i.unidade_base,
  i.ponto_de_pedido,
  COALESCE(
    SUM(
      CASE 
        WHEN m.tipo = 'ENTRADA' THEN m.quantidade
        WHEN m.tipo = 'SAIDA' THEN -m.quantidade
        WHEN m.tipo = 'PERDA' THEN -m.quantidade
        WHEN m.tipo = 'AJUSTE' THEN m.quantidade
        ELSE 0
      END
    ), 
    0
  ) AS saldo_atual,
  COALESCE(AVG(CASE WHEN m.tipo = 'ENTRADA' THEN m.custo_unitario END), 0) AS custo_medio,
  COALESCE(
    SUM(
      CASE 
        WHEN m.tipo = 'ENTRADA' THEN m.custo_total
        WHEN m.tipo = 'SAIDA' THEN -m.custo_total
        WHEN m.tipo = 'PERDA' THEN -m.custo_total
        ELSE 0
      END
    ), 
    0
  ) AS valor_total_estoque,
  MAX(m.data) AS ultima_movimentacao
FROM itens i
LEFT JOIN movimentacoes_estoque m ON i.id = m.item_id
WHERE i.ativo = true
GROUP BY i.id, i.usuario_id, i.nome, i.tipo, i.categoria, i.unidade_base, i.ponto_de_pedido;