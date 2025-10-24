-- CORRIGIR ordem de deleção: tipos_insumos referencia pre_preparos!
-- Precisamos deletar na ordem inversa das dependências
CREATE OR REPLACE FUNCTION public.deletar_cadastros_usuario(p_user_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- 1. Deletar encomenda_itens primeiro (dados transacionais)
  DELETE FROM encomenda_itens WHERE usuario_id = p_user_id;
  
  -- 2. Deletar encomendas_tags (relação)
  DELETE FROM encomendas_tags WHERE encomenda_id IN (
    SELECT id FROM encomendas WHERE usuario_id = p_user_id
  );
  
  -- 3. Deletar encomendas
  DELETE FROM encomendas WHERE usuario_id = p_user_id;
  
  -- 4. Deletar sistema financeiro (contas a receber)
  DELETE FROM contas_receber_comprovantes WHERE pagamento_id IN (
    SELECT p.id FROM contas_receber_pagamentos p
    JOIN contas_receber_parcelas par ON par.id = p.parcela_id
    JOIN contas_receber c ON c.id = par.conta_receber_id
    WHERE c.usuario_id = p_user_id
  );
  
  DELETE FROM contas_receber_pagamentos WHERE parcela_id IN (
    SELECT par.id FROM contas_receber_parcelas par
    JOIN contas_receber c ON c.id = par.conta_receber_id
    WHERE c.usuario_id = p_user_id
  );
  
  DELETE FROM contas_receber_parcelas WHERE conta_receber_id IN (
    SELECT id FROM contas_receber WHERE usuario_id = p_user_id
  );
  
  DELETE FROM contas_receber WHERE usuario_id = p_user_id;
  
  -- 5. Deletar sistema financeiro (contas a pagar)
  DELETE FROM contas_pagar_comprovantes WHERE pagamento_id IN (
    SELECT p.id FROM contas_pagar_pagamentos p
    JOIN contas_pagar_parcelas par ON par.id = p.parcela_id
    JOIN contas_pagar c ON c.id = par.conta_pagar_id
    WHERE c.usuario_id = p_user_id
  );
  
  DELETE FROM contas_pagar_pagamentos WHERE parcela_id IN (
    SELECT par.id FROM contas_pagar_parcelas par
    JOIN contas_pagar c ON c.id = par.conta_pagar_id
    WHERE c.usuario_id = p_user_id
  );
  
  DELETE FROM contas_pagar_parcelas WHERE conta_pagar_id IN (
    SELECT id FROM contas_pagar WHERE usuario_id = p_user_id
  );
  
  DELETE FROM contas_pagar WHERE usuario_id = p_user_id;
  
  -- 6. Deletar sistema de estoque
  DELETE FROM movimentacoes_estoque WHERE usuario_id = p_user_id;
  DELETE FROM entradas_detalhadas WHERE usuario_id = p_user_id;
  DELETE FROM estoque_atual WHERE usuario_id = p_user_id;
  
  -- 7. Deletar relacionamentos de receitas (antes das receitas)
  DELETE FROM receitas_ingredientes WHERE receita_id IN (
    SELECT id FROM receitas WHERE usuario_id = p_user_id
  );
  
  DELETE FROM receitas_embalagens WHERE receita_id IN (
    SELECT id FROM receitas WHERE usuario_id = p_user_id
  );
  
  -- 8. Deletar receitas
  DELETE FROM receitas WHERE usuario_id = p_user_id;
  
  -- 9. Deletar relacionamentos de sub_receitas
  DELETE FROM sub_receitas_ingredientes WHERE sub_receita_id IN (
    SELECT id FROM sub_receitas WHERE usuario_id = p_user_id
  );
  
  -- 10. Deletar sub_receitas
  DELETE FROM sub_receitas WHERE usuario_id = p_user_id;
  
  -- 11. Deletar relacionamentos de pre_preparos (ANTES de pre_preparos e ingredientes)
  DELETE FROM pre_preparos_ingredientes WHERE pre_preparo_id IN (
    SELECT id FROM pre_preparos WHERE usuario_id = p_user_id
  );
  
  -- 12. Deletar ingredientes (referencia tipos_insumos)
  DELETE FROM ingredientes WHERE usuario_id = p_user_id;
  
  -- 13. Deletar embalagens (referencia tipos_insumos)
  DELETE FROM embalagens WHERE usuario_id = p_user_id;
  
  -- 14. AGORA deletar tipos_insumos (referencia pre_preparos, mas pre_preparo_id pode ser NULL)
  -- Primeiro limpar a referência para pre_preparos
  UPDATE tipos_insumos 
  SET pre_preparo_id = NULL 
  WHERE usuario_id = p_user_id AND pre_preparo_id IS NOT NULL;
  
  -- 15. Deletar pré-preparos (após limpar referências de tipos_insumos)
  DELETE FROM pre_preparos WHERE usuario_id = p_user_id;
  
  -- 16. FINALMENTE deletar tipos_insumos (sem conflitos agora)
  DELETE FROM tipos_insumos WHERE usuario_id = p_user_id;
  
  -- 17. Deletar dados cadastrais
  DELETE FROM clientes WHERE usuario_id = p_user_id;
  DELETE FROM fornecedores WHERE usuario_id = p_user_id;
  
  -- 18. Deletar configurações do usuário (mantém as base do sistema)
  DELETE FROM categorias WHERE usuario_id = p_user_id;
  DELETE FROM categorias_estoque WHERE usuario_id = p_user_id;
  DELETE FROM cmv_mensal WHERE usuario_id = p_user_id;
  DELETE FROM custos_fixos WHERE usuario_id = p_user_id;
  
END;
$$;