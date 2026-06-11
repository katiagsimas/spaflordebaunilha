-- Função para validar o owner_group_id no perfil
CREATE OR REPLACE FUNCTION public.validate_profile_owner_group()
RETURNS TRIGGER AS $$
BEGIN
  -- Se for Mother, permite qualquer alteração
  IF public.is_mother(auth.uid()) THEN
    RETURN NEW;
  END IF;

  -- Se o owner_group_id estiver sendo alterado
  IF (TG_OP = 'UPDATE' AND OLD.owner_group_id IS DISTINCT FROM NEW.owner_group_id) OR (TG_OP = 'INSERT') THEN
    -- Se NEW.owner_group_id for NULL, permite (usuário sem grupo ainda)
    IF NEW.owner_group_id IS NULL THEN
      RETURN NEW;
    END IF;

    -- Verifica se o usuário é o MASTER do grupo que ele está tentando se associar
    IF NOT EXISTS (
      SELECT 1 FROM public.groups
      WHERE id = NEW.owner_group_id
        AND master_user_id = NEW.id
    ) THEN
      RAISE EXCEPTION 'Um usuário só pode ser associado a um grupo do qual ele é o Mestre.';
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para validar o perfil
DROP TRIGGER IF EXISTS trigger_validate_profile_owner_group ON public.profiles;
CREATE TRIGGER trigger_validate_profile_owner_group
  BEFORE INSERT OR UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_profile_owner_group();
