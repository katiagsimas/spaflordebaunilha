-- Adicionar políticas para visualização de categorias padrão do sistema
CREATE POLICY "Users can view default categorias_plano"
ON public.categorias_plano_contas
FOR SELECT
USING (e_padrao = true);

-- Adicionar política para visualização de planos de contas padrão do sistema
CREATE POLICY "Users can view default plano_contas"
ON public.plano_contas
FOR SELECT
USING (e_padrao = true);