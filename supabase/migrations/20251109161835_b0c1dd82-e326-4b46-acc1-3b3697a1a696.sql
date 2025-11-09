-- Fix SECURITY DEFINER views by explicitly setting security_invoker = on
-- This ensures views execute with the caller's permissions, not the view owner's

-- Financial views
ALTER VIEW vw_contas_receber_dashboard SET (security_invoker = on);
ALTER VIEW vw_encomendas_com_tags SET (security_invoker = on);
ALTER VIEW vw_resumo_financeiro SET (security_invoker = on);

-- User and statistics views
ALTER VIEW user_statistics SET (security_invoker = on);

-- Inventory views
ALTER VIEW estoque_atual_v2 SET (security_invoker = on);
ALTER VIEW custos_por_categoria SET (security_invoker = on);

-- Bank reconciliation view
ALTER VIEW vw_bank_differences SET (security_invoker = on);

-- Birthday views
ALTER VIEW v_aniversariantes_completa SET (security_invoker = on);
ALTER VIEW v_aniversariantes_fornecedores SET (security_invoker = on);

-- Add comments
COMMENT ON VIEW vw_contas_receber_dashboard IS 'Dashboard metrics for accounts receivable. Respects RLS via security_invoker.';
COMMENT ON VIEW vw_encomendas_com_tags IS 'Orders with associated tags. Respects RLS via security_invoker.';
COMMENT ON VIEW vw_resumo_financeiro IS 'Financial summary by bank. Respects RLS via security_invoker.';
COMMENT ON VIEW user_statistics IS 'User statistics aggregation. Respects RLS via security_invoker.';
COMMENT ON VIEW estoque_atual_v2 IS 'Current inventory with average cost. Respects RLS via security_invoker.';
COMMENT ON VIEW custos_por_categoria IS 'Costs by category. Respects RLS via security_invoker.';
COMMENT ON VIEW vw_bank_differences IS 'Bank entry reconciliation differences. Respects RLS via security_invoker.';
COMMENT ON VIEW v_aniversariantes_completa IS 'Complete birthday list (clients + family). Respects RLS via security_invoker.';
COMMENT ON VIEW v_aniversariantes_fornecedores IS 'Supplier and contact birthdays. Respects RLS via security_invoker.';