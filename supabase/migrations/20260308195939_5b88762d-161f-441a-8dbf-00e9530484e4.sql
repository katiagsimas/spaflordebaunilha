-- Fix remaining functions without search_path
ALTER FUNCTION public.update_mao_obra_perfis_updated_at() SET search_path = 'public';
ALTER FUNCTION public.update_groups_updated_at() SET search_path = 'public';
ALTER FUNCTION public.update_user_group_roles_updated_at() SET search_path = 'public';
ALTER FUNCTION public.ensure_single_default_perfil() SET search_path = 'public';
ALTER FUNCTION public.update_itens_atualizado_em() SET search_path = 'public';
ALTER FUNCTION public.log_perfil_criado() SET search_path = 'public';
ALTER FUNCTION public.log_perfil_alterado() SET search_path = 'public';
ALTER FUNCTION public.validar_categoria_item() SET search_path = 'public';
ALTER FUNCTION public.atualizar_parcela_apos_pagamento() SET search_path = 'public';
ALTER FUNCTION public.update_receitas_updated_at() SET search_path = 'public';