-- ========================================
-- MARCAR CONTAS COMO PADRÃO DO SISTEMA
-- ========================================

-- 1. ADICIONAR COLUNAS
ALTER TABLE categorias_plano_contas 
ADD COLUMN IF NOT EXISTS padrao_sistema boolean NOT NULL DEFAULT false;

ALTER TABLE plano_contas 
ADD COLUMN IF NOT EXISTS padrao_sistema boolean NOT NULL DEFAULT false;

-- 2. MARCAR CATEGORIA 4 COMO PADRÃO DO SISTEMA
UPDATE categorias_plano_contas 
SET padrao_sistema = true
WHERE codigo = '4';

-- 3. MARCAR CONTAS 4.01, 4.02, 4.03 COMO PADRÃO DO SISTEMA
UPDATE plano_contas 
SET padrao_sistema = true
WHERE codigo_estruturado IN ('4.01', '4.02', '4.03');

-- 4. CRIAR ÍNDICES
CREATE INDEX IF NOT EXISTS idx_categorias_plano_padrao 
ON categorias_plano_contas(padrao_sistema);

CREATE INDEX IF NOT EXISTS idx_plano_contas_padrao 
ON plano_contas(padrao_sistema);

-- 5. ATUALIZAR RLS (Row Level Security)
-- CATEGORIAS PLANO CONTAS

-- Visualizar: padrão do sistema OU suas próprias
DROP POLICY IF EXISTS "Users can view own categorias_plano_contas" ON categorias_plano_contas;
CREATE POLICY "Users can view categorias_plano_contas"
  ON categorias_plano_contas FOR SELECT
  USING (
    padrao_sistema = true 
    OR user_id = auth.uid()
  );

-- Inserir: apenas personalizadas (não padrão)
DROP POLICY IF EXISTS "Users can insert own categorias_plano_contas" ON categorias_plano_contas;
CREATE POLICY "Users can insert categorias_plano_contas"
  ON categorias_plano_contas FOR INSERT
  WITH CHECK (
    padrao_sistema = false 
    AND user_id = auth.uid()
  );

-- Atualizar: apenas suas próprias (não padrão) OU campo ativo em contas padrão
DROP POLICY IF EXISTS "Users can update own categorias_plano_contas" ON categorias_plano_contas;
CREATE POLICY "Users can update categorias_plano_contas"
  ON categorias_plano_contas FOR UPDATE
  USING (
    user_id = auth.uid()
  );

-- Deletar: apenas suas próprias (não padrão)
DROP POLICY IF EXISTS "Users can delete own categorias_plano_contas" ON categorias_plano_contas;
CREATE POLICY "Users can delete categorias_plano_contas"
  ON categorias_plano_contas FOR DELETE
  USING (
    padrao_sistema = false 
    AND user_id = auth.uid()
  );

-- PLANO DE CONTAS

-- Visualizar: padrão do sistema OU suas próprias
DROP POLICY IF EXISTS "Users can view own plano_contas" ON plano_contas;
DROP POLICY IF EXISTS "Users can view default plano_contas" ON plano_contas;
CREATE POLICY "Users can view plano_contas"
  ON plano_contas FOR SELECT
  USING (
    padrao_sistema = true 
    OR user_id = auth.uid()
  );

-- Inserir: apenas personalizadas (não padrão)
DROP POLICY IF EXISTS "Users can insert own plano_contas" ON plano_contas;
CREATE POLICY "Users can insert plano_contas"
  ON plano_contas FOR INSERT
  WITH CHECK (
    padrao_sistema = false 
    AND user_id = auth.uid()
  );

-- Atualizar: suas próprias OU campo ativo em contas padrão
DROP POLICY IF EXISTS "Users can update own plano_contas" ON plano_contas;
CREATE POLICY "Users can update plano_contas"
  ON plano_contas FOR UPDATE
  USING (
    user_id = auth.uid()
  );

-- Deletar: apenas suas próprias (não padrão)
DROP POLICY IF EXISTS "Users can delete own plano_contas" ON plano_contas;
CREATE POLICY "Users can delete plano_contas"
  ON plano_contas FOR DELETE
  USING (
    padrao_sistema = false 
    AND user_id = auth.uid()
  );

-- 6. TRIGGER PARA PROTEGER CAMPOS EM CONTAS PADRÃO
CREATE OR REPLACE FUNCTION proteger_contas_padrao()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.padrao_sistema = true THEN
    -- Permitir apenas alteração do campo 'ativo'
    IF (NEW.codigo IS DISTINCT FROM OLD.codigo OR
        NEW.codigo_estruturado IS DISTINCT FROM OLD.codigo_estruturado OR
        NEW.descricao IS DISTINCT FROM OLD.descricao OR
        NEW.categoria_id IS DISTINCT FROM OLD.categoria_id OR
        NEW.padrao_sistema IS DISTINCT FROM OLD.padrao_sistema OR
        NEW.e_padrao IS DISTINCT FROM OLD.e_padrao) THEN
      RAISE EXCEPTION 'Contas padrão do sistema não podem ser editadas. Apenas o campo "ativo" pode ser alterado.';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_proteger_contas_padrao ON plano_contas;
CREATE TRIGGER trigger_proteger_contas_padrao
  BEFORE UPDATE ON plano_contas
  FOR EACH ROW
  EXECUTE FUNCTION proteger_contas_padrao();

-- Mesmo para categorias
CREATE OR REPLACE FUNCTION proteger_categorias_padrao()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.padrao_sistema = true THEN
    IF (NEW.codigo IS DISTINCT FROM OLD.codigo OR
        NEW.descricao IS DISTINCT FROM OLD.descricao OR
        NEW.indicador IS DISTINCT FROM OLD.indicador OR
        NEW.faixa_dre IS DISTINCT FROM OLD.faixa_dre OR
        NEW.ordem IS DISTINCT FROM OLD.ordem OR
        NEW.padrao_sistema IS DISTINCT FROM OLD.padrao_sistema OR
        NEW.e_padrao IS DISTINCT FROM OLD.e_padrao) THEN
      RAISE EXCEPTION 'Categorias padrão do sistema não podem ser editadas. Apenas o campo "ativo" pode ser alterado.';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_proteger_categorias_padrao ON categorias_plano_contas;
CREATE TRIGGER trigger_proteger_categorias_padrao
  BEFORE UPDATE ON categorias_plano_contas
  FOR EACH ROW
  EXECUTE FUNCTION proteger_categorias_padrao();

-- 7. TRIGGER PARA IMPEDIR EXCLUSÃO DE CONTAS PADRÃO
CREATE OR REPLACE FUNCTION impedir_exclusao_padrao()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.padrao_sistema = true THEN
    RAISE EXCEPTION 'Contas padrão do sistema não podem ser excluídas. Use o campo "ativo" para desabilitá-las.';
  END IF;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_impedir_exclusao_conta_padrao ON plano_contas;
CREATE TRIGGER trigger_impedir_exclusao_conta_padrao
  BEFORE DELETE ON plano_contas
  FOR EACH ROW
  EXECUTE FUNCTION impedir_exclusao_padrao();

DROP TRIGGER IF EXISTS trigger_impedir_exclusao_categoria_padrao ON categorias_plano_contas;
CREATE TRIGGER trigger_impedir_exclusao_categoria_padrao
  BEFORE DELETE ON categorias_plano_contas
  FOR EACH ROW
  EXECUTE FUNCTION impedir_exclusao_padrao();