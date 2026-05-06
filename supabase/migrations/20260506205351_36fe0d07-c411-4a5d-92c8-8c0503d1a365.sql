
-- ==============================
-- Tabela: estoque (saldo atual)
-- ==============================
CREATE TABLE public.estoque (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  usuario_id uuid NOT NULL,
  owner_group_id uuid,
  tipo text NOT NULL CHECK (tipo IN ('ingrediente', 'embalagem')),
  ingrediente_id uuid REFERENCES public.ingredientes(id) ON DELETE SET NULL,
  embalagem_id uuid REFERENCES public.embalagens(id) ON DELETE SET NULL,
  quantidade_atual numeric NOT NULL DEFAULT 0,
  custo_medio numeric NOT NULL DEFAULT 0,
  estoque_minimo numeric,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Índices
CREATE INDEX idx_estoque_usuario_id ON public.estoque(usuario_id);
CREATE INDEX idx_estoque_ingrediente_id ON public.estoque(ingrediente_id);
CREATE INDEX idx_estoque_embalagem_id ON public.estoque(embalagem_id);
CREATE UNIQUE INDEX idx_estoque_usuario_ingrediente ON public.estoque(usuario_id, ingrediente_id) WHERE ingrediente_id IS NOT NULL;
CREATE UNIQUE INDEX idx_estoque_usuario_embalagem ON public.estoque(usuario_id, embalagem_id) WHERE embalagem_id IS NOT NULL;

-- RLS
ALTER TABLE public.estoque ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own estoque"
  ON public.estoque FOR SELECT
  USING (auth.uid() = usuario_id);

CREATE POLICY "Users can insert own estoque"
  ON public.estoque FOR INSERT
  WITH CHECK (auth.uid() = usuario_id);

CREATE POLICY "Users can update own estoque"
  ON public.estoque FOR UPDATE
  USING (auth.uid() = usuario_id);

CREATE POLICY "Users can delete own estoque"
  ON public.estoque FOR DELETE
  USING (auth.uid() = usuario_id);

-- Restrição por plano (Business/Start)
CREATE POLICY "plan_check_estoque"
  ON public.estoque AS RESTRICTIVE
  FOR ALL TO authenticated
  USING (user_has_financial_access(auth.uid()))
  WITH CHECK (user_has_financial_access(auth.uid()));

-- ==========================================
-- Tabela: estoque_movimentacoes (histórico)
-- ==========================================
CREATE TABLE public.estoque_movimentacoes (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  estoque_id uuid NOT NULL REFERENCES public.estoque(id) ON DELETE CASCADE,
  usuario_id uuid NOT NULL,
  owner_group_id uuid,
  tipo_movimentacao text NOT NULL CHECK (tipo_movimentacao IN ('entrada', 'saida_producao', 'saida_manual', 'ajuste')),
  quantidade numeric NOT NULL,
  custo_unitario numeric,
  custo_total numeric,
  referencia_tipo text,
  referencia_id uuid,
  observacao text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Índices
CREATE INDEX idx_estoque_mov_estoque_id ON public.estoque_movimentacoes(estoque_id);
CREATE INDEX idx_estoque_mov_usuario_id ON public.estoque_movimentacoes(usuario_id);
CREATE INDEX idx_estoque_mov_tipo ON public.estoque_movimentacoes(tipo_movimentacao);
CREATE INDEX idx_estoque_mov_referencia ON public.estoque_movimentacoes(referencia_tipo, referencia_id);

-- RLS
ALTER TABLE public.estoque_movimentacoes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own movimentacoes"
  ON public.estoque_movimentacoes FOR SELECT
  USING (auth.uid() = usuario_id);

CREATE POLICY "Users can insert own movimentacoes"
  ON public.estoque_movimentacoes FOR INSERT
  WITH CHECK (auth.uid() = usuario_id);

CREATE POLICY "Users can delete own movimentacoes"
  ON public.estoque_movimentacoes FOR DELETE
  USING (auth.uid() = usuario_id);

-- Restrição por plano (Business/Start)
CREATE POLICY "plan_check_estoque_movimentacoes"
  ON public.estoque_movimentacoes AS RESTRICTIVE
  FOR ALL TO authenticated
  USING (user_has_financial_access(auth.uid()))
  WITH CHECK (user_has_financial_access(auth.uid()));

-- Trigger updated_at para estoque
CREATE TRIGGER update_estoque_updated_at
  BEFORE UPDATE ON public.estoque
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
