CREATE OR REPLACE FUNCTION public.calcular_proxima_execucao_backup(
  p_frequencia text, 
  p_horario time without time zone, 
  p_referencia timestamp with time zone DEFAULT now(),
  p_dia_semana integer DEFAULT NULL
)
 RETURNS timestamp with time zone
 LANGUAGE plpgsql
 STABLE
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_referencia_local TIMESTAMP := p_referencia AT TIME ZONE 'America/Sao_Paulo';
  v_data DATE := v_referencia_local::date;
  v_proxima TIMESTAMPTZ;
  v_dia_semana_atual INTEGER;
  v_dias_ate_proximo INTEGER;
BEGIN
  -- Se for diário, mantém a lógica simples de hoje ou amanhã
  IF p_frequencia = 'diario' THEN
    v_proxima := ((v_data::text || ' ' || p_horario::text)::timestamp AT TIME ZONE 'America/Sao_Paulo');
    IF v_proxima <= p_referencia THEN
      v_proxima := v_proxima + INTERVAL '1 day';
    END IF;
    RETURN v_proxima;
  END IF;

  -- Para outras frequências, se p_dia_semana for informado (0=dom, 1=seg, ..., 6=sab)
  IF p_dia_semana IS NOT NULL THEN
    v_dia_semana_atual := EXTRACT(DOW FROM v_data);
    
    -- Calcula quantos dias faltam para o dia da semana desejado
    v_dias_ate_proximo := (p_dia_semana - v_dia_semana_atual + 7) % 7;
    
    v_proxima := (((v_data + v_dias_ate_proximo)::text || ' ' || p_horario::text)::timestamp AT TIME ZONE 'America/Sao_Paulo');
    
    -- Se a próxima data calculada for agora ou no passado, pula para a próxima ocorrência baseada na frequência
    IF v_proxima <= p_referencia THEN
      IF p_frequencia = 'semanal' THEN
        v_proxima := v_proxima + INTERVAL '7 days';
      ELSIF p_frequencia = 'quinzenal' THEN
        v_proxima := v_proxima + INTERVAL '14 days';
      ELSIF p_frequencia = 'mensal' THEN
        v_proxima := v_proxima + INTERVAL '1 month';
      ELSE
        v_proxima := v_proxima + INTERVAL '7 days';
      END IF;
    END IF;
    
    RETURN v_proxima;
  END IF;

  -- Fallback para lógica antiga caso dia_semana seja nulo
  v_proxima := ((v_data::text || ' ' || p_horario::text)::timestamp AT TIME ZONE 'America/Sao_Paulo');
  
  IF v_proxima <= p_referencia THEN
    v_proxima := v_proxima + CASE p_frequencia
      WHEN 'semanal' THEN INTERVAL '7 days'
      WHEN 'quinzenal' THEN INTERVAL '15 days'
      WHEN 'mensal' THEN INTERVAL '1 month'
      ELSE INTERVAL '7 days'
    END;
  END IF;
  
  RETURN v_proxima;
END;
$function$;

-- Revoga execução pública e concede apenas para authenticated e service_role
REVOKE ALL ON FUNCTION public.calcular_proxima_execucao_backup(text, time without time zone, timestamp with time zone, integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.calcular_proxima_execucao_backup(text, time without time zone, timestamp with time zone, integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.calcular_proxima_execucao_backup(text, time without time zone, timestamp with time zone, integer) TO service_role;