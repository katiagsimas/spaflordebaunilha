-- Criar tabela de configuração de mão de obra
CREATE TABLE configuracao_mao_obra (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  nome VARCHAR(100) NOT NULL,
  valor_hora DECIMAL(10,2) NOT NULL,
  descricao TEXT,
  cor VARCHAR(20) DEFAULT 'blue',
  ativo BOOLEAN DEFAULT true,
  padrao BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS (Row Level Security)
ALTER TABLE configuracao_mao_obra ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own mao_obra"
  ON configuracao_mao_obra FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own mao_obra"
  ON configuracao_mao_obra FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own mao_obra"
  ON configuracao_mao_obra FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own mao_obra"
  ON configuracao_mao_obra FOR DELETE
  USING (auth.uid() = user_id);

-- Índices
CREATE INDEX idx_mao_obra_user ON configuracao_mao_obra(user_id);
CREATE INDEX idx_mao_obra_ativo ON configuracao_mao_obra(ativo);
CREATE INDEX idx_mao_obra_padrao ON configuracao_mao_obra(padrao);

-- Garantir apenas um padrão por usuário
CREATE UNIQUE INDEX idx_mao_obra_padrao_user 
  ON configuracao_mao_obra(user_id) 
  WHERE padrao = true;

-- Atualizar tabela receitas
ALTER TABLE receitas 
ADD COLUMN tipo_mao_obra_id UUID REFERENCES configuracao_mao_obra(id),
ADD COLUMN custo_mao_obra DECIMAL(10,2) DEFAULT 0;

-- Índice
CREATE INDEX idx_receitas_mao_obra ON receitas(tipo_mao_obra_id);

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_mao_obra_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_mao_obra_updated_at
  BEFORE UPDATE ON configuracao_mao_obra
  FOR EACH ROW
  EXECUTE FUNCTION update_mao_obra_updated_at();