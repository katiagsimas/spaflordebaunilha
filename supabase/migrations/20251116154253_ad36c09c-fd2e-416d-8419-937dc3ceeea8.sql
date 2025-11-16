-- Remover o constraint antigo que não inclui 'outros'
ALTER TABLE itens DROP CONSTRAINT IF EXISTS itens_tipo_check;

-- Adicionar novo constraint incluindo 'outros'
ALTER TABLE itens ADD CONSTRAINT itens_tipo_check 
CHECK (tipo IN ('ingrediente', 'embalagem', 'outros'));