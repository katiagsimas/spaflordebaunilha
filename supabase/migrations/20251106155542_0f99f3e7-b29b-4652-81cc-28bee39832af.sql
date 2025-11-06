-- ========================================
-- PONTO DE EQUILÍBRIO - SUPORTE A ESTIMATIVAS
-- ========================================

-- 1. ADICIONAR COLUNAS PARA ESTIMATIVAS
ALTER TABLE cmv_mensal 
ADD COLUMN IF NOT EXISTS tipo_dado text DEFAULT 'real' 
  CHECK (tipo_dado IN ('real', 'estimado', 'meta'));

ALTER TABLE cmv_mensal 
ADD COLUMN IF NOT EXISTS custos_fixos_estimado numeric;

ALTER TABLE cmv_mensal 
ADD COLUMN IF NOT EXISTS cmv_percentual_estimado numeric;

ALTER TABLE cmv_mensal 
ADD COLUMN IF NOT EXISTS ticket_medio_estimado numeric;

-- 2. FUNÇÃO: Calcular Custos Fixos do Mês
CREATE OR REPLACE FUNCTION get_custos_fixos_mes(
  p_usuario_id uuid,
  p_ano integer,
  p_mes integer
)
RETURNS numeric AS $$
DECLARE
  v_total numeric;
BEGIN
  -- Somar todos os custos fixos cadastrados pelo usuário
  SELECT COALESCE(SUM(valor), 0)
  INTO v_total
  FROM custos_fixos
  WHERE usuario_id = p_usuario_id;
  
  RETURN v_total;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. FUNÇÃO: Calcular Ticket Médio do Mês
CREATE OR REPLACE FUNCTION get_ticket_medio_mes(
  p_usuario_id uuid,
  p_ano integer,
  p_mes integer
)
RETURNS numeric AS $$
DECLARE
  v_faturamento numeric;
  v_quantidade integer;
BEGIN
  SELECT 
    COALESCE(SUM(valor), 0),
    COUNT(*)
  INTO v_faturamento, v_quantidade
  FROM encomendas
  WHERE usuario_id = p_usuario_id
    AND EXTRACT(YEAR FROM data_entrega) = p_ano
    AND EXTRACT(MONTH FROM data_entrega) = p_mes
    AND status IN ('entregue', 'pago', 'concluido', 'finalizado');

  IF v_quantidade > 0 THEN
    RETURN v_faturamento / v_quantidade;
  ELSE
    RETURN 0;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. FUNÇÃO: Calcular Quantidade de Vendas do Mês
CREATE OR REPLACE FUNCTION get_quantidade_vendas_mes(
  p_usuario_id uuid,
  p_ano integer,
  p_mes integer
)
RETURNS integer AS $$
DECLARE
  v_quantidade integer;
BEGIN
  SELECT COUNT(*)
  INTO v_quantidade
  FROM encomendas
  WHERE usuario_id = p_usuario_id
    AND EXTRACT(YEAR FROM data_entrega) = p_ano
    AND EXTRACT(MONTH FROM data_entrega) = p_mes
    AND status IN ('entregue', 'pago', 'concluido', 'finalizado');

  RETURN v_quantidade;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. FUNÇÃO PRINCIPAL: Ponto de Equilíbrio Mensal (MODO DUPLO)
CREATE OR REPLACE FUNCTION get_ponto_equilibrio_mes(
  p_usuario_id uuid,
  p_ano integer,
  p_mes integer
)
RETURNS TABLE (
  ano integer,
  mes integer,
  mes_nome text,
  tipo_dado text,
  editavel boolean,
  custos_fixos numeric,
  cmv numeric,
  cmv_percentual numeric,
  faturamento numeric,
  margem_contribuicao_percentual numeric,
  ponto_equilibrio_reais numeric,
  ticket_medio numeric,
  ponto_equilibrio_unidades numeric,
  quantidade_vendas_real integer,
  resultado_mes numeric,
  percentual_acima_pe numeric,
  status text
) AS $$
DECLARE
  v_mes_futuro boolean;
  v_historico record;
  v_cmv_dados record;
  v_custos_fixos numeric;
  v_ticket_medio numeric;
  v_quantidade_vendas integer;
