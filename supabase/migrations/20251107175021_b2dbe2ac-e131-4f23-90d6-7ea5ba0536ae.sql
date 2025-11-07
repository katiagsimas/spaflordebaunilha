-- Adicionar novos campos à tabela clientes
ALTER TABLE clientes 
ADD COLUMN IF NOT EXISTS como_conheceu VARCHAR(50),
ADD COLUMN IF NOT EXISTS preferencias_alergias TEXT,
ADD COLUMN IF NOT EXISTS segmento VARCHAR(20) DEFAULT 'novo',
ADD COLUMN IF NOT EXISTS ultima_compra DATE,
ADD COLUMN IF NOT EXISTS total_compras DECIMAL(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS quantidade_pedidos INTEGER DEFAULT 0;

-- Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_clientes_segmento ON clientes(segmento);
CREATE INDEX IF NOT EXISTS idx_clientes_ultima_compra ON clientes(ultima_compra);
CREATE INDEX IF NOT EXISTS idx_clientes_como_conheceu ON clientes(como_conheceu);

-- Comentários para documentação
COMMENT ON COLUMN clientes.como_conheceu IS 'Origem do cliente: Instagram, Indicação, Google, etc';
COMMENT ON COLUMN clientes.preferencias_alergias IS 'Restrições alimentares e preferências';
COMMENT ON COLUMN clientes.segmento IS 'Segmento: novo, eventual, vip, inativo';

-- Tabela para familiares dos clientes
CREATE TABLE IF NOT EXISTS cliente_familiares (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  cliente_id UUID NOT NULL REFERENCES clientes(id) ON DELETE CASCADE,
  nome VARCHAR(200) NOT NULL,
  parentesco VARCHAR(50) NOT NULL,
  data_nascimento DATE NOT NULL,
  observacoes TEXT,
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para cliente_familiares
CREATE INDEX IF NOT EXISTS idx_familiares_cliente ON cliente_familiares(cliente_id);
CREATE INDEX IF NOT EXISTS idx_familiares_data_nascimento ON cliente_familiares(data_nascimento);
CREATE INDEX IF NOT EXISTS idx_familiares_usuario ON cliente_familiares(usuario_id);
CREATE INDEX IF NOT EXISTS idx_familiares_ativo ON cliente_familiares(ativo) WHERE ativo = true;

-- RLS para cliente_familiares
ALTER TABLE cliente_familiares ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuários veem apenas seus familiares"
  ON cliente_familiares FOR SELECT
  USING (auth.uid() = usuario_id);

CREATE POLICY "Usuários inserem apenas seus familiares"
  ON cliente_familiares FOR INSERT
  WITH CHECK (auth.uid() = usuario_id);

CREATE POLICY "Usuários atualizam apenas seus familiares"
  ON cliente_familiares FOR UPDATE
  USING (auth.uid() = usuario_id);

CREATE POLICY "Usuários deletam apenas seus familiares"
  ON cliente_familiares FOR DELETE
  USING (auth.uid() = usuario_id);

-- Tabela para avaliações NPS
CREATE TABLE IF NOT EXISTS cliente_nps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  cliente_id UUID NOT NULL REFERENCES clientes(id) ON DELETE CASCADE,
  encomenda_id UUID REFERENCES encomendas(id) ON DELETE SET NULL,
  nota INTEGER NOT NULL CHECK (nota >= 0 AND nota <= 10),
  comentario TEXT,
  categoria VARCHAR(20) GENERATED ALWAYS AS (
    CASE 
      WHEN nota >= 9 THEN 'promotor'
      WHEN nota >= 7 THEN 'neutro'
      ELSE 'detrator'
    END
  ) STORED,
  enviado_em TIMESTAMP WITH TIME ZONE,
  respondido_em TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para cliente_nps
CREATE INDEX IF NOT EXISTS idx_nps_cliente ON cliente_nps(cliente_id);
CREATE INDEX IF NOT EXISTS idx_nps_categoria ON cliente_nps(categoria);
CREATE INDEX IF NOT EXISTS idx_nps_data ON cliente_nps(respondido_em);
CREATE INDEX IF NOT EXISTS idx_nps_usuario ON cliente_nps(usuario_id);

-- RLS para cliente_nps
ALTER TABLE cliente_nps ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuários veem apenas suas avaliações"
  ON cliente_nps FOR ALL
  USING (auth.uid() = usuario_id);

-- Função para calcular e atualizar segmento do cliente
CREATE OR REPLACE FUNCTION atualizar_segmento_cliente()
RETURNS TRIGGER AS $$
BEGIN
  -- Atualizar dados de compra
  UPDATE clientes c
  SET 
    ultima_compra = (
      SELECT MAX(data_entrega) 
      FROM encomendas 
      WHERE cliente_id = NEW.cliente_id 
        AND status = 'entregue'
    ),
    total_compras = (
      SELECT COALESCE(SUM(valor_total), 0)
      FROM encomendas
      WHERE cliente_id = NEW.cliente_id
        AND status = 'entregue'
    ),
    quantidade_pedidos = (
      SELECT COUNT(*)
      FROM encomendas
      WHERE cliente_id = NEW.cliente_id
        AND status = 'entregue'
    )
  WHERE id = NEW.cliente_id;
  
  -- Atualizar segmento
  UPDATE clientes
  SET segmento = CASE
    WHEN quantidade_pedidos >= 5 OR total_compras >= 1000 THEN 'vip'
    WHEN ultima_compra < CURRENT_DATE - INTERVAL '90 days' THEN 'inativo'
    WHEN quantidade_pedidos BETWEEN 2 AND 4 THEN 'eventual'
    ELSE 'novo'
  END
  WHERE id = NEW.cliente_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para atualizar após mudança de status da encomenda
DROP TRIGGER IF EXISTS trigger_atualizar_segmento ON encomendas;
CREATE TRIGGER trigger_atualizar_segmento
  AFTER INSERT OR UPDATE OF status ON encomendas
  FOR EACH ROW
  WHEN (NEW.status = 'entregue')
  EXECUTE FUNCTION atualizar_segmento_cliente();

-- View unificada de aniversariantes
CREATE OR REPLACE VIEW v_aniversariantes_completa AS
SELECT 
  c.usuario_id,
  c.id as cliente_id,
  c.nome,
  'cliente' as tipo,
  NULL::VARCHAR(50) as parentesco,
  c.data_aniversario as data_nascimento,
  c.telefone,
  c.email,
  EXTRACT(MONTH FROM c.data_aniversario) as mes_aniversario,
  EXTRACT(DAY FROM c.data_aniversario) as dia_aniversario,
  CASE 
    WHEN DATE_PART('doy', c.data_aniversario) >= DATE_PART('doy', CURRENT_DATE)
    THEN MAKE_DATE(
      EXTRACT(YEAR FROM CURRENT_DATE)::INTEGER,
      EXTRACT(MONTH FROM c.data_aniversario)::INTEGER,
      EXTRACT(DAY FROM c.data_aniversario)::INTEGER
    )
    ELSE MAKE_DATE(
      EXTRACT(YEAR FROM CURRENT_DATE)::INTEGER + 1,
      EXTRACT(MONTH FROM c.data_aniversario)::INTEGER,
      EXTRACT(DAY FROM c.data_aniversario)::INTEGER
    )
  END as proximo_aniversario,
  c.observacoes
FROM clientes c
WHERE c.data_aniversario IS NOT NULL

UNION ALL

SELECT 
  cf.usuario_id,
  cf.cliente_id,
  cf.nome || ' (' || c.nome || ')' as nome,
  'familiar' as tipo,
  cf.parentesco,
  cf.data_nascimento,
  c.telefone,
  c.email,
  EXTRACT(MONTH FROM cf.data_nascimento) as mes_aniversario,
  EXTRACT(DAY FROM cf.data_nascimento) as dia_aniversario,
  CASE 
    WHEN DATE_PART('doy', cf.data_nascimento) >= DATE_PART('doy', CURRENT_DATE)
    THEN MAKE_DATE(
      EXTRACT(YEAR FROM CURRENT_DATE)::INTEGER,
      EXTRACT(MONTH FROM cf.data_nascimento)::INTEGER,
      EXTRACT(DAY FROM cf.data_nascimento)::INTEGER
    )
    ELSE MAKE_DATE(
      EXTRACT(YEAR FROM CURRENT_DATE)::INTEGER + 1,
      EXTRACT(MONTH FROM cf.data_nascimento)::INTEGER,
      EXTRACT(DAY FROM cf.data_nascimento)::INTEGER
    )
  END as proximo_aniversario,
  cf.observacoes
FROM cliente_familiares cf
JOIN clientes c ON cf.cliente_id = c.id
WHERE cf.data_nascimento IS NOT NULL
  AND cf.ativo = true;

-- Função para buscar aniversariantes do mês
CREATE OR REPLACE FUNCTION get_aniversariantes_mes(mes_param INTEGER DEFAULT NULL)
RETURNS TABLE (
  cliente_id UUID,
  nome TEXT,
  tipo TEXT,
  parentesco VARCHAR(50),
  data_nascimento DATE,
  telefone VARCHAR(20),
  email VARCHAR(200),
  proximo_aniversario DATE,
  dias_ate_aniversario INTEGER,
  observacoes TEXT
) 
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    v.cliente_id,
    v.nome,
    v.tipo,
    v.parentesco,
    v.data_nascimento,
    v.telefone,
    v.email,
    v.proximo_aniversario,
    (v.proximo_aniversario - CURRENT_DATE)::INTEGER as dias_ate_aniversario,
    v.observacoes
  FROM v_aniversariantes_completa v
  WHERE v.usuario_id = auth.uid()
    AND (mes_param IS NULL OR v.mes_aniversario = mes_param)
  ORDER BY v.proximo_aniversario;
END;
$$ LANGUAGE plpgsql;