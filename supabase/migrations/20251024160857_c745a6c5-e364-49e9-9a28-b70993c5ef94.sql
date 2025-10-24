-- Adicionar campo ativo na tabela profiles para desabilitar usuários
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS ativo BOOLEAN DEFAULT true;

-- Permitir que admins atualizem e deletem perfis de outros usuários
CREATE POLICY "Admins can update all profiles" ON profiles
FOR UPDATE USING (
  public.has_role(auth.uid(), 'admin')
);

CREATE POLICY "Admins can delete profiles" ON profiles
FOR DELETE USING (
  public.has_role(auth.uid(), 'admin')
);

-- Permitir que admins gerenciem roles de usuários
CREATE POLICY "Admins can insert user_roles" ON user_roles
FOR INSERT WITH CHECK (
  public.has_role(auth.uid(), 'admin')
);

CREATE POLICY "Admins can update user_roles" ON user_roles
FOR UPDATE USING (
  public.has_role(auth.uid(), 'admin')
);

CREATE POLICY "Admins can delete user_roles" ON user_roles
FOR DELETE USING (
  public.has_role(auth.uid(), 'admin')
);