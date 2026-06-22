
-- ============================================================
-- 1) DROP de políticas legadas redundantes (auth.uid() = usuario_id / user_id)
--    Todas as tabelas abaixo já possuem políticas group_members_* equivalentes.
-- ============================================================

-- bancos
DROP POLICY IF EXISTS "Users can delete own bancos" ON public.bancos;
DROP POLICY IF EXISTS "Users can insert own bancos" ON public.bancos;
DROP POLICY IF EXISTS "Users can update own bancos" ON public.bancos;
DROP POLICY IF EXISTS "Users can view own bancos" ON public.bancos;

-- categorias
DROP POLICY IF EXISTS "Users can delete own categorias" ON public.categorias;
DROP POLICY IF EXISTS "Users can insert own categorias" ON public.categorias;
DROP POLICY IF EXISTS "Users can update own categorias" ON public.categorias;
DROP POLICY IF EXISTS "Users can view own categorias" ON public.categorias;

-- categorias_plano_contas
DROP POLICY IF EXISTS "Users can delete categorias_plano_contas" ON public.categorias_plano_contas;
DROP POLICY IF EXISTS "Users can delete own categorias_plano" ON public.categorias_plano_contas;
DROP POLICY IF EXISTS "Users can insert categorias_plano_contas" ON public.categorias_plano_contas;
DROP POLICY IF EXISTS "Users can insert own categorias_plano" ON public.categorias_plano_contas;
DROP POLICY IF EXISTS "Users can update categorias_plano_contas" ON public.categorias_plano_contas;
DROP POLICY IF EXISTS "Users can update own categorias_plano" ON public.categorias_plano_contas;
DROP POLICY IF EXISTS "Users can view own categorias_plano_contas" ON public.categorias_plano_contas;

-- configuracoes_juros
DROP POLICY IF EXISTS "Users can manage own config_juros" ON public.configuracoes_juros;

-- contas_pagar
DROP POLICY IF EXISTS "Users can delete own contas_pagar" ON public.contas_pagar;
DROP POLICY IF EXISTS "Users can insert own contas_pagar" ON public.contas_pagar;
DROP POLICY IF EXISTS "Users can update own contas_pagar" ON public.contas_pagar;
DROP POLICY IF EXISTS "Users can view own contas_pagar" ON public.contas_pagar;

-- contas_receber
DROP POLICY IF EXISTS "Users can delete own contas_receber" ON public.contas_receber;
DROP POLICY IF EXISTS "Users can insert own contas_receber" ON public.contas_receber;
DROP POLICY IF EXISTS "Users can update own contas_receber" ON public.contas_receber;
DROP POLICY IF EXISTS "Users can view own contas_receber" ON public.contas_receber;

-- custos_fixos
DROP POLICY IF EXISTS "Users can delete own custos_fixos" ON public.custos_fixos;
DROP POLICY IF EXISTS "Users can insert own custos_fixos" ON public.custos_fixos;
DROP POLICY IF EXISTS "Users can update own custos_fixos" ON public.custos_fixos;
DROP POLICY IF EXISTS "Users can view own custos_fixos" ON public.custos_fixos;

-- embalagens
DROP POLICY IF EXISTS "Users can delete own embalagens" ON public.embalagens;
DROP POLICY IF EXISTS "Users can insert own embalagens" ON public.embalagens;
DROP POLICY IF EXISTS "Users can update own embalagens" ON public.embalagens;
DROP POLICY IF EXISTS "Users can view own embalagens" ON public.embalagens;

-- encomenda_itens
DROP POLICY IF EXISTS "Users can delete own encomenda_itens" ON public.encomenda_itens;
DROP POLICY IF EXISTS "Users can insert own encomenda_itens" ON public.encomenda_itens;
DROP POLICY IF EXISTS "Users can update own encomenda_itens" ON public.encomenda_itens;
DROP POLICY IF EXISTS "Users can view own encomenda_itens" ON public.encomenda_itens;

-- encomendas
DROP POLICY IF EXISTS "Users can delete own encomendas" ON public.encomendas;
DROP POLICY IF EXISTS "Users can insert own encomendas" ON public.encomendas;
DROP POLICY IF EXISTS "Users can update own encomendas" ON public.encomendas;
DROP POLICY IF EXISTS "Users can view own encomendas" ON public.encomendas;

-- estoque
DROP POLICY IF EXISTS "Users can delete own estoque" ON public.estoque;
DROP POLICY IF EXISTS "Users can insert own estoque" ON public.estoque;
DROP POLICY IF EXISTS "Users can update own estoque" ON public.estoque;
DROP POLICY IF EXISTS "Users can view own estoque" ON public.estoque;

