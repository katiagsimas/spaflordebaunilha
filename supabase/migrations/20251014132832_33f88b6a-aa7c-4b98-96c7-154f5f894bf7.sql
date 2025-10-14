-- Correções de segurança críticas (com limpeza de dados)

-- 1. Primeiro, deletar ou corrigir registros órfãos (sem usuario_id)
-- IMPORTANTE: Se houver dados, eles serão deletados. Idealmente, não deveria haver dados sem usuario_id.
DELETE FROM public.categorias_estoque WHERE usuario_id IS NULL;
DELETE FROM public.entradas_detalhadas WHERE usuario_id IS NULL;
DELETE FROM public.estoque_atual WHERE usuario_id IS NULL;
DELETE FROM public.movimentacoes_estoque WHERE usuario_id IS NULL;

-- 2. Agora tornar usuario_id NOT NULL
ALTER TABLE public.categorias_estoque 
  ALTER COLUMN usuario_id SET NOT NULL;

ALTER TABLE public.entradas_detalhadas 
  ALTER COLUMN usuario_id SET NOT NULL;

ALTER TABLE public.estoque_atual 
  ALTER COLUMN usuario_id SET NOT NULL;

ALTER TABLE public.movimentacoes_estoque 
  ALTER COLUMN usuario_id SET NOT NULL;

-- 3. Adicionar política DELETE para profiles
CREATE POLICY "Users can delete own profile" 
ON public.profiles 
FOR DELETE 
USING (auth.uid() = id);

-- 4. Adicionar política DELETE para movimentacoes_estoque
CREATE POLICY "Users can delete their own stock movements" 
ON public.movimentacoes_estoque 
FOR DELETE 
USING (auth.uid() = usuario_id);