-- FASE 1: Estrutura de banco de dados do módulo Estoque

-- Enum para tipo de movimentação
CREATE TYPE tipo_movimentacao AS ENUM ('ENTRADA', 'SAIDA');

-- Enum para tipo de item
CREATE TYPE tipo_item_estoque AS ENUM ('INSUMO', 'EMBALAGEM');

-- Enum para status da entrada
CREATE TYPE status_entrada AS ENUM ('ATIVO', 'CONSUMIDO');

-- Tabela: movimentacoes_estoque
CREATE TABLE IF NOT EXISTS public.movimentacoes_estoque (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  data DATE NOT NULL,
  tipo tipo_movimentacao NOT NULL,
  item_id UUID NOT NULL,
  tipo_item tipo_item_estoque NOT NULL,
  quantidade DECIMAL(10,3) NOT NULL,
  unidade VARCHAR(20) NOT NULL,
  custo_unitario DECIMAL(10,2) NOT NULL,
  custo_total DECIMAL(10,2) NOT NULL,
  motivo VARCHAR(100),
  local_compra VARCHAR(200),
  vinculo_pedido_id UUID,
  validade DATE,
  observacoes TEXT,
  usuario_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela: estoque_atual
CREATE TABLE IF NOT EXISTS public.estoque_atual (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  item_id UUID NOT NULL,
  tipo_item tipo_item_estoque NOT NULL,
  quantidade_atual DECIMAL(10,3) NOT NULL DEFAULT 0,
  custo_medio DECIMAL(10,2) NOT NULL DEFAULT 0,
  valor_total DECIMAL(10,2) NOT NULL DEFAULT 0,
  ultima_atualizacao TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(item_id, tipo_item)
);

-- Tabela: entradas_detalhadas (para FIFO)
CREATE TABLE IF NOT EXISTS public.entradas_detalhadas (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  movimentacao_entrada_id UUID REFERENCES public.movimentacoes_estoque(id),
  item_id UUID NOT NULL,
  tipo_item tipo_item_estoque NOT NULL,
  data_entrada DATE NOT NULL,
  quantidade_inicial DECIMAL(10,3) NOT NULL,
  quantidade_restante DECIMAL(10,3) NOT NULL,
  custo_unitario DECIMAL(10,2) NOT NULL,
  validade DATE,
  status status_entrada NOT NULL DEFAULT 'ATIVO',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela: categorias_estoque
CREATE TABLE IF NOT EXISTS public.categorias_estoque (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome VARCHAR(100) NOT NULL,
  icone VARCHAR(10),
  cor VARCHAR(7),
  ativo BOOLEAN NOT NULL DEFAULT true,
  usuario_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Índices para performance
CREATE INDEX idx_movimentacoes_item ON public.movimentacoes_estoque(item_id, tipo_item);
CREATE INDEX idx_movimentacoes_data ON public.movimentacoes_estoque(data DESC);
CREATE INDEX idx_estoque_item ON public.estoque_atual(item_id, tipo_item);
CREATE INDEX idx_entradas_item ON public.entradas_detalhadas(item_id, tipo_item);
CREATE INDEX idx_entradas_status ON public.entradas_detalhadas(status, data_entrada);

-- Enable RLS
ALTER TABLE public.movimentacoes_estoque ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.estoque_atual ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.entradas_detalhadas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categorias_estoque ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own stock movements"
  ON public.movimentacoes_estoque FOR SELECT
  USING (auth.uid() = usuario_id);

CREATE POLICY "Users can create their own stock movements"
  ON public.movimentacoes_estoque FOR INSERT
  WITH CHECK (auth.uid() = usuario_id);

CREATE POLICY "Users can update their own stock movements"
  ON public.movimentacoes_estoque FOR UPDATE
  USING (auth.uid() = usuario_id);

CREATE POLICY "Users can view stock status"
  ON public.estoque_atual FOR SELECT
  USING (true);

CREATE POLICY "Users can manage stock status"
  ON public.estoque_atual FOR ALL
  USING (true);

CREATE POLICY "Users can view detailed entries"
  ON public.entradas_detalhadas FOR SELECT
  USING (true);

CREATE POLICY "Users can manage detailed entries"
  ON public.entradas_detalhadas FOR ALL
  USING (true);

CREATE POLICY "Users can view their own categories"
  ON public.categorias_estoque FOR SELECT
  USING (auth.uid() = usuario_id);

CREATE POLICY "Users can create their own categories"
  ON public.categorias_estoque FOR INSERT
  WITH CHECK (auth.uid() = usuario_id);

CREATE POLICY "Users can update their own categories"
  ON public.categorias_estoque FOR UPDATE
  USING (auth.uid() = usuario_id);

CREATE POLICY "Users can delete their own categories"
  ON public.categorias_estoque FOR DELETE
  USING (auth.uid() = usuario_id);

-- Trigger para updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_movimentacoes_estoque_updated_at
  BEFORE UPDATE ON public.movimentacoes_estoque
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_categorias_estoque_updated_at
  BEFORE UPDATE ON public.categorias_estoque
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Inserir categorias padrão
INSERT INTO public.categorias_estoque (nome, icone, cor, ativo) VALUES
  ('Ingredientes Base', '🌾', '#8B4513', true),
  ('Ingredientes Especiais', '🍫', '#D2691E', true),
  ('Decoração', '✨', '#FFD700', true),
  ('Embalagens', '🎁', '#4169E1', true),
  ('Limpeza', '🧼', '#00CED1', true),
  ('Utensílios', '🛠️', '#708090', true);