-- estoque_movimentacoes
DROP POLICY IF EXISTS "Users can delete own movimentacoes" ON public.estoque_movimentacoes;
DROP POLICY IF EXISTS "Users can insert own movimentacoes" ON public.estoque_movimentacoes;
DROP POLICY IF EXISTS "Users can view own movimentacoes" ON public.estoque_movimentacoes;

-- fornecedor_contatos (legadas em PT + duplicatas "Group members can")
DROP POLICY IF EXISTS "Usuários atualizam apenas seus contatos de fornecedores" ON public.fornecedor_contatos;
DROP POLICY IF EXISTS "Usuários deletam apenas seus contatos de fornecedores" ON public.fornecedor_contatos;
DROP POLICY IF EXISTS "Usuários inserem apenas seus contatos de fornecedores" ON public.fornecedor_contatos;
DROP POLICY IF EXISTS "Usuários veem apenas seus contatos de fornecedores" ON public.fornecedor_contatos;
DROP POLICY IF EXISTS "Group members can delete fornecedor_contatos" ON public.fornecedor_contatos;
DROP POLICY IF EXISTS "Group members can insert fornecedor_contatos" ON public.fornecedor_contatos;
DROP POLICY IF EXISTS "Group members can update fornecedor_contatos" ON public.fornecedor_contatos;
DROP POLICY IF EXISTS "Group members can view fornecedor_contatos" ON public.fornecedor_contatos;

-- ingredientes
DROP POLICY IF EXISTS "Users can delete own ingredientes" ON public.ingredientes;
DROP POLICY IF EXISTS "Users can insert own ingredientes" ON public.ingredientes;
DROP POLICY IF EXISTS "Users can update own ingredientes" ON public.ingredientes;
DROP POLICY IF EXISTS "Users can view own ingredientes" ON public.ingredientes;

-- mao_obra_perfis
DROP POLICY IF EXISTS "Users can delete own perfis" ON public.mao_obra_perfis;
DROP POLICY IF EXISTS "Users can insert own perfis" ON public.mao_obra_perfis;
DROP POLICY IF EXISTS "Users can update own perfis" ON public.mao_obra_perfis;
DROP POLICY IF EXISTS "Users can view own perfis" ON public.mao_obra_perfis;

-- plano_contas
DROP POLICY IF EXISTS "Users can delete plano_contas" ON public.plano_contas;
DROP POLICY IF EXISTS "Users can insert plano_contas" ON public.plano_contas;
DROP POLICY IF EXISTS "Users can update plano_contas" ON public.plano_contas;
DROP POLICY IF EXISTS "Users can view own plano_contas" ON public.plano_contas;

-- pre_preparos
DROP POLICY IF EXISTS "Users can delete own pre_preparos" ON public.pre_preparos;
DROP POLICY IF EXISTS "Users can insert own pre_preparos" ON public.pre_preparos;
DROP POLICY IF EXISTS "Users can update own pre_preparos" ON public.pre_preparos;
DROP POLICY IF EXISTS "Users can view own pre_preparos" ON public.pre_preparos;

-- receitas
DROP POLICY IF EXISTS "Users can delete own receitas" ON public.receitas;
DROP POLICY IF EXISTS "Users can insert own receitas" ON public.receitas;
DROP POLICY IF EXISTS "Users can update own receitas" ON public.receitas;
DROP POLICY IF EXISTS "Users can view own receitas" ON public.receitas;

-- tags_encomendas (mantém "Users can only view system tags" para permitir visualizar tags do sistema)
DROP POLICY IF EXISTS "Users can view all active tags" ON public.tags_encomendas;
DROP POLICY IF EXISTS "tags_encomendas_delete" ON public.tags_encomendas;
DROP POLICY IF EXISTS "tags_encomendas_insert" ON public.tags_encomendas;
DROP POLICY IF EXISTS "tags_encomendas_update" ON public.tags_encomendas;

-- tipos_documento
DROP POLICY IF EXISTS "Users can delete own tipos_documento" ON public.tipos_documento;
DROP POLICY IF EXISTS "Users can insert own tipos_documento" ON public.tipos_documento;
DROP POLICY IF EXISTS "Users can update own tipos_documento" ON public.tipos_documento;
DROP POLICY IF EXISTS "Users can view own tipos_documento" ON public.tipos_documento;

-- tipos_insumos
DROP POLICY IF EXISTS "Users can delete own tipos_insumos" ON public.tipos_insumos;
DROP POLICY IF EXISTS "Users can insert own tipos_insumos" ON public.tipos_insumos;
DROP POLICY IF EXISTS "Users can update own tipos_insumos" ON public.tipos_insumos;
DROP POLICY IF EXISTS "Users can view own tipos_insumos" ON public.tipos_insumos;

