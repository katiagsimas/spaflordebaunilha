
DO $$ BEGIN
  CREATE TYPE public.planejamento_area AS ENUM ('financeiro', 'vendas', 'marketing', 'pessoal', 'producao', 'atendimento');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.planejamento_prioridade AS ENUM ('alta', 'media', 'baixa');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.planejamento_status AS ENUM ('pendente', 'em_andamento', 'concluida', 'cancelada');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.planejamento_data_tipo AS ENUM ('comemorativa', 'pessoal', 'descanso');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.planejamento_descanso_tipo AS ENUM ('ferias', 'folga', 'pessoal');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE public.planejamento_metas (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  owner_group_id UUID NOT NULL REFERENCES public.groups(id),
  area public.planejamento_area NOT NULL,
  titulo TEXT NOT NULL,
  descricao TEXT,
  valor_alvo NUMERIC NOT NULL DEFAULT 0,
  valor_atual NUMERIC NOT NULL DEFAULT 0,
  unidade TEXT DEFAULT '',
  periodo_inicio DATE NOT NULL,
  periodo_fim DATE NOT NULL,
  status public.planejamento_status NOT NULL DEFAULT 'pendente',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.planejamento_metas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own group metas" ON public.planejamento_metas FOR SELECT TO authenticated USING (owner_group_id IN (SELECT ugr.group_id FROM public.user_group_roles ugr WHERE ugr.user_id = auth.uid()));
CREATE POLICY "Users can insert own group metas" ON public.planejamento_metas FOR INSERT TO authenticated WITH CHECK (owner_group_id IN (SELECT ugr.group_id FROM public.user_group_roles ugr WHERE ugr.user_id = auth.uid()));
CREATE POLICY "Users can update own group metas" ON public.planejamento_metas FOR UPDATE TO authenticated USING (owner_group_id IN (SELECT ugr.group_id FROM public.user_group_roles ugr WHERE ugr.user_id = auth.uid()));
CREATE POLICY "Users can delete own group metas" ON public.planejamento_metas FOR DELETE TO authenticated USING (owner_group_id IN (SELECT ugr.group_id FROM public.user_group_roles ugr WHERE ugr.user_id = auth.uid()));

CREATE TABLE public.planejamento_tarefas (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  owner_group_id UUID NOT NULL REFERENCES public.groups(id),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  area public.planejamento_area NOT NULL,
  titulo TEXT NOT NULL,
  descricao TEXT,
  prioridade public.planejamento_prioridade NOT NULL DEFAULT 'media',
  status public.planejamento_status NOT NULL DEFAULT 'pendente',
  prazo DATE,
  data_conclusao DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.planejamento_tarefas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own group tarefas" ON public.planejamento_tarefas FOR SELECT TO authenticated USING (owner_group_id IN (SELECT ugr.group_id FROM public.user_group_roles ugr WHERE ugr.user_id = auth.uid()));
CREATE POLICY "Users can insert own group tarefas" ON public.planejamento_tarefas FOR INSERT TO authenticated WITH CHECK (owner_group_id IN (SELECT ugr.group_id FROM public.user_group_roles ugr WHERE ugr.user_id = auth.uid()));
CREATE POLICY "Users can update own group tarefas" ON public.planejamento_tarefas FOR UPDATE TO authenticated USING (owner_group_id IN (SELECT ugr.group_id FROM public.user_group_roles ugr WHERE ugr.user_id = auth.uid()));
CREATE POLICY "Users can delete own group tarefas" ON public.planejamento_tarefas FOR DELETE TO authenticated USING (owner_group_id IN (SELECT ugr.group_id FROM public.user_group_roles ugr WHERE ugr.user_id = auth.uid()));

CREATE TABLE public.planejamento_datas_comemorativas (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  owner_group_id UUID REFERENCES public.groups(id),
  nome TEXT NOT NULL,
  data_referencia TEXT NOT NULL,
  tipo public.planejamento_data_tipo NOT NULL DEFAULT 'comemorativa',
  cor TEXT DEFAULT '#C6A85A',
  icone TEXT DEFAULT 'calendar',
  ativo BOOLEAN NOT NULL DEFAULT true,
  is_system BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.planejamento_datas_comemorativas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view system or own group datas" ON public.planejamento_datas_comemorativas FOR SELECT TO authenticated USING (is_system = true OR owner_group_id IN (SELECT ugr.group_id FROM public.user_group_roles ugr WHERE ugr.user_id = auth.uid()));
CREATE POLICY "Users can insert own group datas" ON public.planejamento_datas_comemorativas FOR INSERT TO authenticated WITH CHECK (owner_group_id IN (SELECT ugr.group_id FROM public.user_group_roles ugr WHERE ugr.user_id = auth.uid()));
CREATE POLICY "Users can update own group datas" ON public.planejamento_datas_comemorativas FOR UPDATE TO authenticated USING (owner_group_id IN (SELECT ugr.group_id FROM public.user_group_roles ugr WHERE ugr.user_id = auth.uid()));
CREATE POLICY "Users can delete non-system own group datas" ON public.planejamento_datas_comemorativas FOR DELETE TO authenticated USING (is_system = false AND owner_group_id IN (SELECT ugr.group_id FROM public.user_group_roles ugr WHERE ugr.user_id = auth.uid()));

CREATE TABLE public.planejamento_descanso (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  owner_group_id UUID NOT NULL REFERENCES public.groups(id),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  data_inicio DATE NOT NULL,
  data_fim DATE NOT NULL,
  tipo public.planejamento_descanso_tipo NOT NULL DEFAULT 'folga',
  observacao TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.planejamento_descanso ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own group descanso" ON public.planejamento_descanso FOR SELECT TO authenticated USING (owner_group_id IN (SELECT ugr.group_id FROM public.user_group_roles ugr WHERE ugr.user_id = auth.uid()));
CREATE POLICY "Users can insert own group descanso" ON public.planejamento_descanso FOR INSERT TO authenticated WITH CHECK (owner_group_id IN (SELECT ugr.group_id FROM public.user_group_roles ugr WHERE ugr.user_id = auth.uid()));
CREATE POLICY "Users can update own group descanso" ON public.planejamento_descanso FOR UPDATE TO authenticated USING (owner_group_id IN (SELECT ugr.group_id FROM public.user_group_roles ugr WHERE ugr.user_id = auth.uid()));
CREATE POLICY "Users can delete own group descanso" ON public.planejamento_descanso FOR DELETE TO authenticated USING (owner_group_id IN (SELECT ugr.group_id FROM public.user_group_roles ugr WHERE ugr.user_id = auth.uid()));

INSERT INTO public.planejamento_datas_comemorativas (nome, data_referencia, tipo, cor, icone, is_system, owner_group_id) VALUES
  ('Ano Novo', '01-01', 'comemorativa', '#C6A85A', 'party-popper', true, NULL),
  ('Dia da Mulher', '03-08', 'comemorativa', '#E8A0BF', 'heart', true, NULL),
  ('Páscoa (referência)', '04-20', 'comemorativa', '#C6A85A', 'egg', true, NULL),
  ('Dia das Mães', '05-11', 'comemorativa', '#E8A0BF', 'heart', true, NULL),
  ('Dia dos Namorados', '06-12', 'comemorativa', '#E8A0BF', 'heart', true, NULL),
  ('Festa Junina', '06-24', 'comemorativa', '#C6A85A', 'flame', true, NULL),
  ('Dia dos Pais', '08-10', 'comemorativa', '#BFCFB8', 'star', true, NULL),
  ('Dia das Crianças', '10-12', 'comemorativa', '#87CEEB', 'baby', true, NULL),
  ('Halloween', '10-31', 'comemorativa', '#FF8C00', 'ghost', true, NULL),
  ('Natal', '12-25', 'comemorativa', '#C41E3A', 'gift', true, NULL),
  ('Réveillon', '12-31', 'comemorativa', '#C6A85A', 'party-popper', true, NULL);

CREATE TRIGGER update_planejamento_metas_updated_at BEFORE UPDATE ON public.planejamento_metas FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_planejamento_tarefas_updated_at BEFORE UPDATE ON public.planejamento_tarefas FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_planejamento_descanso_updated_at BEFORE UPDATE ON public.planejamento_descanso FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
