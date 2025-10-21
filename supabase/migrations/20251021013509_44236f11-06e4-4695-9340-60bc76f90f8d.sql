-- Adicionar campo para identificar pré-preparos
ALTER TABLE tipos_insumos 
ADD COLUMN IF NOT EXISTS pre_preparo_id UUID REFERENCES pre_preparos(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_tipos_insumos_pre_preparo ON tipos_insumos(pre_preparo_id);

COMMENT ON COLUMN tipos_insumos.pre_preparo_id IS 'ID do pré-preparo se este tipo é um pré-preparo';

-- Adicionar campo em ingredientes também para facilitar queries
ALTER TABLE ingredientes
ADD COLUMN IF NOT EXISTS e_pre_preparo BOOLEAN DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_ingredientes_pre_preparo ON ingredientes(e_pre_preparo);

COMMENT ON COLUMN ingredientes.e_pre_preparo IS 'Indica se este ingrediente é um pré-preparo';

-- Migrar pré-preparos existentes
-- Atualizar tipos existentes que são pré-preparos
UPDATE tipos_insumos ti
SET pre_preparo_id = pp.id
FROM pre_preparos pp
WHERE ti.descricao LIKE 'PRÉ-PREPARO: %'
  AND ti.descricao = 'PRÉ-PREPARO: ' || pp.nome
  AND ti.tipo = 'ingrediente'
  AND ti.pre_preparo_id IS NULL;

-- Marcar ingredientes que são pré-preparos
UPDATE ingredientes i
SET e_pre_preparo = true
FROM tipos_insumos ti
WHERE i.tipo_insumo_id = ti.id
  AND ti.pre_preparo_id IS NOT NULL;