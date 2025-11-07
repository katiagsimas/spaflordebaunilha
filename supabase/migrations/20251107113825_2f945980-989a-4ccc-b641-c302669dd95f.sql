-- =====================================================
-- HELPER FUNCTIONS
-- =====================================================

-- Function: is_admin - Verifica se usuário é admin
CREATE OR REPLACE FUNCTION public.is_admin(check_user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = check_user_id
    AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: log_admin_action - Helper para registrar ações de forma padronizada
CREATE OR REPLACE FUNCTION public.log_admin_action(
  p_admin_id UUID,
  p_action TEXT,
  p_target_user_id UUID DEFAULT NULL,
  p_module TEXT DEFAULT NULL,
  p_details JSONB DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
  INSERT INTO public.admin_audit_log (
    admin_id,
    target_user_id,
    action,
    module,
    old_value,
    new_value,
    reason,
    created_at
  ) VALUES (
    p_admin_id,
    p_target_user_id,
    p_action,
    p_module,
    NULL,
    p_details,
    NULL,
    NOW()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- TOKEN MANAGEMENT FUNCTIONS
-- =====================================================

-- Function: generate_admin_access_token - Gera token temporário (2 horas)
CREATE OR REPLACE FUNCTION public.generate_admin_access_token(
  p_target_user_id UUID,
  p_admin_id UUID,
  p_reason TEXT
)
RETURNS JSON AS $$
DECLARE
  v_token TEXT;
  v_expires_at TIMESTAMPTZ;
  v_target_email TEXT;
BEGIN
  -- Validar admin
  IF NOT public.is_admin(p_admin_id) THEN
    RAISE EXCEPTION 'Unauthorized: User is not admin';
  END IF;
  
  -- Validar motivo
  IF p_reason IS NULL OR LENGTH(TRIM(p_reason)) < 10 THEN
    RAISE EXCEPTION 'Reason must be at least 10 characters';
  END IF;
  
  -- Gerar token seguro
  v_token := encode(gen_random_bytes(32), 'hex');
  v_expires_at := NOW() + INTERVAL '2 hours';
  
  -- Buscar email da usuária
  SELECT email INTO v_target_email
  FROM auth.users
  WHERE id = p_target_user_id;
  
  IF v_target_email IS NULL THEN
    RAISE EXCEPTION 'Target user not found';
  END IF;
  
  -- Inserir token
  INSERT INTO public.admin_access_tokens (
    id, admin_id, target_user_id, token, reason, expires_at, created_at
  ) VALUES (
    gen_random_uuid(), p_admin_id, p_target_user_id, 
    v_token, p_reason, v_expires_at, NOW()
  );
  
  -- Registrar no audit log
  PERFORM public.log_admin_action(
    p_admin_id,
    'impersonate_start',
    p_target_user_id,
    'admin',
    json_build_object(
      'reason', p_reason,
      'expires_at', v_expires_at
    )::jsonb
  );
  
  -- Retornar dados do token
  RETURN json_build_object(
    'token', v_token,
    'expires_at', v_expires_at,
    'target_user_email', v_target_email,
    'target_user_id', p_target_user_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: validate_admin_token - Valida se token é válido
CREATE OR REPLACE FUNCTION public.validate_admin_token(p_token TEXT)
RETURNS JSON AS $$
DECLARE
  v_token_data RECORD;
BEGIN
  -- Buscar token
  SELECT * INTO v_token_data
  FROM public.admin_access_tokens
  WHERE token = p_token;
  
  -- Token não existe
  IF NOT FOUND THEN
    RETURN json_build_object('valid', false, 'error', 'Token não encontrado');
  END IF;
  
  -- Token revogado
  IF v_token_data.revoked_at IS NOT NULL THEN
    RETURN json_build_object('valid', false, 'error', 'Token revogado');
  END IF;
  
  -- Token expirado
  IF v_token_data.expires_at < NOW() THEN
    RETURN json_build_object('valid', false, 'error', 'Token expirado');
  END IF;
  
  -- Token válido
  RETURN json_build_object(
    'valid', true,
    'target_user_id', v_token_data.target_user_id,
    'admin_id', v_token_data.admin_id,
    'reason', v_token_data.reason,
    'expires_at', v_token_data.expires_at
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: revoke_admin_token - Revoga token de acesso
CREATE OR REPLACE FUNCTION public.revoke_admin_token(p_token TEXT)
RETURNS VOID AS $$
DECLARE
  v_token_data RECORD;
BEGIN
  -- Buscar dados do token
  SELECT * INTO v_token_data
  FROM public.admin_access_tokens
  WHERE token = p_token;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Token não encontrado';
  END IF;
  
  -- Revogar token
  UPDATE public.admin_access_tokens
  SET revoked_at = NOW()
  WHERE token = p_token;
  
  -- Registrar log de revogação
  PERFORM public.log_admin_action(
    v_token_data.admin_id,
    'impersonate_end',
    v_token_data.target_user_id,
    'admin',
    json_build_object('revoked', true, 'token_id', v_token_data.id)::jsonb
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- USER DELETION FUNCTIONS
-- =====================================================

-- Function: soft_delete_user - Marca usuária para exclusão (30 dias)
CREATE OR REPLACE FUNCTION public.soft_delete_user(
  p_user_id UUID,
  p_admin_id UUID
)
RETURNS VOID AS $$
DECLARE
  v_user_data RECORD;
  v_backup_data JSONB;
BEGIN
  -- Validar admin
  IF NOT public.is_admin(p_admin_id) THEN
    RAISE EXCEPTION 'Unauthorized: User is not admin';
  END IF;
  
  -- Buscar dados da usuária
  SELECT 
    u.id,
    u.email,
    (SELECT COUNT(*) FROM public.encomendas WHERE usuario_id = p_user_id) as encomendas_count,
    (SELECT COUNT(*) FROM public.receitas WHERE usuario_id = p_user_id) as receitas_count,
    (SELECT COUNT(*) FROM public.clientes WHERE usuario_id = p_user_id) as clientes_count
  INTO v_user_data
  FROM auth.users u
  WHERE u.id = p_user_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'User not found';
  END IF;
  
  -- Criar backup
  v_backup_data := json_build_object(
    'user_id', v_user_data.id,
    'email', v_user_data.email,
    'encomendas_count', v_user_data.encomendas_count,
    'receitas_count', v_user_data.receitas_count,
    'clientes_count', v_user_data.clientes_count,
    'soft_deleted_at', NOW()
  )::jsonb;
  
  INSERT INTO public.deleted_data_backup (
    user_id,
    data,
    deleted_by,
    permanent_delete_at,
    deleted_at
  ) VALUES (
    p_user_id,
    v_backup_data,
    p_admin_id,
    NOW() + INTERVAL '90 days',
    NOW()
  );
  
  -- Registrar log
  PERFORM public.log_admin_action(
    p_admin_id,
    'soft_delete',
    p_user_id,
    'admin',
    json_build_object('backup_created', true, 'summary', v_backup_data)::jsonb
  );
  
  RAISE NOTICE 'User % soft deleted. Backup created.', v_user_data.email;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: hard_delete_user_data - Deleta permanentemente dados da usuária
CREATE OR REPLACE FUNCTION public.hard_delete_user_data(
  p_user_id UUID,
  p_admin_id UUID
)
RETURNS JSON AS $$
DECLARE
  v_deleted_counts JSONB;
  v_count INTEGER;
BEGIN
  -- Validar admin
  IF NOT public.is_admin(p_admin_id) THEN
    RAISE EXCEPTION 'Unauthorized: User is not admin';
  END IF;
  
  -- Criar backup completo antes de deletar
  INSERT INTO public.deleted_data_backup (
    user_id,
    data,
    deleted_by,
    permanent_delete_at
  )
  SELECT 
    p_user_id,
    json_build_object(
      'user_id', p_user_id,
      'deleted_at', NOW(),
      'hard_delete', true
    )::jsonb,
    p_admin_id,
    NOW() + INTERVAL '90 days';
  
  -- Inicializar contadores
  v_deleted_counts := '{}'::jsonb;
  
  -- Deletar em cascata (ordem importante!)
  
  -- 1. Encomendas
  DELETE FROM public.encomenda_itens WHERE usuario_id = p_user_id;
  GET DIAGNOSTICS v_count = ROW_COUNT;
  v_deleted_counts := v_deleted_counts || json_build_object('encomenda_itens', v_count)::jsonb;
  
  DELETE FROM public.encomendas_tags WHERE encomenda_id IN (
    SELECT id FROM public.encomendas WHERE usuario_id = p_user_id
  );
  GET DIAGNOSTICS v_count = ROW_COUNT;
  v_deleted_counts := v_deleted_counts || json_build_object('encomendas_tags', v_count)::jsonb;
  
  DELETE FROM public.encomendas WHERE usuario_id = p_user_id;
  GET DIAGNOSTICS v_count = ROW_COUNT;
  v_deleted_counts := v_deleted_counts || json_build_object('encomendas', v_count)::jsonb;
  
  -- 2. Estoque
  DELETE FROM public.movimentacoes_estoque WHERE usuario_id = p_user_id;
  GET DIAGNOSTICS v_count = ROW_COUNT;
  v_deleted_counts := v_deleted_counts || json_build_object('movimentacoes_estoque', v_count)::jsonb;
  
  DELETE FROM public.entradas_detalhadas WHERE usuario_id = p_user_id;
  GET DIAGNOSTICS v_count = ROW_COUNT;
  v_deleted_counts := v_deleted_counts || json_build_object('entradas_detalhadas', v_count)::jsonb;
  
  DELETE FROM public.estoque_atual WHERE usuario_id = p_user_id;
  GET DIAGNOSTICS v_count = ROW_COUNT;
  v_deleted_counts := v_deleted_counts || json_build_object('estoque_atual', v_count)::jsonb;
  
  -- 3. Receitas
  DELETE FROM public.receitas_ingredientes WHERE receita_id IN (
    SELECT id FROM public.receitas WHERE usuario_id = p_user_id
  );
  GET DIAGNOSTICS v_count = ROW_COUNT;
  v_deleted_counts := v_deleted_counts || json_build_object('receitas_ingredientes', v_count)::jsonb;
  
  DELETE FROM public.receitas_embalagens WHERE receita_id IN (
    SELECT id FROM public.receitas WHERE usuario_id = p_user_id
  );
  GET DIAGNOSTICS v_count = ROW_COUNT;
  v_deleted_counts := v_deleted_counts || json_build_object('receitas_embalagens', v_count)::jsonb;
  
  DELETE FROM public.receitas WHERE usuario_id = p_user_id;
  GET DIAGNOSTICS v_count = ROW_COUNT;
  v_deleted_counts := v_deleted_counts || json_build_object('receitas', v_count)::jsonb;
  
  -- 4. Pré-preparos
  DELETE FROM public.pre_preparos_ingredientes WHERE pre_preparo_id IN (
    SELECT id FROM public.pre_preparos WHERE usuario_id = p_user_id
  );
  GET DIAGNOSTICS v_count = ROW_COUNT;
  v_deleted_counts := v_deleted_counts || json_build_object('pre_preparos_ingredientes', v_count)::jsonb;
  
  DELETE FROM public.pre_preparos WHERE usuario_id = p_user_id;
  GET DIAGNOSTICS v_count = ROW_COUNT;
  v_deleted_counts := v_deleted_counts || json_build_object('pre_preparos', v_count)::jsonb;
  
  -- 5. Sub-receitas
  DELETE FROM public.sub_receitas_ingredientes WHERE sub_receita_id IN (
    SELECT id FROM public.sub_receitas WHERE usuario_id = p_user_id
  );
  GET DIAGNOSTICS v_count = ROW_COUNT;
  v_deleted_counts := v_deleted_counts || json_build_object('sub_receitas_ingredientes', v_count)::jsonb;
  
  DELETE FROM public.sub_receitas WHERE usuario_id = p_user_id;
  GET DIAGNOSTICS v_count = ROW_COUNT;
  v_deleted_counts := v_deleted_counts || json_build_object('sub_receitas', v_count)::jsonb;
  
  -- 6. Ingredientes e Embalagens
  DELETE FROM public.ingredientes WHERE usuario_id = p_user_id;
  GET DIAGNOSTICS v_count = ROW_COUNT;
  v_deleted_counts := v_deleted_counts || json_build_object('ingredientes', v_count)::jsonb;
  
  DELETE FROM public.embalagens WHERE usuario_id = p_user_id;
  GET DIAGNOSTICS v_count = ROW_COUNT;
  v_deleted_counts := v_deleted_counts || json_build_object('embalagens', v_count)::jsonb;
  
  -- 7. Clientes e Fornecedores
  DELETE FROM public.clientes WHERE usuario_id = p_user_id;
  GET DIAGNOSTICS v_count = ROW_COUNT;
  v_deleted_counts := v_deleted_counts || json_build_object('clientes', v_count)::jsonb;
  
  DELETE FROM public.fornecedores WHERE usuario_id = p_user_id;
  GET DIAGNOSTICS v_count = ROW_COUNT;
  v_deleted_counts := v_deleted_counts || json_build_object('fornecedores', v_count)::jsonb;
  
  -- 8. Financeiro - Contas a Receber
  DELETE FROM public.contas_receber_comprovantes WHERE pagamento_id IN (
    SELECT p.id FROM public.contas_receber_pagamentos p
    JOIN public.contas_receber_parcelas par ON par.id = p.parcela_id
    JOIN public.contas_receber c ON c.id = par.conta_receber_id
    WHERE c.usuario_id = p_user_id
  );
  GET DIAGNOSTICS v_count = ROW_COUNT;
  v_deleted_counts := v_deleted_counts || json_build_object('contas_receber_comprovantes', v_count)::jsonb;
  
  DELETE FROM public.contas_receber_pagamentos WHERE parcela_id IN (
    SELECT par.id FROM public.contas_receber_parcelas par
    JOIN public.contas_receber c ON c.id = par.conta_receber_id
    WHERE c.usuario_id = p_user_id
  );
  GET DIAGNOSTICS v_count = ROW_COUNT;
  v_deleted_counts := v_deleted_counts || json_build_object('contas_receber_pagamentos', v_count)::jsonb;
  
  DELETE FROM public.contas_receber_parcelas WHERE conta_receber_id IN (
    SELECT id FROM public.contas_receber WHERE usuario_id = p_user_id
  );
  GET DIAGNOSTICS v_count = ROW_COUNT;
  v_deleted_counts := v_deleted_counts || json_build_object('contas_receber_parcelas', v_count)::jsonb;
  
  DELETE FROM public.contas_receber WHERE usuario_id = p_user_id;
  GET DIAGNOSTICS v_count = ROW_COUNT;
  v_deleted_counts := v_deleted_counts || json_build_object('contas_receber', v_count)::jsonb;
  
  -- 9. Financeiro - Contas a Pagar
  DELETE FROM public.contas_pagar_comprovantes WHERE pagamento_id IN (
    SELECT p.id FROM public.contas_pagar_pagamentos p
    JOIN public.contas_pagar_parcelas par ON par.id = p.parcela_id
    JOIN public.contas_pagar c ON c.id = par.conta_pagar_id
    WHERE c.usuario_id = p_user_id
  );
  GET DIAGNOSTICS v_count = ROW_COUNT;
  v_deleted_counts := v_deleted_counts || json_build_object('contas_pagar_comprovantes', v_count)::jsonb;
  
  DELETE FROM public.contas_pagar_pagamentos WHERE parcela_id IN (
    SELECT par.id FROM public.contas_pagar_parcelas par
    JOIN public.contas_pagar c ON c.id = par.conta_pagar_id
    WHERE c.usuario_id = p_user_id
  );
  GET DIAGNOSTICS v_count = ROW_COUNT;
  v_deleted_counts := v_deleted_counts || json_build_object('contas_pagar_pagamentos', v_count)::jsonb;
  
  DELETE FROM public.contas_pagar_parcelas WHERE conta_pagar_id IN (
    SELECT id FROM public.contas_pagar WHERE usuario_id = p_user_id
  );
  GET DIAGNOSTICS v_count = ROW_COUNT;
  v_deleted_counts := v_deleted_counts || json_build_object('contas_pagar_parcelas', v_count)::jsonb;
  
  DELETE FROM public.contas_pagar WHERE usuario_id = p_user_id;
  GET DIAGNOSTICS v_count = ROW_COUNT;
  v_deleted_counts := v_deleted_counts || json_build_object('contas_pagar', v_count)::jsonb;
  
  -- 10. Outros dados
  DELETE FROM public.categorias WHERE usuario_id = p_user_id;
  GET DIAGNOSTICS v_count = ROW_COUNT;
  v_deleted_counts := v_deleted_counts || json_build_object('categorias', v_count)::jsonb;
  
  DELETE FROM public.custos_fixos WHERE usuario_id = p_user_id;
  GET DIAGNOSTICS v_count = ROW_COUNT;
  v_deleted_counts := v_deleted_counts || json_build_object('custos_fixos', v_count)::jsonb;
  
  DELETE FROM public.producao_tarefas WHERE usuario_id = p_user_id;
  GET DIAGNOSTICS v_count = ROW_COUNT;
  v_deleted_counts := v_deleted_counts || json_build_object('producao_tarefas', v_count)::jsonb;
  
  -- Registrar log detalhado
  PERFORM public.log_admin_action(
    p_admin_id,
    'hard_delete',
    p_user_id,
    'admin',
    json_build_object('deleted_counts', v_deleted_counts)::jsonb
  );
  
  -- Retornar resumo
  RETURN json_build_object(
    'success', true,
    'user_id', p_user_id,
    'deleted_counts', v_deleted_counts
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- COMENTÁRIOS
-- =====================================================

COMMENT ON FUNCTION public.is_admin IS 'Verifica se usuário tem role de admin';
COMMENT ON FUNCTION public.log_admin_action IS 'Helper para registrar ações administrativas no audit log';
COMMENT ON FUNCTION public.generate_admin_access_token IS 'Gera token temporário de 2 horas para impersonation';
COMMENT ON FUNCTION public.validate_admin_token IS 'Valida se token de acesso ainda é válido';
COMMENT ON FUNCTION public.revoke_admin_token IS 'Revoga token de acesso ativo';
COMMENT ON FUNCTION public.soft_delete_user IS 'Marca usuária para exclusão com backup (90 dias de retenção)';
COMMENT ON FUNCTION public.hard_delete_user_data IS 'Deleta permanentemente todos os dados da usuária com backup';