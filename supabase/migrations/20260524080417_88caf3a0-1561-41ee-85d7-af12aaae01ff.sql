-- =========================================================
-- FECHAMENTO DE MÊS
-- =========================================================

-- Tabela principal de fechamentos
CREATE TABLE public.fechamentos_mensais (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  owner_group_id UUID NOT NULL,
  mes_referencia DATE NOT NULL, -- sempre dia 1 do mês
  status TEXT NOT NULL DEFAULT 'aberto' CHECK (status IN ('aberto','fechado')),
  faturamento NUMERIC NOT NULL DEFAULT 0,
  custos NUMERIC NOT NULL DEFAULT 0,
  margem_seguranca NUMERIC NOT NULL DEFAULT 0,
  pro_labore_saudavel NUMERIC NOT NULL DEFAULT 0,
  retiradas NUMERIC NOT NULL DEFAULT 0,
  saldo_restante NUMERIC NOT NULL DEFAULT 0,
  snapshot JSONB NOT NULL DEFAULT '{}'::jsonb,
  observacoes TEXT,
  fechado_em TIMESTAMPTZ,
  fechado_por UUID,
  reaberto_em TIMESTAMPTZ,
  reaberto_por UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX uq_fechamentos_grupo_mes
  ON public.fechamentos_mensais (owner_group_id, mes_referencia);

CREATE INDEX idx_fechamentos_status
  ON public.fechamentos_mensais (owner_group_id, status, mes_referencia);

ALTER TABLE public.fechamentos_mensais ENABLE ROW LEVEL SECURITY;

-- Função auxiliar: usuário pertence ao grupo?
CREATE OR REPLACE FUNCTION public.user_in_group(_group_id UUID, _user_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = _user_id AND owner_group_id = _group_id
  );
$$;

CREATE POLICY "Grupo vê fechamentos"
  ON public.fechamentos_mensais FOR SELECT
  USING (public.user_in_group(owner_group_id, auth.uid()));

CREATE POLICY "Grupo insere fechamentos"
  ON public.fechamentos_mensais FOR INSERT
  WITH CHECK (public.user_in_group(owner_group_id, auth.uid()));

CREATE POLICY "Grupo atualiza fechamentos"
  ON public.fechamentos_mensais FOR UPDATE
  USING (public.user_in_group(owner_group_id, auth.uid()))
  WITH CHECK (public.user_in_group(owner_group_id, auth.uid()));

CREATE POLICY "Grupo deleta fechamentos"
  ON public.fechamentos_mensais FOR DELETE
  USING (public.user_in_group(owner_group_id, auth.uid()));

-- Trigger updated_at
CREATE TRIGGER trg_fechamentos_updated_at
  BEFORE UPDATE ON public.fechamentos_mensais
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =========================================================
-- CHECKLIST
-- =========================================================
CREATE TABLE public.fechamento_checklist_itens (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  fechamento_id UUID NOT NULL REFERENCES public.fechamentos_mensais(id) ON DELETE CASCADE,
  ordem INTEGER NOT NULL DEFAULT 0,
  titulo TEXT NOT NULL,
  descricao TEXT,
  concluido BOOLEAN NOT NULL DEFAULT false,
  concluido_em TIMESTAMPTZ,
  concluido_por UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_checklist_fechamento ON public.fechamento_checklist_itens (fechamento_id, ordem);

ALTER TABLE public.fechamento_checklist_itens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Grupo vê checklist"
  ON public.fechamento_checklist_itens FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.fechamentos_mensais f
    WHERE f.id = fechamento_id
      AND public.user_in_group(f.owner_group_id, auth.uid())
  ));

CREATE POLICY "Grupo insere checklist"
  ON public.fechamento_checklist_itens FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.fechamentos_mensais f
    WHERE f.id = fechamento_id
      AND public.user_in_group(f.owner_group_id, auth.uid())
  ));

CREATE POLICY "Grupo atualiza checklist"
  ON public.fechamento_checklist_itens FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM public.fechamentos_mensais f
    WHERE f.id = fechamento_id
      AND public.user_in_group(f.owner_group_id, auth.uid())
  ));

CREATE POLICY "Grupo deleta checklist"
  ON public.fechamento_checklist_itens FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM public.fechamentos_mensais f
    WHERE f.id = fechamento_id
      AND public.user_in_group(f.owner_group_id, auth.uid())
  ));

