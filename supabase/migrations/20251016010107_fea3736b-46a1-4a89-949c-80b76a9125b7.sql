-- Adicionar campo ativo e codigo nas tabelas de configuração

-- 1. Unidades de Medida
ALTER TABLE unidades_medida 
ADD COLUMN IF NOT EXISTS ativo BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS codigo VARCHAR(10);

-- 2. Tipos de Insumos
ALTER TABLE tipos_insumos 
ADD COLUMN IF NOT EXISTS ativo BOOLEAN DEFAULT true;

-- 3. Tipos de Embalagens
ALTER TABLE tipos_embalagens 
ADD COLUMN IF NOT EXISTS ativo BOOLEAN DEFAULT true;

-- 4. Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_unidades_medida_ativo ON unidades_medida(ativo);
CREATE INDEX IF NOT EXISTS idx_unidades_medida_usuario_ativo ON unidades_medida(usuario_id, ativo);
CREATE INDEX IF NOT EXISTS idx_tipos_insumos_ativo ON tipos_insumos(ativo);
CREATE INDEX IF NOT EXISTS idx_tipos_insumos_usuario_ativo ON tipos_insumos(usuario_id, ativo);
CREATE INDEX IF NOT EXISTS idx_tipos_embalagens_ativo ON tipos_embalagens(ativo);
CREATE INDEX IF NOT EXISTS idx_tipos_embalagens_usuario_ativo ON tipos_embalagens(usuario_id, ativo);

-- 5. Atualizar registros existentes para ativo = true
UPDATE unidades_medida SET ativo = true WHERE ativo IS NULL;
UPDATE tipos_insumos SET ativo = true WHERE ativo IS NULL;
UPDATE tipos_embalagens SET ativo = true WHERE ativo IS NULL;

-- 6. Adicionar comentários para documentação
COMMENT ON COLUMN unidades_medida.ativo IS 'Indica se a unidade está ativa (soft delete)';
COMMENT ON COLUMN unidades_medida.codigo IS 'Código sequencial único (001, 002, 003...)';
COMMENT ON COLUMN tipos_insumos.ativo IS 'Indica se o tipo de insumo está ativo (soft delete)';
COMMENT ON COLUMN tipos_embalagens.ativo IS 'Indica se o tipo de embalagem está ativo (soft delete)';