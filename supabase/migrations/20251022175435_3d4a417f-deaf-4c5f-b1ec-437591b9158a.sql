-- Tabela para Tarefas de Produção
CREATE TABLE IF NOT EXISTS public.producao_tarefas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id UUID NOT NULL,
  descricao TEXT NOT NULL,
  concluida BOOLEAN NOT NULL DEFAULT false,
  data DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- RLS para producao_tarefas
ALTER TABLE public.producao_tarefas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own producao_tarefas"
  ON public.producao_tarefas
  FOR ALL
  USING (auth.uid() = usuario_id)
  WITH CHECK (auth.uid() = usuario_id);

-- Tabela para CMV Mensal
CREATE TABLE IF NOT EXISTS public.cmv_mensal (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id UUID NOT NULL,
  ano INTEGER NOT NULL,
  mes INTEGER NOT NULL CHECK (mes >= 1 AND mes <= 12),
  estoque_inicial NUMERIC NOT NULL DEFAULT 0,
  compras NUMERIC NOT NULL DEFAULT 0,
  estoque_final NUMERIC NOT NULL DEFAULT 0,
  faturamento NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (usuario_id, ano, mes)
);

-- RLS para cmv_mensal
ALTER TABLE public.cmv_mensal ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own cmv_mensal"
  ON public.cmv_mensal
  FOR ALL
  USING (auth.uid() = usuario_id)
  WITH CHECK (auth.uid() = usuario_id);

-- Adicionar campos de configuração e preferências ao profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS meta_faturamento_mensal NUMERIC DEFAULT 10000,
  ADD COLUMN IF NOT EXISTS meta_faturamento_anual NUMERIC DEFAULT 120000,
  ADD COLUMN IF NOT EXISTS alerta_cmv NUMERIC DEFAULT 50,
  ADD COLUMN IF NOT EXISTS custo_fixo_mensal NUMERIC DEFAULT 2000,
  ADD COLUMN IF NOT EXISTS planejamento_banner_dismissed BOOLEAN DEFAULT false;

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_producao_tarefas_updated_at
  BEFORE UPDATE ON public.producao_tarefas
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_cmv_mensal_updated_at
  BEFORE UPDATE ON public.cmv_mensal
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();