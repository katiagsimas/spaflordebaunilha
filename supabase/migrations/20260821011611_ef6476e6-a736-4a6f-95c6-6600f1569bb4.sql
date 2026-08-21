GRANT EXECUTE ON FUNCTION public.get_active_group_id(uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_user_group_role(uuid, uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.is_group_master(uuid, uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.has_permission(uuid, uuid, text) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.user_belongs_to_group(uuid, uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.is_mother(uuid) TO authenticated, service_role;