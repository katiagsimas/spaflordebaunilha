
-- ============================================
-- FASE 2: MIGRAÇÃO COMPLETA PARA NUVEM
-- Adiciona user_id e RLS em TODAS as tabelas
-- ============================================

-- Tabelas já têm user_id:
-- ✅ categorias_estoque
-- ✅ entradas_detalhadas
-- ✅ estoque_atual
-- ✅ movimentacoes_estoque
-- ✅ profiles

-- RLS já está habilitado em todas as tabelas existentes
-- Verificação completa: todas as tabelas críticas já estão prontas!

-- Criar tabelas faltantes para módulos que usam localStorage

-- 1. CLIENTES
CREATE TABLE IF NOT EXISTS public.clientes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome VARCHAR NOT NULL,
  cpf_cnpj VARCHAR,
  telefone VARCHAR,
  email VARCHAR,
  endereco TEXT,
  cidade VARCHAR,
  estado VARCHAR,
  cep VARCHAR,
  observacoes TEXT,
  usuario_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.clientes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own clientes" ON public.clientes FOR SELECT USING (auth.uid() = usuario_id);
CREATE POLICY "Users can insert own clientes" ON public.clientes FOR INSERT WITH CHECK (auth.uid() = usuario_id);
CREATE POLICY "Users can update own clientes" ON public.clientes FOR UPDATE USING (auth.uid() = usuario_id) WITH CHECK (auth.uid() = usuario_id);
CREATE POLICY "Users can delete own clientes" ON public.clientes FOR DELETE USING (auth.uid() = usuario_id);

CREATE INDEX IF NOT EXISTS idx_clientes_usuario_id ON public.clientes(usuario_id);

-- 2. FORNECEDORES
CREATE TABLE IF NOT EXISTS public.fornecedores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome VARCHAR NOT NULL,
  tipo VARCHAR,
  cpf_cnpj VARCHAR,
  telefone VARCHAR,
  email VARCHAR,
  contato VARCHAR,
  observacoes TEXT,
  usuario_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.fornecedores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own fornecedores" ON public.fornecedores FOR SELECT USING (auth.uid() = usuario_id);
CREATE POLICY "Users can insert own fornecedores" ON public.fornecedores FOR INSERT WITH CHECK (auth.uid() = usuario_id);
CREATE POLICY "Users can update own fornecedores" ON public.fornecedores FOR UPDATE USING (auth.uid() = usuario_id) WITH CHECK (auth.uid() = usuario_id);
CREATE POLICY "Users can delete own fornecedores" ON public.fornecedores FOR DELETE USING (auth.uid() = usuario_id);

CREATE INDEX IF NOT EXISTS idx_fornecedores_usuario_id ON public.fornecedores(usuario_id);

