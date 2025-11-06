-- Tabela para armazenar planejamentos de vendas
CREATE TABLE IF NOT EXISTS public.planejamento_vendas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  ano INTEGER NOT NULL,
  mes INTEGER NOT NULL,
  
  -- Metas anuais
  meta_faturamento_anual NUMERIC(10,2),
  meta_lucro_anual NUMERIC(10,2),
  
  -- Metas mensais
  meta_faturamento_mensal NUMERIC(10,2) NOT NULL,
  meta_lucro_mensal NUMERIC(10,2) NOT NULL,
  meta_pedidos INTEGER NOT NULL,
  meta_ticket_medio NUMERIC(10,2) NOT NULL,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(usuario_id, ano, mes)
);

-- Tabela para distribuição por produto
CREATE TABLE IF NOT EXISTS public.planejamento_produtos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  planejamento_id UUID NOT NULL REFERENCES public.planejamento_vendas(id) ON DELETE CASCADE,
  receita_id UUID NOT NULL REFERENCES public.receitas(id) ON DELETE CASCADE,
  percentual_participacao NUMERIC(5,2) NOT NULL CHECK (percentual_participacao >= 0 AND percentual_participacao <= 100),
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(planejamento_id, receita_id)
);

-- RLS policies
ALTER TABLE public.planejamento_vendas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.planejamento_produtos ENABLE ROW LEVEL SECURITY;

-- Policies para planejamento_vendas
CREATE POLICY "Usuários podem ver seus próprios planejamentos"
  ON public.planejamento_vendas FOR SELECT
  USING (auth.uid() = usuario_id);

CREATE POLICY "Usuários podem criar seus próprios planejamentos"
  ON public.planejamento_vendas FOR INSERT
  WITH CHECK (auth.uid() = usuario_id);

CREATE POLICY "Usuários podem atualizar seus próprios planejamentos"
  ON public.planejamento_vendas FOR UPDATE
  USING (auth.uid() = usuario_id);

CREATE POLICY "Usuários podem deletar seus próprios planejamentos"
  ON public.planejamento_vendas FOR DELETE
  USING (auth.uid() = usuario_id);

-- Policies para planejamento_produtos
CREATE POLICY "Usuários podem ver produtos de seus planejamentos"
  ON public.planejamento_produtos FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.planejamento_vendas
      WHERE id = planejamento_id AND usuario_id = auth.uid()
    )
  );

CREATE POLICY "Usuários podem criar produtos em seus planejamentos"
  ON public.planejamento_produtos FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.planejamento_vendas
      WHERE id = planejamento_id AND usuario_id = auth.uid()
    )
  );

CREATE POLICY "Usuários podem atualizar produtos de seus planejamentos"
  ON public.planejamento_produtos FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.planejamento_vendas
      WHERE id = planejamento_id AND usuario_id = auth.uid()
    )
  );

CREATE POLICY "Usuários podem deletar produtos de seus planejamentos"
  ON public.planejamento_produtos FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.planejamento_vendas
      WHERE id = planejamento_id AND usuario_id = auth.uid()
    )
  );

-- Índices para performance
CREATE INDEX idx_planejamento_vendas_usuario_data ON public.planejamento_vendas(usuario_id, ano, mes);
CREATE INDEX idx_planejamento_produtos_planejamento ON public.planejamento_produtos(planejamento_id);
