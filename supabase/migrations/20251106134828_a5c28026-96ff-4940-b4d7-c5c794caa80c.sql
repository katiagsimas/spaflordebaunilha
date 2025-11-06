-- ========================================
-- CATEGORIAS DE ESTOQUE FIXAS E PADRONIZADAS
-- ========================================

-- 1. CRIAR tabela de categorias fixas (renomeando a antiga)
ALTER TABLE IF EXISTS categorias_estoque RENAME TO categorias_estoque_old;

-- 2. CRIAR nova tabela de categorias fixas
CREATE TABLE categorias_estoque (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL UNIQUE,
  descricao text NOT NULL,
  icone text NOT NULL,
  cor text NOT NULL,
  ordem integer NOT NULL,
  editavel boolean NOT NULL DEFAULT false,
  ativo boolean NOT NULL DEFAULT true,
  criado_em timestamptz NOT NULL DEFAULT now()
);

-- 3. INSERIR AS 6 CATEGORIAS FIXAS
INSERT INTO categorias_estoque (nome, descricao, icone, cor, ordem, editavel) VALUES
('Ingredientes', 'Matéria-prima comestível (farinha, açúcar, ovos, chocolate, etc)', '🧈', '#FF6B6B', 1, false),
('Embalagens', 'Caixas, formas, bases, discos laminados, saquinhos', '📦', '#4ECDC4', 2, false),
('Descartáveis de Produção', 'Itens usados no preparo que não vão no produto final (sacos, filme PVC, papel manteiga)', '🧤', '#95E1D3', 3, false),
('Itens de Decoração', 'Topos prontos, laços, toppers comprados, flores comestíveis, velas', '🎨', '#F38181', 4, false),
('Higiene / Limpeza', 'Detergente, álcool, desinfetante, panos, esponjas', '🧼', '#AA96DA', 5, false),
('Escritório / Impressão', 'Bobina térmica, etiquetas, tags, papel sulfite, canetas', '🖨️', '#FCBAD3', 6, false);

-- 4. CRIAR índices para performance
CREATE INDEX IF NOT EXISTS idx_itens_categoria ON itens(categoria);
CREATE INDEX IF NOT EXISTS idx_categorias_ativo ON categorias_estoque(ativo);
CREATE INDEX IF NOT EXISTS idx_categorias_ordem ON categorias_estoque(ordem);

-- 5. RLS (Row Level Security)
ALTER TABLE categorias_estoque ENABLE ROW LEVEL SECURITY;

-- Todos podem VER as categorias
CREATE POLICY "Categorias visíveis para todos autenticados"
  ON categorias_estoque FOR SELECT
  USING (auth.role() = 'authenticated');

-- NINGUÉM pode INSERIR novas categorias
CREATE POLICY "Apenas service_role pode inserir categorias"
  ON categorias_estoque FOR INSERT
  WITH CHECK (false);

-- NINGUÉM pode ATUALIZAR categorias
CREATE POLICY "Apenas service_role pode atualizar categorias"
  ON categorias_estoque FOR UPDATE
  USING (false);

-- NINGUÉM pode DELETAR categorias
CREATE POLICY "Apenas service_role pode deletar categorias"
  ON categorias_estoque FOR DELETE
  USING (false);

-- 6. FUNÇÃO para validar categoria ao inserir item
CREATE OR REPLACE FUNCTION validar_categoria_item()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.categoria IS NULL OR NEW.categoria = '' THEN
    RETURN NEW;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM categorias_estoque 
    WHERE nome = NEW.categoria 
    AND ativo = true
  ) THEN
    RAISE EXCEPTION 'Categoria inválida: %. Use uma das categorias predefinidas.', NEW.categoria;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 7. TRIGGER para validação automática
DROP TRIGGER IF EXISTS trigger_validar_categoria ON itens;
CREATE TRIGGER trigger_validar_categoria
  BEFORE INSERT OR UPDATE ON itens
  FOR EACH ROW
  EXECUTE FUNCTION validar_categoria_item();

-- 8. VIEW para custos por categoria (simplificada para não depender de estoque_atual)
CREATE OR REPLACE VIEW custos_por_categoria AS
SELECT 
  i.categoria,
  COUNT(DISTINCT i.id) as total_itens,
  COUNT(DISTINCT CASE WHEN i.rastrear_estoque THEN i.id END) as itens_rastreados,
  0 as valor_total_estoque,
  0 as valor_medio_por_item
FROM itens i
WHERE i.ativo = true AND i.categoria IS NOT NULL
GROUP BY i.categoria
ORDER BY i.categoria;

GRANT SELECT ON custos_por_categoria TO authenticated;

-- 9. Dropar tabela antiga
DROP TABLE IF EXISTS categorias_estoque_old CASCADE;