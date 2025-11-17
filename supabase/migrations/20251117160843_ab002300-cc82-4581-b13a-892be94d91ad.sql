-- Remover políticas antigas de gerenciamento de tags personalizadas
DROP POLICY IF EXISTS "Users can manage own tags" ON tags_encomendas;
DROP POLICY IF EXISTS "Prevent delete system tags" ON tags_encomendas;

-- Nova política: usuários podem apenas visualizar tags do sistema
CREATE POLICY "Users can only view system tags"
ON tags_encomendas
FOR SELECT
TO authenticated
USING (
  user_id IS NULL AND 
  ativo = true AND 
  padrao_sistema = true
);

-- Garantir que não há outras políticas permissivas
-- (INSERT, UPDATE, DELETE não terão políticas = bloqueados por padrão)