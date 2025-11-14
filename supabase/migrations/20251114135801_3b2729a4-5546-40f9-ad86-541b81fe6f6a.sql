-- Atualizar função para criar tipos de documentos padrão como DESABILITADOS
CREATE OR REPLACE FUNCTION public.criar_tipos_documentos_padrao(p_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO tipos_documento (usuario_id, codigo, descricao, e_padrao, habilitado, ativo) VALUES
  (p_user_id, 1, 'Boleto Bancário', true, false, false),
  (p_user_id, 2, 'Cartão de Crédito', true, false, false),
  (p_user_id, 3, 'Cartão de Débito', true, false, false),
  (p_user_id, 4, 'Cheque', true, false, false),
  (p_user_id, 5, 'Depósito Bancário', true, false, false),
  (p_user_id, 6, 'Dinheiro', true, false, false),
  (p_user_id, 7, 'DOC', true, false, false),
  (p_user_id, 8, 'Nota Fiscal', true, false, false),
  (p_user_id, 9, 'Nota Promissória', true, false, false),
  (p_user_id, 10, 'PIX', true, false, false),
  (p_user_id, 11, 'Recibo', true, false, false),
  (p_user_id, 12, 'TED', true, false, false),
  (p_user_id, 13, 'Transferência Bancária', true, false, false),
  (p_user_id, 14, 'Vale', true, false, false)
  ON CONFLICT (usuario_id, codigo) DO NOTHING;
END;
$function$;

-- Atualizar tipos existentes para desabilitado (caso já existam)
UPDATE tipos_documento
SET habilitado = false, ativo = false
WHERE habilitado IS NULL OR ativo IS NULL;