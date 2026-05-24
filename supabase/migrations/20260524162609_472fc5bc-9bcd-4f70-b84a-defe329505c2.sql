-- 1) Adicionar coluna subfaixa_dre
ALTER TABLE public.categorias_plano_contas
  ADD COLUMN IF NOT EXISTS subfaixa_dre text;

-- 2) Índice para acelerar agrupamento no DRE
CREATE INDEX IF NOT EXISTS idx_categorias_plano_contas_subfaixa_dre
  ON public.categorias_plano_contas (subfaixa_dre);

-- 3) Popular subfaixa_dre nas categorias padrão do sistema
UPDATE public.categorias_plano_contas SET subfaixa_dre = 'Receita com vendas'             WHERE padrao_sistema = true AND codigo = '1';
UPDATE public.categorias_plano_contas SET subfaixa_dre = 'Receita com serviços'           WHERE padrao_sistema = true AND codigo = '4';
UPDATE public.categorias_plano_contas SET subfaixa_dre = 'Impostos sobre vendas'          WHERE padrao_sistema = true AND codigo = '2';
UPDATE public.categorias_plano_contas SET subfaixa_dre = 'Outras deduções sobre vendas'   WHERE padrao_sistema = true AND codigo = '99';
UPDATE public.categorias_plano_contas SET subfaixa_dre = 'CMV'                            WHERE padrao_sistema = true AND codigo = '3';
UPDATE public.categorias_plano_contas SET subfaixa_dre = 'Despesas comerciais'            WHERE padrao_sistema = true AND codigo = '8';
UPDATE public.categorias_plano_contas SET subfaixa_dre = 'Despesa operacional variável'   WHERE padrao_sistema = true AND codigo = '103';
UPDATE public.categorias_plano_contas SET subfaixa_dre = 'Campanhas sazonais'             WHERE padrao_sistema = true AND codigo = '112';
UPDATE public.categorias_plano_contas SET subfaixa_dre = 'Despesas com pessoal'           WHERE padrao_sistema = true AND codigo = '5';
UPDATE public.categorias_plano_contas SET subfaixa_dre = 'Despesas com ocupação'          WHERE padrao_sistema = true AND codigo = '6';
UPDATE public.categorias_plano_contas SET subfaixa_dre = 'Despesas administrativas'       WHERE padrao_sistema = true AND codigo = '7';
UPDATE public.categorias_plano_contas SET subfaixa_dre = 'Receitas financeiras'           WHERE padrao_sistema = true AND codigo = '106';
UPDATE public.categorias_plano_contas SET subfaixa_dre = 'Despesas financeiras'           WHERE padrao_sistema = true AND codigo = '107';
UPDATE public.categorias_plano_contas SET subfaixa_dre = 'Receitas não operacionais'      WHERE padrao_sistema = true AND codigo = '9';
UPDATE public.categorias_plano_contas SET subfaixa_dre = 'Gastos não operacionais'        WHERE padrao_sistema = true AND codigo = '10';