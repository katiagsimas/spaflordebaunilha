-- Função para atualizar estoque_atual quando movimentacoes_estoque é inserida
CREATE OR REPLACE FUNCTION atualizar_estoque_atual()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_saldo_atual NUMERIC;
  v_valor_unitario NUMERIC;
BEGIN
  -- Calcular novo saldo baseado no tipo de movimentação
  SELECT COALESCE(quantidade_atual, 0)
  INTO v_saldo_atual
  FROM estoque_atual
  WHERE item_id = NEW.item_id AND usuario_id = NEW.usuario_id;
  
  -- Se não existe registro, criar um novo
  IF NOT FOUND THEN
    v_saldo_atual := 0;
  END IF;
  
  -- Atualizar saldo baseado no tipo de movimentação
  IF NEW.tipo = 'ENTRADA' THEN
    v_saldo_atual := v_saldo_atual + NEW.quantidade;
  ELSIF NEW.tipo IN ('SAIDA', 'PERDA', 'AJUSTE') THEN
    v_saldo_atual := v_saldo_atual - NEW.quantidade;
  END IF;
  
  -- Calcular valor unitário médio (se for entrada)
  IF NEW.tipo = 'ENTRADA' AND NEW.custo_unitario > 0 THEN
    v_valor_unitario := NEW.custo_unitario;
  ELSE
    SELECT COALESCE(valor_unitario, 0)
    INTO v_valor_unitario
    FROM estoque_atual
    WHERE item_id = NEW.item_id AND usuario_id = NEW.usuario_id;
  END IF;
  
  -- Inserir ou atualizar estoque_atual
  INSERT INTO estoque_atual (
    item_id,
    usuario_id,
    quantidade_atual,
    valor_unitario,
    valor_total,
    ultima_atualizacao
  ) VALUES (
    NEW.item_id,
    NEW.usuario_id,
    v_saldo_atual,
    v_valor_unitario,
    v_saldo_atual * v_valor_unitario,
    NEW.data
  )
  ON CONFLICT (item_id, usuario_id)
  DO UPDATE SET
    quantidade_atual = v_saldo_atual,
    valor_unitario = CASE 
      WHEN NEW.tipo = 'ENTRADA' AND NEW.custo_unitario > 0 
      THEN NEW.custo_unitario 
      ELSE estoque_atual.valor_unitario 
    END,
    valor_total = v_saldo_atual * CASE 
      WHEN NEW.tipo = 'ENTRADA' AND NEW.custo_unitario > 0 
      THEN NEW.custo_unitario 
      ELSE estoque_atual.valor_unitario 
    END,
    ultima_atualizacao = NEW.data;
  
  RETURN NEW;
END;
$$;

-- Criar trigger para atualizar estoque_atual
DROP TRIGGER IF EXISTS trigger_atualizar_estoque_atual ON movimentacoes_estoque;
CREATE TRIGGER trigger_atualizar_estoque_atual
AFTER INSERT ON movimentacoes_estoque
FOR EACH ROW
EXECUTE FUNCTION atualizar_estoque_atual();