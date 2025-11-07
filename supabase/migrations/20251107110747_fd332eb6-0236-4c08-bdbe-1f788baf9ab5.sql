-- ============================================================
-- BANK RECONCILIATION SYSTEM - COMPLETE MIGRATION
-- ============================================================

-- 1. Create bank_imports table
CREATE TABLE IF NOT EXISTS public.bank_imports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  filename TEXT NOT NULL,
  uploaded_by UUID NOT NULL REFERENCES auth.users(id),
  rows_count INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'uploaded' CHECK (status IN ('uploaded', 'processing', 'completed', 'error')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_bank_imports_usuario_id ON public.bank_imports(usuario_id);
CREATE INDEX idx_bank_imports_status ON public.bank_imports(status);

-- 2. Create bank_raw_entries table
CREATE TABLE IF NOT EXISTS public.bank_raw_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  import_id UUID NOT NULL REFERENCES public.bank_imports(id) ON DELETE CASCADE,
  line_number INTEGER NOT NULL,
  raw_data JSONB NOT NULL,
  hash_key TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_bank_raw_entries_import_id ON public.bank_raw_entries(import_id);
CREATE INDEX idx_bank_raw_entries_hash_key ON public.bank_raw_entries(hash_key);

-- 3. Create bank_entries table
CREATE TABLE IF NOT EXISTS public.bank_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  import_id UUID NOT NULL REFERENCES public.bank_imports(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  amount NUMERIC(15,2) NOT NULL,
  kind TEXT NOT NULL CHECK (kind IN ('credit', 'debit')),
  description TEXT NOT NULL,
  fit_id TEXT,
  status TEXT NOT NULL DEFAULT 'imported' CHECK (status IN ('imported', 'suggested_match', 'matched', 'reconciled', 'ignored')),
  hash_key TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_bank_entries_import_id ON public.bank_entries(import_id);
CREATE INDEX idx_bank_entries_date ON public.bank_entries(date);
CREATE INDEX idx_bank_entries_amount ON public.bank_entries(amount);
CREATE INDEX idx_bank_entries_status ON public.bank_entries(status);
CREATE INDEX idx_bank_entries_hash_key ON public.bank_entries(hash_key);
CREATE INDEX idx_bank_entries_date_amount ON public.bank_entries(date, amount);

-- 4. Create bank_matches table
CREATE TABLE IF NOT EXISTS public.bank_matches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bank_entry_id UUID NOT NULL REFERENCES public.bank_entries(id) ON DELETE CASCADE,
  transaction_id UUID NOT NULL,
  transaction_type TEXT NOT NULL CHECK (transaction_type IN ('contas_receber', 'contas_pagar')),
  score NUMERIC(5,4) NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'suggested' CHECK (status IN ('suggested', 'confirmed', 'rejected')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  confirmed_by UUID REFERENCES auth.users(id),
  confirmed_at TIMESTAMPTZ
);

CREATE INDEX idx_bank_matches_bank_entry_id ON public.bank_matches(bank_entry_id);
CREATE INDEX idx_bank_matches_transaction_id ON public.bank_matches(transaction_id);
CREATE INDEX idx_bank_matches_status ON public.bank_matches(status);

-- 5. Create bank_rules table
CREATE TABLE IF NOT EXISTS public.bank_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  bank_name TEXT NOT NULL,
  csv_delimiter TEXT NOT NULL DEFAULT ',',
  decimal_comma BOOLEAN NOT NULL DEFAULT false,
  date_format TEXT NOT NULL DEFAULT 'DD/MM/YYYY',
  column_map JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_bank_rules_usuario_id ON public.bank_rules(usuario_id);

-- ============================================================
-- RLS POLICIES
-- ============================================================

ALTER TABLE public.bank_imports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bank_raw_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bank_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bank_matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bank_rules ENABLE ROW LEVEL SECURITY;

-- bank_imports policies
CREATE POLICY "Users can view own bank_imports"
  ON public.bank_imports FOR SELECT
  USING (auth.uid() = usuario_id);

CREATE POLICY "Users can insert own bank_imports"
  ON public.bank_imports FOR INSERT
  WITH CHECK (auth.uid() = usuario_id);

CREATE POLICY "Users can update own bank_imports"
  ON public.bank_imports FOR UPDATE
  USING (auth.uid() = usuario_id);

CREATE POLICY "Users can delete own bank_imports"
  ON public.bank_imports FOR DELETE
  USING (auth.uid() = usuario_id);

-- bank_raw_entries policies
CREATE POLICY "Users can view own bank_raw_entries"
  ON public.bank_raw_entries FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.bank_imports
    WHERE bank_imports.id = bank_raw_entries.import_id
    AND bank_imports.usuario_id = auth.uid()
  ));

