-- Atualizar categorias existentes para desabilitadas por padrão
UPDATE categorias
SET ativo = false
WHERE padrao_sistema = true;

-- Alterar o default da coluna ativo para false
ALTER TABLE categorias
ALTER COLUMN ativo SET DEFAULT false;