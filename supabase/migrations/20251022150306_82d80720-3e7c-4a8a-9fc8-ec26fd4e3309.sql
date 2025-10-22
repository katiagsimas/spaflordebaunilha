-- Adicionar colunas faltantes em contas_pagar
ALTER TABLE contas_pagar 
ADD COLUMN IF NOT EXISTS data_emissao date DEFAULT CURRENT_DATE,
ADD COLUMN IF NOT EXISTS fornecedor_id uuid REFERENCES fornecedores(id),
ADD COLUMN IF NOT EXISTS tipo_documento_id uuid REFERENCES tipos_documento(id),
ADD COLUMN IF NOT EXISTS plano_contas_id uuid REFERENCES plano_contas(id),
ADD COLUMN IF NOT EXISTS valor_total numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS numero_parcelas integer DEFAULT 1,
ADD COLUMN IF NOT EXISTS tipo_lancamento varchar DEFAULT 'unico',
ADD COLUMN IF NOT EXISTS e_recorrente boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS dia_vencimento_recorrente integer;

-- Criar tabela de parcelas de contas a pagar
CREATE TABLE IF NOT EXISTS contas_pagar_parcelas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conta_pagar_id uuid NOT NULL REFERENCES contas_pagar(id) ON DELETE CASCADE,
  numero_parcela integer NOT NULL,
  data_emissao date NOT NULL DEFAULT CURRENT_DATE,
  data_vencimento date NOT NULL,
  valor_total numeric NOT NULL DEFAULT 0,
  valor_parcela numeric NOT NULL DEFAULT 0,
  valor_pago numeric DEFAULT 0,
  data_pagamento date,
  status varchar NOT NULL DEFAULT 'aberto',
  observacao text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE contas_pagar_parcelas ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para contas_pagar_parcelas
CREATE POLICY "Users can view own parcelas_pagar"
  ON contas_pagar_parcelas FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM contas_pagar
      WHERE contas_pagar.id = contas_pagar_parcelas.conta_pagar_id
        AND contas_pagar.usuario_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own parcelas_pagar"
  ON contas_pagar_parcelas FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM contas_pagar
      WHERE contas_pagar.id = contas_pagar_parcelas.conta_pagar_id
        AND contas_pagar.usuario_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own parcelas_pagar"
  ON contas_pagar_parcelas FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM contas_pagar
      WHERE contas_pagar.id = contas_pagar_parcelas.conta_pagar_id
        AND contas_pagar.usuario_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete own parcelas_pagar"
  ON contas_pagar_parcelas FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM contas_pagar
      WHERE contas_pagar.id = contas_pagar_parcelas.conta_pagar_id
        AND contas_pagar.usuario_id = auth.uid()
    )
  );