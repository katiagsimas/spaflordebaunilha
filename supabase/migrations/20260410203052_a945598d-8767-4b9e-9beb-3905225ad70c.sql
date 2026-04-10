
-- Corrigir o perfil do usuário afetado para plano Start 14 dias
UPDATE profiles 
SET plano_id = 'start', 
    plano_tipo = '14dias',
    plano_inicio = '2026-04-10',
    plano_fim = '2026-04-24',
    updated_at = now()
WHERE id = 'f207e745-11b2-4b8e-ada4-8b5fbfd5bd35';

-- Corrigir historico_planos
UPDATE historico_planos 
SET plano_novo = 'start', plano_tipo_novo = '14dias', plano_fim = '2026-04-24'
WHERE user_id = 'f207e745-11b2-4b8e-ada4-8b5fbfd5bd35' AND tipo_evento = 'criacao';

-- Corrigir user_has_financial_access para incluir plano Start
CREATE OR REPLACE FUNCTION public.user_has_financial_access(_user_id uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $$
  SELECT CASE
    WHEN public.has_role(_user_id, 'admin') THEN true
    ELSE COALESCE(
      (SELECT p.plano_id IN ('negocio', 'start') FROM profiles p WHERE p.id = _user_id),
      false
    )
  END
$$;
