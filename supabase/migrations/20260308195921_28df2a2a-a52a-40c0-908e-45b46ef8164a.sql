-- Fix SECURITY DEFINER views by recreating with security_invoker = true

-- 1. v_aniversariantes_fornecedores
CREATE OR REPLACE VIEW public.v_aniversariantes_fornecedores 
WITH (security_invoker = true)
AS
SELECT fc.usuario_id,
    fc.fornecedor_id,
    ((((fc.nome)::text || ' ('::text) || (f.nome)::text) || ')'::text) AS nome,
    'contato'::text AS tipo,
    fc.cargo,
    fc.telefone,
    fc.email,
    fc.data_aniversario,
    EXTRACT(month FROM fc.data_aniversario) AS mes_aniversario,
    EXTRACT(day FROM fc.data_aniversario) AS dia_aniversario,
    CASE
        WHEN (date_part('doy'::text, fc.data_aniversario) >= date_part('doy'::text, CURRENT_DATE)) THEN make_date((EXTRACT(year FROM CURRENT_DATE))::integer, (EXTRACT(month FROM fc.data_aniversario))::integer, (EXTRACT(day FROM fc.data_aniversario))::integer)
        ELSE make_date(((EXTRACT(year FROM CURRENT_DATE))::integer + 1), (EXTRACT(month FROM fc.data_aniversario))::integer, (EXTRACT(day FROM fc.data_aniversario))::integer)
    END AS proximo_aniversario,
    fc.observacoes
FROM fornecedor_contatos fc
JOIN fornecedores f ON fc.fornecedor_id = f.id
WHERE fc.data_aniversario IS NOT NULL AND fc.ativo = true;

-- 2. vw_contas_receber_dashboard
CREATE OR REPLACE VIEW public.vw_contas_receber_dashboard
WITH (security_invoker = true)
AS
SELECT c.usuario_id,
    COALESCE(sum(CASE WHEN p.status::text = ANY (ARRAY['aberto','atrasado','pagamento_parcial']) THEN p.valor_parcela - COALESCE(p.valor_pago, 0::numeric) ELSE 0::numeric END), 0::numeric) AS total_a_receber,
    COALESCE(sum(CASE WHEN p.status::text = ANY (ARRAY['pago','adiantado']) THEN p.valor_pago WHEN p.status::text = 'pagamento_parcial' THEN p.valor_pago ELSE 0::numeric END), 0::numeric) AS total_recebido,
    COALESCE(sum(CASE WHEN p.status::text = 'atrasado' THEN p.valor_parcela - COALESCE(p.valor_pago, 0::numeric) ELSE 0::numeric END), 0::numeric) AS total_atrasado,
    COALESCE(sum(CASE WHEN p.data_vencimento = CURRENT_DATE AND p.status::text = ANY (ARRAY['aberto','pagamento_parcial']) THEN p.valor_parcela - COALESCE(p.valor_pago, 0::numeric) ELSE 0::numeric END), 0::numeric) AS vencendo_hoje,
    count(DISTINCT CASE WHEN p.status::text = ANY (ARRAY['aberto','atrasado','pagamento_parcial']) THEN p.id ELSE NULL::uuid END) AS parcelas_abertas,
    count(DISTINCT CASE WHEN p.status::text = 'atrasado' THEN p.id ELSE NULL::uuid END) AS parcelas_atrasadas,
    count(DISTINCT CASE WHEN p.status::text = ANY (ARRAY['pago','adiantado']) THEN p.id ELSE NULL::uuid END) AS parcelas_pagas
FROM contas_receber c
JOIN contas_receber_parcelas p ON p.conta_receber_id = c.id
GROUP BY c.usuario_id;

-- 3. v_aniversariantes_completa
CREATE OR REPLACE VIEW public.v_aniversariantes_completa
WITH (security_invoker = true)
AS
SELECT c.usuario_id,
    c.id AS cliente_id,
    c.nome,
    'cliente'::text AS tipo,
    NULL::character varying(50) AS parentesco,
    c.data_aniversario AS data_nascimento,
    c.telefone,
    c.email,
    EXTRACT(month FROM c.data_aniversario) AS mes_aniversario,
    EXTRACT(day FROM c.data_aniversario) AS dia_aniversario,
    CASE
        WHEN date_part('doy'::text, c.data_aniversario) >= date_part('doy'::text, CURRENT_DATE) THEN make_date(EXTRACT(year FROM CURRENT_DATE)::integer, EXTRACT(month FROM c.data_aniversario)::integer, EXTRACT(day FROM c.data_aniversario)::integer)
        ELSE make_date((EXTRACT(year FROM CURRENT_DATE)::integer + 1), EXTRACT(month FROM c.data_aniversario)::integer, EXTRACT(day FROM c.data_aniversario)::integer)
    END AS proximo_aniversario,
    c.observacoes
