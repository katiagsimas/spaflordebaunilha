-- Adicionar coluna codigo (permitindo NULL inicialmente)
ALTER TABLE bancos 
ADD COLUMN IF NOT EXISTS codigo VARCHAR(10);

-- Atualizar registros existentes com códigos únicos usando CTE
WITH ranked_bancos AS (
  SELECT 
    id,
    usuario_id,
    LPAD(ROW_NUMBER() OVER (PARTITION BY usuario_id ORDER BY created_at)::TEXT, 3, '0') as novo_codigo
  FROM bancos
  WHERE codigo IS NULL
)
UPDATE bancos b
SET codigo = rb.novo_codigo
FROM ranked_bancos rb
WHERE b.id = rb.id;

-- Agora tornar NOT NULL
ALTER TABLE bancos 
ALTER COLUMN codigo SET NOT NULL;

-- Criar índice para a coluna codigo
CREATE INDEX IF NOT EXISTS idx_bancos_codigo ON bancos(codigo);

-- Adicionar constraint unique (removendo a antiga se existir)
ALTER TABLE bancos DROP CONSTRAINT IF EXISTS unique_banco_por_usuario;
ALTER TABLE bancos ADD CONSTRAINT unique_banco_por_usuario UNIQUE (usuario_id, codigo);