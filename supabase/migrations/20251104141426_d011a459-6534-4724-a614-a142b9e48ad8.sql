-- Criar tabelas de backup para preservar dados de Tipos de Insumos
CREATE TABLE _backup_tipos_insumos AS 
SELECT * FROM tipos_insumos;

CREATE TABLE _backup_ingredientes AS 
SELECT * FROM ingredientes;

CREATE TABLE _backup_embalagens AS 
SELECT * FROM embalagens;

-- Adicionar comentários para documentar o propósito
COMMENT ON TABLE _backup_tipos_insumos IS 'Backup da tabela tipos_insumos antes de migração';
COMMENT ON TABLE _backup_ingredientes IS 'Backup da tabela ingredientes antes de migração';
COMMENT ON TABLE _backup_embalagens IS 'Backup da tabela embalagens antes de migração';