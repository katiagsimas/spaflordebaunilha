-- Criar tabela de tipos de insumos
CREATE TABLE public.tipos_insumos (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  codigo serial NOT NULL UNIQUE,
  descricao character varying NOT NULL,
  quantidade_embalagem numeric NOT NULL,
  unidade_medida_id uuid REFERENCES public.unidades_medida(id),
  usuario_id uuid NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Criar tabela de tipos de embalagens
CREATE TABLE public.tipos_embalagens (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  codigo serial NOT NULL UNIQUE,
  descricao character varying NOT NULL,
  quantidade_embalagem numeric NOT NULL,
  unidade_medida_id uuid REFERENCES public.unidades_medida(id),
  usuario_id uuid NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.tipos_insumos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tipos_embalagens ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para tipos_insumos
CREATE POLICY "Users can view own tipos_insumos"
  ON public.tipos_insumos FOR SELECT
  USING (auth.uid() = usuario_id);

CREATE POLICY "Users can insert own tipos_insumos"
  ON public.tipos_insumos FOR INSERT
  WITH CHECK (auth.uid() = usuario_id);

CREATE POLICY "Users can update own tipos_insumos"
  ON public.tipos_insumos FOR UPDATE
  USING (auth.uid() = usuario_id)
  WITH CHECK (auth.uid() = usuario_id);

CREATE POLICY "Users can delete own tipos_insumos"
  ON public.tipos_insumos FOR DELETE
  USING (auth.uid() = usuario_id);

-- Políticas RLS para tipos_embalagens
CREATE POLICY "Users can view own tipos_embalagens"
  ON public.tipos_embalagens FOR SELECT
  USING (auth.uid() = usuario_id);

CREATE POLICY "Users can insert own tipos_embalagens"
  ON public.tipos_embalagens FOR INSERT
  WITH CHECK (auth.uid() = usuario_id);

CREATE POLICY "Users can update own tipos_embalagens"
  ON public.tipos_embalagens FOR UPDATE
  USING (auth.uid() = usuario_id)
  WITH CHECK (auth.uid() = usuario_id);

CREATE POLICY "Users can delete own tipos_embalagens"
  ON public.tipos_embalagens FOR DELETE
  USING (auth.uid() = usuario_id);

-- Trigger para atualizar updated_at automaticamente
CREATE TRIGGER update_tipos_insumos_updated_at
  BEFORE UPDATE ON public.tipos_insumos
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_tipos_embalagens_updated_at
  BEFORE UPDATE ON public.tipos_embalagens
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();