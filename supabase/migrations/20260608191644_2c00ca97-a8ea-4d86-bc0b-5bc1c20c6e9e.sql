CREATE TABLE public.onboarding_exception_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  admin_id UUID NOT NULL REFERENCES auth.users(id),
  action TEXT NOT NULL,
  route TEXT NOT NULL,
  details JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT ON public.onboarding_exception_logs TO authenticated;
GRANT ALL ON public.onboarding_exception_logs TO service_role;

ALTER TABLE public.onboarding_exception_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own exception logs" ON public.onboarding_exception_logs
  FOR SELECT USING (auth.uid() = user_id OR auth.uid() = admin_id);

CREATE POLICY "Admins can insert exception logs" ON public.onboarding_exception_logs
  FOR INSERT WITH CHECK (auth.uid() = admin_id);
