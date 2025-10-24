-- 1. Tabela de logs de ações do admin
CREATE TABLE IF NOT EXISTS admin_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID REFERENCES auth.users NOT NULL,
  admin_email TEXT NOT NULL,
  acao TEXT NOT NULL,
  usuario_afetado_id UUID,
  usuario_afetado_email TEXT,
  detalhes JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX idx_admin_logs_admin_id ON admin_logs(admin_id);
CREATE INDEX idx_admin_logs_usuario_afetado ON admin_logs(usuario_afetado_id);
CREATE INDEX idx_admin_logs_created_at ON admin_logs(created_at DESC);

-- 2. Adicionar campos na tabela profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS last_login TIMESTAMP WITH TIME ZONE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS tags TEXT[];

-- 3. View para estatísticas dos usuários
CREATE OR REPLACE VIEW user_statistics AS
SELECT 
  p.id as user_id,
  p.email,
  p.nome_completo as full_name,
  p.nome_confeitaria as confeitaria,
  COUNT(DISTINCT c.id) as total_clientes,
  COUNT(DISTINCT e.id) as total_encomendas,
  COUNT(DISTINCT r.id) as total_receitas,
  COUNT(DISTINCT f.id) as total_fornecedores,
  COUNT(DISTINCT cr.id) as total_contas_receber,
  COUNT(DISTINCT cp.id) as total_contas_pagar,
  COALESCE(SUM(e.valor), 0) as valor_total_encomendas,
  p.created_at as cadastrado_em,
  p.last_login as ultimo_acesso,
  p.ativo as status,
  (SELECT role FROM user_roles WHERE user_id = p.id LIMIT 1) as permissao
FROM profiles p
LEFT JOIN clientes c ON c.usuario_id = p.id
LEFT JOIN encomendas e ON e.usuario_id = p.id
LEFT JOIN receitas r ON r.usuario_id = p.id
LEFT JOIN fornecedores f ON f.usuario_id = p.id
LEFT JOIN contas_receber cr ON cr.usuario_id = p.id
LEFT JOIN contas_pagar cp ON cp.usuario_id = p.id
GROUP BY p.id, p.email, p.nome_completo, p.nome_confeitaria, p.created_at, p.last_login, p.ativo;

-- 4. Políticas RLS para admin_logs
ALTER TABLE admin_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Apenas admins podem ver logs"
ON admin_logs FOR SELECT
USING (
  public.has_role(auth.uid(), 'admin')
);

CREATE POLICY "Apenas admins podem inserir logs"
ON admin_logs FOR INSERT
WITH CHECK (
  public.has_role(auth.uid(), 'admin')
);