
-- 1) historico_planos: remove redundant/insecure service-role insert policy
DROP POLICY IF EXISTS "Service role can insert plan history" ON public.historico_planos;

-- 2) categorias_plano_contas: tighten SELECT to owner only (defaults are seeded per-user)
DROP POLICY IF EXISTS "Users can view categorias_plano_contas" ON public.categorias_plano_contas;
DROP POLICY IF EXISTS "Users can view default categorias_plano" ON public.categorias_plano_contas;

CREATE POLICY "Users can view own categorias_plano_contas"
ON public.categorias_plano_contas
FOR SELECT
TO authenticated
USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'::public.app_role));

-- 3) plano_contas: tighten SELECT to owner only
DROP POLICY IF EXISTS "Users can view plano_contas" ON public.plano_contas;

CREATE POLICY "Users can view own plano_contas"
ON public.plano_contas
FOR SELECT
TO authenticated
USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'::public.app_role));

-- 4) Storage: restrict topo-bolo SELECT to owner folder
DROP POLICY IF EXISTS "Usuários podem visualizar imagens de topo de bolo" ON storage.objects;

CREATE POLICY "Usuários veem apenas seus topos de bolo"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'topo-bolo'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- 5) Storage: add UPDATE policy for comprovantes-receber, owner-scoped
CREATE POLICY "Usuários atualizam seus próprios comprovantes a receber"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'comprovantes-receber'
  AND (storage.foldername(name))[1] = auth.uid()::text
)
WITH CHECK (
  bucket_id = 'comprovantes-receber'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- 6) Realtime: restrict channel subscriptions to topics prefixed with user's own auth.uid()
ALTER TABLE IF EXISTS realtime.messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users subscribe only to own topic" ON realtime.messages;

CREATE POLICY "Users subscribe only to own topic"
ON realtime.messages
FOR SELECT
TO authenticated
USING (
  realtime.topic() LIKE auth.uid()::text || ':%'
  OR realtime.topic() = auth.uid()::text
);
