-- =====================================================
-- 1. PROFILES: Prevent users from self-updating plan fields
-- =====================================================
CREATE OR REPLACE FUNCTION public.protect_plan_fields()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Allow admins to change plan fields
  IF public.has_role(auth.uid(), 'admin') THEN
    RETURN NEW;
  END IF;

  -- For non-admin users, preserve original plan values
  NEW.plano_id := OLD.plano_id;
  NEW.plano_tipo := OLD.plano_tipo;
  NEW.plano_inicio := OLD.plano_inicio;
  NEW.plano_fim := OLD.plano_fim;

  RETURN NEW;
END;
$$;

CREATE TRIGGER protect_profiles_plan_fields
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.protect_plan_fields();

-- =====================================================
-- 2. ENCOMENDAS_TAGS: Remove overly permissive policies
-- =====================================================
DROP POLICY IF EXISTS "Usuários podem inserir encomendas_tags" ON public.encomendas_tags;
DROP POLICY IF EXISTS "Usuários podem deletar encomendas_tags" ON public.encomendas_tags;

-- =====================================================
-- 3. TAGS: Add user_id column and fix policies
-- =====================================================
ALTER TABLE public.tags ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id);

-- Drop overly permissive policies
DROP POLICY IF EXISTS "Usuários podem atualizar tags" ON public.tags;
DROP POLICY IF EXISTS "Usuários podem inserir tags" ON public.tags;

-- New ownership-scoped policies
CREATE POLICY "Users can insert own tags"
  ON public.tags FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own tags"
  ON public.tags FOR UPDATE
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'))
  WITH CHECK (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage all tags"
  ON public.tags FOR DELETE
  USING (public.has_role(auth.uid(), 'admin') OR auth.uid() = user_id);

-- =====================================================
-- 4. TOPO-BOLO STORAGE: Fix INSERT and DELETE policies
-- =====================================================
DROP POLICY IF EXISTS "Usuários podem fazer upload de imagens de topo de bolo" ON storage.objects;
DROP POLICY IF EXISTS "Usuários podem deletar suas próprias imagens de topo de bolo" ON storage.objects;

CREATE POLICY "Usuários podem fazer upload de imagens de topo de bolo"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'topo-bolo'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Usuários podem deletar suas próprias imagens de topo de bolo"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'topo-bolo'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- =====================================================
-- 5. COMPROVANTES-PAGAR STORAGE: Add missing UPDATE policy
-- =====================================================
CREATE POLICY "Users can update own comprovantes-pagar"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'comprovantes-pagar'
    AND (auth.uid())::text = (storage.foldername(name))[1]
  )
  WITH CHECK (
    bucket_id = 'comprovantes-pagar'
    AND (auth.uid())::text = (storage.foldername(name))[1]
  );