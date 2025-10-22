-- ==========================================
-- TABELA: tags_encomendas
-- ==========================================
CREATE TABLE IF NOT EXISTS tags_encomendas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  nome VARCHAR(50) NOT NULL,
  cor VARCHAR(7) NOT NULL DEFAULT '#3B82F6',
  descricao TEXT,
  ativo BOOLEAN DEFAULT true,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT unique_tag_encomenda_por_user UNIQUE (user_id, nome)
);

CREATE INDEX IF NOT EXISTS idx_tags_encomendas_user ON tags_encomendas(user_id);
CREATE INDEX IF NOT EXISTS idx_tags_encomendas_ativo ON tags_encomendas(ativo);

ALTER TABLE tags_encomendas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own tags_encomendas" 
  ON tags_encomendas FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

COMMENT ON TABLE tags_encomendas IS 'Tags/etiquetas para categorizar encomendas';

-- ==========================================
-- TABELA: encomendas_tags (relacionamento N:N)
-- ==========================================
CREATE TABLE IF NOT EXISTS encomendas_tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  encomenda_id UUID NOT NULL REFERENCES encomendas(id) ON DELETE CASCADE,
  tag_id UUID NOT NULL REFERENCES tags_encomendas(id) ON DELETE CASCADE,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT unique_encomenda_tag UNIQUE (encomenda_id, tag_id)
);

CREATE INDEX IF NOT EXISTS idx_encomendas_tags_encomenda ON encomendas_tags(encomenda_id);
CREATE INDEX IF NOT EXISTS idx_encomendas_tags_tag ON encomendas_tags(tag_id);

ALTER TABLE encomendas_tags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own encomendas_tags" 
  ON encomendas_tags FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM encomendas e
      WHERE e.id = encomendas_tags.encomenda_id
      AND e.usuario_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own encomendas_tags" 
  ON encomendas_tags FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM encomendas e
      WHERE e.id = encomendas_tags.encomenda_id
      AND e.usuario_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete own encomendas_tags" 
  ON encomendas_tags FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM encomendas e
      WHERE e.id = encomendas_tags.encomenda_id
      AND e.usuario_id = auth.uid()
    )
  );

COMMENT ON TABLE encomendas_tags IS 'Relacionamento entre encomendas e tags';

-- ==========================================
-- INSERIR TAGS PRÉ-CADASTRADAS
-- ==========================================
-- Função para criar tags padrão para um usuário
CREATE OR REPLACE FUNCTION criar_tags_padrao_encomendas(p_user_id UUID)
RETURNS void AS $$
BEGIN
  INSERT INTO tags_encomendas (user_id, nome, cor, descricao) VALUES
    (p_user_id, 'Aniversário', '#EF4444', 'Encomendas de aniversário'),
    (p_user_id, 'Mesversário', '#F59E0B', 'Comemorações mensais'),
    (p_user_id, 'Casamento', '#EC4899', 'Festas de casamento'),
    (p_user_id, 'Bodas', '#A855F7', 'Comemoração de bodas'),
    (p_user_id, 'Delivery', '#10B981', 'Entregas a domicílio'),
    (p_user_id, 'Retirada', '#3B82F6', 'Cliente retira no local'),
    (p_user_id, 'Urgente', '#DC2626', 'Pedidos urgentes'),
    (p_user_id, 'Personalizado', '#8B5CF6', 'Produtos personalizados'),
    (p_user_id, 'Corporativo', '#6366F1', 'Eventos corporativos'),
    (p_user_id, 'Infantil', '#F472B6', 'Festas infantis')
  ON CONFLICT (user_id, nome) DO NOTHING;
END;
$$ LANGUAGE plpgsql;

-- Criar tags para usuários existentes
DO $$
DECLARE
  user_record RECORD;
BEGIN
  FOR user_record IN SELECT id FROM auth.users LOOP
    PERFORM criar_tags_padrao_encomendas(user_record.id);
  END LOOP;
END $$;

-- Trigger para criar tags ao criar novo usuário
CREATE OR REPLACE FUNCTION trigger_criar_tags_novo_usuario()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM criar_tags_padrao_encomendas(NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS after_insert_user_criar_tags ON auth.users;
CREATE TRIGGER after_insert_user_criar_tags
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION trigger_criar_tags_novo_usuario();

-- ==========================================
-- VIEW: Encomendas com tags
-- ==========================================
CREATE OR REPLACE VIEW vw_encomendas_com_tags AS
SELECT 
  e.*,
  COALESCE(
    json_agg(
      json_build_object(
        'id', t.id,
        'nome', t.nome,
        'cor', t.cor
      ) ORDER BY t.nome
    ) FILTER (WHERE t.id IS NOT NULL),
    '[]'::json
  ) AS tags
FROM encomendas e
LEFT JOIN encomendas_tags et ON et.encomenda_id = e.id
LEFT JOIN tags_encomendas t ON t.id = et.tag_id AND t.ativo = true
GROUP BY e.id;

COMMENT ON VIEW vw_encomendas_com_tags IS 'Encomendas com suas tags em formato JSON';