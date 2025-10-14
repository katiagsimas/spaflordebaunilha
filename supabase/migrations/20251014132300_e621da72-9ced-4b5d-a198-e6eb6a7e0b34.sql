-- Remover apenas as políticas permissivas antigas
DROP POLICY IF EXISTS "Users can manage stock status" ON public.estoque_atual;
DROP POLICY IF EXISTS "Users can view stock status" ON public.estoque_atual;
DROP POLICY IF EXISTS "Users can manage detailed entries" ON public.entradas_detalhadas;
DROP POLICY IF EXISTS "Users can view detailed entries" ON public.entradas_detalhadas;