-- Criar tabela principal de receitas
CREATE TABLE IF NOT EXISTS public.receitas (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  usuario_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  nome VARCHAR NOT NULL,
  categoria VARCHAR,
  tipo VARCHAR CHECK (tipo IN ('produto_avulso', 'produto_combo')),
  cardapio VARCHAR DEFAULT 'ativo' CHECK (cardapio IN ('ativo', 'fora')),
  tempo_preparo NUMERIC NOT NULL,
  unidade_tempo VARCHAR NOT NULL CHECK (unidade_tempo IN ('minutos', 'horas')),
  rendimento NUMERIC NOT NULL,
  unidade_rendimento VARCHAR NOT NULL,
  custo_total NUMERIC NOT NULL DEFAULT 0,
  valor_venda NUMERIC,
  modo_preparo TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Criar tabela de ingredientes das receitas
CREATE TABLE IF NOT EXISTS public.receitas_ingredientes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  receita_id UUID NOT NULL REFERENCES public.receitas(id) ON DELETE CASCADE,
  ingrediente_id VARCHAR NOT NULL,
  ingrediente VARCHAR NOT NULL,
  marca VARCHAR,
  qtde_embalagem NUMERIC NOT NULL,
  unidade_medida VARCHAR NOT NULL,
  preco_embalagem NUMERIC NOT NULL,
  quantidade_utilizada NUMERIC NOT NULL,
  custo_unitario NUMERIC NOT NULL,
  custo_receita NUMERIC NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Criar tabela de embalagens das receitas
CREATE TABLE IF NOT EXISTS public.receitas_embalagens (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  receita_id UUID NOT NULL REFERENCES public.receitas(id) ON DELETE CASCADE,
  embalagem_id VARCHAR NOT NULL,
  embalagem VARCHAR NOT NULL,
  marca VARCHAR,
  qtde_embalagem NUMERIC NOT NULL,
  unidade_medida VARCHAR NOT NULL,
  preco_embalagem NUMERIC NOT NULL,
  quantidade_utilizada NUMERIC NOT NULL,
  custo_unitario NUMERIC NOT NULL,
  custo_receita NUMERIC NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Criar tabela de despesas de venda
CREATE TABLE IF NOT EXISTS public.receitas_despesas_venda (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  receita_id UUID NOT NULL REFERENCES public.receitas(id) ON DELETE CASCADE,
  despesa_id VARCHAR NOT NULL,
  nome VARCHAR NOT NULL,
  percentual NUMERIC NOT NULL,
  valor NUMERIC NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Criar tabela de imagens das receitas
CREATE TABLE IF NOT EXISTS public.receitas_imagens (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  receita_id UUID NOT NULL REFERENCES public.receitas(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  ordem INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS em todas as tabelas
ALTER TABLE public.receitas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.receitas_ingredientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.receitas_embalagens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.receitas_despesas_venda ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.receitas_imagens ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para receitas
CREATE POLICY "Users can view own receitas"
  ON public.receitas FOR SELECT
  USING (auth.uid() = usuario_id);

CREATE POLICY "Users can insert own receitas"
  ON public.receitas FOR INSERT
  WITH CHECK (auth.uid() = usuario_id);

CREATE POLICY "Users can update own receitas"
  ON public.receitas FOR UPDATE
  USING (auth.uid() = usuario_id);

CREATE POLICY "Users can delete own receitas"
  ON public.receitas FOR DELETE
  USING (auth.uid() = usuario_id);

-- Políticas RLS para receitas_ingredientes
CREATE POLICY "Users can view own receitas_ingredientes"
  ON public.receitas_ingredientes FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.receitas
    WHERE receitas.id = receitas_ingredientes.receita_id
    AND receitas.usuario_id = auth.uid()
  ));

CREATE POLICY "Users can insert own receitas_ingredientes"
  ON public.receitas_ingredientes FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.receitas
    WHERE receitas.id = receitas_ingredientes.receita_id
    AND receitas.usuario_id = auth.uid()
  ));

CREATE POLICY "Users can update own receitas_ingredientes"
  ON public.receitas_ingredientes FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM public.receitas
    WHERE receitas.id = receitas_ingredientes.receita_id
    AND receitas.usuario_id = auth.uid()
  ));

