
-- Alterar o valor padrão de cobrar_juros para false (não cobrar por padrão)
ALTER TABLE configuracoes_juros 
ALTER COLUMN cobrar_juros SET DEFAULT false;
