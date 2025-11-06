-- Adicionar campo categoria_id na tabela pre_preparos
ALTER TABLE pre_preparos ADD COLUMN categoria_id UUID REFERENCES categorias(id) ON DELETE SET NULL;