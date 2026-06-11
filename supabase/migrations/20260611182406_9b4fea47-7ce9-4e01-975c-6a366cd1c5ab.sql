-- Função para validar o grupo ativo
CREATE OR REPLACE FUNCTION public.validate_active_group()
RETURNS TRIGGER AS $$
BEGIN
  -- Se for Mother, permite qualquer grupo (ou modo sistema)
  IF public.is_mother(NEW.user_id) THEN
    RETURN NEW;
  END IF;

  -- Se for modo sistema e não for mother, não permite
  IF NEW.mode = 'system' THEN
    RAISE EXCEPTION 'Apenas usuários administradores globais podem acessar o modo sistema.';
  END IF;

  -- Se active_group_id for nulo, permite (mas o frontend deve lidar com isso)
  IF NEW.active_group_id IS NULL THEN
    RETURN NEW;
  END IF;

  -- Verifica se o usuário pertence ao grupo
  IF NOT public.user_belongs_to_group(NEW.user_id, NEW.active_group_id) THEN
    RAISE EXCEPTION 'O usuário não tem permissão para acessar o grupo selecionado.';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para validar inserções e atualizações na sessão ativa
DROP TRIGGER IF EXISTS trigger_validate_active_session ON public.user_active_session;
CREATE TRIGGER trigger_validate_active_session
  BEFORE INSERT OR UPDATE ON public.user_active_session
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_active_group();

-- Garantir que Master user só tenha UM grupo ativo e pertencente a ele
-- Se houverem múltiplos papéis para o mesmo usuário (o que não deveria ocorrer), 
-- o RLS de visualização já resolve, mas o trigger acima garante a escrita.
