
-- =====================================================================
-- Módulos PROPOSTAS e CONTRATOS - Caixa de Açúcar
-- =====================================================================

-- ---------- PROFILES: campos extras p/ assinatura + dados bancários ---
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS assinatura_url TEXT,
  ADD COLUMN IF NOT EXISTS dados_bancarios JSONB NOT NULL DEFAULT '{}'::jsonb;

-- =====================================================================
-- TABELA: propostas
-- =====================================================================
CREATE TABLE public.propostas (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  owner_group_id UUID NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  created_by UUID NOT NULL,
  numero INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'rascunho',
  -- Cliente
  cliente_nome TEXT NOT NULL,
  cliente_telefone TEXT,
  cliente_email TEXT,
  cliente_documento TEXT,
  cliente_endereco_cep TEXT,
  cliente_endereco_rua TEXT,
  cliente_endereco_numero TEXT,
  cliente_endereco_complemento TEXT,
  cliente_endereco_bairro TEXT,
  cliente_endereco_cidade TEXT,
  cliente_endereco_estado TEXT,
  -- Produtos / valores
  produtos JSONB NOT NULL DEFAULT '[]'::jsonb,
  subtotal NUMERIC(12,2) NOT NULL DEFAULT 0,
  desconto NUMERIC(12,2) NOT NULL DEFAULT 0,
  frete NUMERIC(12,2) NOT NULL DEFAULT 0,
  valor_total NUMERIC(12,2) NOT NULL DEFAULT 0,
  -- Datas
  data_emissao DATE NOT NULL DEFAULT CURRENT_DATE,
  data_validade DATE,
  data_entrega DATE,
  -- Outros
  forma_pagamento TEXT,
  observacoes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (owner_group_id, numero)
);

CREATE INDEX idx_propostas_owner_group ON public.propostas(owner_group_id);
CREATE INDEX idx_propostas_status ON public.propostas(status);
CREATE INDEX idx_propostas_data_emissao ON public.propostas(data_emissao DESC);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.propostas TO authenticated;
GRANT ALL ON public.propostas TO service_role;

ALTER TABLE public.propostas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view their group proposals"
  ON public.propostas FOR SELECT TO authenticated
  USING (public.user_belongs_to_group(auth.uid(), owner_group_id));

CREATE POLICY "Members can create proposals in their group"
  ON public.propostas FOR INSERT TO authenticated
  WITH CHECK (
    public.user_belongs_to_group(auth.uid(), owner_group_id)
    AND created_by = auth.uid()
  );

CREATE POLICY "Members can update their group proposals"
  ON public.propostas FOR UPDATE TO authenticated
  USING (public.user_belongs_to_group(auth.uid(), owner_group_id));

CREATE POLICY "Members can delete their group proposals"
  ON public.propostas FOR DELETE TO authenticated
  USING (public.user_belongs_to_group(auth.uid(), owner_group_id));

CREATE TRIGGER trg_propostas_updated_at
  BEFORE UPDATE ON public.propostas
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =====================================================================
-- TABELA: contratos_templates  (gerenciada pela MOTHER)
-- =====================================================================
CREATE TABLE public.contratos_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL,
  tipo TEXT NOT NULL,
  descricao TEXT,
  icone TEXT NOT NULL DEFAULT '📄',
  campos JSONB NOT NULL DEFAULT '[]'::jsonb,
  corpo TEXT NOT NULL,
  ativo BOOLEAN NOT NULL DEFAULT true,
  ordem INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT ON public.contratos_templates TO authenticated;
GRANT ALL ON public.contratos_templates TO service_role;

ALTER TABLE public.contratos_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view active templates"
  ON public.contratos_templates FOR SELECT TO authenticated
  USING (ativo = true OR public.is_mother(auth.uid()));

CREATE POLICY "Only MOTHER can manage contract templates"
  ON public.contratos_templates FOR ALL TO authenticated
  USING (public.is_mother(auth.uid()))
  WITH CHECK (public.is_mother(auth.uid()));

CREATE TRIGGER trg_contratos_templates_updated_at
  BEFORE UPDATE ON public.contratos_templates
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =====================================================================
-- TABELA: contratos
-- =====================================================================
CREATE TABLE public.contratos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  owner_group_id UUID NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  created_by UUID NOT NULL,
  template_id UUID REFERENCES public.contratos_templates(id) ON DELETE SET NULL,
  template_nome TEXT NOT NULL,
  numero INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'rascunho',
  -- Cliente
  cliente_nome TEXT NOT NULL,
  cliente_telefone TEXT,
  cliente_email TEXT,
  cliente_documento TEXT,
  -- Conteúdo
  form_data JSONB NOT NULL DEFAULT '{}'::jsonb,
  valor_total NUMERIC(12,2) NOT NULL DEFAULT 0,
  data_evento DATE,
  -- Arquivos / fluxo
  pdf_url TEXT,
  enviado_em TIMESTAMPTZ,
  assinado_em TIMESTAMPTZ,
  observacoes TEXT,
  proposta_id UUID REFERENCES public.propostas(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (owner_group_id, numero)
);

