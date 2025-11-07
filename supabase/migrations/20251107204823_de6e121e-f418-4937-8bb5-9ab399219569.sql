
-- Drop e recriar a função get_todos_aniversariantes com tipos corretos
DROP FUNCTION IF EXISTS get_todos_aniversariantes(integer);

CREATE OR REPLACE FUNCTION get_todos_aniversariantes(mes_param INTEGER DEFAULT NULL)
RETURNS TABLE (
  id UUID,
  nome TEXT,
  tipo TEXT,
  referencia TEXT,
  data_aniversario DATE,
  telefone TEXT,
  email TEXT,
  proximo_aniversario DATE,
  dias_ate_aniversario INTEGER,
  observacoes TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  -- Clientes
  SELECT 
    c.id,
    c.nome::TEXT,
    'cliente'::TEXT as tipo,
    'Cliente'::TEXT as referencia,
    c.data_aniversario,
    c.telefone::TEXT,
    c.email::TEXT,
    (
      DATE_TRUNC('year', CURRENT_DATE) + 
      (EXTRACT(MONTH FROM c.data_aniversario) || ' months')::INTERVAL + 
      (EXTRACT(DAY FROM c.data_aniversario) - 1 || ' days')::INTERVAL
    )::DATE + 
    CASE 
      WHEN (
        DATE_TRUNC('year', CURRENT_DATE) + 
        (EXTRACT(MONTH FROM c.data_aniversario) || ' months')::INTERVAL + 
        (EXTRACT(DAY FROM c.data_aniversario) - 1 || ' days')::INTERVAL
      )::DATE < CURRENT_DATE 
      THEN INTERVAL '1 year'
      ELSE INTERVAL '0 days'
    END as proximo_aniversario,
    (
      (
        DATE_TRUNC('year', CURRENT_DATE) + 
        (EXTRACT(MONTH FROM c.data_aniversario) || ' months')::INTERVAL + 
        (EXTRACT(DAY FROM c.data_aniversario) - 1 || ' days')::INTERVAL
      )::DATE + 
      CASE 
        WHEN (
          DATE_TRUNC('year', CURRENT_DATE) + 
          (EXTRACT(MONTH FROM c.data_aniversario) || ' months')::INTERVAL + 
          (EXTRACT(DAY FROM c.data_aniversario) - 1 || ' days')::INTERVAL
        )::DATE < CURRENT_DATE 
        THEN INTERVAL '1 year'
        ELSE INTERVAL '0 days'
      END - CURRENT_DATE
    )::INTEGER as dias_ate_aniversario,
    c.observacoes::TEXT
  FROM clientes c
  WHERE c.usuario_id = auth.uid()
    AND c.data_aniversario IS NOT NULL
    AND (mes_param IS NULL OR EXTRACT(MONTH FROM c.data_aniversario) = mes_param)
  
  UNION ALL
  
  -- Familiares (se a tabela existir)
  SELECT 
    f.id,
    f.nome::TEXT,
    'familiar'::TEXT as tipo,
    COALESCE(f.parentesco, 'Familiar')::TEXT as referencia,
    f.data_aniversario,
    f.telefone_celular::TEXT as telefone,
    f.email::TEXT,
    (
      DATE_TRUNC('year', CURRENT_DATE) + 
      (EXTRACT(MONTH FROM f.data_aniversario) || ' months')::INTERVAL + 
      (EXTRACT(DAY FROM f.data_aniversario) - 1 || ' days')::INTERVAL
    )::DATE + 
    CASE 
      WHEN (
        DATE_TRUNC('year', CURRENT_DATE) + 
        (EXTRACT(MONTH FROM f.data_aniversario) || ' months')::INTERVAL + 
        (EXTRACT(DAY FROM f.data_aniversario) - 1 || ' days')::INTERVAL
      )::DATE < CURRENT_DATE 
      THEN INTERVAL '1 year'
      ELSE INTERVAL '0 days'
    END as proximo_aniversario,
    (
      (
        DATE_TRUNC('year', CURRENT_DATE) + 
        (EXTRACT(MONTH FROM f.data_aniversario) || ' months')::INTERVAL + 
        (EXTRACT(DAY FROM f.data_aniversario) - 1 || ' days')::INTERVAL
      )::DATE + 
      CASE 
        WHEN (
          DATE_TRUNC('year', CURRENT_DATE) + 
          (EXTRACT(MONTH FROM f.data_aniversario) || ' months')::INTERVAL + 
          (EXTRACT(DAY FROM f.data_aniversario) - 1 || ' days')::INTERVAL
        )::DATE < CURRENT_DATE 
        THEN INTERVAL '1 year'
        ELSE INTERVAL '0 days'
      END - CURRENT_DATE
    )::INTEGER as dias_ate_aniversario,
    NULL::TEXT as observacoes
  FROM familiares_clientes f
  INNER JOIN clientes c ON c.id = f.cliente_id
  WHERE c.usuario_id = auth.uid()
    AND f.data_aniversario IS NOT NULL
    AND (mes_param IS NULL OR EXTRACT(MONTH FROM f.data_aniversario) = mes_param)
  
  UNION ALL
  
  -- Contatos de Fornecedores
  SELECT 
    cf.id,
    cf.nome::TEXT,
    'contato_fornecedor'::TEXT as tipo,
    COALESCE(cf.cargo, 'Contato')::TEXT as referencia,
    cf.data_aniversario,
    cf.telefone::TEXT,
    cf.email::TEXT,
    (
      DATE_TRUNC('year', CURRENT_DATE) + 
      (EXTRACT(MONTH FROM cf.data_aniversario) || ' months')::INTERVAL + 
      (EXTRACT(DAY FROM cf.data_aniversario) - 1 || ' days')::INTERVAL
    )::DATE + 
    CASE 
      WHEN (
        DATE_TRUNC('year', CURRENT_DATE) + 
        (EXTRACT(MONTH FROM cf.data_aniversario) || ' months')::INTERVAL + 
        (EXTRACT(DAY FROM cf.data_aniversario) - 1 || ' days')::INTERVAL
      )::DATE < CURRENT_DATE 
      THEN INTERVAL '1 year'
      ELSE INTERVAL '0 days'
    END as proximo_aniversario,
    (
      (
        DATE_TRUNC('year', CURRENT_DATE) + 
        (EXTRACT(MONTH FROM cf.data_aniversario) || ' months')::INTERVAL + 
        (EXTRACT(DAY FROM cf.data_aniversario) - 1 || ' days')::INTERVAL
      )::DATE + 
      CASE 
        WHEN (
          DATE_TRUNC('year', CURRENT_DATE) + 
          (EXTRACT(MONTH FROM cf.data_aniversario) || ' months')::INTERVAL + 
          (EXTRACT(DAY FROM cf.data_aniversario) - 1 || ' days')::INTERVAL
        )::DATE < CURRENT_DATE 
        THEN INTERVAL '1 year'
        ELSE INTERVAL '0 days'
      END - CURRENT_DATE
    )::INTEGER as dias_ate_aniversario,
    cf.observacoes::TEXT
  FROM contatos_fornecedores cf
  INNER JOIN fornecedores f ON f.id = cf.fornecedor_id
  WHERE f.usuario_id = auth.uid()
    AND cf.data_aniversario IS NOT NULL
    AND (mes_param IS NULL OR EXTRACT(MONTH FROM cf.data_aniversario) = mes_param)
  
  ORDER BY proximo_aniversario;
END;
$$;
