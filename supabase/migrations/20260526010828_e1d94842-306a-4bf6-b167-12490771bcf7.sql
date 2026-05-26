-- Corrigir privilégios da função public.fechar_mes
-- Restringe EXECUTE apenas a usuários autenticados (authenticated),
-- removendo o acesso público/anon padrão.

REVOKE EXECUTE
  ON FUNCTION public.fechar_mes(
    p_fechamento_id uuid,
    p_observacoes text,
    p_snapshot jsonb,
    p_faturamento numeric,
    p_custos numeric,
    p_margem_seguranca numeric,
    p_pro_labore_saudavel numeric,
    p_retiradas numeric,
    p_saldo_restante numeric
  )
  FROM PUBLIC, anon;

GRANT EXECUTE
  ON FUNCTION public.fechar_mes(
    p_fechamento_id uuid,
    p_observacoes text,
    p_snapshot jsonb,
    p_faturamento numeric,
    p_custos numeric,
    p_margem_seguranca numeric,
    p_pro_labore_saudavel numeric,
    p_retiradas numeric,
    p_saldo_restante numeric
  )
  TO authenticated;