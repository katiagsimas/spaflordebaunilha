-- Adicionar owner_group_id na tabela mao_obra_perfis_historico
ALTER TABLE public.mao_obra_perfis_historico 
ADD COLUMN IF NOT EXISTS owner_group_id uuid REFERENCES public.groups(id) ON DELETE SET NULL;

-- Atualizar RLS na mao_obra_perfis_historico
DROP POLICY IF EXISTS "Users can view own historico" ON public.mao_obra_perfis_historico;
CREATE POLICY "Users can view own historico" ON public.mao_obra_perfis_historico
FOR SELECT TO authenticated
USING (
    (owner_group_id IS NOT NULL AND user_belongs_to_group(auth.uid(), owner_group_id))
    OR 
    (owner_group_id IS NULL AND auth.uid() = user_id)
);

DROP POLICY IF EXISTS "Users can insert own historico" ON public.mao_obra_perfis_historico;
CREATE POLICY "Users can insert own historico" ON public.mao_obra_perfis_historico
FOR INSERT TO authenticated
WITH CHECK (
    auth.uid() = user_id AND 
    (
        (owner_group_id IS NOT NULL AND user_belongs_to_group(auth.uid(), owner_group_id))
        OR
        (owner_group_id IS NULL)
    )
);

-- Garantir GRANTs
GRANT SELECT, INSERT ON public.mao_obra_perfis_historico TO authenticated;
GRANT ALL ON public.mao_obra_perfis_historico TO service_role;

-- Vincular registros órfãos ao grupo do usuário na mao_obra_perfis_historico
UPDATE public.mao_obra_perfis_historico
SET owner_group_id = (SELECT group_id FROM public.user_group_roles WHERE user_id = mao_obra_perfis_historico.user_id LIMIT 1)
WHERE owner_group_id IS NULL;

-- Vincular registros órfãos na mao_obra_perfis (caso ainda tenha)
UPDATE public.mao_obra_perfis
SET owner_group_id = (SELECT group_id FROM public.user_group_roles WHERE user_id = mao_obra_perfis.user_id LIMIT 1)
WHERE owner_group_id IS NULL;