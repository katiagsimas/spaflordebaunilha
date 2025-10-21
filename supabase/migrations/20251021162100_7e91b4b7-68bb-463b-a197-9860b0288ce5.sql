-- ==========================================
-- TABELA: categorias_plano_contas
-- ==========================================
CREATE TABLE IF NOT EXISTS categorias_plano_contas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  codigo VARCHAR(10) NOT NULL,
  descricao VARCHAR(255) NOT NULL,
  indicador VARCHAR(10) NOT NULL CHECK (indicador IN ('Credito', 'Debito')),
  faixa_dre VARCHAR(100) NOT NULL,
  ativo BOOLEAN DEFAULT true,
  ordem INTEGER NOT NULL DEFAULT 0,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT unique_codigo_por_usuario UNIQUE (user_id, codigo)
);

CREATE INDEX IF NOT EXISTS idx_cat_plano_user ON categorias_plano_contas(user_id);
CREATE INDEX IF NOT EXISTS idx_cat_plano_ativo ON categorias_plano_contas(ativo);
CREATE INDEX IF NOT EXISTS idx_cat_plano_ordem ON categorias_plano_contas(ordem);

ALTER TABLE categorias_plano_contas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own categorias_plano" 
  ON categorias_plano_contas FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own categorias_plano" 
  ON categorias_plano_contas FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own categorias_plano" 
  ON categorias_plano_contas FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own categorias_plano" 
  ON categorias_plano_contas FOR DELETE 
  USING (auth.uid() = user_id);

CREATE TRIGGER update_categorias_plano_updated_at 
  BEFORE UPDATE ON categorias_plano_contas 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

COMMENT ON TABLE categorias_plano_contas IS 'Categorias do Plano de Contas para classificação no DRE';

-- ==========================================
-- FUNÇÃO: Criar categorias padrão para novo usuário
-- ==========================================
CREATE OR REPLACE FUNCTION criar_categorias_plano_padrao(p_user_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO categorias_plano_contas (user_id, codigo, descricao, indicador, faixa_dre, ordem) VALUES
  (p_user_id, '1', 'Receita com Vendas', 'Credito', 'Receitas', 1),
  (p_user_id, '2', 'Impostos Sobre Vendas', 'Debito', 'Deduções sobre vendas', 2),
  (p_user_id, '3', 'CMV - Custo de Mercadoria Vendida', 'Debito', 'Custos variáveis', 3),
  (p_user_id, '5', 'Despesas com Pessoal', 'Debito', 'Custos fixos', 4),
  (p_user_id, '6', 'Despesas com Ocupação', 'Debito', 'Custos fixos', 5),
  (p_user_id, '7', 'Despesas Administrativas', 'Debito', 'Custos fixos', 6),
  (p_user_id, '8', 'Despesas Comerciais', 'Debito', 'Custos variáveis', 7),
  (p_user_id, '9', 'Receitas não Operacionais', 'Credito', 'Resultado não operacional', 8),
  (p_user_id, '10', 'Gastos não Operacionais', 'Debito', 'Resultado não operacional', 9),
  (p_user_id, '12', 'Investimentos (-)', 'Debito', 'Não listar no DRE', 10),
  (p_user_id, '13', 'Transferências e Ajustes de Saldo', 'Debito', 'Não listar no DRE', 11),
  (p_user_id, '14', 'Transferências e Ajustes de Saldo', 'Credito', 'Não listar no DRE', 12),
  (p_user_id, '99', 'Outras Deduções sobre Vendas', 'Debito', 'Deduções sobre vendas', 13),
  (p_user_id, '103', 'Despesa Operacional Variável', 'Debito', 'Custos variáveis', 14),
  (p_user_id, '106', 'Receitas Financeiras', 'Credito', 'Resultado financeiro', 15),
  (p_user_id, '107', 'Despesas Financeiras', 'Debito', 'Resultado financeiro', 16),
  (p_user_id, '111', 'Investimentos (+)', 'Credito', 'Investimento', 17);
END;
$$;

COMMENT ON FUNCTION criar_categorias_plano_padrao IS 'Cria categorias padrão quando usuário acessa pela primeira vez';