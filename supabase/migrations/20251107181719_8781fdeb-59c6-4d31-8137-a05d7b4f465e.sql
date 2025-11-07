-- Criar tabela de contatos dos fornecedores
CREATE TABLE IF NOT EXISTS fornecedor_contatos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  fornecedor_id UUID NOT NULL REFERENCES fornecedores(id) ON DELETE CASCADE,
  nome VARCHAR(200) NOT NULL,
  cargo VARCHAR(100),
  telefone VARCHAR(20),
  email VARCHAR(200),
  data_aniversario DATE,
  observacoes TEXT,
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  CONSTRAINT fk_usuario_contato FOREIGN KEY (usuario_id) REFERENCES auth.users(id),
  CONSTRAINT fk_fornecedor_contato FOREIGN KEY (fornecedor_id) REFERENCES fornecedores(id)
);

-- Índices
CREATE INDEX idx_contatos_fornecedor ON fornecedor_contatos(fornecedor_id);
CREATE INDEX idx_contatos_data_aniversario ON fornecedor_contatos(data_aniversario);
CREATE INDEX idx_contatos_usuario ON fornecedor_contatos(usuario_id);
CREATE INDEX idx_contatos_ativo ON fornecedor_contatos(ativo) WHERE ativo = true;

-- RLS (Row Level Security)
ALTER TABLE fornecedor_contatos ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
CREATE POLICY "Usuários veem apenas seus contatos de fornecedores"
  ON fornecedor_contatos FOR SELECT
  USING (auth.uid() = usuario_id);

CREATE POLICY "Usuários inserem apenas seus contatos de fornecedores"
  ON fornecedor_contatos FOR INSERT
  WITH CHECK (auth.uid() = usuario_id);

CREATE POLICY "Usuários atualizam apenas seus contatos de fornecedores"
  ON fornecedor_contatos FOR UPDATE
  USING (auth.uid() = usuario_id);

CREATE POLICY "Usuários deletam apenas seus contatos de fornecedores"
  ON fornecedor_contatos FOR DELETE
  USING (auth.uid() = usuario_id);

-- Trigger para updated_at
CREATE TRIGGER update_fornecedor_contatos_updated_at
  BEFORE UPDATE ON fornecedor_contatos
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- View unificada de aniversariantes (fornecedores + contatos)
CREATE OR REPLACE VIEW v_aniversariantes_fornecedores AS
SELECT 
  f.usuario_id,
  f.id as fornecedor_id,
  f.nome || ' - ' || COALESCE(f.contato, 'Contato Principal') as nome,
  'fornecedor' as tipo,
  NULL as cargo,
  f.telefone,
  f.email,
  f.data_aniversario_contato as data_aniversario,
  EXTRACT(MONTH FROM f.data_aniversario_contato) as mes_aniversario,
  EXTRACT(DAY FROM f.data_aniversario_contato) as dia_aniversario,
  CASE 
    WHEN DATE_PART('doy', f.data_aniversario_contato) >= DATE_PART('doy', CURRENT_DATE)
    THEN MAKE_DATE(
      EXTRACT(YEAR FROM CURRENT_DATE)::INTEGER,
      EXTRACT(MONTH FROM f.data_aniversario_contato)::INTEGER,
      EXTRACT(DAY FROM f.data_aniversario_contato)::INTEGER
    )
    ELSE MAKE_DATE(
      EXTRACT(YEAR FROM CURRENT_DATE)::INTEGER + 1,
      EXTRACT(MONTH FROM f.data_aniversario_contato)::INTEGER,
      EXTRACT(DAY FROM f.data_aniversario_contato)::INTEGER
    )
  END as proximo_aniversario,
  f.observacoes
FROM fornecedores f
WHERE f.data_aniversario_contato IS NOT NULL

UNION ALL

SELECT 
  fc.usuario_id,
  fc.fornecedor_id,
  fc.nome || ' (' || f.nome || ')' as nome,
  'contato' as tipo,
  fc.cargo,
  fc.telefone,
  fc.email,
  fc.data_aniversario,
  EXTRACT(MONTH FROM fc.data_aniversario) as mes_aniversario,
  EXTRACT(DAY FROM fc.data_aniversario) as dia_aniversario,
  CASE 
    WHEN DATE_PART('doy', fc.data_aniversario) >= DATE_PART('doy', CURRENT_DATE)
    THEN MAKE_DATE(
      EXTRACT(YEAR FROM CURRENT_DATE)::INTEGER,
      EXTRACT(MONTH FROM fc.data_aniversario)::INTEGER,
      EXTRACT(DAY FROM fc.data_aniversario)::INTEGER
    )
    ELSE MAKE_DATE(
      EXTRACT(YEAR FROM CURRENT_DATE)::INTEGER + 1,
      EXTRACT(MONTH FROM fc.data_aniversario)::INTEGER,
      EXTRACT(DAY FROM fc.data_aniversario)::INTEGER
    )
  END as proximo_aniversario,
  fc.observacoes
FROM fornecedor_contatos fc
JOIN fornecedores f ON fc.fornecedor_id = f.id
WHERE fc.data_aniversario IS NOT NULL
  AND fc.ativo = true;

-- Função para buscar aniversariantes de fornecedores do mês
CREATE OR REPLACE FUNCTION get_aniversariantes_fornecedores_mes(mes_param INTEGER DEFAULT NULL)
RETURNS TABLE (
  fornecedor_id UUID,
  nome TEXT,
  tipo TEXT,
  cargo VARCHAR(100),
  telefone VARCHAR(20),
  email VARCHAR(200),
  data_aniversario DATE,
  proximo_aniversario DATE,
  dias_ate_aniversario INTEGER,
  observacoes TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    v.fornecedor_id,
    v.nome,
    v.tipo,
    v.cargo,
    v.telefone,
    v.email,
    v.data_aniversario,
    v.proximo_aniversario,
    (v.proximo_aniversario - CURRENT_DATE)::INTEGER as dias_ate_aniversario,
    v.observacoes
  FROM v_aniversariantes_fornecedores v
  WHERE v.usuario_id = auth.uid()
    AND (mes_param IS NULL OR v.mes_aniversario = mes_param)
  ORDER BY v.proximo_aniversario;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;