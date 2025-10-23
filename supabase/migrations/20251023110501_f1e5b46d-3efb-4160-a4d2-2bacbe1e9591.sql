-- Atualizar todas as referências de SugarBox para Donnas Box no banco de dados

-- Atualizar tabela profiles
UPDATE profiles 
SET nome_confeitaria = REPLACE(REPLACE(nome_confeitaria, 'SugarBox', 'Donnas Box'), 'Sugar Box', 'Donnas Box')
WHERE nome_confeitaria ILIKE '%sugarbox%' OR nome_confeitaria ILIKE '%sugar box%';

UPDATE profiles 
SET nome_completo = REPLACE(REPLACE(nome_completo, 'SugarBox', 'Donnas Box'), 'Sugar Box', 'Donnas Box')
WHERE nome_completo ILIKE '%sugarbox%' OR nome_completo ILIKE '%sugar box%';

-- Atualizar campos de observações e descrições em várias tabelas
UPDATE clientes 
SET observacoes = REPLACE(REPLACE(observacoes, 'SugarBox', 'Donnas Box'), 'Sugar Box', 'Donnas Box')
WHERE observacoes ILIKE '%sugarbox%' OR observacoes ILIKE '%sugar box%';

UPDATE fornecedores 
SET observacoes = REPLACE(REPLACE(observacoes, 'SugarBox', 'Donnas Box'), 'Sugar Box', 'Donnas Box')
WHERE observacoes ILIKE '%sugarbox%' OR observacoes ILIKE '%sugar box%';

UPDATE encomendas 
SET observacoes = REPLACE(REPLACE(observacoes, 'SugarBox', 'Donnas Box'), 'Sugar Box', 'Donnas Box'),
    topo_obs = REPLACE(REPLACE(topo_obs, 'SugarBox', 'Donnas Box'), 'Sugar Box', 'Donnas Box')
WHERE observacoes ILIKE '%sugarbox%' OR observacoes ILIKE '%sugar box%' 
   OR topo_obs ILIKE '%sugarbox%' OR topo_obs ILIKE '%sugar box%';

UPDATE contas_receber 
SET descricao = REPLACE(REPLACE(descricao, 'SugarBox', 'Donnas Box'), 'Sugar Box', 'Donnas Box'),
    observacoes = REPLACE(REPLACE(observacoes, 'SugarBox', 'Donnas Box'), 'Sugar Box', 'Donnas Box')
WHERE descricao ILIKE '%sugarbox%' OR descricao ILIKE '%sugar box%'
   OR observacoes ILIKE '%sugarbox%' OR observacoes ILIKE '%sugar box%';

UPDATE contas_pagar 
SET descricao = REPLACE(REPLACE(descricao, 'SugarBox', 'Donnas Box'), 'Sugar Box', 'Donnas Box'),
    observacoes = REPLACE(REPLACE(observacoes, 'SugarBox', 'Donnas Box'), 'Sugar Box', 'Donnas Box')
WHERE descricao ILIKE '%sugarbox%' OR descricao ILIKE '%sugar box%'
   OR observacoes ILIKE '%sugarbox%' OR observacoes ILIKE '%sugar box%';

UPDATE movimentacoes_estoque 
SET observacoes = REPLACE(REPLACE(observacoes, 'SugarBox', 'Donnas Box'), 'Sugar Box', 'Donnas Box'),
    motivo = REPLACE(REPLACE(motivo, 'SugarBox', 'Donnas Box'), 'Sugar Box', 'Donnas Box')
WHERE observacoes ILIKE '%sugarbox%' OR observacoes ILIKE '%sugar box%'
   OR motivo ILIKE '%sugarbox%' OR motivo ILIKE '%sugar box%';

UPDATE contas_receber_parcelas 
SET observacao = REPLACE(REPLACE(observacao, 'SugarBox', 'Donnas Box'), 'Sugar Box', 'Donnas Box'),
    observacao_interna = REPLACE(REPLACE(observacao_interna, 'SugarBox', 'Donnas Box'), 'Sugar Box', 'Donnas Box')
WHERE observacao ILIKE '%sugarbox%' OR observacao ILIKE '%sugar box%'
   OR observacao_interna ILIKE '%sugarbox%' OR observacao_interna ILIKE '%sugar box%';

UPDATE contas_pagar_parcelas 
SET observacao = REPLACE(REPLACE(observacao, 'SugarBox', 'Donnas Box'), 'Sugar Box', 'Donnas Box')
WHERE observacao ILIKE '%sugarbox%' OR observacao ILIKE '%sugar box%';

UPDATE contas_receber_pagamentos 
SET observacao = REPLACE(REPLACE(observacao, 'SugarBox', 'Donnas Box'), 'Sugar Box', 'Donnas Box')
WHERE observacao ILIKE '%sugarbox%' OR observacao ILIKE '%sugar box%';

UPDATE contas_pagar_pagamentos 
SET observacao = REPLACE(REPLACE(observacao, 'SugarBox', 'Donnas Box'), 'Sugar Box', 'Donnas Box')
WHERE observacao ILIKE '%sugarbox%' OR observacao ILIKE '%sugar box%';

UPDATE configuracoes_juros 
SET observacao = REPLACE(REPLACE(observacao, 'SugarBox', 'Donnas Box'), 'Sugar Box', 'Donnas Box')
WHERE observacao ILIKE '%sugarbox%' OR observacao ILIKE '%sugar box%';