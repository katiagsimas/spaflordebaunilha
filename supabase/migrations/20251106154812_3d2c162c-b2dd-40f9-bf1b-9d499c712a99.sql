-- ========================================
-- CORRIGIR FUNÇÕES DE CMV - ESTRUTURA DAS TABELAS
-- ========================================

-- 1. CORRIGIR get_compras_mes
CREATE OR REPLACE FUNCTION get_compras_mes(
  p_usuario_id uuid,
  p_ano integer,
  p_mes integer
)
RETURNS numeric AS $$
DECLARE
  v_total numeric;
BEGIN
  -- Somar custo_total de todas as entradas do mês
  SELECT COALESCE(SUM(custo_total), 0)
  INTO v_total
  FROM movimentacoes_estoque
  WHERE usuario_id = p_usuario_id
    AND tipo = 'ENTRADA'
    AND EXTRACT(YEAR FROM data) = p_ano
    AND EXTRACT(MONTH FROM data) = p_mes;
  
  RETURN v_total;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. CORRIGIR get_estoque_final_mes
CREATE OR REPLACE FUNCTION get_estoque_final_mes(
  p_usuario_id uuid,
  p_ano integer,
  p_mes integer
)
RETURNS numeric AS $$
DECLARE
  v_total numeric;
BEGIN
  -- Somar valor_total de todos os itens no estoque atual
  SELECT COALESCE(SUM(valor_total), 0)
  INTO v_total
  FROM estoque_atual
  WHERE usuario_id = p_usuario_id
    AND quantidade_atual > 0;
  
  RETURN v_total;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. CORRIGIR get_faturamento_mes
CREATE OR REPLACE FUNCTION get_faturamento_mes(
  p_usuario_id uuid,
  p_ano integer,
  p_mes integer
)
RETURNS numeric AS $$
DECLARE
  v_total numeric;
BEGIN
  -- Somar valor de encomendas com status apropriado
  SELECT COALESCE(SUM(valor), 0)
  INTO v_total
  FROM encomendas
  WHERE usuario_id = p_usuario_id
    AND EXTRACT(YEAR FROM data_entrega) = p_ano
    AND EXTRACT(MONTH FROM data_entrega) = p_mes
    AND status IN ('entregue', 'pago', 'concluido', 'finalizado');
  
  RETURN v_total;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;