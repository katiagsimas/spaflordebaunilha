-- Corrigir search_path em funções para melhor segurança
-- Adicionar SET search_path = public nas funções que não têm

-- 1. atualizar_parcela_apos_pagamento
CREATE OR REPLACE FUNCTION public.atualizar_parcela_apos_pagamento()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  v_total_pago NUMERIC;
  v_valor_parcela NUMERIC;
  v_ultimo_pagamento DATE;
  v_data_vencimento DATE;
BEGIN
  -- Calcular total pago (soma apenas pagamentos NÃO estornados)
  SELECT COALESCE(SUM(valor_pago + COALESCE(juros, 0) - COALESCE(desconto, 0)), 0)
  INTO v_total_pago
  FROM contas_receber_pagamentos
  WHERE parcela_id = COALESCE(NEW.parcela_id, OLD.parcela_id)
    AND (estornado = false OR estornado IS NULL);
  
  -- Buscar valor da parcela e vencimento
  SELECT valor_parcela, data_vencimento
  INTO v_valor_parcela, v_data_vencimento
  FROM contas_receber_parcelas
  WHERE id = COALESCE(NEW.parcela_id, OLD.parcela_id);
  
  -- Buscar data do último pagamento não estornado
  SELECT MAX(data_pagamento)
  INTO v_ultimo_pagamento
  FROM contas_receber_pagamentos
  WHERE parcela_id = COALESCE(NEW.parcela_id, OLD.parcela_id)
    AND (estornado = false OR estornado IS NULL);
  
  -- Atualizar parcela
  UPDATE contas_receber_parcelas
  SET 
    valor_pago = v_total_pago,
    data_pagamento = v_ultimo_pagamento,
    status = CASE
      WHEN v_total_pago >= v_valor_parcela THEN
        CASE 
          WHEN v_ultimo_pagamento < v_data_vencimento THEN 'adiantado'
          ELSE 'pago'
        END
      WHEN v_total_pago > 0 THEN 'pagamento_parcial'
      WHEN v_data_vencimento < CURRENT_DATE THEN 'atrasado'
      ELSE 'aberto'
    END
  WHERE id = COALESCE(NEW.parcela_id, OLD.parcela_id);
  
  RETURN COALESCE(NEW, OLD);
END;
$function$;

-- 2. atualizar_parcela_pagar_apos_pagamento
CREATE OR REPLACE FUNCTION public.atualizar_parcela_pagar_apos_pagamento()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  v_total_pago NUMERIC;
  v_valor_parcela NUMERIC;
  v_ultimo_pagamento DATE;
  v_data_vencimento DATE;
BEGIN
  -- Calcular total pago (soma apenas pagamentos NÃO estornados)
  SELECT COALESCE(SUM(valor_pago + COALESCE(juros, 0) - COALESCE(desconto, 0)), 0)
  INTO v_total_pago
  FROM contas_pagar_pagamentos
  WHERE parcela_id = COALESCE(NEW.parcela_id, OLD.parcela_id)
    AND (estornado = false OR estornado IS NULL);
  
  -- Buscar valor da parcela e vencimento
  SELECT valor_parcela, data_vencimento
  INTO v_valor_parcela, v_data_vencimento
  FROM contas_pagar_parcelas
  WHERE id = COALESCE(NEW.parcela_id, OLD.parcela_id);
  
  -- Buscar data do último pagamento não estornado
  SELECT MAX(data_pagamento)
  INTO v_ultimo_pagamento
  FROM contas_pagar_pagamentos
  WHERE parcela_id = COALESCE(NEW.parcela_id, OLD.parcela_id)
    AND (estornado = false OR estornado IS NULL);
  
  -- Atualizar parcela
  UPDATE contas_pagar_parcelas
  SET 
    valor_pago = v_total_pago,
    data_pagamento = v_ultimo_pagamento,
    status = CASE
      WHEN v_total_pago >= v_valor_parcela THEN 'pago'
      WHEN v_total_pago > 0 THEN 'pagamento_parcial'
      WHEN v_data_vencimento < CURRENT_DATE THEN 'atrasado'
      ELSE 'aberto'
    END
  WHERE id = COALESCE(NEW.parcela_id, OLD.parcela_id);
  
  RETURN COALESCE(NEW, OLD);
END;
$function$;

-- 3. calcular_juros_atraso
CREATE OR REPLACE FUNCTION public.calcular_juros_atraso(p_valor_parcela numeric, p_data_vencimento date, p_data_pagamento date, p_taxa_juros_dia numeric DEFAULT 0.033)
RETURNS numeric
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  v_dias_atraso INTEGER;
  v_juros NUMERIC;
BEGIN
  -- Calcular dias de atraso
  v_dias_atraso := GREATEST(0, p_data_pagamento - p_data_vencimento);
  
  -- Calcular juros (taxa padrão: 1% ao mês = 0.033% ao dia)
  IF v_dias_atraso > 0 THEN
    v_juros := p_valor_parcela * (p_taxa_juros_dia / 100) * v_dias_atraso;
    RETURN ROUND(v_juros, 2);
  ELSE
    RETURN 0;
  END IF;
END;
$function$;

-- 4. criar_tags_padrao_encomendas
CREATE OR REPLACE FUNCTION public.criar_tags_padrao_encomendas(p_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  INSERT INTO tags_encomendas (user_id, nome, cor, descricao) VALUES
    (p_user_id, 'Aniversário', '#EF4444', 'Encomendas de aniversário'),
    (p_user_id, 'Mesversário', '#F59E0B', 'Comemorações mensais'),
    (p_user_id, 'Casamento', '#EC4899', 'Festas de casamento'),
    (p_user_id, 'Bodas', '#A855F7', 'Comemoração de bodas'),
    (p_user_id, 'Delivery', '#10B981', 'Entregas a domicílio'),
    (p_user_id, 'Retirada', '#3B82F6', 'Cliente retira no local'),
    (p_user_id, 'Urgente', '#DC2626', 'Pedidos urgentes'),
    (p_user_id, 'Personalizado', '#8B5CF6', 'Produtos personalizados'),
    (p_user_id, 'Corporativo', '#6366F1', 'Eventos corporativos'),
    (p_user_id, 'Infantil', '#F472B6', 'Festas infantis')
  ON CONFLICT (user_id, nome) DO NOTHING;
END;
$function$;

-- 5. trigger_criar_tags_novo_usuario
CREATE OR REPLACE FUNCTION public.trigger_criar_tags_novo_usuario()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  PERFORM criar_tags_padrao_encomendas(NEW.id);
  RETURN NEW;
END;
$function$;

-- 6. trigger_criar_unidades_novo_usuario
CREATE OR REPLACE FUNCTION public.trigger_criar_unidades_novo_usuario()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  PERFORM criar_unidades_medida_padrao(NEW.id);
  RETURN NEW;
END;
$function$;

-- 7. update_mao_obra_updated_at
CREATE OR REPLACE FUNCTION public.update_mao_obra_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  NEW.updated_at = NOW();
  NEW.ultima_alteracao = NOW();
  RETURN NEW;
END;
$function$;

-- 8. update_updated_at_column
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$function$;