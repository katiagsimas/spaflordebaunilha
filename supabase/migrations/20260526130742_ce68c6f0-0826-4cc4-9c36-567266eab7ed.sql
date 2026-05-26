-- 1. Inserir novo plano
INSERT INTO public.planos (id, nome)
VALUES ('aluna_imersao', 'Aluna da Imersão')
ON CONFLICT (id) DO UPDATE SET nome = EXCLUDED.nome;

-- 2. Coluna de turma em profiles
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS imersao_turma TEXT;

-- 3. Atualizar função de acesso financeiro
CREATE OR REPLACE FUNCTION public.user_has_financial_access(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT CASE
    WHEN public.has_role(_user_id, 'admin') THEN true
    ELSE COALESCE(
      (SELECT p.plano_id IN ('negocio', 'start', 'aluna_imersao') FROM profiles p WHERE p.id = _user_id),
      false
    )
  END
$function$;