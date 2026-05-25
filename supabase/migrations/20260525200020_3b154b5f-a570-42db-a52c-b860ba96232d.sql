SET session_replication_role = 'replica';

DO $$
DECLARE
  v_admin uuid;
BEGIN
  SELECT id INTO v_admin FROM public.profiles WHERE email = 'katiagsimas@gmail.com' LIMIT 1;
  IF v_admin IS NULL THEN RAISE EXCEPTION 'Admin não encontrado'; END IF;

  DELETE FROM public.contas_pagar_comprovantes WHERE pagamento_id IN (SELECT pag.id FROM public.contas_pagar_pagamentos pag JOIN public.contas_pagar_parcelas par ON par.id=pag.parcela_id JOIN public.contas_pagar c ON c.id=par.conta_pagar_id WHERE c.usuario_id<>v_admin);
  DELETE FROM public.contas_pagar_pagamentos WHERE parcela_id IN (SELECT par.id FROM public.contas_pagar_parcelas par JOIN public.contas_pagar c ON c.id=par.conta_pagar_id WHERE c.usuario_id<>v_admin);
  DELETE FROM public.contas_pagar_parcelas WHERE conta_pagar_id IN (SELECT id FROM public.contas_pagar WHERE usuario_id<>v_admin);
  DELETE FROM public.contas_pagar WHERE usuario_id<>v_admin;
  DELETE FROM public.contas_receber_comprovantes WHERE pagamento_id IN (SELECT pag.id FROM public.contas_receber_pagamentos pag JOIN public.contas_receber_parcelas par ON par.id=pag.parcela_id JOIN public.contas_receber c ON c.id=par.conta_receber_id WHERE c.usuario_id<>v_admin);
  DELETE FROM public.contas_receber_pagamentos WHERE parcela_id IN (SELECT par.id FROM public.contas_receber_parcelas par JOIN public.contas_receber c ON c.id=par.conta_receber_id WHERE c.usuario_id<>v_admin);
  DELETE FROM public.contas_receber_parcelas WHERE conta_receber_id IN (SELECT id FROM public.contas_receber WHERE usuario_id<>v_admin);
  DELETE FROM public.contas_receber WHERE usuario_id<>v_admin;
  DELETE FROM public.encomendas_tags WHERE encomenda_id IN (SELECT id FROM public.encomendas WHERE usuario_id<>v_admin);
  DELETE FROM public.encomenda_itens WHERE usuario_id<>v_admin;
  DELETE FROM public.encomendas WHERE usuario_id<>v_admin;
  DELETE FROM public.estoque_movimentacoes WHERE usuario_id<>v_admin;
  DELETE FROM public.estoque WHERE usuario_id<>v_admin;
  DELETE FROM public.cliente_familiares WHERE usuario_id<>v_admin;
  DELETE FROM public.clientes WHERE usuario_id<>v_admin;
  DELETE FROM public.fornecedor_contatos WHERE usuario_id<>v_admin;
  DELETE FROM public.fornecedores WHERE usuario_id<>v_admin;
  DELETE FROM public.receitas WHERE usuario_id<>v_admin;
  DELETE FROM public.pre_preparos WHERE usuario_id<>v_admin;
  DELETE FROM public.ingredientes WHERE usuario_id<>v_admin;
  DELETE FROM public.embalagens WHERE usuario_id<>v_admin;
  DELETE FROM public.transferencias_bancos WHERE usuario_id<>v_admin;
  DELETE FROM public.saldos_iniciais_bancos WHERE user_id<>v_admin;
  DELETE FROM public.bancos WHERE usuario_id<>v_admin;
  DELETE FROM public.mao_obra_perfis_historico WHERE user_id<>v_admin;
  DELETE FROM public.mao_obra_perfis WHERE user_id<>v_admin;
  DELETE FROM public.meu_salario_retiradas WHERE user_id<>v_admin;
  DELETE FROM public.planejamento_tarefas WHERE user_id<>v_admin;
  DELETE FROM public.planejamento_descanso WHERE user_id<>v_admin;
  DELETE FROM public.fechamento_logs WHERE usuario_id<>v_admin;
  DELETE FROM public.configuracoes_juros WHERE usuario_id<>v_admin;
  DELETE FROM public.categorias WHERE usuario_id<>v_admin;
  DELETE FROM public.categorias_plano_contas WHERE user_id<>v_admin;
  DELETE FROM public.plano_contas WHERE user_id<>v_admin;
  DELETE FROM public.tags WHERE user_id<>v_admin;
  DELETE FROM public.tags_encomendas WHERE user_id<>v_admin;
  DELETE FROM public.tipos_documento WHERE usuario_id<>v_admin;
  DELETE FROM public.tipos_insumos WHERE usuario_id<>v_admin;
  DELETE FROM public.unidades_medida WHERE usuario_id<>v_admin;
  DELETE FROM public.custos_fixos WHERE usuario_id<>v_admin;
  DELETE FROM public.backup_agendamentos WHERE usuario_id<>v_admin;
  DELETE FROM public.backups WHERE usuario_id<>v_admin;
  DELETE FROM public.historico_planos WHERE user_id<>v_admin;
  DELETE FROM public.admin_logs WHERE usuario_afetado_id IS NOT NULL AND usuario_afetado_id<>v_admin;
  DELETE FROM public.user_active_session WHERE user_id<>v_admin;
  DELETE FROM public.user_group_roles WHERE user_id<>v_admin;
  DELETE FROM public.user_global_roles WHERE user_id<>v_admin;
  DELETE FROM public.user_roles WHERE user_id<>v_admin;
  DELETE FROM public.profiles WHERE id<>v_admin;
  DELETE FROM auth.identities WHERE user_id<>v_admin;
  DELETE FROM auth.sessions WHERE user_id<>v_admin;
  DELETE FROM auth.refresh_tokens WHERE user_id::uuid<>v_admin;
  DELETE FROM auth.users WHERE id<>v_admin;
END $$;

SET session_replication_role = 'origin';