-- transferencias_bancos
DROP POLICY IF EXISTS "Users can delete own transferencias" ON public.transferencias_bancos;
DROP POLICY IF EXISTS "Users can insert own transferencias" ON public.transferencias_bancos;
DROP POLICY IF EXISTS "Users can update own transferencias" ON public.transferencias_bancos;
DROP POLICY IF EXISTS "Users can view own transferencias" ON public.transferencias_bancos;

-- unidades_medida
DROP POLICY IF EXISTS "Users can delete own unidades_medida" ON public.unidades_medida;
DROP POLICY IF EXISTS "Users can insert own unidades_medida" ON public.unidades_medida;
DROP POLICY IF EXISTS "Users can update own unidades_medida" ON public.unidades_medida;
DROP POLICY IF EXISTS "Users can view own unidades_medida" ON public.unidades_medida;

-- meu_salario_retiradas (legado usa subquery, equivalente já existe em group_members_*)
DROP POLICY IF EXISTS "Users can delete own group retiradas" ON public.meu_salario_retiradas;
DROP POLICY IF EXISTS "Users can insert own group retiradas" ON public.meu_salario_retiradas;
DROP POLICY IF EXISTS "Users can update own group retiradas" ON public.meu_salario_retiradas;
DROP POLICY IF EXISTS "Users can view own group retiradas" ON public.meu_salario_retiradas;

-- clientes: remove a política "solo" e reescreve "Group members can" sem fallback OR usuario_id
DROP POLICY IF EXISTS "Solo users can insert own clientes" ON public.clientes;
DROP POLICY IF EXISTS "Group members can delete clientes" ON public.clientes;
DROP POLICY IF EXISTS "Group members can insert clientes" ON public.clientes;
DROP POLICY IF EXISTS "Group members can update clientes" ON public.clientes;
DROP POLICY IF EXISTS "Group members can view clientes" ON public.clientes;

CREATE POLICY "group_members_select_clientes" ON public.clientes
  FOR SELECT TO authenticated
  USING (owner_group_id IS NOT NULL AND public.user_belongs_to_group(auth.uid(), owner_group_id));

CREATE POLICY "group_members_insert_clientes" ON public.clientes
  FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = usuario_id
    AND owner_group_id IS NOT NULL
    AND public.user_belongs_to_group(auth.uid(), owner_group_id)
  );

CREATE POLICY "group_members_update_clientes" ON public.clientes
  FOR UPDATE TO authenticated
  USING (owner_group_id IS NOT NULL AND public.user_belongs_to_group(auth.uid(), owner_group_id))
  WITH CHECK (owner_group_id IS NOT NULL AND public.user_belongs_to_group(auth.uid(), owner_group_id));

CREATE POLICY "group_members_delete_clientes" ON public.clientes
  FOR DELETE TO authenticated
  USING (owner_group_id IS NOT NULL AND public.user_belongs_to_group(auth.uid(), owner_group_id));

-- fornecedores: mesma higienização
DROP POLICY IF EXISTS "Group members can delete fornecedores" ON public.fornecedores;
DROP POLICY IF EXISTS "Group members can insert fornecedores" ON public.fornecedores;
DROP POLICY IF EXISTS "Group members can update fornecedores" ON public.fornecedores;
DROP POLICY IF EXISTS "Group members can view fornecedores" ON public.fornecedores;

CREATE POLICY "group_members_select_fornecedores" ON public.fornecedores
  FOR SELECT TO authenticated
  USING (owner_group_id IS NOT NULL AND public.user_belongs_to_group(auth.uid(), owner_group_id));

CREATE POLICY "group_members_insert_fornecedores" ON public.fornecedores
  FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = usuario_id
    AND owner_group_id IS NOT NULL
    AND public.user_belongs_to_group(auth.uid(), owner_group_id)
  );

CREATE POLICY "group_members_update_fornecedores" ON public.fornecedores
  FOR UPDATE TO authenticated
  USING (owner_group_id IS NOT NULL AND public.user_belongs_to_group(auth.uid(), owner_group_id))
  WITH CHECK (owner_group_id IS NOT NULL AND public.user_belongs_to_group(auth.uid(), owner_group_id));

CREATE POLICY "group_members_delete_fornecedores" ON public.fornecedores
  FOR DELETE TO authenticated
  USING (owner_group_id IS NOT NULL AND public.user_belongs_to_group(auth.uid(), owner_group_id));
