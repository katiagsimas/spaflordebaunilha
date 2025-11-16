-- Remover a constraint antiga que só aceita 'ingrediente' e 'embalagem'
ALTER TABLE tipos_insumos DROP CONSTRAINT IF EXISTS tipos_insumos_tipo_check;

-- Criar nova constraint que aceita 'ingrediente', 'embalagem' e 'outros'
ALTER TABLE tipos_insumos ADD CONSTRAINT tipos_insumos_tipo_check 
CHECK (tipo IN ('ingrediente', 'embalagem', 'outros'));