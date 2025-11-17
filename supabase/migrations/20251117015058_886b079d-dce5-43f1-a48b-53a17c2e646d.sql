
-- Limpeza cirúrgica dos campos legados da tabela clientes
-- Auditoria confirmou:
-- 1. Campos 'como_conheceu', 'preferencias_alergias' e 'segmento' não são usados no código
-- 2. Aparecem APENAS no types.ts (auto-gerado)
-- 3. Dados no banco:
--    - como_conheceu: 0 registros com dados
--    - preferencias_alergias: 0 registros com dados  
--    - segmento: 2 registros com valor 'novo' (padrão), nenhum com valor customizado
-- 4. Nenhuma tela, relatório ou lógica de negócio usa esses campos

-- Remover campos legados que não fazem parte da experiência atual
ALTER TABLE clientes DROP COLUMN IF EXISTS como_conheceu;
ALTER TABLE clientes DROP COLUMN IF EXISTS preferencias_alergias;
ALTER TABLE clientes DROP COLUMN IF EXISTS segmento;
