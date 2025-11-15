-- Corrigir política RLS de UPDATE da tabela categorias
-- O problema está na subconsulta que usa categorias_1.id = categorias_1.id
-- o que retorna múltiplas linhas

DROP POLICY IF EXISTS "Users can update own categorias" ON categorias;

CREATE POLICY "Users can update own categorias" 
ON categorias 
FOR UPDATE 
USING (auth.uid() = usuario_id)
WITH CHECK (
  (auth.uid() = usuario_id) AND 
  (
    padrao_sistema = false OR 
    (
      padrao_sistema = true AND 
      nome = (SELECT c.nome FROM categorias c WHERE c.id = categorias.id)
    )
  )
);