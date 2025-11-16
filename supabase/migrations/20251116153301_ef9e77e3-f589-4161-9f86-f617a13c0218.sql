-- Adicionar o tipo 'outros' ao enum tipo_item_estoque
ALTER TYPE tipo_item_estoque ADD VALUE IF NOT EXISTS 'outros';

-- Permitir 'outros' na coluna tipo da tabela tipos_insumos
-- (não precisa de alteração pois a coluna tipo é do tipo text, não enum)