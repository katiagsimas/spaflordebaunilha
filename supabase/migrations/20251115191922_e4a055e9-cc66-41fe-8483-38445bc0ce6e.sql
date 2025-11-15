-- Adicionar política de INSERT para mao_obra_perfis_historico
-- Necessário para que os triggers possam inserir no histórico
CREATE POLICY "Users can insert own historico"
  ON public.mao_obra_perfis_historico FOR INSERT
  WITH CHECK (auth.uid() = user_id);