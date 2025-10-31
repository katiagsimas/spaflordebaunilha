-- Verificar e recriar políticas para categorias e contas padrão

-- Remover política existente se houver conflito e recriar
DROP POLICY IF EXISTS "Users can view default categorias_plano" ON public.categorias_plano_contas;
DROP POLICY IF EXISTS "Users can view default plano_contas" ON public.plano_contas;

-- Criar política para visualização de categorias padrão (usando OR para permitir acesso)
CREATE POLICY "Users can view default categorias_plano"
ON public.categorias_plano_contas
FOR SELECT
USING (e_padrao = true OR auth.uid() = user_id);

-- Remover a política antiga de view own para evitar conflito
DROP POLICY IF EXISTS "Users can view own categorias_plano" ON public.categorias_plano_contas;

-- Criar política para visualização de planos de contas padrão (usando OR para permitir acesso)
CREATE POLICY "Users can view default plano_contas"
ON public.plano_contas
FOR SELECT
USING (e_padrao = true OR auth.uid() = user_id);

-- Remover a política antiga de view own para evitar conflito
DROP POLICY IF EXISTS "Users can view own plano_contas" ON public.plano_contas;