FROM clientes c
WHERE c.data_aniversario IS NOT NULL
UNION ALL
SELECT cf.usuario_id,
    cf.cliente_id,
    ((((cf.nome)::text || ' ('::text) || (c.nome)::text) || ')'::text) AS nome,
    'familiar'::text AS tipo,
    cf.parentesco,
    cf.data_nascimento,
    c.telefone,
    c.email,
    EXTRACT(month FROM cf.data_nascimento) AS mes_aniversario,
    EXTRACT(day FROM cf.data_nascimento) AS dia_aniversario,
    CASE
        WHEN date_part('doy'::text, cf.data_nascimento) >= date_part('doy'::text, CURRENT_DATE) THEN make_date(EXTRACT(year FROM CURRENT_DATE)::integer, EXTRACT(month FROM cf.data_nascimento)::integer, EXTRACT(day FROM cf.data_nascimento)::integer)
        ELSE make_date((EXTRACT(year FROM CURRENT_DATE)::integer + 1), EXTRACT(month FROM cf.data_nascimento)::integer, EXTRACT(day FROM cf.data_nascimento)::integer)
    END AS proximo_aniversario,
    cf.observacoes
FROM cliente_familiares cf
JOIN clientes c ON cf.cliente_id = c.id
WHERE cf.data_nascimento IS NOT NULL AND cf.ativo = true;

-- 4. vw_contas_receber_parcelas
CREATE OR REPLACE VIEW public.vw_contas_receber_parcelas
WITH (security_invoker = true)
AS
SELECT p.id,
    p.conta_receber_id,
    p.numero_parcela,
    p.data_vencimento,
    p.valor_parcela,
    p.data_recebimento,
    p.valor_recebido,
    p.juros,
    p.desconto,
    p.status,
    p.observacao,
    p.created_at,
    p.updated_at,
    p.data_emissao,
    p.valor_total,
    COALESCE(pagamentos.total_pago, 0::numeric) AS valor_pago,
    COALESCE(pagamentos.data_pagamento, p.data_pagamento) AS data_pagamento,
    c.cliente_id,
    c.tipo_documento_id,
    c.plano_conta_id,
    c.banco_id,
    c.tipo_lancamento,
    c.numero_parcelas,
    c.usuario_id AS user_id,
    cl.nome AS cliente_nome,
    td.descricao AS tipo_documento_descricao,
    pc.codigo_estruturado AS plano_contas_codigo,
    pc.descricao AS plano_contas_descricao,
    b.nome AS banco_nome
FROM contas_receber_parcelas p
LEFT JOIN contas_receber c ON c.id = p.conta_receber_id
LEFT JOIN clientes cl ON cl.id = c.cliente_id
LEFT JOIN tipos_documento td ON td.id = c.tipo_documento_id
LEFT JOIN plano_contas pc ON pc.id = c.plano_conta_id
LEFT JOIN bancos b ON b.id = c.banco_id
LEFT JOIN (
    SELECT parcela_id, sum(valor_pago) AS total_pago, max(data_pagamento) AS data_pagamento
    FROM contas_receber_pagamentos
    GROUP BY parcela_id
) pagamentos ON pagamentos.parcela_id = p.id;

