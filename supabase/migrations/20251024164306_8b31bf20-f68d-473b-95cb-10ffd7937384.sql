-- Corrigir função para não tocar em tipos_insumos (configuração do sistema)
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
  
  -- Deletar receitas_ingredientes e embalagens (FK para receitas)
  DELETE FROM receitas_ingredientes WHERE receita_id IN (
    SELECT id FROM receitas WHERE usuario_id = p_user_id
  );
  
  DELETE FROM receitas_embalagens WHERE receita_id IN (
    SELECT id FROM receitas WHERE usuario_id = p_user_id
  );
  
  -- Deletar sub_receitas_ingredientes (FK para sub_receitas)
  DELETE FROM sub_receitas_ingredientes WHERE sub_receita_id IN (
    SELECT id FROM sub_receitas WHERE usuario_id = p_user_id
  );
  
  -- Deletar pre_preparos_ingredientes ANTES de deletar pre_preparos e ingredientes
  DELETE FROM pre_preparos_ingredientes WHERE pre_preparo_id IN (
    SELECT id FROM pre_preparos WHERE usuario_id = p_user_id
  );
  
  -- Deletar pré-preparos (antes de ingredientes pois pode ter FK)
  DELETE FROM pre_preparos WHERE usuario_id = p_user_id;
  
  -- Deletar receitas
  DELETE FROM receitas WHERE usuario_id = p_user_id;
  
  -- Deletar sub_receitas
  DELETE FROM sub_receitas WHERE usuario_id = p_user_id;
  
  -- Deletar ingredientes (IMPORTANTE: tipos_insumos NÃO será deletado, é configuração)
  DELETE FROM ingredientes WHERE usuario_id = p_user_id;
  
  -- Deletar embalagens (IMPORTANTE: tipos_insumos NÃO será deletado, é configuração)
  DELETE FROM embalagens WHERE usuario_id = p_user_id;
  
  -- Deletar clientes
  DELETE FROM clientes WHERE usuario_id = p_user_id;
  
  -- Deletar fornecedores
  DELETE FROM fornecedores WHERE usuario_id = p_user_id;
  
  -- Deletar categorias personalizadas (apenas as não-padrão se houver flag)
  DELETE FROM categorias WHERE usuario_id = p_user_id;
  
  -- Deletar categorias de estoque do usuário
  DELETE FROM categorias_estoque WHERE usuario_id = p_user_id;
  
  -- Deletar CMV mensal
  DELETE FROM cmv_mensal WHERE usuario_id = p_user_id;
  
  -- Deletar custos fixos
  DELETE FROM custos_fixos WHERE usuario_id = p_user_id;
  
  -- NOTA: Não deletar tipos_insumos, unidades_medida, tags_encomendas, 
  -- plano_contas, categorias_plano_contas, bancos, tipos_documento
  -- pois são configurações do sistema que devem ser mantidas
  
END;
$$;