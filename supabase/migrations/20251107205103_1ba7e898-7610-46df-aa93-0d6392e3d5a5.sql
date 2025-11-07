
-- Corrigir colunas corretas nas tabelas
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
    EXTRACT(DAY FROM (
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
    ))::INTEGER as dias_ate_aniversario,
    c.observacoes::TEXT
  FROM clientes c
  WHERE c.usuario_id = auth.uid()
    AND c.data_aniversario IS NOT NULL
    AND (mes_param IS NULL OR EXTRACT(MONTH FROM c.data_aniversario) = mes_param)
  
  UNION ALL
  
  -- Familiares de Clientes (usa data_nascimento)
  SELECT 
    f.id,
    f.nome::TEXT,
    'familiar'::TEXT as tipo,
    COALESCE(f.parentesco, 'Familiar')::TEXT as referencia,
    f.data_nascimento as data_aniversario,
    NULL::TEXT as telefone,
    NULL::TEXT as email,
    (
      DATE_TRUNC('year', CURRENT_DATE) + 
      (EXTRACT(MONTH FROM f.data_nascimento) || ' months')::INTERVAL + 
      (EXTRACT(DAY FROM f.data_nascimento) - 1 || ' days')::INTERVAL
    )::DATE + 
    CASE 
      WHEN (
        DATE_TRUNC('year', CURRENT_DATE) + 
        (EXTRACT(MONTH FROM f.data_nascimento) || ' months')::INTERVAL + 
        (EXTRACT(DAY FROM f.data_nascimento) - 1 || ' days')::INTERVAL
      )::DATE < CURRENT_DATE 
      THEN INTERVAL '1 year'
      ELSE INTERVAL '0 days'
    END as proximo_aniversario,
    EXTRACT(DAY FROM (
      (
        DATE_TRUNC('year', CURRENT_DATE) + 
        (EXTRACT(MONTH FROM f.data_nascimento) || ' months')::INTERVAL + 
        (EXTRACT(DAY FROM f.data_nascimento) - 1 || ' days')::INTERVAL
      )::DATE + 
      CASE 
        WHEN (
          DATE_TRUNC('year', CURRENT_DATE) + 
          (EXTRACT(MONTH FROM f.data_nascimento) || ' months')::INTERVAL + 
          (EXTRACT(DAY FROM f.data_nascimento) - 1 || ' days')::INTERVAL
        )::DATE < CURRENT_DATE 
        THEN INTERVAL '1 year'
        ELSE INTERVAL '0 days'
      END - CURRENT_DATE
    ))::INTEGER as dias_ate_aniversario,
    f.observacoes::TEXT
  FROM cliente_familiares f
  WHERE f.usuario_id = auth.uid()
    AND f.data_nascimento IS NOT NULL
    AND (mes_param IS NULL OR EXTRACT(MONTH FROM f.data_nascimento) = mes_param)
  
  UNION ALL
  
  -- Contatos de Fornecedores
  SELECT 
    fc.id,
    fc.nome::TEXT,
    'contato_fornecedor'::TEXT as tipo,
    COALESCE(fc.cargo, 'Contato')::TEXT as referencia,
    fc.data_aniversario,
    fc.telefone::TEXT,
    fc.email::TEXT,
    (
      DATE_TRUNC('year', CURRENT_DATE) + 
      (EXTRACT(MONTH FROM fc.data_aniversario) || ' months')::INTERVAL + 
      (EXTRACT(DAY FROM fc.data_aniversario) - 1 || ' days')::INTERVAL
    )::DATE + 
    CASE 
      WHEN (
        DATE_TRUNC('year', CURRENT_DATE) + 
        (EXTRACT(MONTH FROM fc.data_aniversario) || ' months')::INTERVAL + 
        (EXTRACT(DAY FROM fc.data_aniversario) - 1 || ' days')::INTERVAL
      )::DATE < CURRENT_DATE 
      THEN INTERVAL '1 year'
      ELSE INTERVAL '0 days'
    END as proximo_aniversario,
    EXTRACT(DAY FROM (
      (
        DATE_TRUNC('year', CURRENT_DATE) + 
        (EXTRACT(MONTH FROM fc.data_aniversario) || ' months')::INTERVAL + 
        (EXTRACT(DAY FROM fc.data_aniversario) - 1 || ' days')::INTERVAL
      )::DATE + 
      CASE 
        WHEN (
          DATE_TRUNC('year', CURRENT_DATE) + 
          (EXTRACT(MONTH FROM fc.data_aniversario) || ' months')::INTERVAL + 
          (EXTRACT(DAY FROM fc.data_aniversario) - 1 || ' days')::INTERVAL
        )::DATE < CURRENT_DATE 
        THEN INTERVAL '1 year'
        ELSE INTERVAL '0 days'
      END - CURRENT_DATE
    ))::INTEGER as dias_ate_aniversario,
    fc.observacoes::TEXT
  FROM fornecedor_contatos fc
  WHERE fc.usuario_id = auth.uid()
    AND fc.data_aniversario IS NOT NULL
    AND (mes_param IS NULL OR EXTRACT(MONTH FROM fc.data_aniversario) = mes_param)
  
  ORDER BY proximo_aniversario;
END;
$$;
