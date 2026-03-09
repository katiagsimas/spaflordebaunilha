
-- Function to check if user has access to the financial module (server-side plan enforcement)
CREATE OR REPLACE FUNCTION public.user_has_financial_access(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT CASE
    -- Admin always has access
    WHEN public.has_role(_user_id, 'admin') THEN true
    -- Check if user has 'negocio' plan
    ELSE COALESCE(
      (SELECT p.plano_id = 'negocio' FROM profiles p WHERE p.id = _user_id),
      false
    )
  END
$$;

-- Add RESTRICTIVE plan-check policies to financial tables

-- contas_receber
CREATE POLICY "plan_check_contas_receber"
ON public.contas_receber
AS RESTRICTIVE
FOR ALL
TO authenticated
USING (public.user_has_financial_access(auth.uid()))
WITH CHECK (public.user_has_financial_access(auth.uid()));

-- contas_pagar
CREATE POLICY "plan_check_contas_pagar"
ON public.contas_pagar
AS RESTRICTIVE
FOR ALL
TO authenticated
USING (public.user_has_financial_access(auth.uid()))
WITH CHECK (public.user_has_financial_access(auth.uid()));

-- contas_receber_parcelas
CREATE POLICY "plan_check_contas_receber_parcelas"
ON public.contas_receber_parcelas
AS RESTRICTIVE
FOR ALL
TO authenticated
USING (public.user_has_financial_access(auth.uid()))
WITH CHECK (public.user_has_financial_access(auth.uid()));

-- contas_pagar_parcelas
CREATE POLICY "plan_check_contas_pagar_parcelas"
ON public.contas_pagar_parcelas
AS RESTRICTIVE
FOR ALL
TO authenticated
USING (public.user_has_financial_access(auth.uid()))
WITH CHECK (public.user_has_financial_access(auth.uid()));

-- contas_receber_pagamentos
CREATE POLICY "plan_check_contas_receber_pagamentos"
ON public.contas_receber_pagamentos
AS RESTRICTIVE
FOR ALL
TO authenticated
USING (public.user_has_financial_access(auth.uid()))
WITH CHECK (public.user_has_financial_access(auth.uid()));

-- contas_pagar_pagamentos
CREATE POLICY "plan_check_contas_pagar_pagamentos"
ON public.contas_pagar_pagamentos
AS RESTRICTIVE
FOR ALL
TO authenticated
USING (public.user_has_financial_access(auth.uid()))
WITH CHECK (public.user_has_financial_access(auth.uid()));

-- contas_receber_comprovantes
CREATE POLICY "plan_check_contas_receber_comprovantes"
ON public.contas_receber_comprovantes
AS RESTRICTIVE
FOR ALL
TO authenticated
USING (public.user_has_financial_access(auth.uid()))
WITH CHECK (public.user_has_financial_access(auth.uid()));

-- contas_pagar_comprovantes
CREATE POLICY "plan_check_contas_pagar_comprovantes"
ON public.contas_pagar_comprovantes
AS RESTRICTIVE
FOR ALL
TO authenticated
USING (public.user_has_financial_access(auth.uid()))
WITH CHECK (public.user_has_financial_access(auth.uid()));

-- categorias_plano_contas
CREATE POLICY "plan_check_categorias_plano_contas"
ON public.categorias_plano_contas
AS RESTRICTIVE
FOR ALL
TO authenticated
USING (public.user_has_financial_access(auth.uid()))
WITH CHECK (public.user_has_financial_access(auth.uid()));

-- plano_contas
CREATE POLICY "plan_check_plano_contas"
ON public.plano_contas
AS RESTRICTIVE
FOR ALL
TO authenticated
USING (public.user_has_financial_access(auth.uid()))
WITH CHECK (public.user_has_financial_access(auth.uid()));

-- tipos_documento
CREATE POLICY "plan_check_tipos_documento"
ON public.tipos_documento
AS RESTRICTIVE
FOR ALL
TO authenticated
USING (public.user_has_financial_access(auth.uid()))
WITH CHECK (public.user_has_financial_access(auth.uid()));

-- configuracoes_juros
CREATE POLICY "plan_check_configuracoes_juros"
ON public.configuracoes_juros
AS RESTRICTIVE
FOR ALL
TO authenticated
USING (public.user_has_financial_access(auth.uid()))
WITH CHECK (public.user_has_financial_access(auth.uid()));
