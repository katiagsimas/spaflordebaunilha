-- Lock down deletar_cadastros_usuario: only admins or service_role can call it
CREATE OR REPLACE FUNCTION public.deletar_cadastros_usuario(p_user_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- Admin guard: only admins (or service_role with NULL auth.uid()) may execute
  IF auth.uid() IS NOT NULL AND NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Acesso negado: apenas administradores podem executar esta operação';
  END IF;

  -- 1. Deletar encomenda_itens primeiro (dados transacionais)
  DELETE FROM encomenda_itens WHERE usuario_id = p_user_id;
  DELETE FROM encomendas_tags WHERE encomenda_id IN (SELECT id FROM encomendas WHERE usuario_id = p_user_id);
  DELETE FROM encomendas WHERE usuario_id = p_user_id;

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
  DELETE FROM contas_receber_parcelas WHERE conta_receber_id IN (SELECT id FROM contas_receber WHERE usuario_id = p_user_id);
  DELETE FROM contas_receber WHERE usuario_id = p_user_id;

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
  DELETE FROM contas_pagar_parcelas WHERE conta_pagar_id IN (SELECT id FROM contas_pagar WHERE usuario_id = p_user_id);
  DELETE FROM contas_pagar WHERE usuario_id = p_user_id;

  DELETE FROM receitas_ingredientes WHERE receita_id IN (SELECT id FROM receitas WHERE usuario_id = p_user_id);
  DELETE FROM receitas_embalagens WHERE receita_id IN (SELECT id FROM receitas WHERE usuario_id = p_user_id);
  DELETE FROM receitas WHERE usuario_id = p_user_id;

  DELETE FROM sub_receitas_ingredientes WHERE sub_receita_id IN (SELECT id FROM sub_receitas WHERE usuario_id = p_user_id);
  DELETE FROM sub_receitas WHERE usuario_id = p_user_id;

  DELETE FROM pre_preparos_ingredientes WHERE pre_preparo_id IN (SELECT id FROM pre_preparos WHERE usuario_id = p_user_id);
  DELETE FROM ingredientes WHERE usuario_id = p_user_id;
  DELETE FROM embalagens WHERE usuario_id = p_user_id;

  UPDATE tipos_insumos SET pre_preparo_id = NULL WHERE usuario_id = p_user_id AND pre_preparo_id IS NOT NULL;
  DELETE FROM pre_preparos WHERE usuario_id = p_user_id;
  DELETE FROM tipos_insumos WHERE usuario_id = p_user_id;

  DELETE FROM clientes WHERE usuario_id = p_user_id;
  DELETE FROM fornecedores WHERE usuario_id = p_user_id;

  DELETE FROM categorias WHERE usuario_id = p_user_id;
  DELETE FROM cmv_mensal WHERE usuario_id = p_user_id;
  DELETE FROM custos_fixos WHERE usuario_id = p_user_id;
END;
$function$;

-- Revoke from authenticated, grant only to service_role
REVOKE EXECUTE ON FUNCTION public.deletar_cadastros_usuario(uuid) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.deletar_cadastros_usuario(uuid) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.deletar_cadastros_usuario(uuid) TO service_role;