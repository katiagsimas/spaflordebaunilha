-- ============================================
-- FUNCTION: Validar Estoque para Receitas
-- ============================================

CREATE OR REPLACE FUNCTION validar_estoque_receita(
  p_receita_id uuid,
  p_quantidade numeric,
  p_usuario_id uuid
)
RETURNS TABLE (
  tem_estoque boolean,
  itens_faltantes jsonb
) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_ingrediente record;
  v_quantidade_necessaria numeric;
  v_saldo_disponivel numeric;
  v_tem_estoque boolean := true;
  v_itens_faltantes jsonb := '[]'::jsonb;
  v_item_faltante jsonb;
BEGIN
  -- Buscar todos os ingredientes da receita
  FOR v_ingrediente IN
    SELECT 
      ri.ingrediente_id,
      ri.ingrediente as nome,
      ri.quantidade_receita,
      ri.unidade_medida,
      i.rastrear_estoque
    FROM receitas_ingredientes ri
    LEFT JOIN itens i ON i.id = ri.ingrediente_id::uuid
    WHERE ri.receita_id = p_receita_id
      AND COALESCE(i.rastrear_estoque, false) = true
  LOOP
    -- Calcular quantidade necessária
    v_quantidade_necessaria := v_ingrediente.quantidade_receita * p_quantidade;
    
    -- Buscar saldo disponível no estoque
    SELECT COALESCE(ea.saldo, 0)
    INTO v_saldo_disponivel
    FROM estoque_atual ea
    WHERE ea.item_id = v_ingrediente.ingrediente_id::uuid
      AND ea.usuario_id = p_usuario_id;
    
    -- Se não encontrou no estoque, considera saldo zero
    IF v_saldo_disponivel IS NULL THEN
      v_saldo_disponivel := 0;
    END IF;
    
    -- Verificar se falta estoque
    IF v_saldo_disponivel < v_quantidade_necessaria THEN
      v_tem_estoque := false;
      
      -- Adicionar ao array de itens faltantes
      v_item_faltante := jsonb_build_object(
        'ingrediente', v_ingrediente.nome,
        'necessario', v_quantidade_necessaria,
        'disponivel', v_saldo_disponivel,
        'faltam', v_quantidade_necessaria - v_saldo_disponivel,
        'unidade', v_ingrediente.unidade_medida
      );
      
      v_itens_faltantes := v_itens_faltantes || jsonb_build_array(v_item_faltante);
    END IF;
  END LOOP;
  
  -- Retornar resultado
  RETURN QUERY SELECT v_tem_estoque, v_itens_faltantes;
END;
$$;

-- Conceder permissões
GRANT EXECUTE ON FUNCTION validar_estoque_receita(uuid, numeric, uuid) TO authenticated;

COMMENT ON FUNCTION validar_estoque_receita IS 'Valida se há estoque suficiente para produzir uma receita em determinada quantidade';

-- ============================================
-- MIGRATION: Separar Observações em Encomendas
-- ============================================

-- Adicionar novas colunas
ALTER TABLE encomendas 
ADD COLUMN IF NOT EXISTS observacoes_cliente text,
ADD COLUMN IF NOT EXISTS observacoes_internas text;

-- Copiar dados existentes da coluna observacoes para observacoes_cliente
UPDATE encomendas 
SET observacoes_cliente = observacoes 
WHERE observacoes IS NOT NULL AND observacoes_cliente IS NULL;

-- Adicionar comentário na coluna antiga
COMMENT ON COLUMN encomendas.observacoes IS 'DEPRECATED - Use observacoes_cliente e observacoes_internas';

-- As policies RLS existentes já cobrem todas as colunas da tabela encomendas
-- através do padrão (auth.uid() = usuario_id), então não é necessário adicionar policies específicas