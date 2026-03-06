
-- Tabela de planos
CREATE TABLE public.planos (
  id         text PRIMARY KEY,
  nome       text NOT NULL,
  descricao  text,
  ativo      boolean DEFAULT true,
  em_breve   boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- RLS
ALTER TABLE public.planos ENABLE ROW LEVEL SECURITY;

-- Todos podem ler planos
CREATE POLICY "Anyone can view planos" ON public.planos FOR SELECT TO authenticated USING (true);

-- Inserir dados iniciais
INSERT INTO public.planos (id, nome, descricao, ativo, em_breve) VALUES
  ('base',     'Plano Base',     'Precificação e controle de pedidos — a fundação do negócio.', true,  false),
  ('negocio',  'Plano Negócio',  'Gestão financeira completa — do pedido ao caixa.',            true,  false),
  ('controle', 'Plano Controle', 'Controle de estoque e produção.',                             false, true);

-- Coluna plano_id na tabela profiles
ALTER TABLE public.profiles ADD COLUMN plano_id text REFERENCES public.planos(id) DEFAULT 'base';
