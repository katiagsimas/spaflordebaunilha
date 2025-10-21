-- Função para gerar próximo código disponível
CREATE OR REPLACE FUNCTION gerar_proximo_codigo_categoria(p_user_id UUID)
RETURNS VARCHAR AS $$
DECLARE
  ultimo_codigo VARCHAR;
  proximo_numero INTEGER;
BEGIN
  -- Buscar maior código numérico do usuário
  SELECT codigo INTO ultimo_codigo
  FROM categorias_plano_contas
  WHERE user_id = p_user_id
    AND codigo ~ '^[0-9]+$' -- Apenas códigos numéricos
  ORDER BY CAST(codigo AS INTEGER) DESC
  LIMIT 1;
  
  -- Se não houver categorias, começar do 200
  IF ultimo_codigo IS NULL THEN
    RETURN '200';
  END IF;
  
  -- Calcular próximo número
  proximo_numero := CAST(ultimo_codigo AS INTEGER) + 1;
  
  -- Se for menor que 200, pular para 200 (reservar 1-199 para sistema)
  IF proximo_numero < 200 THEN
    proximo_numero := 200;
  END IF;
  
  RETURN proximo_numero::VARCHAR;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

COMMENT ON FUNCTION gerar_proximo_codigo_categoria IS 'Gera próximo código disponível para categoria customizada (200+)';