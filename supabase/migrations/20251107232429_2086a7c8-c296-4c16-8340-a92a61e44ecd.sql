-- Adicionar coluna de contador de uso na tabela tipos_documento
ALTER TABLE tipos_documento 
ADD COLUMN IF NOT EXISTS contador_uso INTEGER DEFAULT 0;

-- Criar índice para otimizar a ordenação
CREATE INDEX IF NOT EXISTS idx_tipos_documento_contador_uso 
ON tipos_documento(usuario_id, contador_uso DESC, descricao ASC);

-- Função para incrementar contador de uso
CREATE OR REPLACE FUNCTION incrementar_uso_tipo_documento(p_tipo_documento_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
BEGIN
  UPDATE tipos_documento
  SET contador_uso = contador_uso + 1
  WHERE id = p_tipo_documento_id;
END;
$function$;