-- 3. CATEGORIAS
CREATE TABLE IF NOT EXISTS public.categorias (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome VARCHAR NOT NULL,
  usuario_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.categorias ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own categorias" ON public.categorias FOR SELECT USING (auth.uid() = usuario_id);
CREATE POLICY "Users can insert own categorias" ON public.categorias FOR INSERT WITH CHECK (auth.uid() = usuario_id);
CREATE POLICY "Users can update own categorias" ON public.categorias FOR UPDATE USING (auth.uid() = usuario_id) WITH CHECK (auth.uid() = usuario_id);
CREATE POLICY "Users can delete own categorias" ON public.categorias FOR DELETE USING (auth.uid() = usuario_id);

CREATE INDEX IF NOT EXISTS idx_categorias_usuario_id ON public.categorias(usuario_id);

-- 4. UNIDADES DE MEDIDA
CREATE TABLE IF NOT EXISTS public.unidades_medida (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome VARCHAR NOT NULL,
  sigla VARCHAR NOT NULL,
  usuario_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.unidades_medida ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own unidades_medida" ON public.unidades_medida FOR SELECT USING (auth.uid() = usuario_id);
CREATE POLICY "Users can insert own unidades_medida" ON public.unidades_medida FOR INSERT WITH CHECK (auth.uid() = usuario_id);
CREATE POLICY "Users can update own unidades_medida" ON public.unidades_medida FOR UPDATE USING (auth.uid() = usuario_id) WITH CHECK (auth.uid() = usuario_id);
CREATE POLICY "Users can delete own unidades_medida" ON public.unidades_medida FOR DELETE USING (auth.uid() = usuario_id);

CREATE INDEX IF NOT EXISTS idx_unidades_medida_usuario_id ON public.unidades_medida(usuario_id);

-- 5. CUSTOS FIXOS
CREATE TABLE IF NOT EXISTS public.custos_fixos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome VARCHAR NOT NULL,
  valor NUMERIC NOT NULL,
  usuario_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.custos_fixos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own custos_fixos" ON public.custos_fixos FOR SELECT USING (auth.uid() = usuario_id);
CREATE POLICY "Users can insert own custos_fixos" ON public.custos_fixos FOR INSERT WITH CHECK (auth.uid() = usuario_id);
CREATE POLICY "Users can update own custos_fixos" ON public.custos_fixos FOR UPDATE USING (auth.uid() = usuario_id) WITH CHECK (auth.uid() = usuario_id);
CREATE POLICY "Users can delete own custos_fixos" ON public.custos_fixos FOR DELETE USING (auth.uid() = usuario_id);

CREATE INDEX IF NOT EXISTS idx_custos_fixos_usuario_id ON public.custos_fixos(usuario_id);

-- 6. EMBALAGENS
CREATE TABLE IF NOT EXISTS public.embalagens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome VARCHAR NOT NULL,
  marca VARCHAR,
  quantidade NUMERIC NOT NULL,
  unidade_medida VARCHAR NOT NULL,
  preco NUMERIC NOT NULL,
  data_atualizacao DATE NOT NULL DEFAULT CURRENT_DATE,
  usuario_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.embalagens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own embalagens" ON public.embalagens FOR SELECT USING (auth.uid() = usuario_id);
CREATE POLICY "Users can insert own embalagens" ON public.embalagens FOR INSERT WITH CHECK (auth.uid() = usuario_id);
CREATE POLICY "Users can update own embalagens" ON public.embalagens FOR UPDATE USING (auth.uid() = usuario_id) WITH CHECK (auth.uid() = usuario_id);
CREATE POLICY "Users can delete own embalagens" ON public.embalagens FOR DELETE USING (auth.uid() = usuario_id);

CREATE INDEX IF NOT EXISTS idx_embalagens_usuario_id ON public.embalagens(usuario_id);

-- 7. INGREDIENTES/INSUMOS
CREATE TABLE IF NOT EXISTS public.ingredientes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome VARCHAR NOT NULL,
  marca VARCHAR,
  quantidade NUMERIC NOT NULL,
  unidade_medida VARCHAR NOT NULL,
  preco NUMERIC NOT NULL,
  data_atualizacao DATE NOT NULL DEFAULT CURRENT_DATE,
  usuario_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.ingredientes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own ingredientes" ON public.ingredientes FOR SELECT USING (auth.uid() = usuario_id);
CREATE POLICY "Users can insert own ingredientes" ON public.ingredientes FOR INSERT WITH CHECK (auth.uid() = usuario_id);
CREATE POLICY "Users can update own ingredientes" ON public.ingredientes FOR UPDATE USING (auth.uid() = usuario_id) WITH CHECK (auth.uid() = usuario_id);
CREATE POLICY "Users can delete own ingredientes" ON public.ingredientes FOR DELETE USING (auth.uid() = usuario_id);

CREATE INDEX IF NOT EXISTS idx_ingredientes_usuario_id ON public.ingredientes(usuario_id);

-- 8. ENCOMENDAS/ORDERS
CREATE TABLE IF NOT EXISTS public.encomendas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cliente VARCHAR NOT NULL,
  data_pedido DATE NOT NULL,
  data_entrega DATE NOT NULL,
  valor NUMERIC NOT NULL,
  status VARCHAR NOT NULL DEFAULT 'pendente',
  observacoes TEXT,
  usuario_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.encomendas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own encomendas" ON public.encomendas FOR SELECT USING (auth.uid() = usuario_id);
CREATE POLICY "Users can insert own encomendas" ON public.encomendas FOR INSERT WITH CHECK (auth.uid() = usuario_id);
CREATE POLICY "Users can update own encomendas" ON public.encomendas FOR UPDATE USING (auth.uid() = usuario_id) WITH CHECK (auth.uid() = usuario_id);
CREATE POLICY "Users can delete own encomendas" ON public.encomendas FOR DELETE USING (auth.uid() = usuario_id);

CREATE INDEX IF NOT EXISTS idx_encomendas_usuario_id ON public.encomendas(usuario_id);

-- 9. CATEGORIAS FINANCEIRAS
CREATE TABLE IF NOT EXISTS public.categorias_financeiras (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome VARCHAR NOT NULL,
  tipo VARCHAR NOT NULL,
  cor VARCHAR,
  icone VARCHAR,
  usuario_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.categorias_financeiras ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own categorias_financeiras" ON public.categorias_financeiras FOR SELECT USING (auth.uid() = usuario_id);
CREATE POLICY "Users can insert own categorias_financeiras" ON public.categorias_financeiras FOR INSERT WITH CHECK (auth.uid() = usuario_id);
CREATE POLICY "Users can update own categorias_financeiras" ON public.categorias_financeiras FOR UPDATE USING (auth.uid() = usuario_id) WITH CHECK (auth.uid() = usuario_id);
CREATE POLICY "Users can delete own categorias_financeiras" ON public.categorias_financeiras FOR DELETE USING (auth.uid() = usuario_id);

CREATE INDEX IF NOT EXISTS idx_categorias_financeiras_usuario_id ON public.categorias_financeiras(usuario_id);

-- 10. CONTAS A RECEBER
CREATE TABLE IF NOT EXISTS public.contas_receber (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  descricao VARCHAR NOT NULL,
  valor NUMERIC NOT NULL,
  data_vencimento DATE NOT NULL,
  data_recebimento DATE,
  status VARCHAR NOT NULL DEFAULT 'pendente',
  categoria_id UUID REFERENCES public.categorias_financeiras(id),
  observacoes TEXT,
  usuario_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.contas_receber ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own contas_receber" ON public.contas_receber FOR SELECT USING (auth.uid() = usuario_id);
CREATE POLICY "Users can insert own contas_receber" ON public.contas_receber FOR INSERT WITH CHECK (auth.uid() = usuario_id);
CREATE POLICY "Users can update own contas_receber" ON public.contas_receber FOR UPDATE USING (auth.uid() = usuario_id) WITH CHECK (auth.uid() = usuario_id);
CREATE POLICY "Users can delete own contas_receber" ON public.contas_receber FOR DELETE USING (auth.uid() = usuario_id);

CREATE INDEX IF NOT EXISTS idx_contas_receber_usuario_id ON public.contas_receber(usuario_id);

-- 11. CONTAS A PAGAR
CREATE TABLE IF NOT EXISTS public.contas_pagar (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  descricao VARCHAR NOT NULL,
  valor NUMERIC NOT NULL,
  data_vencimento DATE NOT NULL,
  data_pagamento DATE,
  status VARCHAR NOT NULL DEFAULT 'pendente',
  categoria_id UUID REFERENCES public.categorias_financeiras(id),
  observacoes TEXT,
  usuario_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.contas_pagar ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own contas_pagar" ON public.contas_pagar FOR SELECT USING (auth.uid() = usuario_id);
CREATE POLICY "Users can insert own contas_pagar" ON public.contas_pagar FOR INSERT WITH CHECK (auth.uid() = usuario_id);
CREATE POLICY "Users can update own contas_pagar" ON public.contas_pagar FOR UPDATE USING (auth.uid() = usuario_id) WITH CHECK (auth.uid() = usuario_id);
CREATE POLICY "Users can delete own contas_pagar" ON public.contas_pagar FOR DELETE USING (auth.uid() = usuario_id);

CREATE INDEX IF NOT EXISTS idx_contas_pagar_usuario_id ON public.contas_pagar(usuario_id);

-- 12. BANCOS
CREATE TABLE IF NOT EXISTS public.bancos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome VARCHAR NOT NULL,
  tipo VARCHAR NOT NULL,
  saldo_inicial NUMERIC NOT NULL DEFAULT 0,
  usuario_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.bancos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own bancos" ON public.bancos FOR SELECT USING (auth.uid() = usuario_id);
CREATE POLICY "Users can insert own bancos" ON public.bancos FOR INSERT WITH CHECK (auth.uid() = usuario_id);
CREATE POLICY "Users can update own bancos" ON public.bancos FOR UPDATE USING (auth.uid() = usuario_id) WITH CHECK (auth.uid() = usuario_id);
CREATE POLICY "Users can delete own bancos" ON public.bancos FOR DELETE USING (auth.uid() = usuario_id);

CREATE INDEX IF NOT EXISTS idx_bancos_usuario_id ON public.bancos(usuario_id);

-- Trigger para updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Aplicar trigger em todas as tabelas
DO $$
DECLARE
    t text;
BEGIN
    FOR t IN 
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
          AND table_type = 'BASE TABLE'
          AND table_name NOT IN ('schema_migrations', 'profiles')
    LOOP
        EXECUTE format('DROP TRIGGER IF EXISTS update_%I_updated_at ON public.%I', t, t);
        EXECUTE format('CREATE TRIGGER update_%I_updated_at BEFORE UPDATE ON public.%I FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()', t, t);
    END LOOP;
END $$;