BEGIN
  -- Verificar se é mês futuro ou passado
  v_mes_futuro := make_date(p_ano, p_mes, 1) > CURRENT_DATE;
  
  -- Buscar histórico de estimativas
  SELECT * INTO v_historico
  FROM cmv_mensal
  WHERE usuario_id = p_usuario_id
    AND ano = p_ano
    AND mes = p_mes;
  
  -- Se é mês futuro E não tem estimativa, retornar vazio para permitir digitação
  IF v_mes_futuro AND v_historico IS NULL THEN
    RETURN QUERY
    SELECT 
      p_ano,
      p_mes,
      CASE p_mes
        WHEN 1 THEN 'Janeiro' WHEN 2 THEN 'Fevereiro' WHEN 3 THEN 'Março'
        WHEN 4 THEN 'Abril' WHEN 5 THEN 'Maio' WHEN 6 THEN 'Junho'
        WHEN 7 THEN 'Julho' WHEN 8 THEN 'Agosto' WHEN 9 THEN 'Setembro'
        WHEN 10 THEN 'Outubro' WHEN 11 THEN 'Novembro' WHEN 12 THEN 'Dezembro'
      END,
      'estimado'::text,
      true as editavel,
      0::numeric, 0::numeric, 0::numeric, 0::numeric, 0::numeric,
      0::numeric, 0::numeric, 0::numeric, 0, 0::numeric, 0::numeric,
      'pendente'::text;
    RETURN;
  END IF;
  
  -- Se é mês futuro COM estimativa, usar dados estimados
  IF v_mes_futuro AND v_historico.tipo_dado = 'estimado' THEN
    RETURN QUERY
    SELECT 
      p_ano,
      p_mes,
      CASE p_mes
        WHEN 1 THEN 'Janeiro' WHEN 2 THEN 'Fevereiro' WHEN 3 THEN 'Março'
        WHEN 4 THEN 'Abril' WHEN 5 THEN 'Maio' WHEN 6 THEN 'Junho'
        WHEN 7 THEN 'Julho' WHEN 8 THEN 'Agosto' WHEN 9 THEN 'Setembro'
        WHEN 10 THEN 'Outubro' WHEN 11 THEN 'Novembro' WHEN 12 THEN 'Dezembro'
      END,
      'estimado'::text,
      true as editavel,
      
      -- Custos Fixos (estimado)
      v_historico.custos_fixos_estimado as custos_fixos,
      
      -- CMV (calculado pelo percentual estimado)
      0::numeric as cmv,
      v_historico.cmv_percentual_estimado as cmv_percentual,
      
      0::numeric as faturamento,
      
      -- Margem de Contribuição
      (100 - v_historico.cmv_percentual_estimado) as margem_contribuicao_percentual,
      
      -- Ponto de Equilíbrio em R$
      CASE 
        WHEN (100 - v_historico.cmv_percentual_estimado) > 0
        THEN v_historico.custos_fixos_estimado / ((100 - v_historico.cmv_percentual_estimado) / 100)
        ELSE 0
      END as ponto_equilibrio_reais,
      
      -- Ticket Médio
      v_historico.ticket_medio_estimado as ticket_medio,
      
      -- PE em unidades
      CASE 
        WHEN v_historico.ticket_medio_estimado > 0 AND (100 - v_historico.cmv_percentual_estimado) > 0
        THEN ROUND(
          (v_historico.custos_fixos_estimado / ((100 - v_historico.cmv_percentual_estimado) / 100))
          / v_historico.ticket_medio_estimado
        )::numeric
        ELSE 0
      END as ponto_equilibrio_unidades,
      
      0 as quantidade_vendas_real,
      0::numeric as resultado_mes,
      0::numeric as percentual_acima_pe,
      'planejado'::text as status;
    
    RETURN;
  END IF;
  
  -- Se é mês PASSADO, buscar dados reais do sistema
  -- Buscar dados do CMV
  SELECT * INTO v_cmv_dados
  FROM get_cmv_anual(p_usuario_id, p_ano)
  WHERE mes = p_mes;
  
  v_custos_fixos := get_custos_fixos_mes(p_usuario_id, p_ano, p_mes);
  v_ticket_medio := get_ticket_medio_mes(p_usuario_id, p_ano, p_mes);
  v_quantidade_vendas := get_quantidade_vendas_mes(p_usuario_id, p_ano, p_mes);
  
  RETURN QUERY
  SELECT 
    p_ano,
    p_mes,
    CASE p_mes
      WHEN 1 THEN 'Janeiro' WHEN 2 THEN 'Fevereiro' WHEN 3 THEN 'Março'
      WHEN 4 THEN 'Abril' WHEN 5 THEN 'Maio' WHEN 6 THEN 'Junho'
      WHEN 7 THEN 'Julho' WHEN 8 THEN 'Agosto' WHEN 9 THEN 'Setembro'
      WHEN 10 THEN 'Outubro' WHEN 11 THEN 'Novembro' WHEN 12 THEN 'Dezembro'
    END,
    'real'::text,
    false as editavel,
    
    -- Dados reais do sistema
    v_custos_fixos as custos_fixos,
    v_cmv_dados.cmv,
    v_cmv_dados.percentual_cmv as cmv_percentual,
    v_cmv_dados.faturamento,
    
    -- Margem de Contribuição
    CASE 
      WHEN v_cmv_dados.faturamento > 0
      THEN ((v_cmv_dados.faturamento - v_cmv_dados.cmv) / v_cmv_dados.faturamento * 100)
      ELSE 0
    END as margem_contribuicao_percentual,
    
    -- PE em R$
    CASE 
      WHEN v_cmv_dados.faturamento > 0 AND v_cmv_dados.cmv < v_cmv_dados.faturamento
      THEN v_custos_fixos / (((v_cmv_dados.faturamento - v_cmv_dados.cmv) / v_cmv_dados.faturamento))
      ELSE 0
    END as ponto_equilibrio_reais,
    
    v_ticket_medio as ticket_medio,
    
    -- PE em unidades
    CASE 
      WHEN v_ticket_medio > 0 AND v_cmv_dados.faturamento > 0 AND v_cmv_dados.cmv < v_cmv_dados.faturamento
      THEN ROUND((v_custos_fixos / (((v_cmv_dados.faturamento - v_cmv_dados.cmv) / v_cmv_dados.faturamento))) / v_ticket_medio)::numeric
      ELSE 0
    END as ponto_equilibrio_unidades,
    
    v_quantidade_vendas as quantidade_vendas_real,
    
    -- Resultado do mês
    (v_cmv_dados.faturamento - v_cmv_dados.cmv - v_custos_fixos) as resultado_mes,
    
    -- % acima/abaixo do PE
    CASE 
      WHEN v_cmv_dados.faturamento > 0 AND v_cmv_dados.cmv < v_cmv_dados.faturamento AND v_custos_fixos > 0
      THEN (
        (v_cmv_dados.faturamento - (v_custos_fixos / (((v_cmv_dados.faturamento - v_cmv_dados.cmv) / v_cmv_dados.faturamento))))
        / (v_custos_fixos / (((v_cmv_dados.faturamento - v_cmv_dados.cmv) / v_cmv_dados.faturamento)))
        * 100
      )
      ELSE 0
    END as percentual_acima_pe,
    
    -- Status
    CASE 
      WHEN v_cmv_dados.faturamento > 0 AND v_cmv_dados.cmv < v_cmv_dados.faturamento AND v_custos_fixos > 0
      THEN
        CASE 
          WHEN v_cmv_dados.faturamento >= (v_custos_fixos / (((v_cmv_dados.faturamento - v_cmv_dados.cmv) / v_cmv_dados.faturamento)))
          THEN 'acima'
          ELSE 'abaixo'
        END
      ELSE 'pendente'
    END as status;
  
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;