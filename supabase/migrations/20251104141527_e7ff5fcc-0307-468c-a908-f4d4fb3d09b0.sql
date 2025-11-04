-- Habilitar RLS nas tabelas de backup para segurança
ALTER TABLE _backup_tipos_insumos ENABLE ROW LEVEL SECURITY;
ALTER TABLE _backup_ingredientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE _backup_embalagens ENABLE ROW LEVEL SECURITY;

-- Criar políticas para que apenas admins possam acessar os backups
CREATE POLICY "Apenas admins podem ver backup tipos_insumos"
  ON _backup_tipos_insumos
  FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Apenas admins podem ver backup ingredientes"
  ON _backup_ingredientes
  FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Apenas admins podem ver backup embalagens"
  ON _backup_embalagens
  FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));