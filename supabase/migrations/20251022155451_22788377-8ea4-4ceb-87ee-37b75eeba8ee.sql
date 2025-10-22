-- Adicionar campo e_padrao na tabela unidades_medida
ALTER TABLE public.unidades_medida 
ADD COLUMN IF NOT EXISTS e_padrao BOOLEAN DEFAULT false;

-- Criar função para inserir unidades padrão
CREATE OR REPLACE FUNCTION public.criar_unidades_medida_padrao(p_user_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO unidades_medida (usuario_id, nome, sigla, codigo, ativo, e_padrao) VALUES
  (p_user_id, 'Centímetros', 'cm', '001', true, true),
  (p_user_id, 'Gramas', 'g', '002', true, true),
  (p_user_id, 'Mililitros', 'ml', '003', true, true),
  (p_user_id, 'Unidades', 'un', '004', true, true)
  ON CONFLICT (usuario_id, codigo) DO NOTHING;
END;
$$;

-- Criar trigger para criar unidades padrão automaticamente para novos usuários
CREATE OR REPLACE FUNCTION public.trigger_criar_unidades_novo_usuario()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM criar_unidades_medida_padrao(NEW.id);
  RETURN NEW;
END;
$$;

-- Adicionar trigger no auth.users (se ainda não existir)
DROP TRIGGER IF EXISTS on_auth_user_created_unidades ON auth.users;
CREATE TRIGGER on_auth_user_created_unidades
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_criar_unidades_novo_usuario();

-- Marcar unidades existentes como padrão se forem essas 4
UPDATE unidades_medida
SET e_padrao = true
WHERE nome IN ('Centímetros', 'Gramas', 'Mililitros', 'Unidades')
  AND sigla IN ('cm', 'g', 'ml', 'un');