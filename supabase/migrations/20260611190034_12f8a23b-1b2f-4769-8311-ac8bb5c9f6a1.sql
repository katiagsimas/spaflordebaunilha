
-- 1) Restrict onboarding_exception_logs policies
DROP POLICY IF EXISTS "Users can view their own exception logs" ON public.onboarding_exception_logs;
DROP POLICY IF EXISTS "Admins can insert exception logs" ON public.onboarding_exception_logs;

CREATE POLICY "View own or MOTHER exception logs"
ON public.onboarding_exception_logs
FOR SELECT
TO authenticated
USING (auth.uid() = user_id OR public.is_mother(auth.uid()));

CREATE POLICY "Authenticated admins insert exception logs"
ON public.onboarding_exception_logs
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = admin_id AND public.is_mother(auth.uid()));

-- 2) Fix mutable search_path on validation functions
ALTER FUNCTION public.validate_active_group() SET search_path = public;
ALTER FUNCTION public.validate_profile_owner_group() SET search_path = public;
