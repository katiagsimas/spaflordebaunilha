-- Corrigir o trigger de atualização do estoque_atual para calcular custo_medio corretamente

-- Primeiro, vamos alterar a constraint para permitir null temporariamente caso não haja custo
ALTER TABLE public.estoque_atual 
  ALTER COLUMN custo_medio DROP NOT NULL;

-- Agora vamos criar/atualizar a função que atualiza o estoque_atual
CREATE OR REPLACE FUNCTION public.atualizar_estoque_atual()
RETURNS TRIGGER AS $$
DECLARE
  v_quantidade_atual NUMERIC;
  v_custo_medio NUMERIC;
  v_valor_total NUMERIC;
BEGIN
  -- Calcular quantidade atual baseado no tipo de movimentação
  IF NEW.tipo = 'ENTRADA' OR NEW.tipo = 'AJUSTE' THEN
    -- Para entrada ou ajuste, recalcular o custo médio ponderado
    SELECT 
      COALESCE(ea.quantidade_atual, 0) + NEW.quantidade,
      CASE 
        WHEN COALESCE(ea.quantidade_atual, 0) + NEW.quantidade > 0 THEN
          (COALESCE(ea.valor_total, 0) + COALESCE(NEW.custo_total, NEW.quantidade * COALESCE(NEW.custo_unitario, 0))) / 
          (COALESCE(ea.quantidade_atual, 0) + NEW.quantidade)
        ELSE 
          COALESCE(NEW.custo_unitario, 0)
      END
    INTO v_quantidade_atual, v_custo_medio
    FROM public.estoque_atual ea
    WHERE ea.item_id = NEW.item_id 
      AND ea.tipo_item = NEW.tipo_item
      AND ea.usuario_id = NEW.usuario_id;
    
    -- Se não existe registro, usar valores da movimentação
    IF NOT FOUND THEN
      v_quantidade_atual := NEW.quantidade;
      v_custo_medio := COALESCE(NEW.custo_unitario, 0);
    END IF;
    
  ELSIF NEW.tipo = 'SAIDA' THEN
    -- Para saída, manter o custo médio atual e diminuir quantidade
    SELECT 
      GREATEST(COALESCE(ea.quantidade_atual, 0) - NEW.quantidade, 0),
      COALESCE(ea.custo_medio, 0)
    INTO v_quantidade_atual, v_custo_medio
    FROM public.estoque_atual ea
    WHERE ea.item_id = NEW.item_id 
      AND ea.tipo_item = NEW.tipo_item
      AND ea.usuario_id = NEW.usuario_id;
    
    IF NOT FOUND THEN
      v_quantidade_atual := 0;
      v_custo_medio := 0;
    END IF;
  END IF;
  
  -- Calcular valor total
  v_valor_total := v_quantidade_atual * v_custo_medio;
  
  -- Inserir ou atualizar o registro de estoque atual
  INSERT INTO public.estoque_atual (
    item_id, 
    tipo_item, 
    usuario_id, 
    quantidade_atual, 
    custo_medio, 
    valor_total,
    ultima_atualizacao
  )
  VALUES (
    NEW.item_id,
    NEW.tipo_item,
    NEW.usuario_id,
    v_quantidade_atual,
    v_custo_medio,
    v_valor_total,
    NOW()
  )
  ON CONFLICT (item_id, tipo_item, usuario_id)
  DO UPDATE SET
    quantidade_atual = v_quantidade_atual,
    custo_medio = v_custo_medio,
    valor_total = v_valor_total,
    ultima_atualizacao = NOW();
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recriar o trigger se não existir
DROP TRIGGER IF EXISTS trigger_atualizar_estoque_atual ON public.movimentacoes_estoque;

CREATE TRIGGER trigger_atualizar_estoque_atual
  AFTER INSERT ON public.movimentacoes_estoque
  FOR EACH ROW
  EXECUTE FUNCTION public.atualizar_estoque_atual();