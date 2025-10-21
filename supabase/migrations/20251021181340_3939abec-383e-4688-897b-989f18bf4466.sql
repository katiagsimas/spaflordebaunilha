-- ==========================================
-- AJUSTAR TABELA: tipos_documento
-- ==========================================

-- Adicionar colunas faltantes
ALTER TABLE tipos_documento 
ADD COLUMN IF NOT EXISTS e_padrao BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS ativo BOOLEAN DEFAULT true;

-- Converter codigo de VARCHAR para INTEGER (se ainda não for)
-- Primeiro, garantir que todos os códigos sejam numéricos
DO $$ 
BEGIN
  -- Se a coluna codigo for VARCHAR, converter para INTEGER
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'tipos_documento' 
    AND column_name = 'codigo' 
    AND data_type = 'character varying'
  ) THEN
    -- Criar nova coluna temporária
    ALTER TABLE tipos_documento ADD COLUMN codigo_int INTEGER;
    
    -- Copiar valores numéricos
    UPDATE tipos_documento SET codigo_int = codigo::INTEGER WHERE codigo ~ '^[0-9]+$';
    
    -- Dropar coluna antiga e renomear
    ALTER TABLE tipos_documento DROP COLUMN codigo;
    ALTER TABLE tipos_documento RENAME COLUMN codigo_int TO codigo;
    
    -- Adicionar constraints
    ALTER TABLE tipos_documento ALTER COLUMN codigo SET NOT NULL;
  END IF;
END $$;

-- Garantir constraints únicos
DROP INDEX IF EXISTS unique_codigo_tipo_doc_por_usuario;
DROP INDEX IF EXISTS unique_descricao_tipo_doc_por_usuario;

CREATE UNIQUE INDEX IF NOT EXISTS unique_codigo_tipo_doc_por_usuario 
  ON tipos_documento(usuario_id, codigo);

CREATE UNIQUE INDEX IF NOT EXISTS unique_descricao_tipo_doc_por_usuario 
  ON tipos_documento(usuario_id, descricao);

-- Criar índices adicionais
CREATE INDEX IF NOT EXISTS idx_tipos_documento_ativo ON tipos_documento(ativo);
CREATE INDEX IF NOT EXISTS idx_tipos_documento_descricao ON tipos_documento(descricao);

-- ==========================================
-- FUNÇÃO: Gerar próximo código
-- ==========================================
CREATE OR REPLACE FUNCTION gerar_proximo_codigo_tipo_documento(p_user_id UUID)
RETURNS INTEGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  ultimo_codigo INTEGER;
BEGIN
  SELECT COALESCE(MAX(codigo), 0) INTO ultimo_codigo
  FROM tipos_documento
  WHERE usuario_id = p_user_id;
  
  RETURN ultimo_codigo + 1;
END;
$$;

COMMENT ON FUNCTION gerar_proximo_codigo_tipo_documento IS 'Gera próximo código sequencial para tipo de documento';

-- ==========================================
-- FUNÇÃO: Criar tipos padrão
-- ==========================================
CREATE OR REPLACE FUNCTION criar_tipos_documentos_padrao(p_user_id UUID)
RETURNS void 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO tipos_documento (usuario_id, codigo, descricao, e_padrao, ativo) VALUES
  (p_user_id, 1, 'Boleto Bancário', true, true),
  (p_user_id, 2, 'Cartão de Crédito', true, true),
  (p_user_id, 3, 'Cartão de Débito', true, true),
  (p_user_id, 4, 'Cheque', true, true),
  (p_user_id, 5, 'Depósito Bancário', true, true),
  (p_user_id, 6, 'Dinheiro', true, true),
  (p_user_id, 7, 'DOC', true, true),
  (p_user_id, 8, 'Nota Fiscal', true, true),
  (p_user_id, 9, 'Nota Promissória', true, true),
  (p_user_id, 10, 'PIX', true, true),
  (p_user_id, 11, 'Recibo', true, true),
  (p_user_id, 12, 'TED', true, true),
  (p_user_id, 13, 'Transferência Bancária', true, true),
  (p_user_id, 14, 'Vale', true, true)
  ON CONFLICT (usuario_id, codigo) DO NOTHING;
END;
$$;

COMMENT ON FUNCTION criar_tipos_documentos_padrao IS 'Cria tipos de documentos padrão para novo usuário';

COMMENT ON TABLE tipos_documento IS 'Tipos de documentos financeiros (PIX, Boleto, etc)';