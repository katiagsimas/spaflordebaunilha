-- Remover tabelas não utilizadas no sistema

-- 1. Remover tabela planejamento_produtos (vazia, vinculada a planejamento_vendas)
DROP TABLE IF EXISTS planejamento_produtos CASCADE;

-- 2. Remover tabela planejamento_vendas (antiga, não usada no código)
DROP TABLE IF EXISTS planejamento_vendas CASCADE;

-- 3. Remover tabela deleted_data_backup (sistema de backup não implementado)
DROP TABLE IF EXISTS deleted_data_backup CASCADE;

-- 4. Remover tabela admin_access_tokens (sistema de tokens não implementado)
DROP TABLE IF EXISTS admin_access_tokens CASCADE;

-- 5. Remover tabela planos_contas (duplicada - o sistema usa plano_contas no singular)
DROP TABLE IF EXISTS planos_contas CASCADE;