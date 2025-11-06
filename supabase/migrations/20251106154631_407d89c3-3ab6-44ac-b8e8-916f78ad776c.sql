-- ========================================
-- CORRIGIR FUNÇÃO get_cmv_anual - AMBIGUIDADE DE COLUNAS
-- ========================================

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
      END as nome_mes,
      
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
      d.mes_num,
      d.nome_mes,
      
      -- Estoque inicial: primeiro mês vem do histórico, demais = estoque final do mês anterior
      CASE 
        WHEN d.mes_num = 1 THEN COALESCE(d.estoque_inicial_manual, 0)
        ELSE COALESCE(LAG(d.estoque_final_final) OVER (ORDER BY d.mes_num), 0)
      END as estoque_inicial_calc,
      
      COALESCE(d.compras_final, 0) as compras_calc,
      COALESCE(d.estoque_final_final, 0) as estoque_final_calc,
      COALESCE(d.faturamento_final, 0) as faturamento_calc,
      d.tem_historico,
      d.usa_dados_sistema
      
    FROM dados_mes d
  )
  SELECT 
    c.mes_num::integer,
    c.nome_mes::text,
    c.estoque_inicial_calc::numeric,
    c.compras_calc::numeric,
    c.estoque_final_calc::numeric,
    
    -- CMV = Estoque Inicial + Compras - Estoque Final
    (c.estoque_inicial_calc + c.compras_calc - c.estoque_final_calc)::numeric as cmv_calc,
    
    c.faturamento_calc::numeric,
    
    -- % CMV = (CMV / Faturamento) × 100
    CASE 
      WHEN c.faturamento_calc > 0 
      THEN ((c.estoque_inicial_calc + c.compras_calc - c.estoque_final_calc) / c.faturamento_calc * 100)::numeric
      ELSE 0::numeric
    END as percentual_cmv_calc,
    
    -- Editável sempre (permite ajustes manuais em qualquer ano)
    true::boolean as editavel_calc,
    c.tem_historico::boolean
    
  FROM calculo_estoque_inicial c
  ORDER BY c.mes_num;
  
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;