CREATE POLICY "Users can insert own bank_raw_entries"
  ON public.bank_raw_entries FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.bank_imports
    WHERE bank_imports.id = bank_raw_entries.import_id
    AND bank_imports.usuario_id = auth.uid()
  ));

-- bank_entries policies
CREATE POLICY "Users can view own bank_entries"
  ON public.bank_entries FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.bank_imports
    WHERE bank_imports.id = bank_entries.import_id
    AND bank_imports.usuario_id = auth.uid()
  ));

CREATE POLICY "Users can insert own bank_entries"
  ON public.bank_entries FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.bank_imports
    WHERE bank_imports.id = bank_entries.import_id
    AND bank_imports.usuario_id = auth.uid()
  ));

CREATE POLICY "Users can update own bank_entries"
  ON public.bank_entries FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM public.bank_imports
    WHERE bank_imports.id = bank_entries.import_id
    AND bank_imports.usuario_id = auth.uid()
  ));

-- bank_matches policies
CREATE POLICY "Users can view own bank_matches"
  ON public.bank_matches FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.bank_entries
    JOIN public.bank_imports ON bank_imports.id = bank_entries.import_id
    WHERE bank_entries.id = bank_matches.bank_entry_id
    AND bank_imports.usuario_id = auth.uid()
  ));

CREATE POLICY "Users can insert own bank_matches"
  ON public.bank_matches FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.bank_entries
    JOIN public.bank_imports ON bank_imports.id = bank_entries.import_id
    WHERE bank_entries.id = bank_matches.bank_entry_id
    AND bank_imports.usuario_id = auth.uid()
  ));

CREATE POLICY "Users can update own bank_matches"
  ON public.bank_matches FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM public.bank_entries
    JOIN public.bank_imports ON bank_imports.id = bank_entries.import_id
    WHERE bank_entries.id = bank_matches.bank_entry_id
    AND bank_imports.usuario_id = auth.uid()
  ));

-- bank_rules policies
CREATE POLICY "Users can view own bank_rules"
  ON public.bank_rules FOR SELECT
  USING (auth.uid() = usuario_id);

CREATE POLICY "Users can insert own bank_rules"
  ON public.bank_rules FOR INSERT
  WITH CHECK (auth.uid() = usuario_id);

CREATE POLICY "Users can update own bank_rules"
  ON public.bank_rules FOR UPDATE
  USING (auth.uid() = usuario_id);

CREATE POLICY "Users can delete own bank_rules"
  ON public.bank_rules FOR DELETE
  USING (auth.uid() = usuario_id);

-- ============================================================
-- UTILITY FUNCTIONS
-- ============================================================

-- Normalize decimal values
CREATE OR REPLACE FUNCTION fn_normalize_decimal(value_text TEXT, decimal_comma BOOLEAN)
RETURNS NUMERIC AS $$
BEGIN
  IF decimal_comma THEN
    value_text := REPLACE(value_text, '.', '');
    value_text := REPLACE(value_text, ',', '.');
  ELSE
    value_text := REPLACE(value_text, ',', '');
  END IF;
  RETURN value_text::NUMERIC;
EXCEPTION WHEN OTHERS THEN
  RETURN 0;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Parse date from text
CREATE OR REPLACE FUNCTION fn_parse_date(date_text TEXT, format_text TEXT)
RETURNS DATE AS $$
BEGIN
  RETURN to_date(date_text, format_text);
EXCEPTION WHEN OTHERS THEN
  RETURN NULL;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Create hash from text
CREATE OR REPLACE FUNCTION fn_make_hash(input_text TEXT)
RETURNS TEXT AS $$
BEGIN
  RETURN encode(digest(input_text, 'sha256'), 'hex');
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Create bank entry hash
CREATE OR REPLACE FUNCTION fn_bank_entry_hash(entry_date DATE, entry_amount NUMERIC, entry_description TEXT)
RETURNS TEXT AS $$
BEGIN
  RETURN fn_make_hash(
    entry_date::TEXT || '|' || 
    entry_amount::TEXT || '|' || 
    LOWER(TRIM(entry_description))
  );
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- ============================================================
-- INGEST CSV FUNCTION
-- ============================================================

CREATE OR REPLACE FUNCTION fn_ingest_bank_csv(p_import_id UUID, p_rules_id UUID)
RETURNS TABLE(inserted_count INT, duplicate_count INT) AS $$
DECLARE
  v_rules RECORD;
  v_raw RECORD;
  v_date DATE;
  v_amount NUMERIC;
  v_kind TEXT;
  v_description TEXT;
  v_hash TEXT;
  v_inserted INT := 0;
  v_duplicates INT := 0;
  v_column_map JSONB;