CREATE TRIGGER trg_checklist_updated_at
  BEFORE UPDATE ON public.fechamento_checklist_itens
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =========================================================
-- TRAVA: bloquear lançamentos em meses fechados
-- =========================================================

-- Verifica se uma data cai em mês fechado para o grupo
CREATE OR REPLACE FUNCTION public.is_mes_fechado(_group_id UUID, _data DATE)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.fechamentos_mensais
    WHERE owner_group_id = _group_id
      AND status = 'fechado'
      AND mes_referencia = date_trunc('month', _data)::date
  );
$$;

-- Helper para obter owner_group_id do usuário atual
CREATE OR REPLACE FUNCTION public.current_user_group()
RETURNS UUID
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT owner_group_id FROM public.profiles WHERE id = auth.uid();
$$;

-- Trigger genérico para contas_receber (data_vencimento ou data_recebimento)
CREATE OR REPLACE FUNCTION public.bloquear_se_mes_fechado_receber()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _grupo UUID;
  _data DATE;
BEGIN
  _grupo := COALESCE(NEW.owner_group_id, OLD.owner_group_id);
  _data := COALESCE(NEW.data_vencimento, OLD.data_vencimento);
  IF _grupo IS NOT NULL AND _data IS NOT NULL AND public.is_mes_fechado(_grupo, _data) THEN
    RAISE EXCEPTION 'Mês de % está fechado. Reabra o fechamento para alterar este lançamento.', to_char(_data, 'MM/YYYY')
      USING ERRCODE = 'P0001';
  END IF;
  -- Também validar data_recebimento se houver
  IF NEW.data_recebimento IS NOT NULL AND _grupo IS NOT NULL
     AND public.is_mes_fechado(_grupo, NEW.data_recebimento) THEN
    RAISE EXCEPTION 'Mês de % está fechado. Reabra o fechamento para alterar este lançamento.', to_char(NEW.data_recebimento, 'MM/YYYY')
      USING ERRCODE = 'P0001';
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$;

CREATE TRIGGER trg_bloqueio_contas_receber
  BEFORE INSERT OR UPDATE OR DELETE ON public.contas_receber
  FOR EACH ROW EXECUTE FUNCTION public.bloquear_se_mes_fechado_receber();

-- contas_pagar
CREATE OR REPLACE FUNCTION public.bloquear_se_mes_fechado_pagar()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _grupo UUID;
  _data DATE;
BEGIN
  _grupo := COALESCE(NEW.owner_group_id, OLD.owner_group_id);
  _data := COALESCE(NEW.data_vencimento, OLD.data_vencimento);
  IF _grupo IS NOT NULL AND _data IS NOT NULL AND public.is_mes_fechado(_grupo, _data) THEN
    RAISE EXCEPTION 'Mês de % está fechado. Reabra o fechamento para alterar este lançamento.', to_char(_data, 'MM/YYYY')
      USING ERRCODE = 'P0001';
  END IF;
  IF NEW.data_pagamento IS NOT NULL AND _grupo IS NOT NULL
     AND public.is_mes_fechado(_grupo, NEW.data_pagamento) THEN
    RAISE EXCEPTION 'Mês de % está fechado. Reabra o fechamento para alterar este lançamento.', to_char(NEW.data_pagamento, 'MM/YYYY')
      USING ERRCODE = 'P0001';
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$;

CREATE TRIGGER trg_bloqueio_contas_pagar
  BEFORE INSERT OR UPDATE OR DELETE ON public.contas_pagar
  FOR EACH ROW EXECUTE FUNCTION public.bloquear_se_mes_fechado_pagar();

-- Parcelas (descobre grupo via FK)
CREATE OR REPLACE FUNCTION public.bloquear_parcela_receber()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _grupo UUID;
  _data DATE;
BEGIN
  SELECT cr.owner_group_id INTO _grupo
  FROM public.contas_receber cr
  WHERE cr.id = COALESCE(NEW.conta_receber_id, OLD.conta_receber_id);
  _data := COALESCE(NEW.data_vencimento, OLD.data_vencimento);
  IF _grupo IS NOT NULL AND _data IS NOT NULL AND public.is_mes_fechado(_grupo, _data) THEN
    RAISE EXCEPTION 'Mês de % está fechado. Reabra o fechamento para alterar esta parcela.', to_char(_data, 'MM/YYYY')
      USING ERRCODE = 'P0001';
  END IF;
  IF NEW.data_pagamento IS NOT NULL AND _grupo IS NOT NULL
     AND public.is_mes_fechado(_grupo, NEW.data_pagamento) THEN
    RAISE EXCEPTION 'Mês de % está fechado. Reabra o fechamento para alterar esta parcela.', to_char(NEW.data_pagamento, 'MM/YYYY')
      USING ERRCODE = 'P0001';
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$;

