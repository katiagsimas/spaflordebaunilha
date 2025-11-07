-- Função unificada para buscar TODOS os aniversariantes (clientes, familiares e contatos de fornecedores)
CREATE OR REPLACE FUNCTION get_todos_aniversariantes(mes_param INTEGER DEFAULT NULL)
RETURNS TABLE (
  id UUID,
  nome TEXT,
  tipo TEXT,
  referencia TEXT,
  data_aniversario DATE,
  telefone VARCHAR(20),
  email VARCHAR(200),
  proximo_aniversario DATE,
  dias_ate_aniversario INTEGER,
  observacoes TEXT
) 
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  -- Clientes e Familiares
  SELECT 
    v.cliente_id as id,
    v.nome,
    v.tipo,
    CASE 
      WHEN v.tipo = 'familiar' THEN COALESCE(v.parentesco, 'Familiar')
      ELSE 'Cliente'
    END as referencia,
    v.data_nascimento as data_aniversario,
    v.telefone,
    v.email,
    v.proximo_aniversario,
    (v.proximo_aniversario - CURRENT_DATE)::INTEGER as dias_ate_aniversario,
    v.observacoes
  FROM v_aniversariantes_completa v
  WHERE v.usuario_id = auth.uid()
    AND (mes_param IS NULL OR v.mes_aniversario = mes_param)
  
  UNION ALL
  
  -- Contatos de Fornecedores
  SELECT 
    v.fornecedor_id as id,
    v.nome,
    'contato_fornecedor' as tipo,
    COALESCE(v.cargo, 'Contato') as referencia,
    v.data_aniversario,
    v.telefone,
    v.email,
    v.proximo_aniversario,
    (v.proximo_aniversario - CURRENT_DATE)::INTEGER as dias_ate_aniversario,
    v.observacoes
  FROM v_aniversariantes_fornecedores v
  WHERE v.usuario_id = auth.uid()
    AND (mes_param IS NULL OR v.mes_aniversario = mes_param)
  
  ORDER BY proximo_aniversario;
END;
$$ LANGUAGE plpgsql;