-- 5. vw_resumo_financeiro
CREATE OR REPLACE VIEW public.vw_resumo_financeiro
WITH (security_invoker = true)
AS
WITH saldos_iniciais AS (
    SELECT b.usuario_id, b.id AS banco_id, b.codigo AS banco_codigo, b.nome AS banco_nome,
        COALESCE(sib.saldo_inicial, 0::numeric) AS saldo_inicial,
        COALESCE(sib.mes_referencia, EXTRACT(month FROM CURRENT_DATE)::integer) AS mes,
        COALESCE(sib.ano_referencia, EXTRACT(year FROM CURRENT_DATE)::integer) AS ano
    FROM bancos b
    LEFT JOIN saldos_iniciais_bancos sib ON sib.banco_id = b.id AND sib.mes_referencia = EXTRACT(month FROM CURRENT_DATE)::integer AND sib.ano_referencia = EXTRACT(year FROM CURRENT_DATE)::integer
), entradas_mes AS (
    SELECT si.usuario_id, si.banco_id, si.mes, si.ano,
        COALESCE(sum(CASE WHEN pag.estornado = false OR pag.estornado IS NULL THEN pag.valor_pago + COALESCE(pag.juros, 0::numeric) - COALESCE(pag.desconto, 0::numeric) ELSE 0::numeric END), 0::numeric) AS total_entradas
    FROM saldos_iniciais si
    LEFT JOIN contas_receber_pagamentos pag ON pag.banco_id = si.banco_id AND EXTRACT(month FROM pag.data_pagamento) = si.mes::numeric AND EXTRACT(year FROM pag.data_pagamento) = si.ano::numeric
    GROUP BY si.usuario_id, si.banco_id, si.mes, si.ano
), saidas_mes AS (
    SELECT si.usuario_id, si.banco_id, si.mes, si.ano,
        COALESCE(sum(CASE WHEN pag.estornado = false OR pag.estornado IS NULL THEN pag.valor_pago + COALESCE(pag.juros, 0::numeric) - COALESCE(pag.desconto, 0::numeric) ELSE 0::numeric END), 0::numeric) AS total_saidas
    FROM saldos_iniciais si
    LEFT JOIN contas_pagar_pagamentos pag ON pag.banco_id = si.banco_id AND EXTRACT(month FROM pag.data_pagamento) = si.mes::numeric AND EXTRACT(year FROM pag.data_pagamento) = si.ano::numeric
    GROUP BY si.usuario_id, si.banco_id, si.mes, si.ano
)
SELECT si.usuario_id AS user_id, si.banco_id, si.banco_codigo, si.banco_nome, si.mes, si.ano, si.saldo_inicial,
    COALESCE(e.total_entradas, 0::numeric) AS entradas_mes,
    COALESCE(s.total_saidas, 0::numeric) AS saidas_mes,
    si.saldo_inicial + COALESCE(e.total_entradas, 0::numeric) - COALESCE(s.total_saidas, 0::numeric) AS saldo_atual
FROM saldos_iniciais si
LEFT JOIN entradas_mes e ON e.banco_id = si.banco_id AND e.mes = si.mes AND e.ano = si.ano
LEFT JOIN saidas_mes s ON s.banco_id = si.banco_id AND s.mes = si.mes AND s.ano = si.ano;

-- Fix SECURITY DEFINER functions without search_path
ALTER FUNCTION public.is_admin(uuid) SET search_path = 'public';
ALTER FUNCTION public.log_admin_action(uuid, text, uuid, text, jsonb) SET search_path = 'public';
ALTER FUNCTION public.validate_admin_token(text) SET search_path = 'public';
ALTER FUNCTION public.get_aniversariantes_fornecedores_mes(integer) SET search_path = 'public';
ALTER FUNCTION public.criar_categorias_padrao(uuid) SET search_path = 'public';
ALTER FUNCTION public.trigger_criar_categorias_padrao() SET search_path = 'public';
ALTER FUNCTION public.get_todos_aniversariantes(uuid) SET search_path = 'public';
ALTER FUNCTION public.get_faturamento_mes(uuid, integer, integer) SET search_path = 'public';
ALTER FUNCTION public.hard_delete_user_data(uuid, uuid) SET search_path = 'public';
ALTER FUNCTION public.verificar_tipo_documento_em_uso(uuid) SET search_path = 'public';
ALTER FUNCTION public.get_custos_fixos_mes(uuid, integer, integer) SET search_path = 'public';
ALTER FUNCTION public.get_ticket_medio_mes(uuid, integer, integer) SET search_path = 'public';
ALTER FUNCTION public.get_quantidade_vendas_mes(uuid, integer, integer) SET search_path = 'public';
ALTER FUNCTION public.atualizar_segmento_cliente() SET search_path = 'public';
ALTER FUNCTION public.criar_bancos_padrao_para_usuario(uuid) SET search_path = 'public';
ALTER FUNCTION public.criar_tipos_documento_padrao_para_usuario(uuid) SET search_path = 'public';