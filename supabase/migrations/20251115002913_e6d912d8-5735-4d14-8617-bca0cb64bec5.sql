-- Alterar o default do campo ativo na tabela categorias para true
ALTER TABLE categorias 
ALTER COLUMN ativo SET DEFAULT true;

-- Atualizar todas as categorias padrão do sistema para ficarem ativas
UPDATE categorias 
SET ativo = true 
WHERE padrao_sistema = true;