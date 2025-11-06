-- ========================================
-- SISTEMA DE TAGS CATEGORIZADAS
-- ========================================

BEGIN;

-- 1. Criar tabela de categorias de tags
CREATE TABLE IF NOT EXISTS categorias_tags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL UNIQUE,
  descricao text,
  icone text,
  ordem integer NOT NULL,
  ativo boolean NOT NULL DEFAULT true,
  criado_em timestamptz NOT NULL DEFAULT now()
);

-- 2. Criar tabela de tags
CREATE TABLE IF NOT EXISTS tags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  categoria_id uuid NOT NULL REFERENCES categorias_tags(id) ON DELETE CASCADE,
  nome text NOT NULL,
  cor text,
  ordem integer NOT NULL,
  ativo boolean NOT NULL DEFAULT true,
  criado_em timestamptz NOT NULL DEFAULT now(),
  UNIQUE(categoria_id, nome)
);

-- 3. Tabela de relacionamento encomendas_tags (muitos para muitos)
CREATE TABLE IF NOT EXISTS encomendas_tags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  encomenda_id uuid NOT NULL REFERENCES encomendas(id) ON DELETE CASCADE,
  tag_id uuid NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
  criado_em timestamptz NOT NULL DEFAULT now(),
  UNIQUE(encomenda_id, tag_id)
);

-- 4. Índices para performance
CREATE INDEX IF NOT EXISTS idx_tags_categoria ON tags(categoria_id);
CREATE INDEX IF NOT EXISTS idx_encomendas_tags_encomenda ON encomendas_tags(encomenda_id);
CREATE INDEX IF NOT EXISTS idx_encomendas_tags_tag ON encomendas_tags(tag_id);

-- 5. RLS (Row Level Security)
ALTER TABLE categorias_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE encomendas_tags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Categorias visíveis para autenticados" ON categorias_tags FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Usuários podem inserir categorias" ON categorias_tags FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Usuários podem atualizar categorias" ON categorias_tags FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Tags visíveis para autenticados" ON tags FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Usuários podem inserir tags" ON tags FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Usuários podem atualizar tags" ON tags FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Encomendas_tags visíveis para autenticados" ON encomendas_tags FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Usuários podem inserir encomendas_tags" ON encomendas_tags FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Usuários podem deletar encomendas_tags" ON encomendas_tags FOR DELETE USING (auth.role() = 'authenticated');

-- 6. POPULAR COM AS CATEGORIAS E TAGS DEFINIDAS
-- ==============================================

-- Categoria 1: Origem do Pedido
INSERT INTO categorias_tags (nome, descricao, icone, ordem) VALUES
('Origem do Pedido', 'De onde veio o cliente', '📱', 1);

INSERT INTO tags (categoria_id, nome, cor, ordem) 
SELECT id, 'Instagram', '#E4405F', 1 FROM categorias_tags WHERE nome = 'Origem do Pedido'
UNION ALL
SELECT id, 'WhatsApp', '#25D366', 2 FROM categorias_tags WHERE nome = 'Origem do Pedido'
UNION ALL
SELECT id, 'Indicação', '#FFB800', 3 FROM categorias_tags WHERE nome = 'Origem do Pedido'
UNION ALL
SELECT id, 'Google Maps', '#4285F4', 4 FROM categorias_tags WHERE nome = 'Origem do Pedido'
UNION ALL
SELECT id, 'Fidelização Interna', '#9C27B0', 5 FROM categorias_tags WHERE nome = 'Origem do Pedido'
UNION ALL
SELECT id, 'Parceria Local', '#FF6F00', 6 FROM categorias_tags WHERE nome = 'Origem do Pedido';

-- Categoria 2: Tipo de Entrega
INSERT INTO categorias_tags (nome, descricao, icone, ordem) VALUES
('Tipo de Entrega', 'Forma de entrega do pedido', '🚚', 2);

INSERT INTO tags (categoria_id, nome, cor, ordem)
SELECT id, 'Retirada', '#2196F3', 1 FROM categorias_tags WHERE nome = 'Tipo de Entrega'
UNION ALL
SELECT id, 'Delivery', '#FF9800', 2 FROM categorias_tags WHERE nome = 'Tipo de Entrega';

-- Categoria 3: Recorrência
INSERT INTO categorias_tags (nome, descricao, icone, ordem) VALUES
('Recorrência', 'Histórico de compras do cliente', '🔄', 3);

