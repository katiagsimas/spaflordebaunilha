-- Adicionar coluna para marcar categorias padrão do sistema
ALTER TABLE categorias ADD COLUMN IF NOT EXISTS padrao_sistema BOOLEAN DEFAULT false;

-- Deletar todas as categorias existentes
DELETE FROM categorias;

-- Função para criar categorias padrão para um usuário
CREATE OR REPLACE FUNCTION criar_categorias_padrao(user_id UUID)
RETURNS void AS $$
BEGIN
  INSERT INTO categorias (usuario_id, nome, padrao_sistema, ativo) VALUES
    (user_id, 'Bolos', true, true),
    (user_id, 'Tortas', true, true),
    (user_id, 'Doces Finos', true, true),
    (user_id, 'Brigadeiria', true, true),
    (user_id, 'Cupcakes', true, true),
    (user_id, 'Biscoitos / Cookies', true, true),
    (user_id, 'Brownies / Barrinhas', true, true),
    (user_id, 'Sobremesas Geladas', true, true),
    (user_id, 'Salgados Fritos', true, true),
    (user_id, 'Salgados Assados', true, true),
    (user_id, 'Bebidas / Xaropes', true, true),
    (user_id, 'Recheios', true, true),
    (user_id, 'Coberturas', true, true),
    (user_id, 'Bases (massas base)', true, true),
    (user_id, 'Decoração (confeitos, toppers, corantes, flores comestíveis)', true, true),
    (user_id, 'Produção Auxiliar (caldas, caldas de brilho, glaçagem, etc)', true, true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Criar categorias padrão para todos os usuários existentes
DO $$
DECLARE
  user_record RECORD;
BEGIN
  FOR user_record IN SELECT id FROM auth.users LOOP
    PERFORM criar_categorias_padrao(user_record.id);
  END LOOP;
END $$;

-- Trigger para criar categorias padrão quando um novo usuário for criado
CREATE OR REPLACE FUNCTION trigger_criar_categorias_padrao()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM criar_categorias_padrao(NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created_categorias ON auth.users;
CREATE TRIGGER on_auth_user_created_categorias
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION trigger_criar_categorias_padrao();

-- Atualizar RLS policies para impedir edição/exclusão de categorias padrão
DROP POLICY IF EXISTS "Users can delete own categorias" ON categorias;
CREATE POLICY "Users can delete own categorias"
  ON categorias FOR DELETE
  USING (auth.uid() = usuario_id AND padrao_sistema = false);

DROP POLICY IF EXISTS "Users can update own categorias" ON categorias;
CREATE POLICY "Users can update own categorias"
  ON categorias FOR UPDATE
  USING (auth.uid() = usuario_id)
  WITH CHECK (
    auth.uid() = usuario_id AND 
    (padrao_sistema = false OR (padrao_sistema = true AND nome = (SELECT nome FROM categorias WHERE id = categorias.id)))
  );