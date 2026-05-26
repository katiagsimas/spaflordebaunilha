
-- 1) Tabela backups_cofre
CREATE TABLE IF NOT EXISTS public.backups_cofre (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  owner_group_id UUID REFERENCES public.groups(id) ON DELETE CASCADE,
  usuario_id_origem UUID NOT NULL,
  backup_id_origem UUID,
  nome TEXT NOT NULL,
  modulos TEXT[],
  storage_path TEXT NOT NULL,
  tamanho TEXT,
  tamanho_bytes BIGINT,
  origem TEXT NOT NULL DEFAULT 'agendado',
  eh_mensal BOOLEAN NOT NULL DEFAULT false,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, DELETE ON public.backups_cofre TO authenticated;
GRANT ALL ON public.backups_cofre TO service_role;

ALTER TABLE public.backups_cofre ENABLE ROW LEVEL SECURITY;

CREATE POLICY "MOTHER pode ver cofre de backups"
  ON public.backups_cofre
  FOR SELECT
  TO authenticated
  USING (public.is_mother(auth.uid()));

CREATE POLICY "MOTHER pode excluir do cofre"
  ON public.backups_cofre
  FOR DELETE
  TO authenticated
  USING (public.is_mother(auth.uid()));

CREATE INDEX IF NOT EXISTS idx_backups_cofre_grupo_criado
  ON public.backups_cofre (owner_group_id, criado_em DESC);

CREATE INDEX IF NOT EXISTS idx_backups_cofre_grupo_mensal
  ON public.backups_cofre (owner_group_id, eh_mensal);

-- 2) Bucket privado do cofre
INSERT INTO storage.buckets (id, name, public)
VALUES ('backups-cofre', 'backups-cofre', false)
ON CONFLICT (id) DO NOTHING;

-- 3) Políticas de Storage: apenas MOTHER lê via API; gravação só por service_role (sem policy = bloqueado)
CREATE POLICY "MOTHER pode ler arquivos do cofre"
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (bucket_id = 'backups-cofre' AND public.is_mother(auth.uid()));

CREATE POLICY "MOTHER pode excluir arquivos do cofre"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (bucket_id = 'backups-cofre' AND public.is_mother(auth.uid()));