INSERT INTO tags (categoria_id, nome, cor, ordem)
SELECT id, 'Primeira Compra', '#4CAF50', 1 FROM categorias_tags WHERE nome = 'Recorrência'
UNION ALL
SELECT id, 'Cliente Recorrente', '#2196F3', 2 FROM categorias_tags WHERE nome = 'Recorrência'
UNION ALL
SELECT id, 'Assinatura', '#9C27B0', 3 FROM categorias_tags WHERE nome = 'Recorrência';

-- Categoria 4: Tipo de Evento
INSERT INTO categorias_tags (nome, descricao, icone, ordem) VALUES
('Tipo de Evento', 'Ocasião da encomenda', '🎉', 4);

INSERT INTO tags (categoria_id, nome, cor, ordem)
SELECT id, 'Aniversário Infantil', '#FF6B9D', 1 FROM categorias_tags WHERE nome = 'Tipo de Evento'
UNION ALL
SELECT id, 'Aniversário Adulto', '#7E57C2', 2 FROM categorias_tags WHERE nome = 'Tipo de Evento'
UNION ALL
SELECT id, 'Mesversário', '#FFB74D', 3 FROM categorias_tags WHERE nome = 'Tipo de Evento'
UNION ALL
SELECT id, 'Batizado', '#81C784', 4 FROM categorias_tags WHERE nome = 'Tipo de Evento'
UNION ALL
SELECT id, 'Casamento', '#F48FB1', 5 FROM categorias_tags WHERE nome = 'Tipo de Evento'
UNION ALL
SELECT id, 'Noivado', '#CE93D8', 6 FROM categorias_tags WHERE nome = 'Tipo de Evento'
UNION ALL
SELECT id, 'Chá de Bebê', '#90CAF9', 7 FROM categorias_tags WHERE nome = 'Tipo de Evento'
UNION ALL
SELECT id, 'Chá de Fraldas', '#A5D6A7', 8 FROM categorias_tags WHERE nome = 'Tipo de Evento'
UNION ALL
SELECT id, 'Corporativo', '#455A64', 9 FROM categorias_tags WHERE nome = 'Tipo de Evento';

-- 7. Função para gerar insights cruzados
CREATE OR REPLACE FUNCTION get_insights_cruzados(dias integer, user_id_param uuid)
RETURNS TABLE (
  origem text,
  evento text,
  total_vendas bigint,
  valor_total numeric,
  ticket_medio numeric,
  percentual numeric
) AS $$
BEGIN
  RETURN QUERY
  WITH dados_cruzados AS (
    SELECT 
      t_origem.nome as origem,
      t_evento.nome as evento,
      COUNT(DISTINCT e.id) as total_vendas,
      COALESCE(SUM(e.valor), 0) as valor_total
    FROM encomendas e
    INNER JOIN encomendas_tags et_origem ON e.id = et_origem.encomenda_id
    INNER JOIN tags t_origem ON et_origem.tag_id = t_origem.id
    INNER JOIN categorias_tags ct_origem ON t_origem.categoria_id = ct_origem.id
    INNER JOIN encomendas_tags et_evento ON e.id = et_evento.encomenda_id
    INNER JOIN tags t_evento ON et_evento.tag_id = t_evento.id
    INNER JOIN categorias_tags ct_evento ON t_evento.categoria_id = ct_evento.id
    WHERE 
      ct_origem.nome = 'Origem do Pedido'
      AND ct_evento.nome = 'Tipo de Evento'
      AND e.usuario_id = user_id_param
      AND e.created_at >= NOW() - (dias || ' days')::interval
    GROUP BY t_origem.nome, t_evento.nome
  ),
  total_geral AS (
    SELECT SUM(valor_total) as total FROM dados_cruzados
  )
  SELECT 
    dc.origem,
    dc.evento,
    dc.total_vendas,
    dc.valor_total,
    CASE 
      WHEN dc.total_vendas > 0 THEN dc.valor_total / dc.total_vendas
      ELSE 0
    END as ticket_medio,
    CASE 
      WHEN tg.total > 0 THEN (dc.valor_total / tg.total * 100)
      ELSE 0
    END as percentual
  FROM dados_cruzados dc
  CROSS JOIN total_geral tg
  ORDER BY dc.valor_total DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMIT;