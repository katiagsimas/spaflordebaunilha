
-- =============================================
-- 1. CRIAR ENUMS PARA PAPÉIS
-- =============================================

-- Papel global (apenas MOTHER)
DO $$ BEGIN
  CREATE TYPE public.role_global AS ENUM ('MOTHER');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Papel dentro do grupo
DO $$ BEGIN
  CREATE TYPE public.role_group AS ENUM ('ADMIN', 'USER');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- =============================================
-- 2. CRIAR TABELA DE GRUPOS
-- =============================================
CREATE TABLE IF NOT EXISTS public.groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  created_by_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Índice para busca por usuário criador
CREATE INDEX IF NOT EXISTS idx_groups_created_by ON public.groups(created_by_user_id);

-- Trigger para updated_at
CREATE OR REPLACE FUNCTION public.update_groups_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_groups_updated_at ON public.groups;
CREATE TRIGGER trigger_groups_updated_at
  BEFORE UPDATE ON public.groups
  FOR EACH ROW EXECUTE FUNCTION public.update_groups_updated_at();

-- =============================================
-- 3. CRIAR TABELA DE PAPÉIS GLOBAIS (MOTHER)
-- =============================================
CREATE TABLE IF NOT EXISTS public.user_global_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role_global role_global NOT NULL DEFAULT 'MOTHER',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id, role_global)
);

-- =============================================
-- 4. CRIAR TABELA DE PAPÉIS POR GRUPO
-- =============================================
CREATE TABLE IF NOT EXISTS public.user_group_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  group_id UUID NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  role_group role_group NOT NULL DEFAULT 'USER',
  permission_flags JSONB DEFAULT '{
    "financeiro_view": true,
    "financeiro_edit": false,
    "metas_view": true,
    "metas_edit": false,
    "tarefas_view": true,
    "tarefas_edit": false,
    "cadastros_view": true,
    "cadastros_edit": false,
    "receitas_view": true,
    "receitas_edit": false,
    "encomendas_view": true,
    "encomendas_edit": false,
    "precificacao_view": true,
    "precificacao_edit": false,
    "admin_users_manage": false
  }'::jsonb,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id, group_id)
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_user_group_roles_user ON public.user_group_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_group_roles_group ON public.user_group_roles(group_id);

-- Trigger para updated_at
CREATE OR REPLACE FUNCTION public.update_user_group_roles_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_user_group_roles_updated_at ON public.user_group_roles;
CREATE TRIGGER trigger_user_group_roles_updated_at
  BEFORE UPDATE ON public.user_group_roles
  FOR EACH ROW EXECUTE FUNCTION public.update_user_group_roles_updated_at();

-- =============================================
-- 5. ADICIONAR owner_group_id NAS TABELAS FUNCIONAIS
-- =============================================

-- Tabela de sessão ativa do usuário (grupo selecionado)
CREATE TABLE IF NOT EXISTS public.user_active_session (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  active_group_id UUID REFERENCES public.groups(id) ON DELETE SET NULL,
  mode TEXT DEFAULT 'group' CHECK (mode IN ('system', 'group')),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Adicionar owner_group_id em todas as tabelas funcionais
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS owner_group_id UUID REFERENCES public.groups(id) ON DELETE SET NULL;
ALTER TABLE public.clientes ADD COLUMN IF NOT EXISTS owner_group_id UUID REFERENCES public.groups(id) ON DELETE SET NULL;
ALTER TABLE public.fornecedores ADD COLUMN IF NOT EXISTS owner_group_id UUID REFERENCES public.groups(id) ON DELETE SET NULL;
ALTER TABLE public.receitas ADD COLUMN IF NOT EXISTS owner_group_id UUID REFERENCES public.groups(id) ON DELETE SET NULL;
ALTER TABLE public.ingredientes ADD COLUMN IF NOT EXISTS owner_group_id UUID REFERENCES public.groups(id) ON DELETE SET NULL;
ALTER TABLE public.embalagens ADD COLUMN IF NOT EXISTS owner_group_id UUID REFERENCES public.groups(id) ON DELETE SET NULL;
ALTER TABLE public.encomendas ADD COLUMN IF NOT EXISTS owner_group_id UUID REFERENCES public.groups(id) ON DELETE SET NULL;
ALTER TABLE public.encomenda_itens ADD COLUMN IF NOT EXISTS owner_group_id UUID REFERENCES public.groups(id) ON DELETE SET NULL;
ALTER TABLE public.categorias ADD COLUMN IF NOT EXISTS owner_group_id UUID REFERENCES public.groups(id) ON DELETE SET NULL;
ALTER TABLE public.custos_fixos ADD COLUMN IF NOT EXISTS owner_group_id UUID REFERENCES public.groups(id) ON DELETE SET NULL;
ALTER TABLE public.bancos ADD COLUMN IF NOT EXISTS owner_group_id UUID REFERENCES public.groups(id) ON DELETE SET NULL;
ALTER TABLE public.contas_pagar ADD COLUMN IF NOT EXISTS owner_group_id UUID REFERENCES public.groups(id) ON DELETE SET NULL;
ALTER TABLE public.contas_receber ADD COLUMN IF NOT EXISTS owner_group_id UUID REFERENCES public.groups(id) ON DELETE SET NULL;
ALTER TABLE public.pre_preparos ADD COLUMN IF NOT EXISTS owner_group_id UUID REFERENCES public.groups(id) ON DELETE SET NULL;
ALTER TABLE public.tipos_insumos ADD COLUMN IF NOT EXISTS owner_group_id UUID REFERENCES public.groups(id) ON DELETE SET NULL;
ALTER TABLE public.unidades_medida ADD COLUMN IF NOT EXISTS owner_group_id UUID REFERENCES public.groups(id) ON DELETE SET NULL;
ALTER TABLE public.plano_contas ADD COLUMN IF NOT EXISTS owner_group_id UUID REFERENCES public.groups(id) ON DELETE SET NULL;
ALTER TABLE public.categorias_plano_contas ADD COLUMN IF NOT EXISTS owner_group_id UUID REFERENCES public.groups(id) ON DELETE SET NULL;
ALTER TABLE public.tipos_documento ADD COLUMN IF NOT EXISTS owner_group_id UUID REFERENCES public.groups(id) ON DELETE SET NULL;
ALTER TABLE public.mao_obra_perfis ADD COLUMN IF NOT EXISTS owner_group_id UUID REFERENCES public.groups(id) ON DELETE SET NULL;
ALTER TABLE public.configuracoes_juros ADD COLUMN IF NOT EXISTS owner_group_id UUID REFERENCES public.groups(id) ON DELETE SET NULL;
ALTER TABLE public.tags_encomendas ADD COLUMN IF NOT EXISTS owner_group_id UUID REFERENCES public.groups(id) ON DELETE SET NULL;

-- Criar índices para owner_group_id
CREATE INDEX IF NOT EXISTS idx_clientes_owner_group ON public.clientes(owner_group_id);
CREATE INDEX IF NOT EXISTS idx_fornecedores_owner_group ON public.fornecedores(owner_group_id);
CREATE INDEX IF NOT EXISTS idx_receitas_owner_group ON public.receitas(owner_group_id);
CREATE INDEX IF NOT EXISTS idx_ingredientes_owner_group ON public.ingredientes(owner_group_id);
CREATE INDEX IF NOT EXISTS idx_embalagens_owner_group ON public.embalagens(owner_group_id);
CREATE INDEX IF NOT EXISTS idx_encomendas_owner_group ON public.encomendas(owner_group_id);
CREATE INDEX IF NOT EXISTS idx_contas_pagar_owner_group ON public.contas_pagar(owner_group_id);
CREATE INDEX IF NOT EXISTS idx_contas_receber_owner_group ON public.contas_receber(owner_group_id);

-- =============================================
-- 6. FUNÇÕES DE VERIFICAÇÃO DE PERMISSÃO
-- =============================================

-- Verificar se usuário é MOTHER
CREATE OR REPLACE FUNCTION public.is_mother(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_global_roles
    WHERE user_id = _user_id
      AND role_global = 'MOTHER'
      AND is_active = true
  )
$$;

-- Verificar papel do usuário em um grupo
CREATE OR REPLACE FUNCTION public.get_user_group_role(_user_id UUID, _group_id UUID)
RETURNS role_group
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role_group FROM public.user_group_roles
  WHERE user_id = _user_id
    AND group_id = _group_id
    AND is_active = true
  LIMIT 1
$$;

-- Verificar se usuário é ADMIN de um grupo
CREATE OR REPLACE FUNCTION public.is_group_admin(_user_id UUID, _group_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_group_roles
    WHERE user_id = _user_id
      AND group_id = _group_id
      AND role_group = 'ADMIN'
      AND is_active = true
  )
$$;

-- Verificar se usuário pertence a um grupo (qualquer papel)
CREATE OR REPLACE FUNCTION public.user_belongs_to_group(_user_id UUID, _group_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_group_roles
    WHERE user_id = _user_id
      AND group_id = _group_id
      AND is_active = true
  )
$$;

-- Obter grupo ativo do usuário
CREATE OR REPLACE FUNCTION public.get_active_group_id(_user_id UUID)
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT active_group_id FROM public.user_active_session
  WHERE user_id = _user_id
  LIMIT 1
$$;

-- Verificar permissão específica do usuário
CREATE OR REPLACE FUNCTION public.has_permission(_user_id UUID, _group_id UUID, _permission TEXT)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    CASE 
      -- ADMIN tem todas as permissões
      WHEN role_group = 'ADMIN' THEN true
      -- USER verifica permission_flags
      ELSE COALESCE((permission_flags->>_permission)::boolean, false)
    END
  FROM public.user_group_roles
  WHERE user_id = _user_id
    AND group_id = _group_id
    AND is_active = true
  LIMIT 1
$$;

-- =============================================
-- 7. HABILITAR RLS NAS NOVAS TABELAS
-- =============================================

ALTER TABLE public.groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_global_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_group_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_active_session ENABLE ROW LEVEL SECURITY;

-- =============================================
-- 8. POLÍTICAS RLS PARA GROUPS
-- =============================================

-- MOTHER pode ver todos os grupos
CREATE POLICY "Mother can view all groups"
ON public.groups FOR SELECT
TO authenticated
USING (public.is_mother(auth.uid()));

-- Usuários podem ver grupos onde participam
CREATE POLICY "Users can view their groups"
ON public.groups FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_group_roles
    WHERE user_group_roles.group_id = groups.id
      AND user_group_roles.user_id = auth.uid()
      AND user_group_roles.is_active = true
  )
);

-- Apenas MOTHER pode criar grupos
CREATE POLICY "Mother can create groups"
ON public.groups FOR INSERT
TO authenticated
WITH CHECK (public.is_mother(auth.uid()));

-- MOTHER ou ADMIN do grupo pode atualizar
CREATE POLICY "Mother or Admin can update groups"
ON public.groups FOR UPDATE
TO authenticated
USING (
  public.is_mother(auth.uid()) OR 
  public.is_group_admin(auth.uid(), id)
);

-- Apenas MOTHER pode deletar grupos
CREATE POLICY "Mother can delete groups"
ON public.groups FOR DELETE
TO authenticated
USING (public.is_mother(auth.uid()));

-- =============================================
-- 9. POLÍTICAS RLS PARA USER_GLOBAL_ROLES
-- =============================================

-- MOTHER pode ver todos
CREATE POLICY "Mother can view global roles"
ON public.user_global_roles FOR SELECT
TO authenticated
USING (public.is_mother(auth.uid()) OR user_id = auth.uid());

-- Apenas MOTHER pode gerenciar
CREATE POLICY "Mother can manage global roles"
ON public.user_global_roles FOR ALL
TO authenticated
USING (public.is_mother(auth.uid()));

-- =============================================
-- 10. POLÍTICAS RLS PARA USER_GROUP_ROLES
-- =============================================

-- Usuários podem ver seus próprios papéis
CREATE POLICY "Users can view own group roles"
ON public.user_group_roles FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- MOTHER pode ver todos
CREATE POLICY "Mother can view all group roles"
ON public.user_group_roles FOR SELECT
TO authenticated
USING (public.is_mother(auth.uid()));

-- ADMIN pode ver papéis do seu grupo
CREATE POLICY "Admin can view group roles"
ON public.user_group_roles FOR SELECT
TO authenticated
USING (public.is_group_admin(auth.uid(), group_id));

-- MOTHER pode criar papéis em qualquer grupo
CREATE POLICY "Mother can create group roles"
ON public.user_group_roles FOR INSERT
TO authenticated
WITH CHECK (public.is_mother(auth.uid()));

-- ADMIN pode criar USER no seu grupo
CREATE POLICY "Admin can create users in group"
ON public.user_group_roles FOR INSERT
TO authenticated
WITH CHECK (
  public.is_group_admin(auth.uid(), group_id) AND 
  role_group = 'USER'
);

-- MOTHER ou ADMIN pode atualizar papéis
CREATE POLICY "Mother or Admin can update group roles"
ON public.user_group_roles FOR UPDATE
TO authenticated
USING (
  public.is_mother(auth.uid()) OR 
  (public.is_group_admin(auth.uid(), group_id) AND role_group = 'USER')
);

-- Apenas MOTHER pode deletar
CREATE POLICY "Mother can delete group roles"
ON public.user_group_roles FOR DELETE
TO authenticated
USING (public.is_mother(auth.uid()));

-- =============================================
-- 11. POLÍTICAS RLS PARA USER_ACTIVE_SESSION
-- =============================================

CREATE POLICY "Users can manage own session"
ON public.user_active_session FOR ALL
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- =============================================
-- 12. MIGRAÇÃO DE DADOS EXISTENTES
-- =============================================

-- Criar grupo padrão para cada usuário existente que ainda não tem grupo
DO $$
DECLARE
  r RECORD;
  new_group_id UUID;
BEGIN
  FOR r IN 
    SELECT DISTINCT p.id as user_id, p.nome_confeitaria, p.email
    FROM profiles p
    WHERE NOT EXISTS (
      SELECT 1 FROM user_group_roles ugr WHERE ugr.user_id = p.id
    )
  LOOP
    -- Criar grupo para o usuário
    INSERT INTO groups (name, created_by_user_id)
    VALUES (
      COALESCE(r.nome_confeitaria, 'Minha Confeitaria'),
      r.user_id
    )
    RETURNING id INTO new_group_id;
    
    -- Adicionar usuário como ADMIN do grupo
    INSERT INTO user_group_roles (user_id, group_id, role_group, permission_flags)
    VALUES (
      r.user_id, 
      new_group_id, 
      'ADMIN',
      '{
        "financeiro_view": true,
        "financeiro_edit": true,
        "metas_view": true,
        "metas_edit": true,
        "tarefas_view": true,
        "tarefas_edit": true,
        "cadastros_view": true,
        "cadastros_edit": true,
        "receitas_view": true,
        "receitas_edit": true,
        "encomendas_view": true,
        "encomendas_edit": true,
        "precificacao_view": true,
        "precificacao_edit": true,
        "admin_users_manage": true
      }'::jsonb
    );
    
    -- Criar sessão ativa
    INSERT INTO user_active_session (user_id, active_group_id, mode)
    VALUES (r.user_id, new_group_id, 'group')
    ON CONFLICT (user_id) DO UPDATE SET active_group_id = new_group_id;
    
    -- Atualizar owner_group_id em todas as tabelas do usuário
    UPDATE clientes SET owner_group_id = new_group_id WHERE usuario_id = r.user_id AND owner_group_id IS NULL;
    UPDATE fornecedores SET owner_group_id = new_group_id WHERE usuario_id = r.user_id AND owner_group_id IS NULL;
    UPDATE receitas SET owner_group_id = new_group_id WHERE usuario_id = r.user_id AND owner_group_id IS NULL;
    UPDATE ingredientes SET owner_group_id = new_group_id WHERE usuario_id = r.user_id AND owner_group_id IS NULL;
    UPDATE embalagens SET owner_group_id = new_group_id WHERE usuario_id = r.user_id AND owner_group_id IS NULL;
    UPDATE encomendas SET owner_group_id = new_group_id WHERE usuario_id = r.user_id AND owner_group_id IS NULL;
    UPDATE encomenda_itens SET owner_group_id = new_group_id WHERE usuario_id = r.user_id AND owner_group_id IS NULL;
    UPDATE categorias SET owner_group_id = new_group_id WHERE usuario_id = r.user_id AND owner_group_id IS NULL;
    UPDATE custos_fixos SET owner_group_id = new_group_id WHERE usuario_id = r.user_id AND owner_group_id IS NULL;
    UPDATE bancos SET owner_group_id = new_group_id WHERE usuario_id = r.user_id AND owner_group_id IS NULL;
    UPDATE contas_pagar SET owner_group_id = new_group_id WHERE usuario_id = r.user_id AND owner_group_id IS NULL;
    UPDATE contas_receber SET owner_group_id = new_group_id WHERE usuario_id = r.user_id AND owner_group_id IS NULL;
    UPDATE pre_preparos SET owner_group_id = new_group_id WHERE usuario_id = r.user_id AND owner_group_id IS NULL;
    UPDATE unidades_medida SET owner_group_id = new_group_id WHERE usuario_id = r.user_id AND owner_group_id IS NULL;
    UPDATE mao_obra_perfis SET owner_group_id = new_group_id WHERE user_id = r.user_id AND owner_group_id IS NULL;
    UPDATE configuracoes_juros SET owner_group_id = new_group_id WHERE usuario_id = r.user_id AND owner_group_id IS NULL;
    UPDATE profiles SET owner_group_id = new_group_id WHERE id = r.user_id AND owner_group_id IS NULL;
  END LOOP;
END $$;

-- Atualizar tabelas que usam user_id diferente
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN 
    SELECT ugr.user_id, ugr.group_id
    FROM user_group_roles ugr
    WHERE ugr.role_group = 'ADMIN'
  LOOP
    UPDATE plano_contas SET owner_group_id = r.group_id WHERE user_id = r.user_id AND owner_group_id IS NULL;
    UPDATE categorias_plano_contas SET owner_group_id = r.group_id WHERE user_id = r.user_id AND owner_group_id IS NULL;
    UPDATE tipos_insumos SET owner_group_id = r.group_id WHERE usuario_id = r.user_id AND owner_group_id IS NULL;
    UPDATE tipos_documento SET owner_group_id = r.group_id WHERE usuario_id = r.user_id AND owner_group_id IS NULL;
    UPDATE tags_encomendas SET owner_group_id = r.group_id WHERE user_id = r.user_id AND owner_group_id IS NULL;
  END LOOP;
END $$;
