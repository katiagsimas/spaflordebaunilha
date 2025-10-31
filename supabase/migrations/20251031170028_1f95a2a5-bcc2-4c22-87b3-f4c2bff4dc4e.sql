-- Recriar a função criar_planos_contas_padrao sem a conta "Custo de Pré-Preparos"
CREATE OR REPLACE FUNCTION public.criar_planos_contas_padrao(p_user_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_cat_id UUID;
  v_codigo INTEGER;
BEGIN
  v_codigo := 1;

  -- CATEGORIA 1 - Receita com Vendas
  SELECT id INTO v_cat_id FROM categorias_plano_contas WHERE user_id = p_user_id AND codigo = '1';
  IF v_cat_id IS NOT NULL THEN
    INSERT INTO plano_contas (user_id, categoria_id, codigo, codigo_estruturado, descricao, e_padrao) VALUES
    (p_user_id, v_cat_id, v_codigo, '1.01', 'Vendas no Balcão', true), 
    (p_user_id, v_cat_id, v_codigo + 1, '1.02', 'Vendas por Encomenda', true),
    (p_user_id, v_cat_id, v_codigo + 2, '1.03', 'Vendas Delivery', true),
    (p_user_id, v_cat_id, v_codigo + 3, '1.04', 'Vendas Atacado', true),
    (p_user_id, v_cat_id, v_codigo + 4, '1.05', 'Vendas Eventos', true)
    ON CONFLICT (user_id, codigo_estruturado) DO NOTHING;
    v_codigo := v_codigo + 5;
  END IF;

  -- CATEGORIA 2 - Impostos Sobre Vendas
  SELECT id INTO v_cat_id FROM categorias_plano_contas WHERE user_id = p_user_id AND codigo = '2';
  IF v_cat_id IS NOT NULL THEN
    INSERT INTO plano_contas (user_id, categoria_id, codigo, codigo_estruturado, descricao, e_padrao) VALUES
    (p_user_id, v_cat_id, v_codigo, '2.01', 'Simples Nacional', true),
    (p_user_id, v_cat_id, v_codigo + 1, '2.02', 'ICMS', true),
    (p_user_id, v_cat_id, v_codigo + 2, '2.03', 'PIS', true),
    (p_user_id, v_cat_id, v_codigo + 3, '2.04', 'COFINS', true),
    (p_user_id, v_cat_id, v_codigo + 4, '2.05', 'ISS', true)
    ON CONFLICT (user_id, codigo_estruturado) DO NOTHING;
    v_codigo := v_codigo + 5;
  END IF;

  -- CATEGORIA 3 - CMV (SEM "Custo de Pré-Preparos")
  SELECT id INTO v_cat_id FROM categorias_plano_contas WHERE user_id = p_user_id AND codigo = '3';
  IF v_cat_id IS NOT NULL THEN
    INSERT INTO plano_contas (user_id, categoria_id, codigo, codigo_estruturado, descricao, e_padrao) VALUES
    (p_user_id, v_cat_id, v_codigo, '3.01', 'Custo de Ingredientes', true),
    (p_user_id, v_cat_id, v_codigo + 1, '3.02', 'Custo de Embalagens', true),
    (p_user_id, v_cat_id, v_codigo + 2, '3.03', 'Perdas e Quebras', true)
    ON CONFLICT (user_id, codigo_estruturado) DO NOTHING;
    v_codigo := v_codigo + 3;
  END IF;

  -- CATEGORIA 5 - Despesas com Pessoal
  SELECT id INTO v_cat_id FROM categorias_plano_contas WHERE user_id = p_user_id AND codigo = '5';
  IF v_cat_id IS NOT NULL THEN
    INSERT INTO plano_contas (user_id, categoria_id, codigo, codigo_estruturado, descricao, e_padrao) VALUES
    (p_user_id, v_cat_id, v_codigo, '5.01', 'Salários', true),
    (p_user_id, v_cat_id, v_codigo + 1, '5.02', 'Encargos Sociais', true),
    (p_user_id, v_cat_id, v_codigo + 2, '5.03', 'Vale Transporte', true),
    (p_user_id, v_cat_id, v_codigo + 3, '5.04', 'Vale Alimentação', true),
    (p_user_id, v_cat_id, v_codigo + 4, '5.05', 'Benefícios', true),
    (p_user_id, v_cat_id, v_codigo + 5, '5.06', 'Uniformes', true)
    ON CONFLICT (user_id, codigo_estruturado) DO NOTHING;
    v_codigo := v_codigo + 6;
  END IF;

  -- CATEGORIA 6 - Despesas com Ocupação
  SELECT id INTO v_cat_id FROM categorias_plano_contas WHERE user_id = p_user_id AND codigo = '6';
  IF v_cat_id IS NOT NULL THEN
    INSERT INTO plano_contas (user_id, categoria_id, codigo, codigo_estruturado, descricao, e_padrao) VALUES
    (p_user_id, v_cat_id, v_codigo, '6.01', 'Aluguel', true),
    (p_user_id, v_cat_id, v_codigo + 1, '6.02', 'Condomínio', true),
    (p_user_id, v_cat_id, v_codigo + 2, '6.03', 'IPTU', true),
    (p_user_id, v_cat_id, v_codigo + 3, '6.04', 'Água', true),
    (p_user_id, v_cat_id, v_codigo + 4, '6.05', 'Energia Elétrica', true),
    (p_user_id, v_cat_id, v_codigo + 5, '6.06', 'Gás', true),
    (p_user_id, v_cat_id, v_codigo + 6, '6.07', 'Internet e Telefone', true)
    ON CONFLICT (user_id, codigo_estruturado) DO NOTHING;
    v_codigo := v_codigo + 7;
  END IF;

  -- CATEGORIA 7 - Despesas Administrativas
  SELECT id INTO v_cat_id FROM categorias_plano_contas WHERE user_id = p_user_id AND codigo = '7';
  IF v_cat_id IS NOT NULL THEN
    INSERT INTO plano_contas (user_id, categoria_id, codigo, codigo_estruturado, descricao, e_padrao) VALUES
    (p_user_id, v_cat_id, v_codigo, '7.01', 'Material de Escritório', true),
    (p_user_id, v_cat_id, v_codigo + 1, '7.02', 'Material de Limpeza', true),
    (p_user_id, v_cat_id, v_codigo + 2, '7.03', 'Contador', true),
    (p_user_id, v_cat_id, v_codigo + 3, '7.04', 'Assessoria Jurídica', true),
    (p_user_id, v_cat_id, v_codigo + 4, '7.05', 'Seguros', true),
    (p_user_id, v_cat_id, v_codigo + 5, '7.06', 'Licenças e Taxas', true),
    (p_user_id, v_cat_id, v_codigo + 6, '7.07', 'Pró-labore / Retirada de Sócios', true)
    ON CONFLICT (user_id, codigo_estruturado) DO NOTHING;
    v_codigo := v_codigo + 7;
  END IF;

  -- CATEGORIA 8 - Despesas Comerciais
  SELECT id INTO v_cat_id FROM categorias_plano_contas WHERE user_id = p_user_id AND codigo = '8';
  IF v_cat_id IS NOT NULL THEN
    INSERT INTO plano_contas (user_id, categoria_id, codigo, codigo_estruturado, descricao, e_padrao) VALUES
    (p_user_id, v_cat_id, v_codigo, '8.01', 'Marketing e Publicidade', true),
    (p_user_id, v_cat_id, v_codigo + 1, '8.02', 'Comissões de Vendas', true),
    (p_user_id, v_cat_id, v_codigo + 2, '8.03', 'Taxas de Delivery', true),
    (p_user_id, v_cat_id, v_codigo + 3, '8.04', 'Brindes e Amostras', true),
    (p_user_id, v_cat_id, v_codigo + 4, '8.05', 'Embalagens Promocionais', true)
    ON CONFLICT (user_id, codigo_estruturado) DO NOTHING;
    v_codigo := v_codigo + 5;
  END IF;

  -- CATEGORIA 9 - Receitas não Operacionais
  SELECT id INTO v_cat_id FROM categorias_plano_contas WHERE user_id = p_user_id AND codigo = '9';
  IF v_cat_id IS NOT NULL THEN
    INSERT INTO plano_contas (user_id, categoria_id, codigo, codigo_estruturado, descricao, e_padrao) VALUES
    (p_user_id, v_cat_id, v_codigo, '9.01', 'Venda de Ativos', true),
    (p_user_id, v_cat_id, v_codigo + 1, '9.02', 'Ganhos de Capital', true),
    (p_user_id, v_cat_id, v_codigo + 2, '9.03', 'Outras Receitas', true)
    ON CONFLICT (user_id, codigo_estruturado) DO NOTHING;
    v_codigo := v_codigo + 3;
  END IF;

  -- CATEGORIA 10 - Gastos não Operacionais
  SELECT id INTO v_cat_id FROM categorias_plano_contas WHERE user_id = p_user_id AND codigo = '10';
  IF v_cat_id IS NOT NULL THEN
    INSERT INTO plano_contas (user_id, categoria_id, codigo, codigo_estruturado, descricao, e_padrao) VALUES
    (p_user_id, v_cat_id, v_codigo, '10.01', 'Perdas Extraordinárias', true),
    (p_user_id, v_cat_id, v_codigo + 1, '10.02', 'Multas e Penalidades', true),
    (p_user_id, v_cat_id, v_codigo + 2, '10.03', 'Outras Despesas', true)
    ON CONFLICT (user_id, codigo_estruturado) DO NOTHING;
    v_codigo := v_codigo + 3;
  END IF;

  -- CATEGORIA 12 - Investimentos (-)
  SELECT id INTO v_cat_id FROM categorias_plano_contas WHERE user_id = p_user_id AND codigo = '12';
  IF v_cat_id IS NOT NULL THEN
    INSERT INTO plano_contas (user_id, categoria_id, codigo, codigo_estruturado, descricao, e_padrao) VALUES
    (p_user_id, v_cat_id, v_codigo, '12.01', 'Compra de Equipamentos', true),
    (p_user_id, v_cat_id, v_codigo + 1, '12.02', 'Reformas e Benfeitorias', true),
    (p_user_id, v_cat_id, v_codigo + 2, '12.03', 'Veículos', true)
    ON CONFLICT (user_id, codigo_estruturado) DO NOTHING;
    v_codigo := v_codigo + 3;
  END IF;

  -- CATEGORIA 13 - Transferências Débito
  SELECT id INTO v_cat_id FROM categorias_plano_contas WHERE user_id = p_user_id AND codigo = '13';
  IF v_cat_id IS NOT NULL THEN
    INSERT INTO plano_contas (user_id, categoria_id, codigo, codigo_estruturado, descricao, e_padrao) VALUES
    (p_user_id, v_cat_id, v_codigo, '13.01', 'Transferência entre Contas', true)
    ON CONFLICT (user_id, codigo_estruturado) DO NOTHING;
    v_codigo := v_codigo + 1;
  END IF;

  -- CATEGORIA 14 - Transferências Crédito
  SELECT id INTO v_cat_id FROM categorias_plano_contas WHERE user_id = p_user_id AND codigo = '14';
  IF v_cat_id IS NOT NULL THEN
    INSERT INTO plano_contas (user_id, categoria_id, codigo, codigo_estruturado, descricao, e_padrao) VALUES
    (p_user_id, v_cat_id, v_codigo, '14.01', 'Transferência entre Contas', true),
    (p_user_id, v_cat_id, v_codigo + 1, '14.02', 'Aporte de Capital', true)
    ON CONFLICT (user_id, codigo_estruturado) DO NOTHING;
    v_codigo := v_codigo + 2;
  END IF;

  -- CATEGORIA 99 - Outras Deduções
  SELECT id INTO v_cat_id FROM categorias_plano_contas WHERE user_id = p_user_id AND codigo = '99';
  IF v_cat_id IS NOT NULL THEN
    INSERT INTO plano_contas (user_id, categoria_id, codigo, codigo_estruturado, descricao, e_padrao) VALUES
    (p_user_id, v_cat_id, v_codigo, '99.01', 'Descontos Concedidos', true),
    (p_user_id, v_cat_id, v_codigo + 1, '99.02', 'Devoluções de Vendas', true),
    (p_user_id, v_cat_id, v_codigo + 2, '99.03', 'Cancelamentos', true)
    ON CONFLICT (user_id, codigo_estruturado) DO NOTHING;
    v_codigo := v_codigo + 3;
  END IF;

  -- CATEGORIA 103 - Despesa Operacional Variável
  SELECT id INTO v_cat_id FROM categorias_plano_contas WHERE user_id = p_user_id AND codigo = '103';
  IF v_cat_id IS NOT NULL THEN
    INSERT INTO plano_contas (user_id, categoria_id, codigo, codigo_estruturado, descricao, e_padrao) VALUES
    (p_user_id, v_cat_id, v_codigo, '103.01', 'Frete e Entregas', true),
    (p_user_id, v_cat_id, v_codigo + 1, '103.02', 'Embalagens Variáveis', true),
    (p_user_id, v_cat_id, v_codigo + 2, '103.03', 'Manutenção de Equipamentos', true)
    ON CONFLICT (user_id, codigo_estruturado) DO NOTHING;
    v_codigo := v_codigo + 3;
  END IF;

  -- CATEGORIA 106 - Receitas Financeiras
  SELECT id INTO v_cat_id FROM categorias_plano_contas WHERE user_id = p_user_id AND codigo = '106';
  IF v_cat_id IS NOT NULL THEN
    INSERT INTO plano_contas (user_id, categoria_id, codigo, codigo_estruturado, descricao, e_padrao) VALUES
    (p_user_id, v_cat_id, v_codigo, '106.01', 'Juros Recebidos', true),
    (p_user_id, v_cat_id, v_codigo + 1, '106.02', 'Rendimentos de Aplicações', true),
    (p_user_id, v_cat_id, v_codigo + 2, '106.03', 'Descontos Obtidos', true)
    ON CONFLICT (user_id, codigo_estruturado) DO NOTHING;
    v_codigo := v_codigo + 3;
  END IF;

  -- CATEGORIA 107 - Despesas Financeiras
  SELECT id INTO v_cat_id FROM categorias_plano_contas WHERE user_id = p_user_id AND codigo = '107';
  IF v_cat_id IS NOT NULL THEN
    INSERT INTO plano_contas (user_id, categoria_id, codigo, codigo_estruturado, descricao, e_padrao) VALUES
    (p_user_id, v_cat_id, v_codigo, '107.01', 'Juros Pagos', true),
    (p_user_id, v_cat_id, v_codigo + 1, '107.02', 'IOF', true),
    (p_user_id, v_cat_id, v_codigo + 2, '107.03', 'Tarifas Bancárias', true),
    (p_user_id, v_cat_id, v_codigo + 3, '107.04', 'Descontos Concedidos Financeiros', true)
    ON CONFLICT (user_id, codigo_estruturado) DO NOTHING;
    v_codigo := v_codigo + 4;
  END IF;

  -- CATEGORIA 111 - Investimentos (+)
  SELECT id INTO v_cat_id FROM categorias_plano_contas WHERE user_id = p_user_id AND codigo = '111';
  IF v_cat_id IS NOT NULL THEN
    INSERT INTO plano_contas (user_id, categoria_id, codigo, codigo_estruturado, descricao, e_padrao) VALUES
    (p_user_id, v_cat_id, v_codigo, '111.01', 'Venda de Equipamentos', true),
    (p_user_id, v_cat_id, v_codigo + 1, '111.02', 'Recuperação de Investimentos', true)
    ON CONFLICT (user_id, codigo_estruturado) DO NOTHING;
  END IF;

END;
$function$;