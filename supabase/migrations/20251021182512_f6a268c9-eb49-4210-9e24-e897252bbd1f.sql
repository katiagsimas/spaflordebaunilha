-- Atualizar tipos de documentos padrão existentes
-- Marcar como padrão os tipos com códigos de 1 a 14
UPDATE tipos_documento 
SET e_padrao = true 
WHERE codigo BETWEEN 1 AND 14;