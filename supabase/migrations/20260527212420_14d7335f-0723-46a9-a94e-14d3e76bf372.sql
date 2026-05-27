
-- 1. historico_planos: allow users to view their own plan history
CREATE POLICY "Users can view own plan history"
ON public.historico_planos
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- 2. imersao_notificacoes_log: restrict admin SELECT to MOTHER-level only
DROP POLICY IF EXISTS "Admin pode ver todos os logs de notificacao" ON public.imersao_notificacoes_log;

CREATE POLICY "MOTHER can view all notification logs"
ON public.imersao_notificacoes_log
FOR SELECT
TO authenticated
USING (public.is_mother(auth.uid()));

-- 3. sso_token_log: add explicit deny policies to document intent
-- (service_role bypasses RLS, so inserts/reads from edge functions continue to work)
CREATE POLICY "Deny all client access (authenticated)"
ON public.sso_token_log
FOR ALL
TO authenticated
USING (false)
WITH CHECK (false);

CREATE POLICY "Deny all client access (anon)"
ON public.sso_token_log
FOR ALL
TO anon
USING (false)
WITH CHECK (false);
