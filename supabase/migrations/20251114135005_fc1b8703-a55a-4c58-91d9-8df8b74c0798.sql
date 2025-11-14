-- Adicionar coluna habilitado à tabela tipos_documento
ALTER TABLE tipos_documento ADD COLUMN IF NOT EXISTS habilitado boolean DEFAULT true;

-- Função para verificar se um tipo de documento está em uso
CREATE OR REPLACE FUNCTION verificar_tipo_documento_em_uso(p_tipo_documento_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Verifica se existe em contas_pagar
  IF EXISTS (
    SELECT 1 FROM contas_pagar 
    WHERE tipo_documento_id = p_tipo_documento_id
  ) THEN
    RETURN true;
  END IF;
  
  -- Verifica se existe em contas_receber
  IF EXISTS (
    SELECT 1 FROM contas_receber 
    WHERE tipo_documento_id = p_tipo_documento_id
  ) THEN
    RETURN true;
  END IF;
  
  RETURN false;
END;
$$;