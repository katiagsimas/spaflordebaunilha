-- ========================================
-- CMV GLOBAL - CUSTO DE MERCADORIA VENDIDA
-- Adicionar campos e funções para análise anual
-- ========================================

-- 1. Adicionar campos de controle na tabela cmv_mensal (se não existirem)
-- =========================================================

DO $$ 
BEGIN
  -- Adicionar coluna usa_dados_sistema se não existir
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'cmv_mensal' AND column_name = 'usa_dados_sistema'
  ) THEN
    ALTER TABLE cmv_mensal ADD COLUMN usa_dados_sistema boolean NOT NULL DEFAULT true;
  END IF;

  -- Adicionar coluna observacao se não existir
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'cmv_mensal' AND column_name = 'observacao'
  ) THEN
    ALTER TABLE cmv_mensal ADD COLUMN observacao text;
  END IF;
END $$;

-- 2. FUNÇÃO PARA CALCULAR COMPRAS DO MÊS (Sistema)
-- =================================================

CREATE OR REPLACE FUNCTION get_compras_mes(
  p_usuario_id uuid,
  p_ano integer,
  p_mes integer
)
RETURNS numeric AS $$
DECLARE
  v_total numeric;
BEGIN
  -- Somar valor de todas as compras (movimentações de entrada tipo compra)
  SELECT COALESCE(SUM(
    CASE 
      WHEN me.valor_total IS NOT NULL THEN me.valor_total
      ELSE (me.quantidade * COALESCE(me.custo_unitario, 0))
    END
  ), 0)
  INTO v_total
  FROM movimentacoes_estoque me
  WHERE me.usuario_id = p_usuario_id
    AND me.tipo_movimentacao = 'entrada'
    AND EXTRACT(YEAR FROM me.data_movimentacao) = p_ano
    AND EXTRACT(MONTH FROM me.data_movimentacao) = p_mes;
  
  RETURN v_total;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. FUNÇÃO PARA CALCULAR ESTOQUE FINAL DO MÊS (Sistema)
-- =======================================================

CREATE OR REPLACE FUNCTION get_estoque_final_mes(
  p_usuario_id uuid,
  p_ano integer,
  p_mes integer
)
RETURNS numeric AS $$
DECLARE
  v_total numeric;
  v_data_final date;
BEGIN
  -- Último dia do mês
  v_data_final := DATE_TRUNC('month', make_date(p_ano, p_mes, 1))::date 
                  + INTERVAL '1 month' 
                  - INTERVAL '1 day';
  
  -- Calcular valor do estoque no último dia do mês
  -- Somar saldo * custo médio de cada item
  WITH estoque_final AS (
    SELECT 
      ea.item_id,
      ea.quantidade_atual,
      COALESCE(p.custo_unitario, 0) as custo_medio
    FROM estoque_atual ea
    LEFT JOIN LATERAL (
      SELECT custo_unitario
      FROM precos
      WHERE item_id = ea.item_id
        AND usuario_id = p_usuario_id
        AND ativo = true
      ORDER BY data_coleta DESC
      LIMIT 1
    ) p ON true
    WHERE ea.usuario_id = p_usuario_id
      AND ea.quantidade_atual > 0
  )
  SELECT COALESCE(SUM(quantidade_atual * custo_medio), 0)
  INTO v_total
  FROM estoque_final;
  
  RETURN v_total;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. FUNÇÃO PARA CALCULAR FATURAMENTO DO MÊS (Sistema)
-- =====================================================

CREATE OR REPLACE FUNCTION get_faturamento_mes(
  p_usuario_id uuid,
  p_ano integer,
  p_mes integer
)
RETURNS numeric AS $$
DECLARE
  v_total numeric;
BEGIN
  -- Somar valor de encomendas entregues do mês
  SELECT COALESCE(SUM(valor_total), 0)
  INTO v_total
  FROM encomendas
  WHERE usuario_id = p_usuario_id
    AND EXTRACT(YEAR FROM data_entrega) = p_ano
    AND EXTRACT(MONTH FROM data_entrega) = p_mes
    AND status IN ('entregue', 'pago', 'concluido');
  
  RETURN v_total;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. FUNÇÃO PRINCIPAL: GERAR CMV DO ANO
-- ======================================

CREATE OR REPLACE FUNCTION get_cmv_anual(
  p_usuario_id uuid,
  p_ano integer
)
RETURNS TABLE (
  mes integer,
  mes_nome text,
  estoque_inicial numeric,
  compras numeric,
  estoque_final numeric,
  cmv numeric,
  faturamento numeric,
  percentual_cmv numeric,
  editavel boolean,
  tem_historico boolean
) AS $$
DECLARE
  v_usa_sistema boolean;