CREATE INDEX idx_contratos_owner_group ON public.contratos(owner_group_id);
CREATE INDEX idx_contratos_status ON public.contratos(status);
CREATE INDEX idx_contratos_template ON public.contratos(template_id);
CREATE INDEX idx_contratos_data_evento ON public.contratos(data_evento DESC);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.contratos TO authenticated;
GRANT ALL ON public.contratos TO service_role;

ALTER TABLE public.contratos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view their group contracts"
  ON public.contratos FOR SELECT TO authenticated
  USING (public.user_belongs_to_group(auth.uid(), owner_group_id));

CREATE POLICY "Members can create contracts in their group"
  ON public.contratos FOR INSERT TO authenticated
  WITH CHECK (
    public.user_belongs_to_group(auth.uid(), owner_group_id)
    AND created_by = auth.uid()
  );

CREATE POLICY "Members can update their group contracts"
  ON public.contratos FOR UPDATE TO authenticated
  USING (public.user_belongs_to_group(auth.uid(), owner_group_id));

CREATE POLICY "Members can delete their group contracts"
  ON public.contratos FOR DELETE TO authenticated
  USING (public.user_belongs_to_group(auth.uid(), owner_group_id));

CREATE TRIGGER trg_contratos_updated_at
  BEFORE UPDATE ON public.contratos
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =====================================================================
-- FUNÇÃO: próximo número sequencial por grupo (propostas e contratos)
-- =====================================================================
CREATE OR REPLACE FUNCTION public.proximo_numero_proposta(_group_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE v_prox INTEGER;
BEGIN
  SELECT COALESCE(MAX(numero), 0) + 1 INTO v_prox
  FROM public.propostas WHERE owner_group_id = _group_id;
  RETURN v_prox;
END;
$$;

CREATE OR REPLACE FUNCTION public.proximo_numero_contrato(_group_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE v_prox INTEGER;
BEGIN
  SELECT COALESCE(MAX(numero), 0) + 1 INTO v_prox
  FROM public.contratos WHERE owner_group_id = _group_id;
  RETURN v_prox;
END;
$$;

GRANT EXECUTE ON FUNCTION public.proximo_numero_proposta(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.proximo_numero_contrato(UUID) TO authenticated;

-- =====================================================================
-- STORAGE BUCKETS: assinaturas (public) + contratos-pdf (privado)
-- =====================================================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('assinaturas', 'assinaturas', true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public)
VALUES ('contratos-pdf', 'contratos-pdf', false)
ON CONFLICT (id) DO NOTHING;

-- Assinaturas: leitura pública (bucket público)
CREATE POLICY "Assinaturas são publicamente acessíveis"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'assinaturas');

CREATE POLICY "Membros do grupo podem subir assinatura"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'assinaturas'
    AND public.user_belongs_to_group(auth.uid(), (storage.foldername(name))[1]::uuid)
  );

CREATE POLICY "Membros do grupo podem atualizar sua assinatura"
  ON storage.objects FOR UPDATE TO authenticated
  USING (
    bucket_id = 'assinaturas'
    AND public.user_belongs_to_group(auth.uid(), (storage.foldername(name))[1]::uuid)
  );

CREATE POLICY "Membros do grupo podem deletar sua assinatura"
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'assinaturas'
    AND public.user_belongs_to_group(auth.uid(), (storage.foldername(name))[1]::uuid)
  );

-- Contratos PDF: acesso privado por grupo
CREATE POLICY "Membros do grupo podem visualizar PDFs de contratos"
  ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id = 'contratos-pdf'
    AND public.user_belongs_to_group(auth.uid(), (storage.foldername(name))[1]::uuid)
  );

CREATE POLICY "Membros do grupo podem subir PDFs de contratos"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'contratos-pdf'
    AND public.user_belongs_to_group(auth.uid(), (storage.foldername(name))[1]::uuid)
  );

CREATE POLICY "Membros do grupo podem atualizar PDFs de contratos"
  ON storage.objects FOR UPDATE TO authenticated
  USING (
    bucket_id = 'contratos-pdf'
    AND public.user_belongs_to_group(auth.uid(), (storage.foldername(name))[1]::uuid)
  );

CREATE POLICY "Membros do grupo podem deletar PDFs de contratos"
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'contratos-pdf'
    AND public.user_belongs_to_group(auth.uid(), (storage.foldername(name))[1]::uuid)
  );