CREATE POLICY "Users can delete own receitas_ingredientes"
  ON public.receitas_ingredientes FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM public.receitas
    WHERE receitas.id = receitas_ingredientes.receita_id
    AND receitas.usuario_id = auth.uid()
  ));

-- Políticas RLS para receitas_embalagens
CREATE POLICY "Users can view own receitas_embalagens"
  ON public.receitas_embalagens FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.receitas
    WHERE receitas.id = receitas_embalagens.receita_id
    AND receitas.usuario_id = auth.uid()
  ));

CREATE POLICY "Users can insert own receitas_embalagens"
  ON public.receitas_embalagens FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.receitas
    WHERE receitas.id = receitas_embalagens.receita_id
    AND receitas.usuario_id = auth.uid()
  ));

CREATE POLICY "Users can update own receitas_embalagens"
  ON public.receitas_embalagens FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM public.receitas
    WHERE receitas.id = receitas_embalagens.receita_id
    AND receitas.usuario_id = auth.uid()
  ));

CREATE POLICY "Users can delete own receitas_embalagens"
  ON public.receitas_embalagens FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM public.receitas
    WHERE receitas.id = receitas_embalagens.receita_id
    AND receitas.usuario_id = auth.uid()
  ));

-- Políticas RLS para receitas_despesas_venda
CREATE POLICY "Users can view own receitas_despesas_venda"
  ON public.receitas_despesas_venda FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.receitas
    WHERE receitas.id = receitas_despesas_venda.receita_id
    AND receitas.usuario_id = auth.uid()
  ));

CREATE POLICY "Users can insert own receitas_despesas_venda"
  ON public.receitas_despesas_venda FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.receitas
    WHERE receitas.id = receitas_despesas_venda.receita_id
    AND receitas.usuario_id = auth.uid()
  ));

CREATE POLICY "Users can update own receitas_despesas_venda"
  ON public.receitas_despesas_venda FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM public.receitas
    WHERE receitas.id = receitas_despesas_venda.receita_id
    AND receitas.usuario_id = auth.uid()
  ));

CREATE POLICY "Users can delete own receitas_despesas_venda"
  ON public.receitas_despesas_venda FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM public.receitas
    WHERE receitas.id = receitas_despesas_venda.receita_id
    AND receitas.usuario_id = auth.uid()
  ));

-- Políticas RLS para receitas_imagens
CREATE POLICY "Users can view own receitas_imagens"
  ON public.receitas_imagens FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.receitas
    WHERE receitas.id = receitas_imagens.receita_id
    AND receitas.usuario_id = auth.uid()
  ));

CREATE POLICY "Users can insert own receitas_imagens"
  ON public.receitas_imagens FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.receitas
    WHERE receitas.id = receitas_imagens.receita_id
    AND receitas.usuario_id = auth.uid()
  ));

CREATE POLICY "Users can update own receitas_imagens"
  ON public.receitas_imagens FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM public.receitas
    WHERE receitas.id = receitas_imagens.receita_id
    AND receitas.usuario_id = auth.uid()
  ));

CREATE POLICY "Users can delete own receitas_imagens"
  ON public.receitas_imagens FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM public.receitas
    WHERE receitas.id = receitas_imagens.receita_id
    AND receitas.usuario_id = auth.uid()
  ));

-- Criar índices para melhor performance
CREATE INDEX idx_receitas_usuario_id ON public.receitas(usuario_id);
CREATE INDEX idx_receitas_cardapio ON public.receitas(cardapio);
CREATE INDEX idx_receitas_ingredientes_receita_id ON public.receitas_ingredientes(receita_id);
CREATE INDEX idx_receitas_embalagens_receita_id ON public.receitas_embalagens(receita_id);
CREATE INDEX idx_receitas_despesas_venda_receita_id ON public.receitas_despesas_venda(receita_id);
CREATE INDEX idx_receitas_imagens_receita_id ON public.receitas_imagens(receita_id);

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION public.update_receitas_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_receitas_updated_at
  BEFORE UPDATE ON public.receitas
  FOR EACH ROW
  EXECUTE FUNCTION public.update_receitas_updated_at();