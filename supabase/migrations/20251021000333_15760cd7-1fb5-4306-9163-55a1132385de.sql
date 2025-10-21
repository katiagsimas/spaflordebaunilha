-- ==========================================
-- TABELA: tipos_insumos (ÚNICA para ingredientes e embalagens)
-- ==========================================
CREATE TABLE IF NOT EXISTS tipos_insumos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  tipo VARCHAR(20) NOT NULL CHECK (tipo IN ('ingrediente', 'embalagem')),
  descricao VARCHAR(255) NOT NULL,
  quantidade_embalagem NUMERIC NOT NULL CHECK (quantidade_embalagem > 0),
  unidade_medida_id UUID NOT NULL REFERENCES unidades_medida(id) ON DELETE RESTRICT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT unique_tipo_insumo_por_usuario 
    UNIQUE (usuario_id, tipo, descricao, quantidade_embalagem, unidade_medida_id)
);

CREATE INDEX IF NOT EXISTS idx_tipos_insumos_usuario ON tipos_insumos(usuario_id);
CREATE INDEX IF NOT EXISTS idx_tipos_insumos_tipo ON tipos_insumos(tipo);

ALTER TABLE tipos_insumos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own tipos_insumos" 
  ON tipos_insumos FOR SELECT 
  USING (auth.uid() = usuario_id);

CREATE POLICY "Users can insert own tipos_insumos" 
  ON tipos_insumos FOR INSERT 
  WITH CHECK (auth.uid() = usuario_id);

CREATE POLICY "Users can update own tipos_insumos" 
  ON tipos_insumos FOR UPDATE 
  USING (auth.uid() = usuario_id);

CREATE POLICY "Users can delete own tipos_insumos" 
  ON tipos_insumos FOR DELETE 
  USING (auth.uid() = usuario_id);

CREATE TRIGGER update_tipos_insumos_updated_at 
  BEFORE UPDATE ON tipos_insumos 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

COMMENT ON TABLE tipos_insumos IS 'Tipos base de ingredientes e embalagens';
COMMENT ON COLUMN tipos_insumos.tipo IS 'ingrediente ou embalagem';

-- ==========================================
-- TABELA: ingredientes (Precificação)
-- ==========================================
CREATE TABLE IF NOT EXISTS ingredientes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  tipo_insumo_id UUID NOT NULL REFERENCES tipos_insumos(id) ON DELETE RESTRICT,
  marca VARCHAR(255),
  preco NUMERIC NOT NULL CHECK (preco > 0),
  data_atualizacao DATE NOT NULL DEFAULT CURRENT_DATE,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT unique_tipo_insumo_ingrediente UNIQUE (usuario_id, tipo_insumo_id)
);

CREATE INDEX IF NOT EXISTS idx_ingredientes_usuario ON ingredientes(usuario_id);
CREATE INDEX IF NOT EXISTS idx_ingredientes_tipo ON ingredientes(tipo_insumo_id);

ALTER TABLE ingredientes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own ingredientes" 
  ON ingredientes FOR SELECT 
  USING (auth.uid() = usuario_id);

CREATE POLICY "Users can insert own ingredientes" 
  ON ingredientes FOR INSERT 
  WITH CHECK (auth.uid() = usuario_id);

CREATE POLICY "Users can update own ingredientes" 
  ON ingredientes FOR UPDATE 
  USING (auth.uid() = usuario_id);

CREATE POLICY "Users can delete own ingredientes" 
  ON ingredientes FOR DELETE 
  USING (auth.uid() = usuario_id);

CREATE TRIGGER update_ingredientes_updated_at 
  BEFORE UPDATE ON ingredientes 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

COMMENT ON TABLE ingredientes IS 'Ingredientes com marca e preço';

-- ==========================================
-- TABELA: embalagens (Precificação)
-- ==========================================
CREATE TABLE IF NOT EXISTS embalagens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  tipo_insumo_id UUID NOT NULL REFERENCES tipos_insumos(id) ON DELETE RESTRICT,
  marca VARCHAR(255),
  preco NUMERIC NOT NULL CHECK (preco > 0),
  data_atualizacao DATE NOT NULL DEFAULT CURRENT_DATE,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT unique_tipo_insumo_embalagem UNIQUE (usuario_id, tipo_insumo_id)
);

CREATE INDEX IF NOT EXISTS idx_embalagens_usuario ON embalagens(usuario_id);
CREATE INDEX IF NOT EXISTS idx_embalagens_tipo ON embalagens(tipo_insumo_id);

ALTER TABLE embalagens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own embalagens" 
  ON embalagens FOR SELECT 
  USING (auth.uid() = usuario_id);

CREATE POLICY "Users can insert own embalagens" 
  ON embalagens FOR INSERT 
  WITH CHECK (auth.uid() = usuario_id);

CREATE POLICY "Users can update own embalagens" 
  ON embalagens FOR UPDATE 
  USING (auth.uid() = usuario_id);

CREATE POLICY "Users can delete own embalagens" 
  ON embalagens FOR DELETE 
  USING (auth.uid() = usuario_id);

CREATE TRIGGER update_embalagens_updated_at 
  BEFORE UPDATE ON embalagens 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

COMMENT ON TABLE embalagens IS 'Embalagens com marca e preço';