BEGIN
  -- Get rules
  SELECT * INTO v_rules FROM bank_rules WHERE id = p_rules_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Rules not found';
  END IF;
  
  v_column_map := v_rules.column_map;
  
  -- Process each raw entry
  FOR v_raw IN 
    SELECT * FROM bank_raw_entries WHERE import_id = p_import_id
  LOOP
    BEGIN
      -- Extract and parse date
      v_date := fn_parse_date(
        v_raw.raw_data->>(v_column_map->>'date'),
        v_rules.date_format
      );
      
      -- Extract and normalize amount
      v_amount := fn_normalize_decimal(
        v_raw.raw_data->>(v_column_map->>'amount'),
        v_rules.decimal_comma
      );
      
      -- Extract description
      v_description := v_raw.raw_data->>(v_column_map->>'description');
      
      -- Determine kind (credit/debit)
      IF v_column_map ? 'credit_debit' THEN
        v_kind := CASE 
          WHEN v_raw.raw_data->>(v_column_map->>'credit_debit') ILIKE '%credit%' THEN 'credit'
          WHEN v_raw.raw_data->>(v_column_map->>'credit_debit') ILIKE '%debit%' THEN 'debit'
          ELSE CASE WHEN v_amount >= 0 THEN 'credit' ELSE 'debit' END
        END;
      ELSE
        v_kind := CASE WHEN v_amount >= 0 THEN 'credit' ELSE 'debit' END;
      END IF;
      
      v_amount := ABS(v_amount);
      
      -- Generate hash
      v_hash := fn_bank_entry_hash(v_date, v_amount, v_description);
      
      -- Insert if not duplicate
      INSERT INTO bank_entries (import_id, date, amount, kind, description, hash_key, status)
      VALUES (p_import_id, v_date, v_amount, v_kind, v_description, v_hash, 'imported')
      ON CONFLICT (hash_key) DO NOTHING;
      
      IF FOUND THEN
        v_inserted := v_inserted + 1;
      ELSE
        v_duplicates := v_duplicates + 1;
      END IF;
      
    EXCEPTION WHEN OTHERS THEN
      -- Skip invalid entries
      CONTINUE;
    END;
  END LOOP;
  
  RETURN QUERY SELECT v_inserted, v_duplicates;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- SUGGEST MATCHES FUNCTION
-- ============================================================

CREATE OR REPLACE FUNCTION fn_suggest_matches(
  p_import_id UUID,
  p_from_date DATE DEFAULT NULL,
  p_to_date DATE DEFAULT NULL
)
RETURNS TABLE(suggested_count INT) AS $$
DECLARE
  v_entry RECORD;
  v_match RECORD;
  v_best_score NUMERIC;
  v_best_match RECORD;
  v_suggested INT := 0;
BEGIN
  -- Enable pg_trgm if not already
  CREATE EXTENSION IF NOT EXISTS pg_trgm;
  
  FOR v_entry IN 
    SELECT * FROM bank_entries 
    WHERE import_id = p_import_id 
    AND status = 'imported'
    AND (p_from_date IS NULL OR date >= p_from_date)
    AND (p_to_date IS NULL OR date <= p_to_date)
  LOOP
    v_best_score := 0;
    v_best_match := NULL;
    
    -- Search in contas_receber
    FOR v_match IN
      SELECT 
        'contas_receber' as tx_type,
        cr.id as tx_id,
        crp.valor_parcela as amount,
        crp.data_vencimento as tx_date,
        c.nome as party,
        cr.descricao as notes,
        CASE 
          WHEN ABS(v_entry.amount - crp.valor_parcela) < 0.01 
          AND crp.data_vencimento BETWEEN (v_entry.date - 2) AND (v_entry.date + 2)
          THEN 0.9
          ELSE 0.7 * similarity(v_entry.description, COALESCE(c.nome, '') || ' ' || COALESCE(cr.descricao, ''))
        END as score
      FROM contas_receber cr
      JOIN contas_receber_parcelas crp ON crp.conta_receber_id = cr.id
      LEFT JOIN clientes c ON c.id = cr.cliente_id
      WHERE crp.status IN ('aberto', 'vencido')
      AND v_entry.kind = 'credit'
      AND ABS(crp.valor_parcela - v_entry.amount) < v_entry.amount * 0.1
    LOOP
      IF v_match.score > v_best_score THEN
        v_best_score := v_match.score;
        v_best_match := v_match;
      END IF;
    END LOOP;
    
    -- Search in contas_pagar
    FOR v_match IN
      SELECT 
        'contas_pagar' as tx_type,
        cp.id as tx_id,
        cpp.valor_parcela as amount,
        cpp.data_vencimento as tx_date,
        f.nome as party,
        cp.descricao as notes,
        CASE 
          WHEN ABS(v_entry.amount - cpp.valor_parcela) < 0.01 
          AND cpp.data_vencimento BETWEEN (v_entry.date - 2) AND (v_entry.date + 2)
          THEN 0.9
          ELSE 0.7 * similarity(v_entry.description, COALESCE(f.nome, '') || ' ' || COALESCE(cp.descricao, ''))
        END as score
      FROM contas_pagar cp
      JOIN contas_pagar_parcelas cpp ON cpp.conta_pagar_id = cp.id
      LEFT JOIN fornecedores f ON f.id = cp.fornecedor_id
      WHERE cpp.status IN ('pendente', 'vencida')
      AND v_entry.kind = 'debit'
      AND ABS(cpp.valor_parcela - v_entry.amount) < v_entry.amount * 0.1
    LOOP
      IF v_match.score > v_best_score THEN
        v_best_score := v_match.score;
        v_best_match := v_match;
      END IF;
    END LOOP;
    
    -- Insert best match if score > 0.6
    IF v_best_match IS NOT NULL AND v_best_score > 0.6 THEN
      INSERT INTO bank_matches (bank_entry_id, transaction_id, transaction_type, score, status)
      VALUES (v_entry.id, v_best_match.tx_id, v_best_match.tx_type, v_best_score, 'suggested');
      
      UPDATE bank_entries SET status = 'suggested_match' WHERE id = v_entry.id;
      v_suggested := v_suggested + 1;
    END IF;
  END LOOP;
  
  RETURN QUERY SELECT v_suggested;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- CONFIRM/REJECT/RECONCILE FUNCTIONS
