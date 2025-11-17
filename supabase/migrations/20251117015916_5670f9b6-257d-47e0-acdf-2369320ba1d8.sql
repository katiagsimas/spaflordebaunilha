-- Limpeza cirúrgica da coluna tipo_fornecedor da tabela fornecedores
-- Auditoria confirmou:
-- 1. Campo 'tipo_fornecedor' é usado apenas em formulários, sem lógica de negócio
-- 2. Não é usado em filtros, relatórios ou listagens
-- 3. Dados no banco: 1 fornecedor com valor NULL
-- 4. Nenhuma view, trigger ou função depende desse campo
-- 5. Campo foi removido de todos os componentes e hooks do frontend

-- Remover coluna tipo_fornecedor que não faz parte da lógica de negócio
ALTER TABLE fornecedores DROP COLUMN IF EXISTS tipo_fornecedor;