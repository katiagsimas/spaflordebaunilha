
-- Adicionar conceito de "Mestre" do grupo
ALTER TABLE public.groups ADD COLUMN IF NOT EXISTS master_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- Backfill: o mestre é o criador, ou o primeiro ADMIN ativo do grupo
UPDATE public.groups g
SET master_user_id = COALESCE(
  g.created_by_user_id,
  (SELECT ugr.user_id FROM public.user_group_roles ugr
   WHERE ugr.group_id = g.id AND ugr.role_group = 'ADMIN' AND ugr.is_active = true
   ORDER BY ugr.created_at ASC LIMIT 1)
)
WHERE master_user_id IS NULL;

CREATE INDEX IF NOT EXISTS idx_groups_master_user_id ON public.groups(master_user_id);

-- Funções auxiliares
CREATE OR REPLACE FUNCTION public.is_group_master(_user_id uuid, _group_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.groups
    WHERE id = _group_id AND master_user_id = _user_id
  )
$$;

CREATE OR REPLACE FUNCTION public.get_group_master(_group_id uuid)
RETURNS uuid
LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $$
  SELECT master_user_id FROM public.groups WHERE id = _group_id LIMIT 1
$$;

-- Retorna true se o usuário é mestre de pelo menos um grupo (precisa concluir onboarding)
CREATE OR REPLACE FUNCTION public.user_is_any_group_master(_user_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.groups
    WHERE master_user_id = _user_id AND is_active = true
  )
$$;