-- ============================================================

CREATE OR REPLACE FUNCTION fn_confirm_match(
  p_bank_entry_id UUID,
  p_transaction_type TEXT,
  p_transaction_id UUID,
  p_confirmed_by UUID
)
RETURNS VOID AS $$
BEGIN
  -- Update or insert match
  INSERT INTO bank_matches (bank_entry_id, transaction_id, transaction_type, score, status, confirmed_by, confirmed_at)
  VALUES (p_bank_entry_id, p_transaction_id, p_transaction_type, 1.0, 'confirmed', p_confirmed_by, now())
  ON CONFLICT (bank_entry_id, transaction_id) 
  DO UPDATE SET status = 'confirmed', confirmed_by = p_confirmed_by, confirmed_at = now();
  
  -- Update entry status
  UPDATE bank_entries SET status = 'matched' WHERE id = p_bank_entry_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION fn_reject_match(p_bank_entry_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE bank_matches SET status = 'rejected' WHERE bank_entry_id = p_bank_entry_id;
  UPDATE bank_entries SET status = 'imported' WHERE id = p_bank_entry_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION fn_split_match(
  p_bank_entry_id UUID,
  p_transactions JSONB
)
RETURNS VOID AS $$
DECLARE
  v_tx JSONB;
  v_total NUMERIC := 0;
  v_entry_amount NUMERIC;
BEGIN
  SELECT amount INTO v_entry_amount FROM bank_entries WHERE id = p_bank_entry_id;
  
  -- Validate total
  FOR v_tx IN SELECT * FROM jsonb_array_elements(p_transactions)
  LOOP
    v_total := v_total + (v_tx->>'amount')::NUMERIC;
  END LOOP;
  
  IF ABS(v_total - v_entry_amount) > 0.01 THEN
    RAISE EXCEPTION 'Total amount does not match entry amount';
  END IF;
  
  -- Create matches
  FOR v_tx IN SELECT * FROM jsonb_array_elements(p_transactions)
  LOOP
    INSERT INTO bank_matches (bank_entry_id, transaction_id, transaction_type, score, status)
    VALUES (p_bank_entry_id, (v_tx->>'id')::UUID, v_tx->>'type', 1.0, 'confirmed');
  END LOOP;
  
  UPDATE bank_entries SET status = 'matched' WHERE id = p_bank_entry_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION fn_reconcile_import(
  p_import_id UUID,
  p_reconciled_by UUID
)
RETURNS TABLE(reconciled_count INT) AS $$
DECLARE
  v_count INT := 0;
BEGIN
  -- Mark entries as reconciled
  UPDATE bank_entries 
  SET status = 'reconciled' 
  WHERE import_id = p_import_id 
  AND status = 'matched'
  RETURNING 1 INTO v_count;
  
  GET DIAGNOSTICS v_count = ROW_COUNT;
  
  -- Update import status
  UPDATE bank_imports SET status = 'completed' WHERE id = p_import_id;
  
  RETURN QUERY SELECT v_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- VIEW FOR DIFFERENCES
-- ============================================================

CREATE OR REPLACE VIEW vw_bank_differences AS
SELECT 
  be.id,
  be.import_id,
  be.date,
  be.amount,
  be.kind,
  be.description,
  be.status,
  bi.usuario_id
FROM bank_entries be
JOIN bank_imports bi ON bi.id = be.import_id
WHERE be.status NOT IN ('matched', 'reconciled')
ORDER BY be.date DESC;