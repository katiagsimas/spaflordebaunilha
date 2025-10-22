-- Tornar colunas antigas opcionais para evitar conflitos
ALTER TABLE contas_pagar 
ALTER COLUMN valor DROP NOT NULL,
ALTER COLUMN data_vencimento DROP NOT NULL,
ALTER COLUMN descricao DROP NOT NULL;

-- Adicionar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_contas_pagar_fornecedor ON contas_pagar(fornecedor_id);
CREATE INDEX IF NOT EXISTS idx_contas_pagar_usuario ON contas_pagar(usuario_id);
CREATE INDEX IF NOT EXISTS idx_contas_pagar_data_emissao ON contas_pagar(data_emissao);
CREATE INDEX IF NOT EXISTS idx_contas_pagar_parcelas_conta ON contas_pagar_parcelas(conta_pagar_id);
CREATE INDEX IF NOT EXISTS idx_contas_pagar_parcelas_status ON contas_pagar_parcelas(status);