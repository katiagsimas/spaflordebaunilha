-- Fix search_path for remaining 8 database functions
-- This prevents search path manipulation attacks

-- 1. fn_split_match - Bank reconciliation
CREATE OR REPLACE FUNCTION public.fn_split_match(p_bank_entry_id uuid, p_transactions jsonb)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  v_tx JSONB;
  v_total NUMERIC := 0;
  v_entry_amount NUMERIC;
BEGIN
  SELECT amount INTO v_entry_amount FROM bank_entries WHERE id = p_bank_entry_id;
  
  -- Validate total
  FOR v_tx IN SELECT * FROM jsonb_array_elements(p_transactions)
  LOOP
    v_total := v_total + (v_tx->>'amount')::NUMERIC;
  END LOOP;
  
  IF ABS(v_total - v_entry_amount) > 0.01 THEN
    RAISE EXCEPTION 'Total amount does not match entry amount';
  END IF;
  
  -- Create matches
  FOR v_tx IN SELECT * FROM jsonb_array_elements(p_transactions)
  LOOP
    INSERT INTO bank_matches (bank_entry_id, transaction_id, transaction_type, score, status)
    VALUES (p_bank_entry_id, (v_tx->>'id')::UUID, v_tx->>'type', 1.0, 'confirmed');
  END LOOP;
  
  UPDATE bank_entries SET status = 'matched' WHERE id = p_bank_entry_id;
END;
$function$;

-- 2. fn_reconcile_import - Import reconciliation
CREATE OR REPLACE FUNCTION public.fn_reconcile_import(p_import_id uuid, p_reconciled_by uuid)
RETURNS TABLE(reconciled_count integer)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  v_count INT := 0;
BEGIN
  -- Mark entries as reconciled
  UPDATE bank_entries 
  SET status = 'reconciled' 
  WHERE import_id = p_import_id 
  AND status = 'matched'
  RETURNING 1 INTO v_count;
  
  GET DIAGNOSTICS v_count = ROW_COUNT;
  
  -- Update import status
  UPDATE bank_imports SET status = 'completed' WHERE id = p_import_id;
  
  RETURN QUERY SELECT v_count;
END;
$function$;

-- 3. get_compras_mes - Monthly purchases calculation
CREATE OR REPLACE FUNCTION public.get_compras_mes(p_usuario_id uuid, p_ano integer, p_mes integer)
RETURNS numeric
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
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
$function$;

-- 4. get_estoque_final_mes - End of month stock
CREATE OR REPLACE FUNCTION public.get_estoque_final_mes(p_usuario_id uuid, p_ano integer, p_mes integer)
RETURNS numeric
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
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
$function$;

-- 5. atualizar_status_parcelas_vencidas - Update overdue installments
CREATE OR REPLACE FUNCTION public.atualizar_status_parcelas_vencidas()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  UPDATE contas_receber_parcelas
  SET status = 'vencida'
  WHERE status = 'pendente'
    AND data_vencimento < CURRENT_DATE;
END;
$function$;

-- 6. get_cmv_anual - Annual CMV calculation
CREATE OR REPLACE FUNCTION public.get_cmv_anual(p_usuario_id uuid, p_ano integer)
RETURNS TABLE(mes integer, mes_nome text, estoque_inicial numeric, compras numeric, estoque_final numeric, cmv numeric, faturamento numeric, percentual_cmv numeric, editavel boolean, tem_historico boolean)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
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
$function$;

-- 7. get_insights_cruzados - Cross-insights analytics
CREATE OR REPLACE FUNCTION public.get_insights_cruzados(dias integer, user_id_param uuid)
RETURNS TABLE(origem text, evento text, total_vendas bigint, valor_total numeric, ticket_medio numeric, percentual numeric)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  RETURN QUERY
  WITH dados_cruzados AS (
    SELECT 
      t_origem.nome as origem,
      t_evento.nome as evento,
      COUNT(DISTINCT e.id) as total_vendas,
      COALESCE(SUM(e.valor), 0) as valor_total
    FROM encomendas e
    INNER JOIN encomendas_tags et_origem ON e.id = et_origem.encomenda_id
    INNER JOIN tags t_origem ON et_origem.tag_id = t_origem.id
    INNER JOIN categorias_tags ct_origem ON t_origem.categoria_id = ct_origem.id
    INNER JOIN encomendas_tags et_evento ON e.id = et_evento.encomenda_id
    INNER JOIN tags t_evento ON et_evento.tag_id = t_evento.id
    INNER JOIN categorias_tags ct_evento ON t_evento.categoria_id = ct_evento.id
    WHERE 
      ct_origem.nome = 'Origem do Pedido'
      AND ct_evento.nome = 'Tipo de Evento'
      AND e.usuario_id = user_id_param
      AND e.created_at >= NOW() - (dias || ' days')::interval
    GROUP BY t_origem.nome, t_evento.nome
  ),
  total_geral AS (
    SELECT SUM(valor_total) as total FROM dados_cruzados
  )
  SELECT 
    dc.origem,
    dc.evento,
    dc.total_vendas,
    dc.valor_total,
    CASE 
      WHEN dc.total_vendas > 0 THEN dc.valor_total / dc.total_vendas
      ELSE 0
    END as ticket_medio,
    CASE 
      WHEN tg.total > 0 THEN (dc.valor_total / tg.total * 100)
      ELSE 0
    END as percentual
  FROM dados_cruzados dc
  CROSS JOIN total_geral tg
  ORDER BY dc.valor_total DESC;
END;
$function$;

-- Add comments documenting the security fix
COMMENT ON FUNCTION public.fn_split_match IS 'Bank reconciliation split match. Fixed search_path prevents privilege escalation.';
COMMENT ON FUNCTION public.fn_reconcile_import IS 'Import reconciliation. Fixed search_path prevents privilege escalation.';
COMMENT ON FUNCTION public.get_compras_mes IS 'Calculate monthly purchases. Fixed search_path prevents privilege escalation.';
COMMENT ON FUNCTION public.get_estoque_final_mes IS 'Calculate end of month stock. Fixed search_path prevents privilege escalation.';
COMMENT ON FUNCTION public.atualizar_status_parcelas_vencidas IS 'Update overdue installments. Fixed search_path prevents privilege escalation.';
COMMENT ON FUNCTION public.get_cmv_anual IS 'Calculate annual CMV. Fixed search_path prevents privilege escalation.';
COMMENT ON FUNCTION public.get_insights_cruzados IS 'Cross-insights analytics. Fixed search_path prevents privilege escalation.';