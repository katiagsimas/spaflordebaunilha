-- Criar tabela sub_receitas
CREATE TABLE IF NOT EXISTS public.sub_receitas (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  usuario_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  nome VARCHAR NOT NULL,
  tempo_preparo NUMERIC NOT NULL,
  unidade_tempo VARCHAR NOT NULL CHECK (unidade_tempo IN ('minutos', 'horas')),
  rendimento NUMERIC NOT NULL,
  unidade_rendimento_id UUID NOT NULL,
  modo_preparo TEXT,
  custo_total NUMERIC NOT NULL DEFAULT 0,
  imagem_1_url TEXT,
  imagem_2_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- RLS para sub_receitas
ALTER TABLE public.sub_receitas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own sub_receitas" 
ON public.sub_receitas FOR SELECT 
USING (auth.uid() = usuario_id);

CREATE POLICY "Users can insert own sub_receitas" 
ON public.sub_receitas FOR INSERT 
WITH CHECK (auth.uid() = usuario_id);

CREATE POLICY "Users can update own sub_receitas" 
ON public.sub_receitas FOR UPDATE 
USING (auth.uid() = usuario_id);

CREATE POLICY "Users can delete own sub_receitas" 
ON public.sub_receitas FOR DELETE 
USING (auth.uid() = usuario_id);

-- Tabela de ingredientes das sub-receitas
CREATE TABLE IF NOT EXISTS public.sub_receitas_ingredientes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  sub_receita_id UUID NOT NULL REFERENCES public.sub_receitas(id) ON DELETE CASCADE,
  ingrediente_id UUID NOT NULL,
  quantidade_utilizada NUMERIC NOT NULL,
  custo_ingrediente NUMERIC NOT NULL DEFAULT 0,
  ordem INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- RLS para sub_receitas_ingredientes
ALTER TABLE public.sub_receitas_ingredientes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own sub_receitas_ingredientes" 
ON public.sub_receitas_ingredientes FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM public.sub_receitas 
  WHERE sub_receitas.id = sub_receitas_ingredientes.sub_receita_id 
  AND sub_receitas.usuario_id = auth.uid()
));

CREATE POLICY "Users can insert own sub_receitas_ingredientes" 
ON public.sub_receitas_ingredientes FOR INSERT 
WITH CHECK (EXISTS (
  SELECT 1 FROM public.sub_receitas 
  WHERE sub_receitas.id = sub_receitas_ingredientes.sub_receita_id 
  AND sub_receitas.usuario_id = auth.uid()
));

CREATE POLICY "Users can update own sub_receitas_ingredientes" 
ON public.sub_receitas_ingredientes FOR UPDATE 
USING (EXISTS (
  SELECT 1 FROM public.sub_receitas 
  WHERE sub_receitas.id = sub_receitas_ingredientes.sub_receita_id 
  AND sub_receitas.usuario_id = auth.uid()
));

CREATE POLICY "Users can delete own sub_receitas_ingredientes" 
ON public.sub_receitas_ingredientes FOR DELETE 
USING (EXISTS (
  SELECT 1 FROM public.sub_receitas 
  WHERE sub_receitas.id = sub_receitas_ingredientes.sub_receita_id 
  AND sub_receitas.usuario_id = auth.uid()
));

-- Trigger para recalcular custo da sub-receita
CREATE OR REPLACE FUNCTION calcular_custo_sub_receita(receita_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  total_custo NUMERIC;
BEGIN
  SELECT COALESCE(SUM(custo_ingrediente), 0)
  INTO total_custo
  FROM sub_receitas_ingredientes
  WHERE sub_receita_id = receita_id;
  
  UPDATE sub_receitas
  SET custo_total = total_custo
  WHERE id = receita_id;
END;
$$;

CREATE OR REPLACE FUNCTION trigger_recalcular_custo_sub_receita()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF (TG_OP = 'DELETE') THEN
    PERFORM calcular_custo_sub_receita(OLD.sub_receita_id);
    RETURN OLD;
  ELSE
    PERFORM calcular_custo_sub_receita(NEW.sub_receita_id);
    RETURN NEW;
  END IF;
END;
$$;

CREATE TRIGGER recalcular_custo_sub_receita
AFTER INSERT OR UPDATE OR DELETE ON sub_receitas_ingredientes
FOR EACH ROW EXECUTE FUNCTION trigger_recalcular_custo_sub_receita();

-- Trigger para updated_at
CREATE TRIGGER update_sub_receitas_updated_at
BEFORE UPDATE ON sub_receitas
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();