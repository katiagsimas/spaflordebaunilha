-- Drop the old version with mes_param
DROP FUNCTION IF EXISTS get_todos_aniversariantes(integer);

-- Ensure the correct version exists
DROP FUNCTION IF EXISTS get_todos_aniversariantes(uuid);

CREATE OR REPLACE FUNCTION get_todos_aniversariantes(p_tenant_id uuid)
RETURNS TABLE (
  id uuid,
  nome text,
  tipo text,
  data_aniversario date,
  dias_ate_aniversario integer,
  telefone text,
  cliente_nome text
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  -- Clientes
  SELECT 
    c.id,
    c.nome,
    'cliente'::text as tipo,
    c.data_aniversario,
    CASE 
      WHEN EXTRACT(DOY FROM c.data_aniversario) >= EXTRACT(DOY FROM CURRENT_DATE) 
      THEN EXTRACT(DOY FROM c.data_aniversario)::integer - EXTRACT(DOY FROM CURRENT_DATE)::integer
      ELSE (365 + EXTRACT(DOY FROM c.data_aniversario)::integer - EXTRACT(DOY FROM CURRENT_DATE)::integer)
    END as dias_ate_aniversario,
    c.telefone,
    NULL::text as cliente_nome
  FROM clientes c
  WHERE c.usuario_id = p_tenant_id
    AND c.data_aniversario IS NOT NULL
  
  UNION ALL
  
  -- Familiares de clientes
  SELECT 
    cf.id,
    cf.nome,
    'familiar'::text as tipo,
    cf.data_nascimento as data_aniversario,
    CASE 
      WHEN EXTRACT(DOY FROM cf.data_nascimento) >= EXTRACT(DOY FROM CURRENT_DATE) 
      THEN EXTRACT(DOY FROM cf.data_nascimento)::integer - EXTRACT(DOY FROM CURRENT_DATE)::integer
      ELSE (365 + EXTRACT(DOY FROM cf.data_nascimento)::integer - EXTRACT(DOY FROM CURRENT_DATE)::integer)
    END as dias_ate_aniversario,
    cf.telefone,
    c.nome as cliente_nome
  FROM cliente_familiares cf
  INNER JOIN clientes c ON c.id = cf.cliente_id
  WHERE c.usuario_id = p_tenant_id
    AND cf.data_nascimento IS NOT NULL
  
  UNION ALL
  
  -- Contatos de fornecedores
  SELECT 
    fc.id,
    fc.nome,
    'contato_fornecedor'::text as tipo,
    fc.data_aniversario,
    CASE 
      WHEN EXTRACT(DOY FROM fc.data_aniversario) >= EXTRACT(DOY FROM CURRENT_DATE) 
      THEN EXTRACT(DOY FROM fc.data_aniversario)::integer - EXTRACT(DOY FROM CURRENT_DATE)::integer
      ELSE (365 + EXTRACT(DOY FROM fc.data_aniversario)::integer - EXTRACT(DOY FROM CURRENT_DATE)::integer)
    END as dias_ate_aniversario,
    fc.telefone,
    NULL::text as cliente_nome
  FROM fornecedor_contatos fc
  INNER JOIN fornecedores f ON f.id = fc.fornecedor_id
  WHERE f.usuario_id = p_tenant_id
    AND fc.data_aniversario IS NOT NULL
  
  ORDER BY dias_ate_aniversario;
END;
$$;