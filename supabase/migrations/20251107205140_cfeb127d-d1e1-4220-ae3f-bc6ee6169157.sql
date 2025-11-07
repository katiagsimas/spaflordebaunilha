
-- Simplificar função get_todos_aniversariantes
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
DECLARE
  v_prox_aniv DATE;
BEGIN
  RETURN QUERY
  -- Clientes
  SELECT 
    c.id,
    c.nome::TEXT,
    'cliente'::TEXT,
    'Cliente'::TEXT,
    c.data_aniversario,
    c.telefone::TEXT,
    c.email::TEXT,
    (make_date(EXTRACT(YEAR FROM CURRENT_DATE)::int, EXTRACT(MONTH FROM c.data_aniversario)::int, EXTRACT(DAY FROM c.data_aniversario)::int) + 
     CASE WHEN make_date(EXTRACT(YEAR FROM CURRENT_DATE)::int, EXTRACT(MONTH FROM c.data_aniversario)::int, EXTRACT(DAY FROM c.data_aniversario)::int) < CURRENT_DATE 
          THEN INTERVAL '1 year' ELSE INTERVAL '0' END)::DATE,
    (make_date(EXTRACT(YEAR FROM CURRENT_DATE)::int, EXTRACT(MONTH FROM c.data_aniversario)::int, EXTRACT(DAY FROM c.data_aniversario)::int) + 
     CASE WHEN make_date(EXTRACT(YEAR FROM CURRENT_DATE)::int, EXTRACT(MONTH FROM c.data_aniversario)::int, EXTRACT(DAY FROM c.data_aniversario)::int) < CURRENT_DATE 
          THEN INTERVAL '1 year' ELSE INTERVAL '0' END - CURRENT_DATE)::INTEGER,
    c.observacoes::TEXT
  FROM clientes c
  WHERE c.usuario_id = auth.uid()
    AND c.data_aniversario IS NOT NULL
    AND (mes_param IS NULL OR EXTRACT(MONTH FROM c.data_aniversario) = mes_param)
  
  UNION ALL
  
  SELECT 
    f.id,
    f.nome::TEXT,
    'familiar'::TEXT,
    COALESCE(f.parentesco, 'Familiar')::TEXT,
    f.data_nascimento,
    NULL::TEXT,
    NULL::TEXT,
    (make_date(EXTRACT(YEAR FROM CURRENT_DATE)::int, EXTRACT(MONTH FROM f.data_nascimento)::int, EXTRACT(DAY FROM f.data_nascimento)::int) + 
     CASE WHEN make_date(EXTRACT(YEAR FROM CURRENT_DATE)::int, EXTRACT(MONTH FROM f.data_nascimento)::int, EXTRACT(DAY FROM f.data_nascimento)::int) < CURRENT_DATE 
          THEN INTERVAL '1 year' ELSE INTERVAL '0' END)::DATE,
    (make_date(EXTRACT(YEAR FROM CURRENT_DATE)::int, EXTRACT(MONTH FROM f.data_nascimento)::int, EXTRACT(DAY FROM f.data_nascimento)::int) + 
     CASE WHEN make_date(EXTRACT(YEAR FROM CURRENT_DATE)::int, EXTRACT(MONTH FROM f.data_nascimento)::int, EXTRACT(DAY FROM f.data_nascimento)::int) < CURRENT_DATE 
          THEN INTERVAL '1 year' ELSE INTERVAL '0' END - CURRENT_DATE)::INTEGER,
    f.observacoes::TEXT
  FROM cliente_familiares f
  WHERE f.usuario_id = auth.uid()
    AND f.data_nascimento IS NOT NULL
    AND (mes_param IS NULL OR EXTRACT(MONTH FROM f.data_nascimento) = mes_param)
  
  UNION ALL
  
  SELECT 
    fc.id,
    fc.nome::TEXT,
    'contato_fornecedor'::TEXT,
    COALESCE(fc.cargo, 'Contato')::TEXT,
    fc.data_aniversario,
    fc.telefone::TEXT,
    fc.email::TEXT,
    (make_date(EXTRACT(YEAR FROM CURRENT_DATE)::int, EXTRACT(MONTH FROM fc.data_aniversario)::int, EXTRACT(DAY FROM fc.data_aniversario)::int) + 
     CASE WHEN make_date(EXTRACT(YEAR FROM CURRENT_DATE)::int, EXTRACT(MONTH FROM fc.data_aniversario)::int, EXTRACT(DAY FROM fc.data_aniversario)::int) < CURRENT_DATE 
          THEN INTERVAL '1 year' ELSE INTERVAL '0' END)::DATE,
    (make_date(EXTRACT(YEAR FROM CURRENT_DATE)::int, EXTRACT(MONTH FROM fc.data_aniversario)::int, EXTRACT(DAY FROM fc.data_aniversario)::int) + 
     CASE WHEN make_date(EXTRACT(YEAR FROM CURRENT_DATE)::int, EXTRACT(MONTH FROM fc.data_aniversario)::int, EXTRACT(DAY FROM fc.data_aniversario)::int) < CURRENT_DATE 
          THEN INTERVAL '1 year' ELSE INTERVAL '0' END - CURRENT_DATE)::INTEGER,
    fc.observacoes::TEXT
  FROM fornecedor_contatos fc
  WHERE fc.usuario_id = auth.uid()
    AND fc.data_aniversario IS NOT NULL
    AND (mes_param IS NULL OR EXTRACT(MONTH FROM fc.data_aniversario) = mes_param)
  
  ORDER BY 8;
END;
$$;
