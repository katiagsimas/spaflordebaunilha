-- Corrigir a função get_aniversariantes_mes para retornar os tipos corretos
DROP FUNCTION IF EXISTS get_aniversariantes_mes(integer);

CREATE OR REPLACE FUNCTION get_aniversariantes_mes(mes_param integer)
RETURNS TABLE (
  cliente_id uuid,
  nome text,
  tipo text,
  parentesco text,
  data_nascimento date,
  telefone text,
  dias_ate_aniversario integer
) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  -- Aniversariantes de clientes
  SELECT 
    c.id as cliente_id,
    c.nome::text as nome,
    'cliente'::text as tipo,
    NULL::text as parentesco,
    c.data_aniversario as data_nascimento,
    c.telefone::text as telefone,
    CASE 
      WHEN EXTRACT(MONTH FROM c.data_aniversario) = mes_param THEN
        CASE
          WHEN EXTRACT(DAY FROM c.data_aniversario) >= EXTRACT(DAY FROM CURRENT_DATE) 
               AND EXTRACT(MONTH FROM c.data_aniversario) = EXTRACT(MONTH FROM CURRENT_DATE) THEN
            CAST(EXTRACT(DAY FROM c.data_aniversario) - EXTRACT(DAY FROM CURRENT_DATE) AS integer)
          WHEN EXTRACT(MONTH FROM c.data_aniversario) > EXTRACT(MONTH FROM CURRENT_DATE) THEN
            CAST(EXTRACT(DAY FROM c.data_aniversario) + 
                 (DATE_TRUNC('month', CURRENT_DATE + INTERVAL '1 month') - CURRENT_DATE)::integer AS integer)
          ELSE 365
        END
      ELSE 365
    END as dias_ate_aniversario
  FROM clientes c
  WHERE c.usuario_id = auth.uid()
    AND c.data_aniversario IS NOT NULL
    AND EXTRACT(MONTH FROM c.data_aniversario) = mes_param
  
  UNION ALL
  
  -- Aniversariantes de familiares
  SELECT 
    cf.cliente_id,
    cf.nome::text as nome,
    'familiar'::text as tipo,
    cf.parentesco::text as parentesco,
    cf.data_nascimento,
    c.telefone::text as telefone,
    CASE 
      WHEN EXTRACT(MONTH FROM cf.data_nascimento) = mes_param THEN
        CASE
          WHEN EXTRACT(DAY FROM cf.data_nascimento) >= EXTRACT(DAY FROM CURRENT_DATE) 
               AND EXTRACT(MONTH FROM cf.data_nascimento) = EXTRACT(MONTH FROM CURRENT_DATE) THEN
            CAST(EXTRACT(DAY FROM cf.data_nascimento) - EXTRACT(DAY FROM CURRENT_DATE) AS integer)
          WHEN EXTRACT(MONTH FROM cf.data_nascimento) > EXTRACT(MONTH FROM CURRENT_DATE) THEN
            CAST(EXTRACT(DAY FROM cf.data_nascimento) + 
                 (DATE_TRUNC('month', CURRENT_DATE + INTERVAL '1 month') - CURRENT_DATE)::integer AS integer)
          ELSE 365
        END
      ELSE 365
    END as dias_ate_aniversario
  FROM cliente_familiares cf
  JOIN clientes c ON c.id = cf.cliente_id
  WHERE cf.usuario_id = auth.uid()
    AND cf.ativo = true
    AND cf.data_nascimento IS NOT NULL
    AND EXTRACT(MONTH FROM cf.data_nascimento) = mes_param
  
  ORDER BY dias_ate_aniversario ASC, nome ASC;
END;
$$;