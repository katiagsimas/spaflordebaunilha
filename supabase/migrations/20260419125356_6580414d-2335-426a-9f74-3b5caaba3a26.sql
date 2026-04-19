-- Replace overly-permissive SELECT policy on public.tags
DROP POLICY IF EXISTS "Tags visíveis para autenticados" ON public.tags;

CREATE POLICY "Users can view own tags"
ON public.tags
FOR SELECT
TO authenticated
USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'::public.app_role));