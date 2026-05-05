
-- Tabela de transferências bancárias
CREATE TABLE IF NOT EXISTS public.transferencias_bancos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_group_id uuid,
  banco_origem_id uuid NOT NULL,
  banco_destino_id uuid NOT NULL,
  valor numeric(15,2) NOT NULL CONSTRAINT valor_positivo CHECK (valor > 0),
  data_transferencia date NOT NULL DEFAULT CURRENT_DATE,
  descricao text,
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid NOT NULL,
  usuario_id uuid NOT NULL,
  CONSTRAINT origem_diferente_destino CHECK (banco_origem_id <> banco_destino_id)
);

ALTER TABLE public.transferencias_bancos ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'transferencias_bancos' AND policyname = 'Users can view own transferencias') THEN
    CREATE POLICY "Users can view own transferencias"
      ON public.transferencias_bancos FOR SELECT
      USING (auth.uid() = usuario_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'transferencias_bancos' AND policyname = 'Users can insert own transferencias') THEN
    CREATE POLICY "Users can insert own transferencias"
      ON public.transferencias_bancos FOR INSERT
      WITH CHECK (auth.uid() = usuario_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'transferencias_bancos' AND policyname = 'Users can delete own transferencias') THEN
    CREATE POLICY "Users can delete own transferencias"
      ON public.transferencias_bancos FOR DELETE
      USING (auth.uid() = usuario_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'transferencias_bancos' AND policyname = 'plan_check_transferencias_bancos') THEN
    CREATE POLICY "plan_check_transferencias_bancos"
      ON public.transferencias_bancos
      AS RESTRICTIVE
      FOR ALL
      TO authenticated
      USING (user_has_financial_access(auth.uid()))
      WITH CHECK (user_has_financial_access(auth.uid()));
  END IF;
END $$;

-- RPC para realizar transferência atômica
CREATE OR REPLACE FUNCTION public.realizar_transferencia(
  p_banco_origem_id uuid,
  p_banco_destino_id uuid,
  p_valor numeric,
  p_data_transferencia date,
  p_descricao text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_saldo_origem numeric;
  v_user_id uuid;
  v_owner_group uuid;
  v_transferencia_id uuid;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Usuário não autenticado.');
  END IF;
  IF p_banco_origem_id = p_banco_destino_id THEN
    RETURN jsonb_build_object('success', false, 'error', 'Conta de origem e destino devem ser diferentes.');
  END IF;
  IF p_valor <= 0 THEN
    RETURN jsonb_build_object('success', false, 'error', 'O valor deve ser maior que zero.');
  END IF;

  SELECT saldo_inicial, owner_group_id INTO v_saldo_origem, v_owner_group
    FROM bancos WHERE id = p_banco_origem_id AND usuario_id = v_user_id;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Banco de origem não encontrado.');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM bancos WHERE id = p_banco_destino_id AND usuario_id = v_user_id) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Banco de destino não encontrado.');
  END IF;

  IF v_saldo_origem < p_valor THEN
    RETURN jsonb_build_object('success', false, 'error',
      'Saldo insuficiente na conta de origem. Saldo disponível: R$ ' || TRIM(to_char(v_saldo_origem, '999G999G990D00')));
  END IF;

  UPDATE bancos SET saldo_inicial = saldo_inicial - p_valor, updated_at = now()
    WHERE id = p_banco_origem_id AND usuario_id = v_user_id;
  UPDATE bancos SET saldo_inicial = saldo_inicial + p_valor, updated_at = now()
    WHERE id = p_banco_destino_id AND usuario_id = v_user_id;

  INSERT INTO transferencias_bancos (
    banco_origem_id, banco_destino_id, valor, data_transferencia,
    descricao, created_by, usuario_id, owner_group_id
  ) VALUES (
    p_banco_origem_id, p_banco_destino_id, p_valor, p_data_transferencia,
    p_descricao, v_user_id, v_user_id, v_owner_group
  ) RETURNING id INTO v_transferencia_id;

  RETURN jsonb_build_object('success', true, 'transferencia_id', v_transferencia_id);
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$;
