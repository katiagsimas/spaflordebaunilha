-- Função para adicionar automaticamente role 'user' para novos usuários
CREATE OR REPLACE FUNCTION public.handle_new_user_role()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Adiciona role 'user' automaticamente para todos os novos usuários
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user'::app_role)
  ON CONFLICT (user_id, role) DO NOTHING;
  
  RETURN NEW;
END;
$$;

-- Trigger para adicionar role automaticamente quando um novo perfil é criado
CREATE TRIGGER on_profile_created_add_user_role
  AFTER INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user_role();

-- Garantir que katiagsimas@gmail.com tem role 'admin'
-- Primeiro remove qualquer role 'user' que ela possa ter
DELETE FROM public.user_roles
WHERE user_id IN (
  SELECT id FROM public.profiles WHERE email = 'katiagsimas@gmail.com'
) AND role = 'user';

-- Adiciona role 'admin' para katiagsimas@gmail.com
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin'::app_role
FROM public.profiles
WHERE email = 'katiagsimas@gmail.com'
ON CONFLICT (user_id, role) DO NOTHING;