BEGIN
  -- Determinar se usa dados do sistema ou manual
  -- Antes de 2025 = sempre manual
  -- 2025+ = pode ser misto (sistema + ajustes manuais)
  v_usa_sistema := (p_ano >= 2025);
  
  RETURN QUERY
  WITH meses AS (
    SELECT generate_series(1, 12) as mes_num
  ),
  dados_mes AS (
    SELECT 
      m.mes_num,
      
      -- Nome do mês
      CASE m.mes_num
        WHEN 1 THEN 'Janeiro'
        WHEN 2 THEN 'Fevereiro'
        WHEN 3 THEN 'Março'
        WHEN 4 THEN 'Abril'
        WHEN 5 THEN 'Maio'
        WHEN 6 THEN 'Junho'
        WHEN 7 THEN 'Julho'
        WHEN 8 THEN 'Agosto'
        WHEN 9 THEN 'Setembro'
        WHEN 10 THEN 'Outubro'
        WHEN 11 THEN 'Novembro'
        WHEN 12 THEN 'Dezembro'
      END as mes_nome,
      
      -- Dados históricos/manuais
      h.estoque_inicial as estoque_inicial_manual,
      h.compras as compras_manual,
      h.estoque_final as estoque_final_manual,
      h.faturamento as faturamento_manual,
      COALESCE(h.usa_dados_sistema, true) as usa_dados_sistema,
      h.id IS NOT NULL as tem_historico,
      
      -- Dados do sistema (calculados)
      CASE 
        WHEN v_usa_sistema AND COALESCE(h.usa_dados_sistema, true)
        THEN get_compras_mes(p_usuario_id, p_ano, m.mes_num)
        ELSE h.compras
      END as compras_final,
      
      CASE 
        WHEN v_usa_sistema AND COALESCE(h.usa_dados_sistema, true)
        THEN get_estoque_final_mes(p_usuario_id, p_ano, m.mes_num)
        ELSE h.estoque_final
      END as estoque_final_final,
      
      CASE 
        WHEN v_usa_sistema AND COALESCE(h.usa_dados_sistema, true)
        THEN get_faturamento_mes(p_usuario_id, p_ano, m.mes_num)
        ELSE h.faturamento
      END as faturamento_final
      
    FROM meses m
    LEFT JOIN cmv_mensal h ON h.usuario_id = p_usuario_id 
                            AND h.ano = p_ano 
                            AND h.mes = m.mes_num
  ),
  calculo_estoque_inicial AS (
    SELECT 
      mes_num,
      mes_nome,
      
      -- Estoque inicial: primeiro mês vem do histórico, demais = estoque final do mês anterior
      CASE 
        WHEN mes_num = 1 THEN COALESCE(estoque_inicial_manual, 0)
        ELSE COALESCE(LAG(estoque_final_final) OVER (ORDER BY mes_num), 0)
      END as estoque_inicial,
      
      COALESCE(compras_final, 0) as compras,
      COALESCE(estoque_final_final, 0) as estoque_final,
      COALESCE(faturamento_final, 0) as faturamento,
      tem_historico,
      usa_dados_sistema
      
    FROM dados_mes
  )
  SELECT 
    c.mes_num,
    c.mes_nome,
    c.estoque_inicial,
    c.compras,
    c.estoque_final,
    
    -- CMV = Estoque Inicial + Compras - Estoque Final
    (c.estoque_inicial + c.compras - c.estoque_final) as cmv,
    
    c.faturamento,
    
    -- % CMV = (CMV / Faturamento) × 100
    CASE 
      WHEN c.faturamento > 0 
      THEN ((c.estoque_inicial + c.compras - c.estoque_final) / c.faturamento * 100)
      ELSE 0
    END as percentual_cmv,
    
    -- Editável se: antes de 2025 OU tem histórico manual OU é o estoque inicial de janeiro
    (NOT v_usa_sistema OR c.tem_historico OR NOT c.usa_dados_sistema OR c.mes_num = 1) as editavel,
    c.tem_historico
    
  FROM calculo_estoque_inicial c
  ORDER BY c.mes_num;
  
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Comentários nas funções
COMMENT ON FUNCTION get_compras_mes IS 'Calcula total de compras (entradas) de um mês específico';
COMMENT ON FUNCTION get_estoque_final_mes IS 'Calcula valor do estoque no último dia do mês';
COMMENT ON FUNCTION get_faturamento_mes IS 'Calcula faturamento (encomendas entregues) de um mês específico';
COMMENT ON FUNCTION get_cmv_anual IS 'Retorna análise completa de CMV para um ano, com 12 meses + cálculos automáticos';