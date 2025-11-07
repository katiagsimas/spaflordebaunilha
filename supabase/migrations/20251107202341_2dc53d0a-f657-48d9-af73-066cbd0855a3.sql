-- Função corrigida para deletar dados seletivamente (desabilitando triggers via session_replication_role)
DROP FUNCTION IF EXISTS public.deletar_cadastros_seletivo(UUID, JSONB);

CREATE OR REPLACE FUNCTION public.deletar_cadastros_seletivo(
  p_user_id UUID,
  p_selecao JSONB
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_resultado JSONB := '{}'::JSONB;
  v_count INTEGER;
  v_old_role TEXT;
BEGIN
  -- Salvar configuração atual e desabilitar triggers
  SELECT current_setting('session_replication_role') INTO v_old_role;
  PERFORM set_config('session_replication_role', 'replica', true);
  
  -- MÓDULO: PRECIFICAÇÃO
  
  -- Ingredientes (tabela itens com tipo = 'ingrediente')
  IF (p_selecao->>'ingredientes')::BOOLEAN THEN
    DELETE FROM precos WHERE item_id IN (
      SELECT id FROM itens WHERE usuario_id = p_user_id AND tipo = 'ingrediente'
    );
    DELETE FROM itens WHERE usuario_id = p_user_id AND tipo = 'ingrediente';
    GET DIAGNOSTICS v_count = ROW_COUNT;
    v_resultado := v_resultado || jsonb_build_object('ingredientes_deletados', v_count);
  END IF;
  
  -- Embalagens (tabela itens com tipo = 'embalagem')
  IF (p_selecao->>'embalagens')::BOOLEAN THEN
    DELETE FROM precos WHERE item_id IN (
      SELECT id FROM itens WHERE usuario_id = p_user_id AND tipo = 'embalagem'
    );
    DELETE FROM itens WHERE usuario_id = p_user_id AND tipo = 'embalagem';
    GET DIAGNOSTICS v_count = ROW_COUNT;
    v_resultado := v_resultado || jsonb_build_object('embalagens_deletadas', v_count);
  END IF;
  
  -- Pré-preparos
  IF (p_selecao->>'prePreparos')::BOOLEAN THEN
    DELETE FROM pre_preparos WHERE usuario_id = p_user_id;
    GET DIAGNOSTICS v_count = ROW_COUNT;
    v_resultado := v_resultado || jsonb_build_object('pre_preparos_deletados', v_count);
  END IF;
  
  -- Sub-receitas
  IF (p_selecao->>'subReceitas')::BOOLEAN THEN
    DELETE FROM sub_receitas WHERE usuario_id = p_user_id;
    GET DIAGNOSTICS v_count = ROW_COUNT;
    v_resultado := v_resultado || jsonb_build_object('sub_receitas_deletadas', v_count);
  END IF;
  
  -- Receitas
  IF (p_selecao->>'receitas')::BOOLEAN THEN
    DELETE FROM receitas_embalagens WHERE receita_id IN (
      SELECT id FROM receitas WHERE usuario_id = p_user_id
    );
    DELETE FROM receitas_despesas_venda WHERE receita_id IN (
      SELECT id FROM receitas WHERE usuario_id = p_user_id
    );
    DELETE FROM receitas WHERE usuario_id = p_user_id;
    GET DIAGNOSTICS v_count = ROW_COUNT;
    v_resultado := v_resultado || jsonb_build_object('receitas_deletadas', v_count);
  END IF;
  
  -- Custos Fixos
  IF (p_selecao->>'custosFixos')::BOOLEAN THEN
    DELETE FROM custos_fixos WHERE usuario_id = p_user_id;
    GET DIAGNOSTICS v_count = ROW_COUNT;
    v_resultado := v_resultado || jsonb_build_object('custos_fixos_deletados', v_count);
  END IF;
  
  -- Mão de Obra
  IF (p_selecao->>'maoObra')::BOOLEAN THEN
    DELETE FROM configuracao_mao_obra WHERE user_id = p_user_id;
    GET DIAGNOSTICS v_count = ROW_COUNT;
    v_resultado := v_resultado || jsonb_build_object('mao_obra_deletada', v_count);
  END IF;
  
  -- Preços
  IF (p_selecao->>'precos')::BOOLEAN THEN
    DELETE FROM precos WHERE usuario_id = p_user_id;
    GET DIAGNOSTICS v_count = ROW_COUNT;
    v_resultado := v_resultado || jsonb_build_object('precos_deletados', v_count);
  END IF;
  
  -- MÓDULO: ESTOQUE
  
  -- Itens de Estoque (todos os tipos)
  IF (p_selecao->>'itensEstoque')::BOOLEAN THEN
    DELETE FROM precos WHERE usuario_id = p_user_id;
    DELETE FROM itens WHERE usuario_id = p_user_id;
    GET DIAGNOSTICS v_count = ROW_COUNT;
    v_resultado := v_resultado || jsonb_build_object('itens_estoque_deletados', v_count);
  END IF;
  
  -- MÓDULO: ENCOMENDAS
  
  IF (p_selecao->>'encomendas')::BOOLEAN THEN
    DELETE FROM encomenda_itens WHERE usuario_id = p_user_id;
    DELETE FROM encomendas WHERE usuario_id = p_user_id;
    GET DIAGNOSTICS v_count = ROW_COUNT;
    v_resultado := v_resultado || jsonb_build_object('encomendas_deletadas', v_count);
  END IF;
  
  -- Tags de Encomendas
  IF (p_selecao->>'tagsEncomendas')::BOOLEAN THEN
    DELETE FROM tags_encomendas WHERE user_id = p_user_id;
    GET DIAGNOSTICS v_count = ROW_COUNT;
    v_resultado := v_resultado || jsonb_build_object('tags_encomendas_deletadas', v_count);
  END IF;
  
  -- MÓDULO: PRODUÇÃO
  
  IF (p_selecao->>'producao')::BOOLEAN THEN
    DELETE FROM producao_tarefas WHERE usuario_id = p_user_id;
    GET DIAGNOSTICS v_count = ROW_COUNT;
    v_resultado := v_resultado || jsonb_build_object('producao_tarefas_deletadas', v_count);
  END IF;
  
  -- MÓDULO: CLIENTES
  
  IF (p_selecao->>'clientes')::BOOLEAN THEN
    DELETE FROM cliente_familiares WHERE usuario_id = p_user_id;
    DELETE FROM clientes WHERE usuario_id = p_user_id;
    GET DIAGNOSTICS v_count = ROW_COUNT;
    v_resultado := v_resultado || jsonb_build_object('clientes_deletados', v_count);
  END IF;
  
  -- MÓDULO: FORNECEDORES
  
  IF (p_selecao->>'fornecedores')::BOOLEAN THEN
    DELETE FROM fornecedores WHERE usuario_id = p_user_id;
    GET DIAGNOSTICS v_count = ROW_COUNT;
    v_resultado := v_resultado || jsonb_build_object('fornecedores_deletados', v_count);
  END IF;
  
  -- MÓDULO: FINANCEIRO
  
  -- Contas a Receber
  IF (p_selecao->>'contasReceber')::BOOLEAN THEN
    DELETE FROM contas_receber_parcelas WHERE conta_receber_id IN (
      SELECT id FROM contas_receber WHERE usuario_id = p_user_id
    );
    DELETE FROM contas_receber WHERE usuario_id = p_user_id;
    GET DIAGNOSTICS v_count = ROW_COUNT;
    v_resultado := v_resultado || jsonb_build_object('contas_receber_deletadas', v_count);
  END IF;
  
  -- Contas a Pagar
  IF (p_selecao->>'contasPagar')::BOOLEAN THEN
    DELETE FROM contas_pagar_pagamentos WHERE parcela_id IN (
      SELECT par.id FROM contas_pagar_parcelas par
      JOIN contas_pagar c ON c.id = par.conta_pagar_id
      WHERE c.usuario_id = p_user_id
    );
    DELETE FROM contas_pagar_parcelas WHERE conta_pagar_id IN (
      SELECT id FROM contas_pagar WHERE usuario_id = p_user_id
    );
    DELETE FROM contas_pagar WHERE usuario_id = p_user_id;
    GET DIAGNOSTICS v_count = ROW_COUNT;
    v_resultado := v_resultado || jsonb_build_object('contas_pagar_deletadas', v_count);
  END IF;
  
  -- Plano de Contas (DELETAR TODOS, incluindo padrão sistema)
  IF (p_selecao->>'planoContas')::BOOLEAN THEN
    DELETE FROM plano_contas WHERE user_id = p_user_id;
    GET DIAGNOSTICS v_count = ROW_COUNT;
    v_resultado := v_resultado || jsonb_build_object('plano_contas_deletado', v_count);
  END IF;
  
  -- Categorias Plano Contas (DELETAR TODOS, incluindo padrão sistema)
  IF (p_selecao->>'categoriasPlanoContas')::BOOLEAN THEN
    -- Deletar plano_contas associado primeiro (se ainda não foi)
    IF NOT (p_selecao->>'planoContas')::BOOLEAN THEN
      DELETE FROM plano_contas WHERE categoria_id IN (
        SELECT id FROM categorias_plano_contas WHERE user_id = p_user_id
      );
    END IF;
    
    DELETE FROM categorias_plano_contas WHERE user_id = p_user_id;
    GET DIAGNOSTICS v_count = ROW_COUNT;
    v_resultado := v_resultado || jsonb_build_object('categorias_plano_deletadas', v_count);
  END IF;
  
  -- MÓDULO: BANCO
  
  IF (p_selecao->>'banco')::BOOLEAN THEN
    DELETE FROM bank_matches WHERE bank_entry_id IN (
      SELECT be.id FROM bank_entries be
      JOIN bank_imports bi ON bi.id = be.import_id
      WHERE bi.usuario_id = p_user_id
    );
    DELETE FROM bank_entries WHERE import_id IN (
      SELECT id FROM bank_imports WHERE usuario_id = p_user_id
    );
    DELETE FROM bank_imports WHERE usuario_id = p_user_id;
    GET DIAGNOSTICS v_count = ROW_COUNT;
    v_resultado := v_resultado || jsonb_build_object('banco_deletado', v_count);
  END IF;
  
  -- Bancos (DELETAR TODOS)
  IF (p_selecao->>'bancos')::BOOLEAN THEN
    DELETE FROM bancos WHERE usuario_id = p_user_id;
    GET DIAGNOSTICS v_count = ROW_COUNT;
    v_resultado := v_resultado || jsonb_build_object('bancos_deletados', v_count);
  END IF;
  
  -- MÓDULO: CONFIGURAÇÕES
  
  -- Categorias de Receitas
  IF (p_selecao->>'categorias')::BOOLEAN THEN
    DELETE FROM categorias WHERE usuario_id = p_user_id;
    GET DIAGNOSTICS v_count = ROW_COUNT;
    v_resultado := v_resultado || jsonb_build_object('categorias_deletadas', v_count);
  END IF;
  
  -- Unidades de Medida (DELETAR TODAS, incluindo padrão sistema)
  IF (p_selecao->>'unidadesMedida')::BOOLEAN THEN
    DELETE FROM unidades_medida WHERE usuario_id = p_user_id;
    GET DIAGNOSTICS v_count = ROW_COUNT;
    v_resultado := v_resultado || jsonb_build_object('unidades_medida_deletadas', v_count);
  END IF;
  
  -- Tipos de Documento (DELETAR TODOS, incluindo padrão sistema)
  IF (p_selecao->>'tiposDocumento')::BOOLEAN THEN
    DELETE FROM tipos_documento WHERE usuario_id = p_user_id;
    GET DIAGNOSTICS v_count = ROW_COUNT;
    v_resultado := v_resultado || jsonb_build_object('tipos_documento_deletados', v_count);
  END IF;
  
  -- Planejamento de Vendas
  IF (p_selecao->>'planejamentoVendas')::BOOLEAN THEN
    DELETE FROM planejamento_vendas WHERE usuario_id = p_user_id;
    GET DIAGNOSTICS v_count = ROW_COUNT;
    v_resultado := v_resultado || jsonb_build_object('planejamento_vendas_deletado', v_count);
  END IF;
  
  -- Configuração de Juros
  IF (p_selecao->>'configuracaoJuros')::BOOLEAN THEN
    DELETE FROM configuracoes_juros WHERE usuario_id = p_user_id;
    GET DIAGNOSTICS v_count = ROW_COUNT;
    v_resultado := v_resultado || jsonb_build_object('configuracao_juros_deletada', v_count);
  END IF;
  
  -- Restaurar configuração de triggers
  PERFORM set_config('session_replication_role', v_old_role, true);
  
  RETURN v_resultado;
  
EXCEPTION
  WHEN OTHERS THEN
    -- Em caso de erro, restaurar configuração de triggers
    PERFORM set_config('session_replication_role', v_old_role, true);
    RAISE;
END;
$$;