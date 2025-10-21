-- Corrigir tipos de dados e adicionar foreign keys em contas_receber

-- Primeiro, limpar dados existentes para evitar problemas de conversão
TRUNCATE TABLE contas_receber_parcelas CASCADE;
TRUNCATE TABLE contas_receber CASCADE;

-- Alterar tipo_documento_id de VARCHAR para UUID
ALTER TABLE contas_receber 
ALTER COLUMN tipo_documento_id TYPE UUID USING tipo_documento_id::UUID;

-- Alterar banco_id de VARCHAR para UUID  
ALTER TABLE contas_receber
ALTER COLUMN banco_id TYPE UUID USING banco_id::UUID;

-- Adicionar foreign key para tipos_documento
ALTER TABLE contas_receber
ADD CONSTRAINT fk_contas_receber_tipo_documento 
FOREIGN KEY (tipo_documento_id) 
REFERENCES tipos_documento(id) 
ON DELETE RESTRICT;

-- Adicionar foreign key para bancos
ALTER TABLE contas_receber
ADD CONSTRAINT fk_contas_receber_banco
FOREIGN KEY (banco_id) 
REFERENCES bancos(id) 
ON DELETE RESTRICT;

-- Adicionar foreign key para plano_contas (se não existir)
ALTER TABLE contas_receber
DROP CONSTRAINT IF EXISTS fk_contas_receber_plano_conta;

ALTER TABLE contas_receber
ADD CONSTRAINT fk_contas_receber_plano_conta
FOREIGN KEY (plano_conta_id) 
REFERENCES plano_contas(id) 
ON DELETE RESTRICT;

COMMENT ON COLUMN contas_receber.tipo_documento_id IS 'Referência ao tipo de documento (UUID)';
COMMENT ON COLUMN contas_receber.banco_id IS 'Referência ao banco (UUID)';
COMMENT ON COLUMN contas_receber.plano_conta_id IS 'Referência ao plano de contas (UUID)';