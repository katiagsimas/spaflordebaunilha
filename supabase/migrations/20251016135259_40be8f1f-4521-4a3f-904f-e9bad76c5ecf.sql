-- Migração da tabela ingredientes existente para nova estrutura

-- Adicionar coluna tipo_insumo_id
ALTER TABLE ingredientes 
ADD COLUMN IF NOT EXISTS tipo_insumo_id UUID REFERENCES tipos_insumos(id) ON DELETE RESTRICT;

-- Criar índice
CREATE INDEX IF NOT EXISTS idx_ingredientes_tipo ON ingredientes(tipo_insumo_id);

-- Adicionar constraint único (1 tipo = 1 ingrediente por usuário)
ALTER TABLE ingredientes 
ADD CONSTRAINT unique_tipo_ingrediente_por_usuario UNIQUE (usuario_id, tipo_insumo_id);

-- Adicionar check no preço se não existir
DO $$ 
BEGIN
  ALTER TABLE ingredientes ADD CONSTRAINT check_preco_positivo CHECK (preco > 0);
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Migração da tabela embalagens existente para nova estrutura

-- Adicionar coluna tipo_embalagem_id
ALTER TABLE embalagens 
ADD COLUMN IF NOT EXISTS tipo_embalagem_id UUID REFERENCES tipos_embalagens(id) ON DELETE RESTRICT;

-- Criar índice
CREATE INDEX IF NOT EXISTS idx_embalagens_tipo ON embalagens(tipo_embalagem_id);

-- Adicionar constraint único
ALTER TABLE embalagens 
ADD CONSTRAINT unique_tipo_embalagem_por_usuario UNIQUE (usuario_id, tipo_embalagem_id);

-- Adicionar check no preço se não existir
DO $$ 
BEGIN
  ALTER TABLE embalagens ADD CONSTRAINT check_embalagem_preco_positivo CHECK (preco > 0);
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;