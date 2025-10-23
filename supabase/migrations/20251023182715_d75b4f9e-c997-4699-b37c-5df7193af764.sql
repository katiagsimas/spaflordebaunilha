-- Criar tabela de histórico de mão de obra
CREATE TABLE mao_obra_historico (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mao_obra_id UUID NOT NULL REFERENCES configuracao_mao_obra(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Valores antes e depois
  valor_anterior DECIMAL(10,2),
  valor_novo DECIMAL(10,2) NOT NULL,
  
  -- Outras alterações
  nome_anterior VARCHAR(100),
  nome_novo VARCHAR(100),
  descricao_anterior TEXT,
  descricao_novo TEXT,
  
  -- Metadata
  tipo_alteracao VARCHAR(50),
  descricao_alteracao TEXT,
  data_alteracao TIMESTAMP DEFAULT NOW(),
  
  created_at TIMESTAMP DEFAULT NOW()
);

-- Índices
CREATE INDEX idx_historico_mao_obra ON mao_obra_historico(mao_obra_id);
CREATE INDEX idx_historico_user ON mao_obra_historico(user_id);
CREATE INDEX idx_historico_data ON mao_obra_historico(data_alteracao DESC);

-- RLS
ALTER TABLE mao_obra_historico ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own historico"
  ON mao_obra_historico FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own historico"
  ON mao_obra_historico FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Atualizar tabela configuracao_mao_obra
ALTER TABLE configuracao_mao_obra
ADD COLUMN ultima_alteracao TIMESTAMP DEFAULT NOW(),
ADD COLUMN versao INTEGER DEFAULT 1;

-- Trigger para atualizar ultima_alteracao
CREATE OR REPLACE FUNCTION update_mao_obra_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  NEW.ultima_alteracao = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_mao_obra_timestamp ON configuracao_mao_obra;
CREATE TRIGGER update_mao_obra_timestamp
  BEFORE UPDATE ON configuracao_mao_obra
  FOR EACH ROW
  EXECUTE FUNCTION update_mao_obra_updated_at();