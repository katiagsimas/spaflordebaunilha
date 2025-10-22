-- ==========================================
-- TABELA: configuracoes_juros
-- ==========================================
CREATE TABLE IF NOT EXISTS configuracoes_juros (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  cobrar_juros BOOLEAN DEFAULT true,
  tipo_juros VARCHAR(20) NOT NULL DEFAULT 'mensal' CHECK (tipo_juros IN ('mensal', 'diario')),
  percentual_juros NUMERIC(5,2) NOT NULL DEFAULT 1.00,
  
  multa_atraso BOOLEAN DEFAULT false,
  percentual_multa NUMERIC(5,2) DEFAULT 2.00,
  
  observacao TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT unique_config_por_user UNIQUE (usuario_id)
);

CREATE INDEX IF NOT EXISTS idx_config_juros_user ON configuracoes_juros(usuario_id);

ALTER TABLE configuracoes_juros ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own config_juros" 
  ON configuracoes_juros FOR ALL
  USING (auth.uid() = usuario_id)
  WITH CHECK (auth.uid() = usuario_id);

COMMENT ON TABLE configuracoes_juros IS 'Configurações de juros e multas por usuário';
COMMENT ON COLUMN configuracoes_juros.cobrar_juros IS 'Se deve cobrar juros automaticamente';
COMMENT ON COLUMN configuracoes_juros.tipo_juros IS 'Tipo: mensal ou diario';
COMMENT ON COLUMN configuracoes_juros.percentual_juros IS 'Percentual de juros (ex: 1.00 = 1%)';
COMMENT ON COLUMN configuracoes_juros.multa_atraso IS 'Se cobra multa por atraso';
COMMENT ON COLUMN configuracoes_juros.percentual_multa IS 'Percentual de multa (ex: 2.00 = 2%)';

-- ==========================================
-- FUNÇÃO ATUALIZADA: Calcular juros com config
-- ==========================================
CREATE OR REPLACE FUNCTION calcular_juros_com_config(
  p_user_id UUID,
  p_valor_parcela NUMERIC,
  p_data_vencimento DATE,
  p_data_pagamento DATE
)
RETURNS TABLE(
  juros NUMERIC,
  multa NUMERIC,
  total NUMERIC
) AS $$
DECLARE
  v_config RECORD;
  v_dias_atraso INTEGER;
  v_juros NUMERIC := 0;
  v_multa NUMERIC := 0;
  v_taxa_dia NUMERIC;
BEGIN
  -- Buscar configuração do usuário
  SELECT * INTO v_config
  FROM configuracoes_juros
  WHERE usuario_id = p_user_id;
  
  -- Se não tem config, criar padrão
  IF NOT FOUND THEN
    INSERT INTO configuracoes_juros (usuario_id)
    VALUES (p_user_id)
    RETURNING * INTO v_config;
  END IF;
  
  -- Calcular dias de atraso
  v_dias_atraso := GREATEST(0, p_data_pagamento - p_data_vencimento);
  
  IF v_dias_atraso > 0 THEN
    -- Calcular JUROS
    IF v_config.cobrar_juros THEN
      IF v_config.tipo_juros = 'mensal' THEN
        -- Juros mensal: divide por 30 para obter taxa diária
        v_taxa_dia := v_config.percentual_juros / 30;
        v_juros := p_valor_parcela * (v_taxa_dia / 100) * v_dias_atraso;
      ELSE
        -- Juros diário
        v_juros := p_valor_parcela * (v_config.percentual_juros / 100) * v_dias_atraso;
      END IF;
    END IF;
    
    -- Calcular MULTA (aplicada uma única vez)
    IF v_config.multa_atraso THEN
      v_multa := p_valor_parcela * (v_config.percentual_multa / 100);
    END IF;
  END IF;
  
  RETURN QUERY SELECT 
    ROUND(v_juros, 2) AS juros,
    ROUND(v_multa, 2) AS multa,
    ROUND(v_juros + v_multa, 2) AS total;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

COMMENT ON FUNCTION calcular_juros_com_config IS 'Calcula juros e multa baseado nas configurações do usuário';

-- ==========================================
-- Inserir configuração padrão para users existentes
-- ==========================================
INSERT INTO configuracoes_juros (usuario_id, cobrar_juros, tipo_juros, percentual_juros)
SELECT id, true, 'mensal', 1.00
FROM auth.users
WHERE NOT EXISTS (
  SELECT 1 FROM configuracoes_juros WHERE usuario_id = auth.users.id
)
ON CONFLICT (usuario_id) DO NOTHING;