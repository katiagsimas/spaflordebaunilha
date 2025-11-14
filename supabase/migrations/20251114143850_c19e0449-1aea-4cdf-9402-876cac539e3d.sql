-- Criar função para inserir tipos de documentos padrão para um usuário
CREATE OR REPLACE FUNCTION public.criar_tipos_documento_padrao_para_usuario(p_usuario_id UUID)
RETURNS void AS $$
BEGIN
  -- Verifica se o usuário já possui tipos de documento
  IF NOT EXISTS (SELECT 1 FROM public.tipos_documento WHERE usuario_id = p_usuario_id) THEN
    -- Insere os tipos de documento padrão com habilitado = false
    INSERT INTO public.tipos_documento (usuario_id, codigo, descricao, e_padrao, habilitado, ativo)
    VALUES
      (p_usuario_id, 1, 'Nota Fiscal', true, false, true),
      (p_usuario_id, 2, 'Recibo', true, false, true),
      (p_usuario_id, 3, 'Cupom Fiscal', true, false, true),
      (p_usuario_id, 4, 'Boleto', true, false, true),
      (p_usuario_id, 5, 'Transferência Bancária', true, false, true),
      (p_usuario_id, 6, 'PIX', true, false, true),
      (p_usuario_id, 7, 'Cheque', true, false, true),
      (p_usuario_id, 8, 'Cartão de Crédito', true, false, true),
      (p_usuario_id, 9, 'Cartão de Débito', true, false, true),
      (p_usuario_id, 10, 'Dinheiro', true, false, true),
      (p_usuario_id, 11, 'Nota Promissória', true, false, true),
      (p_usuario_id, 12, 'Duplicata', true, false, true);
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;