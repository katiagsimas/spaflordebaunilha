-- Criar tabela de perfis de mão de obra
CREATE TABLE IF NOT EXISTS public.mao_obra_perfis (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  nome text NOT NULL,
  valor_hora numeric(10,2) NOT NULL,
  ativo boolean DEFAULT true,
  padrao boolean DEFAULT false,
  criado_em timestamptz DEFAULT now(),
  atualizado_em timestamptz DEFAULT now()
);

-- Criar tabela de histórico
CREATE TABLE IF NOT EXISTS public.mao_obra_perfis_historico (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  perfil_id uuid NOT NULL REFERENCES public.mao_obra_perfis(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  valor_antigo numeric(10,2),
  valor_novo numeric(10,2),
  acao text NOT NULL,
  registrado_em timestamptz DEFAULT now()
);

-- Adicionar campo perfil_mao_obra_id na tabela receitas
ALTER TABLE public.receitas 
ADD COLUMN IF NOT EXISTS perfil_mao_obra_id uuid REFERENCES public.mao_obra_perfis(id);

-- Trigger para atualizar atualizado_em em mao_obra_perfis
CREATE OR REPLACE FUNCTION public.update_mao_obra_perfis_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.atualizado_em = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_mao_obra_perfis_updated_at
  BEFORE UPDATE ON public.mao_obra_perfis
  FOR EACH ROW
  EXECUTE FUNCTION public.update_mao_obra_perfis_updated_at();

-- Trigger para garantir apenas um perfil padrão por usuário
CREATE OR REPLACE FUNCTION public.ensure_single_default_perfil()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.padrao = true THEN
    UPDATE public.mao_obra_perfis
    SET padrao = false
    WHERE user_id = NEW.user_id 
      AND id != NEW.id 
      AND padrao = true;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_ensure_single_default_perfil
  BEFORE INSERT OR UPDATE ON public.mao_obra_perfis
  FOR EACH ROW
  EXECUTE FUNCTION public.ensure_single_default_perfil();

-- Trigger para registrar histórico ao criar perfil
CREATE OR REPLACE FUNCTION public.log_perfil_criado()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.mao_obra_perfis_historico (perfil_id, user_id, valor_novo, acao)
  VALUES (NEW.id, NEW.user_id, NEW.valor_hora, 'criado');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_log_perfil_criado
  AFTER INSERT ON public.mao_obra_perfis
  FOR EACH ROW
  EXECUTE FUNCTION public.log_perfil_criado();

-- Trigger para registrar histórico ao atualizar perfil
CREATE OR REPLACE FUNCTION public.log_perfil_alterado()
RETURNS TRIGGER AS $$
BEGIN
  -- Registrar alteração de valor_hora
  IF OLD.valor_hora != NEW.valor_hora THEN
    INSERT INTO public.mao_obra_perfis_historico (perfil_id, user_id, valor_antigo, valor_novo, acao)
    VALUES (NEW.id, NEW.user_id, OLD.valor_hora, NEW.valor_hora, 'alterado');
  END IF;
  
  -- Registrar desativação
  IF OLD.ativo = true AND NEW.ativo = false THEN
    INSERT INTO public.mao_obra_perfis_historico (perfil_id, user_id, valor_novo, acao)
    VALUES (NEW.id, NEW.user_id, NEW.valor_hora, 'desativado');
  END IF;
  
  -- Registrar reativação
  IF OLD.ativo = false AND NEW.ativo = true THEN
    INSERT INTO public.mao_obra_perfis_historico (perfil_id, user_id, valor_novo, acao)
    VALUES (NEW.id, NEW.user_id, NEW.valor_hora, 'reativado');
  END IF;
  
  -- Registrar definição como padrão
  IF OLD.padrao = false AND NEW.padrao = true THEN
    INSERT INTO public.mao_obra_perfis_historico (perfil_id, user_id, valor_novo, acao)
    VALUES (NEW.id, NEW.user_id, NEW.valor_hora, 'definido_padrao');
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_log_perfil_alterado
  AFTER UPDATE ON public.mao_obra_perfis
  FOR EACH ROW
  EXECUTE FUNCTION public.log_perfil_alterado();

-- RLS para mao_obra_perfis
ALTER TABLE public.mao_obra_perfis ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own perfis"
  ON public.mao_obra_perfis FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own perfis"
  ON public.mao_obra_perfis FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own perfis"
  ON public.mao_obra_perfis FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own perfis"
  ON public.mao_obra_perfis FOR DELETE
  USING (auth.uid() = user_id);

-- RLS para mao_obra_perfis_historico
ALTER TABLE public.mao_obra_perfis_historico ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own historico"
  ON public.mao_obra_perfis_historico FOR SELECT
  USING (auth.uid() = user_id);