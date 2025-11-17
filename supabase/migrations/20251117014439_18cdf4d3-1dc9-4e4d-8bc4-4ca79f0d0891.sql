
-- Limpeza cirúrgica dos campos legados da tabela fornecedores
-- Passo 1: Recriar a view v_aniversariantes_fornecedores sem usar os campos legados
-- A view atualmente usa fornecedores.contato e fornecedores.data_aniversario_contato
-- Como não há dados nesses campos, vamos simplificar a view para usar apenas fornecedor_contatos

DROP VIEW IF EXISTS v_aniversariantes_fornecedores;

CREATE VIEW v_aniversariantes_fornecedores AS
SELECT 
  fc.usuario_id,
  fc.fornecedor_id,
  (fc.nome || ' (' || f.nome || ')') AS nome,
  'contato' AS tipo,
  fc.cargo,
  fc.telefone,
  fc.email,
  fc.data_aniversario,
  EXTRACT(MONTH FROM fc.data_aniversario) AS mes_aniversario,
  EXTRACT(DAY FROM fc.data_aniversario) AS dia_aniversario,
  CASE 
    WHEN DATE_PART('doy', fc.data_aniversario) >= DATE_PART('doy', CURRENT_DATE)
    THEN MAKE_DATE(
      EXTRACT(YEAR FROM CURRENT_DATE)::INTEGER,
      EXTRACT(MONTH FROM fc.data_aniversario)::INTEGER,
      EXTRACT(DAY FROM fc.data_aniversario)::INTEGER
    )
    ELSE MAKE_DATE(
      EXTRACT(YEAR FROM CURRENT_DATE)::INTEGER + 1,
      EXTRACT(MONTH FROM fc.data_aniversario)::INTEGER,
      EXTRACT(DAY FROM fc.data_aniversario)::INTEGER
    )
  END AS proximo_aniversario,
  fc.observacoes
FROM fornecedor_contatos fc
JOIN fornecedores f ON fc.fornecedor_id = f.id
WHERE fc.data_aniversario IS NOT NULL 
  AND fc.ativo = true;

-- Passo 2: Agora podemos dropar as colunas legadas sem problemas
ALTER TABLE fornecedores DROP COLUMN IF EXISTS contato;
ALTER TABLE fornecedores DROP COLUMN IF EXISTS data_aniversario_contato;
