-- Tabela: planos_contas
CREATE TABLE IF NOT EXISTS planos_contas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Informações da conta
  codigo VARCHAR(50) NOT NULL,
  nome VARCHAR(255) NOT NULL,
  tipo VARCHAR(50) NOT NULL,
  categoria VARCHAR(100),
  
  -- Hierarquia
  conta_pai_id UUID REFERENCES planos_contas(id) ON DELETE SET NULL,
  nivel INTEGER NOT NULL DEFAULT 1,
  
  -- Classificação
  natureza VARCHAR(50),
  aceita_lancamento BOOLEAN DEFAULT true,
  
  -- Status
  ativo BOOLEAN DEFAULT true,
  
  -- Auditoria
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT unique_user_codigo UNIQUE(usuario_id, codigo)
);

-- Criar índices
CREATE INDEX IF NOT EXISTS idx_planos_contas_usuario_id ON planos_contas(usuario_id);
CREATE INDEX IF NOT EXISTS idx_planos_contas_tipo ON planos_contas(tipo);
CREATE INDEX IF NOT EXISTS idx_planos_contas_conta_pai ON planos_contas(conta_pai_id);
CREATE INDEX IF NOT EXISTS idx_planos_contas_codigo ON planos_contas(codigo);

-- Habilitar RLS
ALTER TABLE planos_contas ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
CREATE POLICY "Users can view own planos_contas"
  ON planos_contas FOR SELECT
  USING (auth.uid() = usuario_id);

CREATE POLICY "Users can insert own planos_contas"
  ON planos_contas FOR INSERT
  WITH CHECK (auth.uid() = usuario_id);

CREATE POLICY "Users can update own planos_contas"
  ON planos_contas FOR UPDATE
  USING (auth.uid() = usuario_id)
  WITH CHECK (auth.uid() = usuario_id);

CREATE POLICY "Users can delete own planos_contas"
  ON planos_contas FOR DELETE
  USING (auth.uid() = usuario_id);

-- Trigger para atualizar updated_at
CREATE TRIGGER update_planos_contas_updated_at
  BEFORE UPDATE ON planos_contas
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Comentários
COMMENT ON TABLE planos_contas IS 'Plano de contas contábil para organização financeira';
COMMENT ON COLUMN planos_contas.codigo IS 'Código hierárquico da conta (ex: 1.1.1)';
COMMENT ON COLUMN planos_contas.aceita_lancamento IS 'Se FALSE, conta é apenas agrupadora';