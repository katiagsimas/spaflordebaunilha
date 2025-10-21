-- Adicionar campo para identificar categorias padrão
ALTER TABLE categorias_plano_contas 
ADD COLUMN IF NOT EXISTS e_padrao BOOLEAN DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_cat_plano_padrao ON categorias_plano_contas(e_padrao);

COMMENT ON COLUMN categorias_plano_contas.e_padrao IS 'Indica se é uma categoria padrão do sistema (não editável)';

-- Marcar as 17 categorias existentes como padrão
UPDATE categorias_plano_contas 
SET e_padrao = true 
WHERE codigo IN ('1', '2', '3', '5', '6', '7', '8', '9', '10', '12', '13', '14', '99', '103', '106', '107', '111');

-- Atualizar função para marcar novas categorias padrão
CREATE OR REPLACE FUNCTION criar_categorias_plano_padrao(p_user_id UUID)
RETURNS void AS $$
BEGIN
  INSERT INTO categorias_plano_contas (user_id, codigo, descricao, indicador, faixa_dre, ordem, e_padrao) VALUES
  (p_user_id, '1', 'Receita com Vendas', 'Credito', 'Receitas', 1, true),
  (p_user_id, '2', 'Impostos Sobre Vendas', 'Debito', 'Deduções sobre vendas', 2, true),
  (p_user_id, '3', 'CMV - Custo de Mercadoria Vendida', 'Debito', 'Custos variáveis', 3, true),
  (p_user_id, '5', 'Despesas com Pessoal', 'Debito', 'Custos fixos', 4, true),
  (p_user_id, '6', 'Despesas com Ocupação', 'Debito', 'Custos fixos', 5, true),
  (p_user_id, '7', 'Despesas Administrativas', 'Debito', 'Custos fixos', 6, true),
  (p_user_id, '8', 'Despesas Comerciais', 'Debito', 'Custos variáveis', 7, true),
  (p_user_id, '9', 'Receitas não Operacionais', 'Credito', 'Resultado não operacional', 8, true),
  (p_user_id, '10', 'Gastos não Operacionais', 'Debito', 'Resultado não operacional', 9, true),
  (p_user_id, '12', 'Investimentos (-)', 'Debito', 'Não listar no DRE', 10, true),
  (p_user_id, '13', 'Transferências e Ajustes de Saldo', 'Debito', 'Não listar no DRE', 11, true),
  (p_user_id, '14', 'Transferências e Ajustes de Saldo', 'Credito', 'Não listar no DRE', 12, true),
  (p_user_id, '99', 'Outras Deduções sobre Vendas', 'Debito', 'Deduções sobre vendas', 13, true),
  (p_user_id, '103', 'Despesa Operacional Variável', 'Debito', 'Custos variáveis', 14, true),
  (p_user_id, '106', 'Receitas Financeiras', 'Credito', 'Resultado financeiro', 15, true),
  (p_user_id, '107', 'Despesas Financeiras', 'Debito', 'Resultado financeiro', 16, true),
  (p_user_id, '111', 'Investimentos (+)', 'Credito', 'Investimento', 17, true)
  ON CONFLICT (user_id, codigo) DO NOTHING;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;