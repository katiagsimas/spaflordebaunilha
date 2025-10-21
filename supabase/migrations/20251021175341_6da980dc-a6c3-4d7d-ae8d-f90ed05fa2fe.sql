-- Remover temporariamente a constraint UNIQUE
ALTER TABLE bancos DROP CONSTRAINT IF EXISTS unique_banco_por_usuario;

-- Adicionar as colunas se ainda não existirem
ALTER TABLE bancos 
ADD COLUMN IF NOT EXISTS e_banco_oficial BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS e_customizado BOOLEAN DEFAULT false;

-- Atualizar códigos para os códigos oficiais do Bacen
UPDATE bancos SET codigo = '000', e_banco_oficial = true WHERE nome = 'Caixa Empresa';
UPDATE bancos SET codigo = '001', e_banco_oficial = true WHERE nome = 'Banco do Brasil';
UPDATE bancos SET codigo = '033', e_banco_oficial = true WHERE nome = 'Santander';
UPDATE bancos SET codigo = '104', e_banco_oficial = true WHERE nome = 'Caixa Econômica Federal';
UPDATE bancos SET codigo = '237', e_banco_oficial = true WHERE nome = 'Bradesco';
UPDATE bancos SET codigo = '341', e_banco_oficial = true WHERE nome = 'Itaú Unibanco';
UPDATE bancos SET codigo = '260', e_banco_oficial = true WHERE nome = 'Nubank';
UPDATE bancos SET codigo = '077', e_banco_oficial = true WHERE nome = 'Banco Inter';
UPDATE bancos SET codigo = '290', e_banco_oficial = true WHERE nome = 'PagSeguro';
UPDATE bancos SET codigo = '336', e_banco_oficial = true WHERE nome = 'C6 Bank';
UPDATE bancos SET codigo = '323', e_banco_oficial = true WHERE nome = 'Mercado Pago';

-- Recriar a constraint UNIQUE
ALTER TABLE bancos ADD CONSTRAINT unique_banco_por_usuario UNIQUE (usuario_id, codigo);