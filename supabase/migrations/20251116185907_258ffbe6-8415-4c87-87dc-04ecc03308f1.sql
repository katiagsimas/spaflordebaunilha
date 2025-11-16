-- Corrigir função atualizar_estoque_atual para usar nomes corretos de colunas
CREATE OR REPLACE FUNCTION atualizar_estoque_atual()
RETURNS TRIGGER AS $$
DECLARE
  v_saldo_atual NUMERIC;
  v_custo_medio NUMERIC;
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
  
  -- Calcular custo médio (se for entrada)
  IF NEW.tipo = 'ENTRADA' AND NEW.custo_unitario > 0 THEN
    v_custo_medio := NEW.custo_unitario;
  ELSE
    SELECT COALESCE(custo_medio, 0)
    INTO v_custo_medio
    FROM estoque_atual
    WHERE item_id = NEW.item_id AND usuario_id = NEW.usuario_id;
  END IF;
  
  -- Inserir ou atualizar estoque_atual
  INSERT INTO estoque_atual (
    item_id,
    usuario_id,
    tipo_item,
    quantidade_atual,
    custo_medio,
    valor_total,
    ultima_atualizacao
  ) VALUES (
    NEW.item_id,
    NEW.usuario_id,
    NEW.tipo_item,
    v_saldo_atual,
    v_custo_medio,
    v_saldo_atual * v_custo_medio,
    NEW.data
  )
  ON CONFLICT (item_id, usuario_id)
  DO UPDATE SET
    quantidade_atual = v_saldo_atual,
    custo_medio = CASE 
      WHEN NEW.tipo = 'ENTRADA' AND NEW.custo_unitario > 0 
      THEN NEW.custo_unitario 
      ELSE estoque_atual.custo_medio 
    END,
    valor_total = v_saldo_atual * CASE 
      WHEN NEW.tipo = 'ENTRADA' AND NEW.custo_unitario > 0 
      THEN NEW.custo_unitario 
      ELSE estoque_atual.custo_medio 
    END,
    ultima_atualizacao = NEW.data;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;