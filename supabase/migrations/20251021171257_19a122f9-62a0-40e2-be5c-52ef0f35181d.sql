-- ==========================================
-- TABELA: plano_contas
-- ==========================================
CREATE TABLE IF NOT EXISTS plano_contas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  categoria_id UUID NOT NULL REFERENCES categorias_plano_contas(id) ON DELETE RESTRICT,
  
  codigo INTEGER NOT NULL,
  codigo_estruturado VARCHAR(20) NOT NULL,
  descricao VARCHAR(255) NOT NULL,
  ativo BOOLEAN DEFAULT true,
  e_padrao BOOLEAN DEFAULT false,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT unique_codigo_estruturado_por_usuario UNIQUE (user_id, codigo_estruturado)
);

CREATE INDEX IF NOT EXISTS idx_plano_contas_user ON plano_contas(user_id);
CREATE INDEX IF NOT EXISTS idx_plano_contas_categoria ON plano_contas(categoria_id);
CREATE INDEX IF NOT EXISTS idx_plano_contas_ativo ON plano_contas(ativo);
CREATE INDEX IF NOT EXISTS idx_plano_contas_codigo ON plano_contas(codigo);

ALTER TABLE plano_contas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own plano_contas" 
  ON plano_contas FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own plano_contas" 
  ON plano_contas FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own plano_contas" 
  ON plano_contas FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own plano_contas" 
  ON plano_contas FOR DELETE 
  USING (auth.uid() = user_id);

CREATE TRIGGER update_plano_contas_updated_at 
  BEFORE UPDATE ON plano_contas 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

COMMENT ON TABLE plano_contas IS 'Plano de Contas detalhado para lançamentos financeiros';

-- ==========================================
-- FUNÇÃO: Gerar próximo código simples
-- ==========================================
CREATE OR REPLACE FUNCTION gerar_proximo_codigo_plano(p_user_id UUID)
RETURNS INTEGER AS $$
DECLARE
  ultimo_codigo INTEGER;
BEGIN
  SELECT COALESCE(MAX(codigo), 0) INTO ultimo_codigo
  FROM plano_contas
  WHERE user_id = p_user_id;
  
  RETURN ultimo_codigo + 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- ==========================================
-- FUNÇÃO: Gerar próximo código estruturado
-- ==========================================
CREATE OR REPLACE FUNCTION gerar_proximo_codigo_estruturado(p_user_id UUID, p_categoria_id UUID)
RETURNS VARCHAR AS $$
DECLARE
  codigo_categoria VARCHAR;
  ultimo_sequencial INTEGER;
  proximo_sequencial INTEGER;
BEGIN
  -- Buscar código da categoria
  SELECT codigo INTO codigo_categoria
  FROM categorias_plano_contas
  WHERE id = p_categoria_id;
  
  -- Buscar último sequencial desta categoria
  SELECT COALESCE(MAX(
    CAST(
      SUBSTRING(codigo_estruturado FROM POSITION('.' IN codigo_estruturado) + 1) 
      AS INTEGER
    )
  ), 0) INTO ultimo_sequencial
  FROM plano_contas
  WHERE user_id = p_user_id
    AND categoria_id = p_categoria_id
    AND codigo_estruturado LIKE codigo_categoria || '.%';
  
  proximo_sequencial := ultimo_sequencial + 1;
  
  -- Retornar código estruturado (ex: 1.01, 1.02)
  RETURN codigo_categoria || '.' || LPAD(proximo_sequencial::TEXT, 2, '0');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- ==========================================
-- FUNÇÃO: Criar planos padrão para usuário
-- ==========================================
CREATE OR REPLACE FUNCTION criar_planos_contas_padrao(p_user_id UUID)
RETURNS void AS $$
DECLARE
  v_cat_id UUID;
  v_codigo INTEGER;
