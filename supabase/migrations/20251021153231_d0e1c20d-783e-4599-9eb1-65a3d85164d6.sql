-- Limpar unidades que não são: Centímetros, Gramas, Mililitros, Unidades
-- Manter apenas as 4 unidades especificadas baseado no nome
DELETE FROM unidades_medida 
WHERE LOWER(nome) NOT IN ('centímetros', 'gramas', 'mililitros', 'unidades');