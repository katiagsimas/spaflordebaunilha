-- Adicionar usuario_id às tabelas de estoque
ALTER TABLE public.estoque_atual ADD COLUMN IF NOT EXISTS usuario_id uuid REFERENCES auth.users(id);
ALTER TABLE public.entradas_detalhadas ADD COLUMN IF NOT EXISTS usuario_id uuid REFERENCES auth.users(id);

-- Preencher usuario_id existente baseado nas movimentações (se houver dados)
UPDATE public.estoque_atual ea
SET usuario_id = (
  SELECT DISTINCT me.usuario_id 
  FROM public.movimentacoes_estoque me 
  WHERE me.item_id = ea.item_id 
    AND me.tipo_item = ea.tipo_item 
  LIMIT 1
)
WHERE ea.usuario_id IS NULL;

UPDATE public.entradas_detalhadas ed
SET usuario_id = (
  SELECT me.usuario_id 
  FROM public.movimentacoes_estoque me 
  WHERE me.id = ed.movimentacao_entrada_id
)
WHERE ed.usuario_id IS NULL AND ed.movimentacao_entrada_id IS NOT NULL;

-- Remover políticas permissivas antigas de estoque_atual
DROP POLICY IF EXISTS "Users can manage stock status" ON public.estoque_atual;
DROP POLICY IF EXISTS "Users can view stock status" ON public.estoque_atual;

-- Criar políticas RLS corretas para estoque_atual
CREATE POLICY "Users can view their own stock"
ON public.estoque_atual
FOR SELECT
USING (auth.uid() = usuario_id);

CREATE POLICY "Users can insert their own stock"
ON public.estoque_atual
FOR INSERT
WITH CHECK (auth.uid() = usuario_id);

CREATE POLICY "Users can update their own stock"
ON public.estoque_atual
FOR UPDATE
USING (auth.uid() = usuario_id);

CREATE POLICY "Users can delete their own stock"
ON public.estoque_atual
FOR DELETE
USING (auth.uid() = usuario_id);

-- Remover políticas permissivas antigas de entradas_detalhadas
DROP POLICY IF EXISTS "Users can manage detailed entries" ON public.entradas_detalhadas;
DROP POLICY IF EXISTS "Users can view detailed entries" ON public.entradas_detalhadas;

-- Criar políticas RLS corretas para entradas_detalhadas
CREATE POLICY "Users can view their own detailed entries"
ON public.entradas_detalhadas
FOR SELECT
USING (auth.uid() = usuario_id);

CREATE POLICY "Users can insert their own detailed entries"
ON public.entradas_detalhadas
FOR INSERT
WITH CHECK (auth.uid() = usuario_id);

CREATE POLICY "Users can update their own detailed entries"
ON public.entradas_detalhadas
FOR UPDATE
USING (auth.uid() = usuario_id);

CREATE POLICY "Users can delete their own detailed entries"
ON public.entradas_detalhadas
FOR DELETE
USING (auth.uid() = usuario_id);