BEGIN
  v_codigo := 1;

  -- CATEGORIA 1 - Receita com Vendas
  SELECT id INTO v_cat_id FROM categorias_plano_contas WHERE user_id = p_user_id AND codigo = '1';
  IF v_cat_id IS NOT NULL THEN
    INSERT INTO plano_contas (user_id, categoria_id, codigo, codigo_estruturado, descricao, e_padrao) VALUES
    (p_user_id, v_cat_id, v_codigo, '1.01', 'Vendas no Balcão', true), 
    (p_user_id, v_cat_id, v_codigo + 1, '1.02', 'Vendas por Encomenda', true),
    (p_user_id, v_cat_id, v_codigo + 2, '1.03', 'Vendas Delivery', true),
    (p_user_id, v_cat_id, v_codigo + 3, '1.04', 'Vendas Atacado', true),
    (p_user_id, v_cat_id, v_codigo + 4, '1.05', 'Vendas Eventos', true)
    ON CONFLICT (user_id, codigo_estruturado) DO NOTHING;
    v_codigo := v_codigo + 5;
  END IF;

  -- CATEGORIA 2 - Impostos Sobre Vendas
  SELECT id INTO v_cat_id FROM categorias_plano_contas WHERE user_id = p_user_id AND codigo = '2';
  IF v_cat_id IS NOT NULL THEN
    INSERT INTO plano_contas (user_id, categoria_id, codigo, codigo_estruturado, descricao, e_padrao) VALUES
    (p_user_id, v_cat_id, v_codigo, '2.01', 'Simples Nacional', true),
    (p_user_id, v_cat_id, v_codigo + 1, '2.02', 'ICMS', true),
    (p_user_id, v_cat_id, v_codigo + 2, '2.03', 'PIS', true),
    (p_user_id, v_cat_id, v_codigo + 3, '2.04', 'COFINS', true),
    (p_user_id, v_cat_id, v_codigo + 4, '2.05', 'ISS', true)
    ON CONFLICT (user_id, codigo_estruturado) DO NOTHING;
    v_codigo := v_codigo + 5;
  END IF;

  -- CATEGORIA 3 - CMV
  SELECT id INTO v_cat_id FROM categorias_plano_contas WHERE user_id = p_user_id AND codigo = '3';
  IF v_cat_id IS NOT NULL THEN
    INSERT INTO plano_contas (user_id, categoria_id, codigo, codigo_estruturado, descricao, e_padrao) VALUES
    (p_user_id, v_cat_id, v_codigo, '3.01', 'Custo de Ingredientes', true),
    (p_user_id, v_cat_id, v_codigo + 1, '3.02', 'Custo de Embalagens', true),
    (p_user_id, v_cat_id, v_codigo + 2, '3.03', 'Custo de Pré-Preparos', true),
    (p_user_id, v_cat_id, v_codigo + 3, '3.04', 'Perdas e Quebras', true)
    ON CONFLICT (user_id, codigo_estruturado) DO NOTHING;
    v_codigo := v_codigo + 4;
  END IF;

  -- CATEGORIA 5 - Despesas com Pessoal
  SELECT id INTO v_cat_id FROM categorias_plano_contas WHERE user_id = p_user_id AND codigo = '5';
  IF v_cat_id IS NOT NULL THEN
    INSERT INTO plano_contas (user_id, categoria_id, codigo, codigo_estruturado, descricao, e_padrao) VALUES
    (p_user_id, v_cat_id, v_codigo, '5.01', 'Salários', true),
    (p_user_id, v_cat_id, v_codigo + 1, '5.02', 'Encargos Sociais', true),
    (p_user_id, v_cat_id, v_codigo + 2, '5.03', 'Vale Transporte', true),
    (p_user_id, v_cat_id, v_codigo + 3, '5.04', 'Vale Alimentação', true),
    (p_user_id, v_cat_id, v_codigo + 4, '5.05', 'Benefícios', true),
    (p_user_id, v_cat_id, v_codigo + 5, '5.06', 'Uniformes', true)
    ON CONFLICT (user_id, codigo_estruturado) DO NOTHING;
    v_codigo := v_codigo + 6;
  END IF;

  -- CATEGORIA 6 - Despesas com Ocupação
  SELECT id INTO v_cat_id FROM categorias_plano_contas WHERE user_id = p_user_id AND codigo = '6';
  IF v_cat_id IS NOT NULL THEN
    INSERT INTO plano_contas (user_id, categoria_id, codigo, codigo_estruturado, descricao, e_padrao) VALUES
    (p_user_id, v_cat_id, v_codigo, '6.01', 'Aluguel', true),
    (p_user_id, v_cat_id, v_codigo + 1, '6.02', 'Condomínio', true),
    (p_user_id, v_cat_id, v_codigo + 2, '6.03', 'IPTU', true),
    (p_user_id, v_cat_id, v_codigo + 3, '6.04', 'Água', true),
    (p_user_id, v_cat_id, v_codigo + 4, '6.05', 'Energia Elétrica', true),
    (p_user_id, v_cat_id, v_codigo + 5, '6.06', 'Gás', true),
    (p_user_id, v_cat_id, v_codigo + 6, '6.07', 'Internet e Telefone', true)
    ON CONFLICT (user_id, codigo_estruturado) DO NOTHING;
    v_codigo := v_codigo + 7;
  END IF;

  -- CATEGORIA 7 - Despesas Administrativas
  SELECT id INTO v_cat_id FROM categorias_plano_contas WHERE user_id = p_user_id AND codigo = '7';
  IF v_cat_id IS NOT NULL THEN
    INSERT INTO plano_contas (user_id, categoria_id, codigo, codigo_estruturado, descricao, e_padrao) VALUES
    (p_user_id, v_cat_id, v_codigo, '7.01', 'Material de Escritório', true),
    (p_user_id, v_cat_id, v_codigo + 1, '7.02', 'Material de Limpeza', true),
    (p_user_id, v_cat_id, v_codigo + 2, '7.03', 'Contador', true),
    (p_user_id, v_cat_id, v_codigo + 3, '7.04', 'Assessoria Jurídica', true),
    (p_user_id, v_cat_id, v_codigo + 4, '7.05', 'Seguros', true),
    (p_user_id, v_cat_id, v_codigo + 5, '7.06', 'Licenças e Taxas', true)
    ON CONFLICT (user_id, codigo_estruturado) DO NOTHING;
    v_codigo := v_codigo + 6;
  END IF;

  -- CATEGORIA 8 - Despesas Comerciais
  SELECT id INTO v_cat_id FROM categorias_plano_contas WHERE user_id = p_user_id AND codigo = '8';
  IF v_cat_id IS NOT NULL THEN
    INSERT INTO plano_contas (user_id, categoria_id, codigo, codigo_estruturado, descricao, e_padrao) VALUES
    (p_user_id, v_cat_id, v_codigo, '8.01', 'Marketing e Publicidade', true),
    (p_user_id, v_cat_id, v_codigo + 1, '8.02', 'Comissões de Vendas', true),
    (p_user_id, v_cat_id, v_codigo + 2, '8.03', 'Taxas de Delivery', true),
    (p_user_id, v_cat_id, v_codigo + 3, '8.04', 'Brindes e Amostras', true),
    (p_user_id, v_cat_id, v_codigo + 4, '8.05', 'Embalagens Promocionais', true)
    ON CONFLICT (user_id, codigo_estruturado) DO NOTHING;
    v_codigo := v_codigo + 5;
  END IF;

  -- CATEGORIA 9 - Receitas não Operacionais
  SELECT id INTO v_cat_id FROM categorias_plano_contas WHERE user_id = p_user_id AND codigo = '9';
  IF v_cat_id IS NOT NULL THEN
    INSERT INTO plano_contas (user_id, categoria_id, codigo, codigo_estruturado, descricao, e_padrao) VALUES
    (p_user_id, v_cat_id, v_codigo, '9.01', 'Venda de Ativos', true),
    (p_user_id, v_cat_id, v_codigo + 1, '9.02', 'Ganhos de Capital', true),
    (p_user_id, v_cat_id, v_codigo + 2, '9.03', 'Outras Receitas', true)
    ON CONFLICT (user_id, codigo_estruturado) DO NOTHING;
    v_codigo := v_codigo + 3;
  END IF;

  -- CATEGORIA 10 - Gastos não Operacionais
  SELECT id INTO v_cat_id FROM categorias_plano_contas WHERE user_id = p_user_id AND codigo = '10';
  IF v_cat_id IS NOT NULL THEN
    INSERT INTO plano_contas (user_id, categoria_id, codigo, codigo_estruturado, descricao, e_padrao) VALUES
    (p_user_id, v_cat_id, v_codigo, '10.01', 'Perdas Extraordinárias', true),
    (p_user_id, v_cat_id, v_codigo + 1, '10.02', 'Multas e Penalidades', true),
    (p_user_id, v_cat_id, v_codigo + 2, '10.03', 'Outras Despesas', true)
    ON CONFLICT (user_id, codigo_estruturado) DO NOTHING;
    v_codigo := v_codigo + 3;
  END IF;

  -- CATEGORIA 12 - Investimentos (-)
  SELECT id INTO v_cat_id FROM categorias_plano_contas WHERE user_id = p_user_id AND codigo = '12';
  IF v_cat_id IS NOT NULL THEN
    INSERT INTO plano_contas (user_id, categoria_id, codigo, codigo_estruturado, descricao, e_padrao) VALUES
    (p_user_id, v_cat_id, v_codigo, '12.01', 'Compra de Equipamentos', true),
    (p_user_id, v_cat_id, v_codigo + 1, '12.02', 'Reformas e Benfeitorias', true),
    (p_user_id, v_cat_id, v_codigo + 2, '12.03', 'Veículos', true)
    ON CONFLICT (user_id, codigo_estruturado) DO NOTHING;
    v_codigo := v_codigo + 3;
  END IF;

  -- CATEGORIA 13 - Transferências Débito
  SELECT id INTO v_cat_id FROM categorias_plano_contas WHERE user_id = p_user_id AND codigo = '13';
  IF v_cat_id IS NOT NULL THEN
    INSERT INTO plano_contas (user_id, categoria_id, codigo, codigo_estruturado, descricao, e_padrao) VALUES
    (p_user_id, v_cat_id, v_codigo, '13.01', 'Transferência entre Contas', true),
    (p_user_id, v_cat_id, v_codigo + 1, '13.02', 'Retirada de Sócios (Pró-labore)', true)
    ON CONFLICT (user_id, codigo_estruturado) DO NOTHING;
    v_codigo := v_codigo + 2;
  END IF;

  -- CATEGORIA 14 - Transferências Crédito
  SELECT id INTO v_cat_id FROM categorias_plano_contas WHERE user_id = p_user_id AND codigo = '14';
  IF v_cat_id IS NOT NULL THEN
    INSERT INTO plano_contas (user_id, categoria_id, codigo, codigo_estruturado, descricao, e_padrao) VALUES
    (p_user_id, v_cat_id, v_codigo, '14.01', 'Transferência entre Contas', true),
    (p_user_id, v_cat_id, v_codigo + 1, '14.02', 'Aporte de Capital', true)
    ON CONFLICT (user_id, codigo_estruturado) DO NOTHING;
    v_codigo := v_codigo + 2;
  END IF;

  -- CATEGORIA 99 - Outras Deduções
  SELECT id INTO v_cat_id FROM categorias_plano_contas WHERE user_id = p_user_id AND codigo = '99';
  IF v_cat_id IS NOT NULL THEN
    INSERT INTO plano_contas (user_id, categoria_id, codigo, codigo_estruturado, descricao, e_padrao) VALUES
    (p_user_id, v_cat_id, v_codigo, '99.01', 'Descontos Concedidos', true),
    (p_user_id, v_cat_id, v_codigo + 1, '99.02', 'Devoluções de Vendas', true),
    (p_user_id, v_cat_id, v_codigo + 2, '99.03', 'Cancelamentos', true)
    ON CONFLICT (user_id, codigo_estruturado) DO NOTHING;
    v_codigo := v_codigo + 3;
  END IF;

  -- CATEGORIA 103 - Despesa Operacional Variável
  SELECT id INTO v_cat_id FROM categorias_plano_contas WHERE user_id = p_user_id AND codigo = '103';
  IF v_cat_id IS NOT NULL THEN
    INSERT INTO plano_contas (user_id, categoria_id, codigo, codigo_estruturado, descricao, e_padrao) VALUES
    (p_user_id, v_cat_id, v_codigo, '103.01', 'Frete e Entregas', true),
    (p_user_id, v_cat_id, v_codigo + 1, '103.02', 'Embalagens Variáveis', true),
    (p_user_id, v_cat_id, v_codigo + 2, '103.03', 'Manutenção de Equipamentos', true)
    ON CONFLICT (user_id, codigo_estruturado) DO NOTHING;
    v_codigo := v_codigo + 3;
  END IF;

  -- CATEGORIA 106 - Receitas Financeiras
  SELECT id INTO v_cat_id FROM categorias_plano_contas WHERE user_id = p_user_id AND codigo = '106';
  IF v_cat_id IS NOT NULL THEN
    INSERT INTO plano_contas (user_id, categoria_id, codigo, codigo_estruturado, descricao, e_padrao) VALUES
    (p_user_id, v_cat_id, v_codigo, '106.01', 'Juros Recebidos', true),
    (p_user_id, v_cat_id, v_codigo + 1, '106.02', 'Rendimentos de Aplicações', true),
    (p_user_id, v_cat_id, v_codigo + 2, '106.03', 'Descontos Obtidos', true)
    ON CONFLICT (user_id, codigo_estruturado) DO NOTHING;
    v_codigo := v_codigo + 3;
  END IF;

  -- CATEGORIA 107 - Despesas Financeiras
  SELECT id INTO v_cat_id FROM categorias_plano_contas WHERE user_id = p_user_id AND codigo = '107';
  IF v_cat_id IS NOT NULL THEN
    INSERT INTO plano_contas (user_id, categoria_id, codigo, codigo_estruturado, descricao, e_padrao) VALUES
    (p_user_id, v_cat_id, v_codigo, '107.01', 'Juros Pagos', true),
    (p_user_id, v_cat_id, v_codigo + 1, '107.02', 'IOF', true),
    (p_user_id, v_cat_id, v_codigo + 2, '107.03', 'Tarifas Bancárias', true),
    (p_user_id, v_cat_id, v_codigo + 3, '107.04', 'Descontos Concedidos Financeiros', true)
    ON CONFLICT (user_id, codigo_estruturado) DO NOTHING;
    v_codigo := v_codigo + 4;
  END IF;

  -- CATEGORIA 111 - Investimentos (+)
  SELECT id INTO v_cat_id FROM categorias_plano_contas WHERE user_id = p_user_id AND codigo = '111';
  IF v_cat_id IS NOT NULL THEN
    INSERT INTO plano_contas (user_id, categoria_id, codigo, codigo_estruturado, descricao, e_padrao) VALUES
    (p_user_id, v_cat_id, v_codigo, '111.01', 'Venda de Equipamentos', true),
    (p_user_id, v_cat_id, v_codigo + 1, '111.02', 'Recuperação de Investimentos', true)
    ON CONFLICT (user_id, codigo_estruturado) DO NOTHING;
  END IF;

END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

COMMENT ON FUNCTION criar_planos_contas_padrao IS 'Cria planos de contas padrão para confeitaria';