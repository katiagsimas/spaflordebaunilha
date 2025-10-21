-- ==========================================
-- TABELA: pre_preparos
-- ==========================================
CREATE TABLE IF NOT EXISTS pre_preparos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  nome VARCHAR(255) NOT NULL,
  tempo_preparo NUMERIC NOT NULL CHECK (tempo_preparo > 0),
  tempo_preparo_unidade VARCHAR(10) NOT NULL CHECK (tempo_preparo_unidade IN ('minutos', 'horas')),
  
  rendimento_quantidade NUMERIC NOT NULL CHECK (rendimento_quantidade > 0),
  rendimento_unidade_id UUID NOT NULL REFERENCES unidades_medida(id) ON DELETE RESTRICT,
  
  modo_preparo TEXT,
  imagem_1_url TEXT,
  imagem_2_url TEXT,
  
  custo_total NUMERIC DEFAULT 0,
  custo_por_unidade NUMERIC DEFAULT 0,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT unique_nome_pre_preparo UNIQUE (usuario_id, nome)
);

CREATE INDEX IF NOT EXISTS idx_pre_preparos_user ON pre_preparos(usuario_id);
CREATE INDEX IF NOT EXISTS idx_pre_preparos_nome ON pre_preparos(nome);

ALTER TABLE pre_preparos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own pre_preparos" 
  ON pre_preparos FOR SELECT 
  USING (auth.uid() = usuario_id);

CREATE POLICY "Users can insert own pre_preparos" 
  ON pre_preparos FOR INSERT 
  WITH CHECK (auth.uid() = usuario_id);

CREATE POLICY "Users can update own pre_preparos" 
  ON pre_preparos FOR UPDATE 
  USING (auth.uid() = usuario_id);

CREATE POLICY "Users can delete own pre_preparos" 
  ON pre_preparos FOR DELETE 
  USING (auth.uid() = usuario_id);

CREATE TRIGGER update_pre_preparos_updated_at 
  BEFORE UPDATE ON pre_preparos 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

COMMENT ON TABLE pre_preparos IS 'Pré-preparos com tempo, rendimento e custo';

-- ==========================================
-- TABELA: pre_preparos_ingredientes
-- ==========================================
CREATE TABLE IF NOT EXISTS pre_preparos_ingredientes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pre_preparo_id UUID NOT NULL REFERENCES pre_preparos(id) ON DELETE CASCADE,
  ingrediente_id UUID NOT NULL REFERENCES ingredientes(id) ON DELETE RESTRICT,
  
  quantidade_utilizada NUMERIC NOT NULL CHECK (quantidade_utilizada > 0),
  custo_ingrediente NUMERIC NOT NULL DEFAULT 0,
  ordem INTEGER NOT NULL DEFAULT 0,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT unique_ingrediente_pre_preparo UNIQUE (pre_preparo_id, ingrediente_id)
);

CREATE INDEX IF NOT EXISTS idx_pp_ingredientes_preparo ON pre_preparos_ingredientes(pre_preparo_id);
CREATE INDEX IF NOT EXISTS idx_pp_ingredientes_ingrediente ON pre_preparos_ingredientes(ingrediente_id);

ALTER TABLE pre_preparos_ingredientes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own pp_ingredientes" 
  ON pre_preparos_ingredientes FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM pre_preparos 
      WHERE pre_preparos.id = pre_preparos_ingredientes.pre_preparo_id 
      AND pre_preparos.usuario_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own pp_ingredientes" 
  ON pre_preparos_ingredientes FOR INSERT 
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM pre_preparos 
      WHERE pre_preparos.id = pre_preparos_ingredientes.pre_preparo_id 
      AND pre_preparos.usuario_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own pp_ingredientes" 
  ON pre_preparos_ingredientes FOR UPDATE 
  USING (
    EXISTS (
      SELECT 1 FROM pre_preparos 
      WHERE pre_preparos.id = pre_preparos_ingredientes.pre_preparo_id 
      AND pre_preparos.usuario_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete own pp_ingredientes" 
  ON pre_preparos_ingredientes FOR DELETE 
  USING (
    EXISTS (
      SELECT 1 FROM pre_preparos 
      WHERE pre_preparos.id = pre_preparos_ingredientes.pre_preparo_id 
      AND pre_preparos.usuario_id = auth.uid()
    )
  );

COMMENT ON TABLE pre_preparos_ingredientes IS 'Ingredientes usados em cada pré-preparo';

-- ==========================================
-- FUNÇÃO: Calcular custos automaticamente
-- ==========================================
CREATE OR REPLACE FUNCTION calcular_custo_pre_preparo(preparo_id UUID)
RETURNS void AS $$
DECLARE
  total_custo NUMERIC;
  rendimento NUMERIC;
  custo_unidade NUMERIC;
BEGIN
  -- Calcular custo total dos ingredientes
  SELECT COALESCE(SUM(custo_ingrediente), 0)
  INTO total_custo
  FROM pre_preparos_ingredientes
  WHERE pre_preparo_id = preparo_id;
  
  -- Buscar rendimento
  SELECT rendimento_quantidade
  INTO rendimento
  FROM pre_preparos
  WHERE id = preparo_id;
  
  -- Calcular custo por unidade
  IF rendimento > 0 THEN
    custo_unidade := total_custo / rendimento;
  ELSE
    custo_unidade := 0;
  END IF;
  
  -- Atualizar pré-preparo
  UPDATE pre_preparos
  SET 
    custo_total = total_custo,
    custo_por_unidade = custo_unidade
  WHERE id = preparo_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- ==========================================
-- TRIGGER: Recalcular ao adicionar/atualizar ingrediente
-- ==========================================
CREATE OR REPLACE FUNCTION trigger_recalcular_custo()
RETURNS TRIGGER AS $$
BEGIN
  IF (TG_OP = 'DELETE') THEN
    PERFORM calcular_custo_pre_preparo(OLD.pre_preparo_id);
    RETURN OLD;
  ELSE
    PERFORM calcular_custo_pre_preparo(NEW.pre_preparo_id);
    RETURN NEW;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER recalcular_custo_pp_ingredientes
AFTER INSERT OR UPDATE OR DELETE ON pre_preparos_ingredientes
FOR EACH ROW EXECUTE FUNCTION trigger_recalcular_custo();

-- ==========================================
-- STORAGE BUCKET para imagens
-- ==========================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('pre-preparos', 'pre-preparos', true)
ON CONFLICT (id) DO NOTHING;

-- Policy para upload
CREATE POLICY "Users can upload own images"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'pre-preparos' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Policy para ler
CREATE POLICY "Public can view images"
ON storage.objects FOR SELECT
USING (bucket_id = 'pre-preparos');