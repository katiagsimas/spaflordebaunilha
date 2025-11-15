-- 1. Criar tabela de mãos de obra por receita
CREATE TABLE IF NOT EXISTS public.receitas_mao_obra (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  receita_id uuid NOT NULL REFERENCES public.receitas(id) ON DELETE CASCADE,
  perfil_id uuid NULL REFERENCES public.mao_obra_perfis(id) ON DELETE SET NULL,
  usar_valor_padrao boolean NOT NULL DEFAULT true,
  horas numeric(10,2) NOT NULL,
  criado_em timestamptz DEFAULT now(),
  atualizado_em timestamptz DEFAULT now()
);

-- 2. Criar tabela de mãos de obra por pré-preparo
CREATE TABLE IF NOT EXISTS public.pre_preparos_mao_obra (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pre_preparo_id uuid NOT NULL REFERENCES public.pre_preparos(id) ON DELETE CASCADE,
  perfil_id uuid NULL REFERENCES public.mao_obra_perfis(id) ON DELETE SET NULL,
  usar_valor_padrao boolean NOT NULL DEFAULT true,
  horas numeric(10,2) NOT NULL,
  criado_em timestamptz default now(),
  atualizado_em timestamptz default now()
);

-- 3. Habilitar RLS nas novas tabelas
ALTER TABLE public.receitas_mao_obra ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pre_preparos_mao_obra ENABLE ROW LEVEL SECURITY;

-- 4. Políticas RLS para receitas_mao_obra
CREATE POLICY "Users can view own receitas_mao_obra"
  ON public.receitas_mao_obra FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.receitas
      WHERE receitas.id = receitas_mao_obra.receita_id
      AND receitas.usuario_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own receitas_mao_obra"
  ON public.receitas_mao_obra FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.receitas
      WHERE receitas.id = receitas_mao_obra.receita_id
      AND receitas.usuario_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own receitas_mao_obra"
  ON public.receitas_mao_obra FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.receitas
      WHERE receitas.id = receitas_mao_obra.receita_id
      AND receitas.usuario_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete own receitas_mao_obra"
  ON public.receitas_mao_obra FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.receitas
      WHERE receitas.id = receitas_mao_obra.receita_id
      AND receitas.usuario_id = auth.uid()
    )
  );

-- 5. Políticas RLS para pre_preparos_mao_obra
CREATE POLICY "Users can view own pre_preparos_mao_obra"
  ON public.pre_preparos_mao_obra FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.pre_preparos
      WHERE pre_preparos.id = pre_preparos_mao_obra.pre_preparo_id
      AND pre_preparos.usuario_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own pre_preparos_mao_obra"
  ON public.pre_preparos_mao_obra FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.pre_preparos
      WHERE pre_preparos.id = pre_preparos_mao_obra.pre_preparo_id
      AND pre_preparos.usuario_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own pre_preparos_mao_obra"
  ON public.pre_preparos_mao_obra FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.pre_preparos
      WHERE pre_preparos.id = pre_preparos_mao_obra.pre_preparo_id
      AND pre_preparos.usuario_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete own pre_preparos_mao_obra"
  ON public.pre_preparos_mao_obra FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.pre_preparos
      WHERE pre_preparos.id = pre_preparos_mao_obra.pre_preparo_id
      AND pre_preparos.usuario_id = auth.uid()
    )
  );

-- 6. Migrar dados existentes de receitas (tempo_preparo)
INSERT INTO public.receitas_mao_obra (receita_id, perfil_id, usar_valor_padrao, horas)
SELECT 
  id as receita_id,
  perfil_mao_obra_id as perfil_id,
  CASE 
    WHEN perfil_mao_obra_id IS NULL THEN true
    ELSE false
  END as usar_valor_padrao,
  CASE 
    WHEN unidade_tempo = 'minutos' THEN tempo_preparo / 60.0
    WHEN unidade_tempo = 'horas' THEN tempo_preparo
    ELSE tempo_preparo / 60.0
  END as horas
FROM public.receitas
WHERE tempo_preparo > 0;

-- 7. Criar índices para performance
CREATE INDEX idx_receitas_mao_obra_receita_id ON public.receitas_mao_obra(receita_id);
CREATE INDEX idx_receitas_mao_obra_perfil_id ON public.receitas_mao_obra(perfil_id);
CREATE INDEX idx_pre_preparos_mao_obra_pre_preparo_id ON public.pre_preparos_mao_obra(pre_preparo_id);
CREATE INDEX idx_pre_preparos_mao_obra_perfil_id ON public.pre_preparos_mao_obra(perfil_id);