CREATE TRIGGER trg_bloqueio_parcelas_receber
  BEFORE INSERT OR UPDATE OR DELETE ON public.contas_receber_parcelas
  FOR EACH ROW EXECUTE FUNCTION public.bloquear_parcela_receber();

CREATE OR REPLACE FUNCTION public.bloquear_parcela_pagar()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _grupo UUID;
  _data DATE;
BEGIN
  SELECT cp.owner_group_id INTO _grupo
  FROM public.contas_pagar cp
  WHERE cp.id = COALESCE(NEW.conta_pagar_id, OLD.conta_pagar_id);
  _data := COALESCE(NEW.data_vencimento, OLD.data_vencimento);
  IF _grupo IS NOT NULL AND _data IS NOT NULL AND public.is_mes_fechado(_grupo, _data) THEN
    RAISE EXCEPTION 'Mês de % está fechado. Reabra o fechamento para alterar esta parcela.', to_char(_data, 'MM/YYYY')
      USING ERRCODE = 'P0001';
  END IF;
  IF NEW.data_pagamento IS NOT NULL AND _grupo IS NOT NULL
     AND public.is_mes_fechado(_grupo, NEW.data_pagamento) THEN
    RAISE EXCEPTION 'Mês de % está fechado. Reabra o fechamento para alterar esta parcela.', to_char(NEW.data_pagamento, 'MM/YYYY')
      USING ERRCODE = 'P0001';
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$;

CREATE TRIGGER trg_bloqueio_parcelas_pagar
  BEFORE INSERT OR UPDATE OR DELETE ON public.contas_pagar_parcelas
  FOR EACH ROW EXECUTE FUNCTION public.bloquear_parcela_pagar();

-- Pagamentos (usa data_pagamento)
CREATE OR REPLACE FUNCTION public.bloquear_pagamento_receber()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _grupo UUID;
  _data DATE;
BEGIN
  SELECT cr.owner_group_id INTO _grupo
  FROM public.contas_receber_parcelas par
  JOIN public.contas_receber cr ON cr.id = par.conta_receber_id
  WHERE par.id = COALESCE(NEW.parcela_id, OLD.parcela_id);
  _data := COALESCE(NEW.data_pagamento, OLD.data_pagamento);
  IF _grupo IS NOT NULL AND _data IS NOT NULL AND public.is_mes_fechado(_grupo, _data) THEN
    RAISE EXCEPTION 'Mês de % está fechado. Reabra o fechamento para alterar este pagamento.', to_char(_data, 'MM/YYYY')
      USING ERRCODE = 'P0001';
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$;

CREATE TRIGGER trg_bloqueio_pagamentos_receber
  BEFORE INSERT OR UPDATE OR DELETE ON public.contas_receber_pagamentos
  FOR EACH ROW EXECUTE FUNCTION public.bloquear_pagamento_receber();

CREATE OR REPLACE FUNCTION public.bloquear_pagamento_pagar()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _grupo UUID;
  _data DATE;
BEGIN
  SELECT cp.owner_group_id INTO _grupo
  FROM public.contas_pagar_parcelas par
  JOIN public.contas_pagar cp ON cp.id = par.conta_pagar_id
  WHERE par.id = COALESCE(NEW.parcela_id, OLD.parcela_id);
  _data := COALESCE(NEW.data_pagamento, OLD.data_pagamento);
  IF _grupo IS NOT NULL AND _data IS NOT NULL AND public.is_mes_fechado(_grupo, _data) THEN
    RAISE EXCEPTION 'Mês de % está fechado. Reabra o fechamento para alterar este pagamento.', to_char(_data, 'MM/YYYY')
      USING ERRCODE = 'P0001';
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$;

CREATE TRIGGER trg_bloqueio_pagamentos_pagar
  BEFORE INSERT OR UPDATE OR DELETE ON public.contas_pagar_pagamentos
  FOR EACH ROW EXECUTE FUNCTION public.bloquear_pagamento_pagar();