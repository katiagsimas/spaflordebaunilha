-- First, deactivate all non-admin memberships in groups
UPDATE public.user_group_roles
SET is_active = false,
    updated_at = now()
WHERE role_group = 'USER';

-- Deactivate profiles that don't have any active ADMIN role in any group
-- and are not owners (master_user_id) of any group.
UPDATE public.profiles p
SET ativo = false,
    updated_at = now()
WHERE ativo = true
  AND NOT EXISTS (
    SELECT 1 
    FROM public.user_group_roles ugr
    WHERE ugr.user_id = p.id 
      AND ugr.role_group = 'ADMIN'
      AND ugr.is_active = true
  )
  AND NOT EXISTS (
    SELECT 1
    FROM public.groups g
    WHERE g.master_user_id = p.id
  );

-- Optional: If a user is an ADMIN in one group but a USER in another, 
-- their USER membership is already deactivated by the first query.
-- Their profile remains active because of the ADMIN membership.
