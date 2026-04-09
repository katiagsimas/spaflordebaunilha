
-- 1. Create historico_planos table
CREATE TABLE public.historico_planos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  plano_anterior TEXT,
  plano_novo TEXT,
  plano_tipo_anterior TEXT,
  plano_tipo_novo TEXT,
  plano_inicio DATE,
  plano_fim DATE,
  tipo_evento TEXT NOT NULL DEFAULT 'alteracao',
  origem TEXT NOT NULL DEFAULT 'admin',
  observacao TEXT,
  admin_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.historico_planos ENABLE ROW LEVEL SECURITY;

-- Only admins can view
CREATE POLICY "Admins can view plan history"
ON public.historico_planos
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Only admins can insert
CREATE POLICY "Admins can insert plan history"
ON public.historico_planos
FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Service role (edge functions) can insert
CREATE POLICY "Service role can insert plan history"
ON public.historico_planos
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() IS NULL);

-- 2. Add origem_criacao column to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS origem_criacao TEXT DEFAULT NULL;

-- 3. Backfill origem_criacao for existing users based on admin_logs
UPDATE public.profiles p
SET origem_criacao = 'admin'
WHERE p.origem_criacao IS NULL
AND EXISTS (
  SELECT 1 FROM public.admin_logs al
  WHERE al.usuario_afetado_id = p.id
  AND al.acao = 'criou_usuario'
);

-- Set remaining users to 'webhook' (or unknown)
UPDATE public.profiles p
SET origem_criacao = 'webhook'
WHERE p.origem_criacao IS NULL
AND p.email != 'katiagsimas@gmail.com';

-- Set admin origin
UPDATE public.profiles
SET origem_criacao = 'sistema'
WHERE email = 'katiagsimas@gmail.com';

-- 4. Backfill initial plan history for all non-admin users
INSERT INTO public.historico_planos (user_id, plano_novo, plano_tipo_novo, plano_inicio, plano_fim, tipo_evento, origem, observacao, created_at)
SELECT 
  p.id,
  COALESCE(p.plano_id, 'base'),
  COALESCE(p.plano_tipo, 'mensal'),
  p.plano_inicio::date,
  p.plano_fim::date,
  'criacao',
  COALESCE(p.origem_criacao, 'admin'),
  'Registro inicial - backfill',
  COALESCE(p.created_at, now())
FROM public.profiles p
WHERE p.email != 'katiagsimas@gmail.com'
AND NOT EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = p.id AND ur.role = 'admin');
