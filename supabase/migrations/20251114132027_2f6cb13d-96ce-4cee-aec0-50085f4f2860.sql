-- Remove duplicatas mantendo apenas a primeira ocorrência de cada unidade por usuário
DELETE FROM unidades_medida
WHERE id IN (
  SELECT id
  FROM (
    SELECT id, 
           ROW_NUMBER() OVER (PARTITION BY usuario_id, nome ORDER BY created_at ASC) as rn
    FROM unidades_medida
  ) t
  WHERE rn > 1
);

-- Adiciona constraint única para evitar duplicatas futuras
ALTER TABLE unidades_medida 
ADD CONSTRAINT unidades_medida_usuario_nome_unique 
UNIQUE (usuario_id, nome);