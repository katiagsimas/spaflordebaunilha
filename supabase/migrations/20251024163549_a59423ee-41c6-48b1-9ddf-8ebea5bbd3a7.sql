-- Criar função para deletar cadastros de usuário (mantendo configurações)
CREATE OR REPLACE FUNCTION public.deletar_cadastros_usuario(p_user_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Deletar encomenda_itens primeiro (por causa de FK)
  DELETE FROM encomenda_itens WHERE usuario_id = p_user_id;
  
  -- Deletar encomendas_tags (por causa de FK)
  DELETE FROM encomendas_tags WHERE encomenda_id IN (
    SELECT id FROM encomendas WHERE usuario_id = p_user_id
  );
  
  -- Deletar encomendas
  DELETE FROM encomendas WHERE usuario_id = p_user_id;
  
  -- Deletar contas_receber_comprovantes (por causa de FK)
  DELETE FROM contas_receber_comprovantes WHERE pagamento_id IN (
    SELECT p.id FROM contas_receber_pagamentos p
    JOIN contas_receber_parcelas par ON par.id = p.parcela_id
    JOIN contas_receber c ON c.id = par.conta_receber_id
    WHERE c.usuario_id = p_user_id
  );
  
  -- Deletar contas_receber_pagamentos
  DELETE FROM contas_receber_pagamentos WHERE parcela_id IN (
    SELECT par.id FROM contas_receber_parcelas par
    JOIN contas_receber c ON c.id = par.conta_receber_id
    WHERE c.usuario_id = p_user_id
  );
  
  -- Deletar contas_receber_parcelas
  DELETE FROM contas_receber_parcelas WHERE conta_receber_id IN (
    SELECT id FROM contas_receber WHERE usuario_id = p_user_id
  );
  
  -- Deletar contas_receber
  DELETE FROM contas_receber WHERE usuario_id = p_user_id;
  
  -- Deletar contas_pagar_comprovantes
  DELETE FROM contas_pagar_comprovantes WHERE pagamento_id IN (
    SELECT p.id FROM contas_pagar_pagamentos p
    JOIN contas_pagar_parcelas par ON par.id = p.parcela_id
    JOIN contas_pagar c ON c.id = par.conta_pagar_id
    WHERE c.usuario_id = p_user_id
  );
  
  -- Deletar contas_pagar_pagamentos
  DELETE FROM contas_pagar_pagamentos WHERE parcela_id IN (
    SELECT par.id FROM contas_pagar_parcelas par
    JOIN contas_pagar c ON c.id = par.conta_pagar_id
    WHERE c.usuario_id = p_user_id
  );
  
  -- Deletar contas_pagar_parcelas
  DELETE FROM contas_pagar_parcelas WHERE conta_pagar_id IN (
    SELECT id FROM contas_pagar WHERE usuario_id = p_user_id
  );
  
  -- Deletar contas_pagar
  DELETE FROM contas_pagar WHERE usuario_id = p_user_id;
  
  -- Deletar movimentações de estoque
  DELETE FROM movimentacoes_estoque WHERE usuario_id = p_user_id;
  
  -- Deletar entradas detalhadas
  DELETE FROM entradas_detalhadas WHERE usuario_id = p_user_id;
  
  -- Deletar estoque atual
  DELETE FROM estoque_atual WHERE usuario_id = p_user_id;
  
  -- Deletar receitas (sub_receitas tem FK para receitas)
  DELETE FROM receitas WHERE usuario_id = p_user_id;
  
  -- Deletar sub_receitas
  DELETE FROM sub_receitas WHERE usuario_id = p_user_id;
  
  -- Deletar ingredientes
  DELETE FROM ingredientes WHERE usuario_id = p_user_id;
  
  -- Deletar embalagens
  DELETE FROM embalagens WHERE usuario_id = p_user_id;
  
  -- Deletar clientes
  DELETE FROM clientes WHERE usuario_id = p_user_id;
  
  -- Deletar fornecedores
  DELETE FROM fornecedores WHERE usuario_id = p_user_id;
  
  -- Deletar categorias personalizadas (não padrão)
  DELETE FROM categorias WHERE usuario_id = p_user_id;
  
  -- Deletar CMV mensal
  DELETE FROM cmv_mensal WHERE usuario_id = p_user_id;
END;
$$;

-- Permitir que admins executem esta função
GRANT EXECUTE ON FUNCTION public.deletar_cadastros_usuario(UUID) TO authenticated;