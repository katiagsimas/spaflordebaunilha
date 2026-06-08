-- Group members access policies
-- Permite que membros ativos de um grupo (user_group_roles) acessem dados do grupo via owner_group_id.
-- Mantém políticas legadas (auth.uid() = usuario_id) intactas — combinadas via OR (permissive).

-- Helper local para padronizar nomes
DO $$ BEGIN
  -- nada
END $$;

-- =================== TABELAS COM usuario_id ===================

-- bancos
CREATE POLICY "group_members_select_bancos" ON public.bancos FOR SELECT TO authenticated
  USING (owner_group_id IS NOT NULL AND public.user_belongs_to_group(auth.uid(), owner_group_id));
CREATE POLICY "group_members_insert_bancos" ON public.bancos FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = usuario_id AND owner_group_id IS NOT NULL AND public.user_belongs_to_group(auth.uid(), owner_group_id));
CREATE POLICY "group_members_update_bancos" ON public.bancos FOR UPDATE TO authenticated
  USING (owner_group_id IS NOT NULL AND public.user_belongs_to_group(auth.uid(), owner_group_id))
  WITH CHECK (owner_group_id IS NOT NULL AND public.user_belongs_to_group(auth.uid(), owner_group_id));
CREATE POLICY "group_members_delete_bancos" ON public.bancos FOR DELETE TO authenticated
  USING (owner_group_id IS NOT NULL AND public.user_belongs_to_group(auth.uid(), owner_group_id));

-- categorias (preserva proteção padrao_sistema)
CREATE POLICY "group_members_select_categorias" ON public.categorias FOR SELECT TO authenticated
  USING (owner_group_id IS NOT NULL AND public.user_belongs_to_group(auth.uid(), owner_group_id));
CREATE POLICY "group_members_insert_categorias" ON public.categorias FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = usuario_id AND owner_group_id IS NOT NULL AND public.user_belongs_to_group(auth.uid(), owner_group_id));
CREATE POLICY "group_members_update_categorias" ON public.categorias FOR UPDATE TO authenticated
  USING (owner_group_id IS NOT NULL AND public.user_belongs_to_group(auth.uid(), owner_group_id))
  WITH CHECK (owner_group_id IS NOT NULL AND public.user_belongs_to_group(auth.uid(), owner_group_id));
CREATE POLICY "group_members_delete_categorias" ON public.categorias FOR DELETE TO authenticated
  USING (owner_group_id IS NOT NULL AND public.user_belongs_to_group(auth.uid(), owner_group_id) AND padrao_sistema = false);

-- configuracoes_juros
CREATE POLICY "group_members_select_configuracoes_juros" ON public.configuracoes_juros FOR SELECT TO authenticated
  USING (owner_group_id IS NOT NULL AND public.user_belongs_to_group(auth.uid(), owner_group_id));
CREATE POLICY "group_members_insert_configuracoes_juros" ON public.configuracoes_juros FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = usuario_id AND owner_group_id IS NOT NULL AND public.user_belongs_to_group(auth.uid(), owner_group_id));
CREATE POLICY "group_members_update_configuracoes_juros" ON public.configuracoes_juros FOR UPDATE TO authenticated
  USING (owner_group_id IS NOT NULL AND public.user_belongs_to_group(auth.uid(), owner_group_id))
  WITH CHECK (owner_group_id IS NOT NULL AND public.user_belongs_to_group(auth.uid(), owner_group_id));
CREATE POLICY "group_members_delete_configuracoes_juros" ON public.configuracoes_juros FOR DELETE TO authenticated
  USING (owner_group_id IS NOT NULL AND public.user_belongs_to_group(auth.uid(), owner_group_id));

-- contas_pagar
CREATE POLICY "group_members_select_contas_pagar" ON public.contas_pagar FOR SELECT TO authenticated
  USING (owner_group_id IS NOT NULL AND public.user_belongs_to_group(auth.uid(), owner_group_id));
CREATE POLICY "group_members_insert_contas_pagar" ON public.contas_pagar FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = usuario_id AND owner_group_id IS NOT NULL AND public.user_belongs_to_group(auth.uid(), owner_group_id));
CREATE POLICY "group_members_update_contas_pagar" ON public.contas_pagar FOR UPDATE TO authenticated
  USING (owner_group_id IS NOT NULL AND public.user_belongs_to_group(auth.uid(), owner_group_id))
  WITH CHECK (owner_group_id IS NOT NULL AND public.user_belongs_to_group(auth.uid(), owner_group_id));
CREATE POLICY "group_members_delete_contas_pagar" ON public.contas_pagar FOR DELETE TO authenticated
  USING (owner_group_id IS NOT NULL AND public.user_belongs_to_group(auth.uid(), owner_group_id));

-- contas_receber
CREATE POLICY "group_members_select_contas_receber" ON public.contas_receber FOR SELECT TO authenticated
  USING (owner_group_id IS NOT NULL AND public.user_belongs_to_group(auth.uid(), owner_group_id));
CREATE POLICY "group_members_insert_contas_receber" ON public.contas_receber FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = usuario_id AND owner_group_id IS NOT NULL AND public.user_belongs_to_group(auth.uid(), owner_group_id));
CREATE POLICY "group_members_update_contas_receber" ON public.contas_receber FOR UPDATE TO authenticated
  USING (owner_group_id IS NOT NULL AND public.user_belongs_to_group(auth.uid(), owner_group_id))
  WITH CHECK (owner_group_id IS NOT NULL AND public.user_belongs_to_group(auth.uid(), owner_group_id));
CREATE POLICY "group_members_delete_contas_receber" ON public.contas_receber FOR DELETE TO authenticated
  USING (owner_group_id IS NOT NULL AND public.user_belongs_to_group(auth.uid(), owner_group_id));

-- custos_fixos
CREATE POLICY "group_members_select_custos_fixos" ON public.custos_fixos FOR SELECT TO authenticated
  USING (owner_group_id IS NOT NULL AND public.user_belongs_to_group(auth.uid(), owner_group_id));
CREATE POLICY "group_members_insert_custos_fixos" ON public.custos_fixos FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = usuario_id AND owner_group_id IS NOT NULL AND public.user_belongs_to_group(auth.uid(), owner_group_id));
CREATE POLICY "group_members_update_custos_fixos" ON public.custos_fixos FOR UPDATE TO authenticated
  USING (owner_group_id IS NOT NULL AND public.user_belongs_to_group(auth.uid(), owner_group_id))
  WITH CHECK (owner_group_id IS NOT NULL AND public.user_belongs_to_group(auth.uid(), owner_group_id));
CREATE POLICY "group_members_delete_custos_fixos" ON public.custos_fixos FOR DELETE TO authenticated
  USING (owner_group_id IS NOT NULL AND public.user_belongs_to_group(auth.uid(), owner_group_id));

-- embalagens
CREATE POLICY "group_members_select_embalagens" ON public.embalagens FOR SELECT TO authenticated
  USING (owner_group_id IS NOT NULL AND public.user_belongs_to_group(auth.uid(), owner_group_id));
CREATE POLICY "group_members_insert_embalagens" ON public.embalagens FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = usuario_id AND owner_group_id IS NOT NULL AND public.user_belongs_to_group(auth.uid(), owner_group_id));
CREATE POLICY "group_members_update_embalagens" ON public.embalagens FOR UPDATE TO authenticated
  USING (owner_group_id IS NOT NULL AND public.user_belongs_to_group(auth.uid(), owner_group_id))
  WITH CHECK (owner_group_id IS NOT NULL AND public.user_belongs_to_group(auth.uid(), owner_group_id));
CREATE POLICY "group_members_delete_embalagens" ON public.embalagens FOR DELETE TO authenticated
  USING (owner_group_id IS NOT NULL AND public.user_belongs_to_group(auth.uid(), owner_group_id));

-- encomenda_itens
CREATE POLICY "group_members_select_encomenda_itens" ON public.encomenda_itens FOR SELECT TO authenticated
  USING (owner_group_id IS NOT NULL AND public.user_belongs_to_group(auth.uid(), owner_group_id));
CREATE POLICY "group_members_insert_encomenda_itens" ON public.encomenda_itens FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = usuario_id AND owner_group_id IS NOT NULL AND public.user_belongs_to_group(auth.uid(), owner_group_id));
CREATE POLICY "group_members_update_encomenda_itens" ON public.encomenda_itens FOR UPDATE TO authenticated
  USING (owner_group_id IS NOT NULL AND public.user_belongs_to_group(auth.uid(), owner_group_id))
  WITH CHECK (owner_group_id IS NOT NULL AND public.user_belongs_to_group(auth.uid(), owner_group_id));
CREATE POLICY "group_members_delete_encomenda_itens" ON public.encomenda_itens FOR DELETE TO authenticated
  USING (owner_group_id IS NOT NULL AND public.user_belongs_to_group(auth.uid(), owner_group_id));

-- encomendas
CREATE POLICY "group_members_select_encomendas" ON public.encomendas FOR SELECT TO authenticated
  USING (owner_group_id IS NOT NULL AND public.user_belongs_to_group(auth.uid(), owner_group_id));
CREATE POLICY "group_members_insert_encomendas" ON public.encomendas FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = usuario_id AND owner_group_id IS NOT NULL AND public.user_belongs_to_group(auth.uid(), owner_group_id));
CREATE POLICY "group_members_update_encomendas" ON public.encomendas FOR UPDATE TO authenticated
  USING (owner_group_id IS NOT NULL AND public.user_belongs_to_group(auth.uid(), owner_group_id))
  WITH CHECK (owner_group_id IS NOT NULL AND public.user_belongs_to_group(auth.uid(), owner_group_id));
CREATE POLICY "group_members_delete_encomendas" ON public.encomendas FOR DELETE TO authenticated
  USING (owner_group_id IS NOT NULL AND public.user_belongs_to_group(auth.uid(), owner_group_id));

-- estoque
CREATE POLICY "group_members_select_estoque" ON public.estoque FOR SELECT TO authenticated
  USING (owner_group_id IS NOT NULL AND public.user_belongs_to_group(auth.uid(), owner_group_id));
CREATE POLICY "group_members_insert_estoque" ON public.estoque FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = usuario_id AND owner_group_id IS NOT NULL AND public.user_belongs_to_group(auth.uid(), owner_group_id));
CREATE POLICY "group_members_update_estoque" ON public.estoque FOR UPDATE TO authenticated
  USING (owner_group_id IS NOT NULL AND public.user_belongs_to_group(auth.uid(), owner_group_id))
  WITH CHECK (owner_group_id IS NOT NULL AND public.user_belongs_to_group(auth.uid(), owner_group_id));
CREATE POLICY "group_members_delete_estoque" ON public.estoque FOR DELETE TO authenticated
  USING (owner_group_id IS NOT NULL AND public.user_belongs_to_group(auth.uid(), owner_group_id));

-- estoque_movimentacoes
CREATE POLICY "group_members_select_estoque_movimentacoes" ON public.estoque_movimentacoes FOR SELECT TO authenticated
  USING (owner_group_id IS NOT NULL AND public.user_belongs_to_group(auth.uid(), owner_group_id));
CREATE POLICY "group_members_insert_estoque_movimentacoes" ON public.estoque_movimentacoes FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = usuario_id AND owner_group_id IS NOT NULL AND public.user_belongs_to_group(auth.uid(), owner_group_id));
CREATE POLICY "group_members_update_estoque_movimentacoes" ON public.estoque_movimentacoes FOR UPDATE TO authenticated
  USING (owner_group_id IS NOT NULL AND public.user_belongs_to_group(auth.uid(), owner_group_id))
  WITH CHECK (owner_group_id IS NOT NULL AND public.user_belongs_to_group(auth.uid(), owner_group_id));
CREATE POLICY "group_members_delete_estoque_movimentacoes" ON public.estoque_movimentacoes FOR DELETE TO authenticated
  USING (owner_group_id IS NOT NULL AND public.user_belongs_to_group(auth.uid(), owner_group_id));

-- fornecedor_contatos
CREATE POLICY "group_members_select_fornecedor_contatos" ON public.fornecedor_contatos FOR SELECT TO authenticated
  USING (owner_group_id IS NOT NULL AND public.user_belongs_to_group(auth.uid(), owner_group_id));
CREATE POLICY "group_members_insert_fornecedor_contatos" ON public.fornecedor_contatos FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = usuario_id AND owner_group_id IS NOT NULL AND public.user_belongs_to_group(auth.uid(), owner_group_id));
CREATE POLICY "group_members_update_fornecedor_contatos" ON public.fornecedor_contatos FOR UPDATE TO authenticated
  USING (owner_group_id IS NOT NULL AND public.user_belongs_to_group(auth.uid(), owner_group_id))
  WITH CHECK (owner_group_id IS NOT NULL AND public.user_belongs_to_group(auth.uid(), owner_group_id));
CREATE POLICY "group_members_delete_fornecedor_contatos" ON public.fornecedor_contatos FOR DELETE TO authenticated
  USING (owner_group_id IS NOT NULL AND public.user_belongs_to_group(auth.uid(), owner_group_id));

-- ingredientes
CREATE POLICY "group_members_select_ingredientes" ON public.ingredientes FOR SELECT TO authenticated
  USING (owner_group_id IS NOT NULL AND public.user_belongs_to_group(auth.uid(), owner_group_id));
CREATE POLICY "group_members_insert_ingredientes" ON public.ingredientes FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = usuario_id AND owner_group_id IS NOT NULL AND public.user_belongs_to_group(auth.uid(), owner_group_id));
CREATE POLICY "group_members_update_ingredientes" ON public.ingredientes FOR UPDATE TO authenticated
  USING (owner_group_id IS NOT NULL AND public.user_belongs_to_group(auth.uid(), owner_group_id))
  WITH CHECK (owner_group_id IS NOT NULL AND public.user_belongs_to_group(auth.uid(), owner_group_id));
CREATE POLICY "group_members_delete_ingredientes" ON public.ingredientes FOR DELETE TO authenticated
  USING (owner_group_id IS NOT NULL AND public.user_belongs_to_group(auth.uid(), owner_group_id));

-- pre_preparos
CREATE POLICY "group_members_select_pre_preparos" ON public.pre_preparos FOR SELECT TO authenticated
  USING (owner_group_id IS NOT NULL AND public.user_belongs_to_group(auth.uid(), owner_group_id));
CREATE POLICY "group_members_insert_pre_preparos" ON public.pre_preparos FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = usuario_id AND owner_group_id IS NOT NULL AND public.user_belongs_to_group(auth.uid(), owner_group_id));
CREATE POLICY "group_members_update_pre_preparos" ON public.pre_preparos FOR UPDATE TO authenticated
  USING (owner_group_id IS NOT NULL AND public.user_belongs_to_group(auth.uid(), owner_group_id))
  WITH CHECK (owner_group_id IS NOT NULL AND public.user_belongs_to_group(auth.uid(), owner_group_id));
CREATE POLICY "group_members_delete_pre_preparos" ON public.pre_preparos FOR DELETE TO authenticated
  USING (owner_group_id IS NOT NULL AND public.user_belongs_to_group(auth.uid(), owner_group_id));

-- receitas
CREATE POLICY "group_members_select_receitas" ON public.receitas FOR SELECT TO authenticated
  USING (owner_group_id IS NOT NULL AND public.user_belongs_to_group(auth.uid(), owner_group_id));
CREATE POLICY "group_members_insert_receitas" ON public.receitas FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = usuario_id AND owner_group_id IS NOT NULL AND public.user_belongs_to_group(auth.uid(), owner_group_id));
CREATE POLICY "group_members_update_receitas" ON public.receitas FOR UPDATE TO authenticated
  USING (owner_group_id IS NOT NULL AND public.user_belongs_to_group(auth.uid(), owner_group_id))
  WITH CHECK (owner_group_id IS NOT NULL AND public.user_belongs_to_group(auth.uid(), owner_group_id));
CREATE POLICY "group_members_delete_receitas" ON public.receitas FOR DELETE TO authenticated
  USING (owner_group_id IS NOT NULL AND public.user_belongs_to_group(auth.uid(), owner_group_id));

-- tipos_documento
CREATE POLICY "group_members_select_tipos_documento" ON public.tipos_documento FOR SELECT TO authenticated
  USING (owner_group_id IS NOT NULL AND public.user_belongs_to_group(auth.uid(), owner_group_id));
CREATE POLICY "group_members_insert_tipos_documento" ON public.tipos_documento FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = usuario_id AND owner_group_id IS NOT NULL AND public.user_belongs_to_group(auth.uid(), owner_group_id));
CREATE POLICY "group_members_update_tipos_documento" ON public.tipos_documento FOR UPDATE TO authenticated
  USING (owner_group_id IS NOT NULL AND public.user_belongs_to_group(auth.uid(), owner_group_id))
  WITH CHECK (owner_group_id IS NOT NULL AND public.user_belongs_to_group(auth.uid(), owner_group_id));
CREATE POLICY "group_members_delete_tipos_documento" ON public.tipos_documento FOR DELETE TO authenticated
  USING (owner_group_id IS NOT NULL AND public.user_belongs_to_group(auth.uid(), owner_group_id));

-- tipos_insumos
CREATE POLICY "group_members_select_tipos_insumos" ON public.tipos_insumos FOR SELECT TO authenticated
  USING (owner_group_id IS NOT NULL AND public.user_belongs_to_group(auth.uid(), owner_group_id));
CREATE POLICY "group_members_insert_tipos_insumos" ON public.tipos_insumos FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = usuario_id AND owner_group_id IS NOT NULL AND public.user_belongs_to_group(auth.uid(), owner_group_id));
CREATE POLICY "group_members_update_tipos_insumos" ON public.tipos_insumos FOR UPDATE TO authenticated
  USING (owner_group_id IS NOT NULL AND public.user_belongs_to_group(auth.uid(), owner_group_id))
  WITH CHECK (owner_group_id IS NOT NULL AND public.user_belongs_to_group(auth.uid(), owner_group_id));
CREATE POLICY "group_members_delete_tipos_insumos" ON public.tipos_insumos FOR DELETE TO authenticated
  USING (owner_group_id IS NOT NULL AND public.user_belongs_to_group(auth.uid(), owner_group_id));

-- transferencias_bancos
CREATE POLICY "group_members_select_transferencias_bancos" ON public.transferencias_bancos FOR SELECT TO authenticated
  USING (owner_group_id IS NOT NULL AND public.user_belongs_to_group(auth.uid(), owner_group_id));
CREATE POLICY "group_members_insert_transferencias_bancos" ON public.transferencias_bancos FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = usuario_id AND owner_group_id IS NOT NULL AND public.user_belongs_to_group(auth.uid(), owner_group_id));
CREATE POLICY "group_members_update_transferencias_bancos" ON public.transferencias_bancos FOR UPDATE TO authenticated
  USING (owner_group_id IS NOT NULL AND public.user_belongs_to_group(auth.uid(), owner_group_id))
  WITH CHECK (owner_group_id IS NOT NULL AND public.user_belongs_to_group(auth.uid(), owner_group_id));
CREATE POLICY "group_members_delete_transferencias_bancos" ON public.transferencias_bancos FOR DELETE TO authenticated
  USING (owner_group_id IS NOT NULL AND public.user_belongs_to_group(auth.uid(), owner_group_id));

-- unidades_medida
CREATE POLICY "group_members_select_unidades_medida" ON public.unidades_medida FOR SELECT TO authenticated
  USING (owner_group_id IS NOT NULL AND public.user_belongs_to_group(auth.uid(), owner_group_id));
CREATE POLICY "group_members_insert_unidades_medida" ON public.unidades_medida FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = usuario_id AND owner_group_id IS NOT NULL AND public.user_belongs_to_group(auth.uid(), owner_group_id));
CREATE POLICY "group_members_update_unidades_medida" ON public.unidades_medida FOR UPDATE TO authenticated
  USING (owner_group_id IS NOT NULL AND public.user_belongs_to_group(auth.uid(), owner_group_id))
  WITH CHECK (owner_group_id IS NOT NULL AND public.user_belongs_to_group(auth.uid(), owner_group_id));
CREATE POLICY "group_members_delete_unidades_medida" ON public.unidades_medida FOR DELETE TO authenticated
  USING (owner_group_id IS NOT NULL AND public.user_belongs_to_group(auth.uid(), owner_group_id));

-- =================== TABELAS COM user_id ===================

-- categorias_plano_contas
CREATE POLICY "group_members_select_categorias_plano_contas" ON public.categorias_plano_contas FOR SELECT TO authenticated
  USING (owner_group_id IS NOT NULL AND public.user_belongs_to_group(auth.uid(), owner_group_id));
CREATE POLICY "group_members_insert_categorias_plano_contas" ON public.categorias_plano_contas FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id AND owner_group_id IS NOT NULL AND public.user_belongs_to_group(auth.uid(), owner_group_id));
CREATE POLICY "group_members_update_categorias_plano_contas" ON public.categorias_plano_contas FOR UPDATE TO authenticated
  USING (owner_group_id IS NOT NULL AND public.user_belongs_to_group(auth.uid(), owner_group_id))
  WITH CHECK (owner_group_id IS NOT NULL AND public.user_belongs_to_group(auth.uid(), owner_group_id));
CREATE POLICY "group_members_delete_categorias_plano_contas" ON public.categorias_plano_contas FOR DELETE TO authenticated
  USING (owner_group_id IS NOT NULL AND public.user_belongs_to_group(auth.uid(), owner_group_id));

-- conversa_doce_favoritos
CREATE POLICY "group_members_select_conversa_doce_favoritos" ON public.conversa_doce_favoritos FOR SELECT TO authenticated
  USING (owner_group_id IS NOT NULL AND public.user_belongs_to_group(auth.uid(), owner_group_id));
CREATE POLICY "group_members_insert_conversa_doce_favoritos" ON public.conversa_doce_favoritos FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id AND owner_group_id IS NOT NULL AND public.user_belongs_to_group(auth.uid(), owner_group_id));
CREATE POLICY "group_members_update_conversa_doce_favoritos" ON public.conversa_doce_favoritos FOR UPDATE TO authenticated
  USING (owner_group_id IS NOT NULL AND public.user_belongs_to_group(auth.uid(), owner_group_id))
  WITH CHECK (owner_group_id IS NOT NULL AND public.user_belongs_to_group(auth.uid(), owner_group_id));
CREATE POLICY "group_members_delete_conversa_doce_favoritos" ON public.conversa_doce_favoritos FOR DELETE TO authenticated
  USING (owner_group_id IS NOT NULL AND public.user_belongs_to_group(auth.uid(), owner_group_id));

-- mao_obra_perfis
CREATE POLICY "group_members_select_mao_obra_perfis" ON public.mao_obra_perfis FOR SELECT TO authenticated
  USING (owner_group_id IS NOT NULL AND public.user_belongs_to_group(auth.uid(), owner_group_id));
CREATE POLICY "group_members_insert_mao_obra_perfis" ON public.mao_obra_perfis FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id AND owner_group_id IS NOT NULL AND public.user_belongs_to_group(auth.uid(), owner_group_id));
CREATE POLICY "group_members_update_mao_obra_perfis" ON public.mao_obra_perfis FOR UPDATE TO authenticated
  USING (owner_group_id IS NOT NULL AND public.user_belongs_to_group(auth.uid(), owner_group_id))
  WITH CHECK (owner_group_id IS NOT NULL AND public.user_belongs_to_group(auth.uid(), owner_group_id));
CREATE POLICY "group_members_delete_mao_obra_perfis" ON public.mao_obra_perfis FOR DELETE TO authenticated
  USING (owner_group_id IS NOT NULL AND public.user_belongs_to_group(auth.uid(), owner_group_id));

-- meu_salario_retiradas
CREATE POLICY "group_members_select_meu_salario_retiradas" ON public.meu_salario_retiradas FOR SELECT TO authenticated
  USING (owner_group_id IS NOT NULL AND public.user_belongs_to_group(auth.uid(), owner_group_id));
CREATE POLICY "group_members_insert_meu_salario_retiradas" ON public.meu_salario_retiradas FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id AND owner_group_id IS NOT NULL AND public.user_belongs_to_group(auth.uid(), owner_group_id));
CREATE POLICY "group_members_update_meu_salario_retiradas" ON public.meu_salario_retiradas FOR UPDATE TO authenticated
  USING (owner_group_id IS NOT NULL AND public.user_belongs_to_group(auth.uid(), owner_group_id))
  WITH CHECK (owner_group_id IS NOT NULL AND public.user_belongs_to_group(auth.uid(), owner_group_id));
CREATE POLICY "group_members_delete_meu_salario_retiradas" ON public.meu_salario_retiradas FOR DELETE TO authenticated
  USING (owner_group_id IS NOT NULL AND public.user_belongs_to_group(auth.uid(), owner_group_id));

-- organizacao_doce_state
CREATE POLICY "group_members_select_organizacao_doce_state" ON public.organizacao_doce_state FOR SELECT TO authenticated
  USING (owner_group_id IS NOT NULL AND public.user_belongs_to_group(auth.uid(), owner_group_id));
CREATE POLICY "group_members_insert_organizacao_doce_state" ON public.organizacao_doce_state FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id AND owner_group_id IS NOT NULL AND public.user_belongs_to_group(auth.uid(), owner_group_id));
CREATE POLICY "group_members_update_organizacao_doce_state" ON public.organizacao_doce_state FOR UPDATE TO authenticated
  USING (owner_group_id IS NOT NULL AND public.user_belongs_to_group(auth.uid(), owner_group_id))
  WITH CHECK (owner_group_id IS NOT NULL AND public.user_belongs_to_group(auth.uid(), owner_group_id));
CREATE POLICY "group_members_delete_organizacao_doce_state" ON public.organizacao_doce_state FOR DELETE TO authenticated
  USING (owner_group_id IS NOT NULL AND public.user_belongs_to_group(auth.uid(), owner_group_id));

-- planejamento_descanso
CREATE POLICY "group_members_select_planejamento_descanso" ON public.planejamento_descanso FOR SELECT TO authenticated
  USING (owner_group_id IS NOT NULL AND public.user_belongs_to_group(auth.uid(), owner_group_id));
CREATE POLICY "group_members_insert_planejamento_descanso" ON public.planejamento_descanso FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id AND owner_group_id IS NOT NULL AND public.user_belongs_to_group(auth.uid(), owner_group_id));
CREATE POLICY "group_members_update_planejamento_descanso" ON public.planejamento_descanso FOR UPDATE TO authenticated
  USING (owner_group_id IS NOT NULL AND public.user_belongs_to_group(auth.uid(), owner_group_id))
  WITH CHECK (owner_group_id IS NOT NULL AND public.user_belongs_to_group(auth.uid(), owner_group_id));
CREATE POLICY "group_members_delete_planejamento_descanso" ON public.planejamento_descanso FOR DELETE TO authenticated
  USING (owner_group_id IS NOT NULL AND public.user_belongs_to_group(auth.uid(), owner_group_id));

-- planejamento_tarefas
CREATE POLICY "group_members_select_planejamento_tarefas" ON public.planejamento_tarefas FOR SELECT TO authenticated
  USING (owner_group_id IS NOT NULL AND public.user_belongs_to_group(auth.uid(), owner_group_id));
CREATE POLICY "group_members_insert_planejamento_tarefas" ON public.planejamento_tarefas FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id AND owner_group_id IS NOT NULL AND public.user_belongs_to_group(auth.uid(), owner_group_id));
CREATE POLICY "group_members_update_planejamento_tarefas" ON public.planejamento_tarefas FOR UPDATE TO authenticated
  USING (owner_group_id IS NOT NULL AND public.user_belongs_to_group(auth.uid(), owner_group_id))
  WITH CHECK (owner_group_id IS NOT NULL AND public.user_belongs_to_group(auth.uid(), owner_group_id));
CREATE POLICY "group_members_delete_planejamento_tarefas" ON public.planejamento_tarefas FOR DELETE TO authenticated
  USING (owner_group_id IS NOT NULL AND public.user_belongs_to_group(auth.uid(), owner_group_id));

-- plano_contas
CREATE POLICY "group_members_select_plano_contas" ON public.plano_contas FOR SELECT TO authenticated
  USING (owner_group_id IS NOT NULL AND public.user_belongs_to_group(auth.uid(), owner_group_id));
CREATE POLICY "group_members_insert_plano_contas" ON public.plano_contas FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id AND owner_group_id IS NOT NULL AND public.user_belongs_to_group(auth.uid(), owner_group_id));
CREATE POLICY "group_members_update_plano_contas" ON public.plano_contas FOR UPDATE TO authenticated
  USING (owner_group_id IS NOT NULL AND public.user_belongs_to_group(auth.uid(), owner_group_id))
  WITH CHECK (owner_group_id IS NOT NULL AND public.user_belongs_to_group(auth.uid(), owner_group_id));
CREATE POLICY "group_members_delete_plano_contas" ON public.plano_contas FOR DELETE TO authenticated
  USING (owner_group_id IS NOT NULL AND public.user_belongs_to_group(auth.uid(), owner_group_id));

-- tags_encomendas (preserva proteção padrao_sistema no delete)
CREATE POLICY "group_members_select_tags_encomendas" ON public.tags_encomendas FOR SELECT TO authenticated
  USING (owner_group_id IS NOT NULL AND public.user_belongs_to_group(auth.uid(), owner_group_id));
CREATE POLICY "group_members_insert_tags_encomendas" ON public.tags_encomendas FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id AND owner_group_id IS NOT NULL AND public.user_belongs_to_group(auth.uid(), owner_group_id) AND padrao_sistema = false);
CREATE POLICY "group_members_update_tags_encomendas" ON public.tags_encomendas FOR UPDATE TO authenticated
  USING (owner_group_id IS NOT NULL AND public.user_belongs_to_group(auth.uid(), owner_group_id))
  WITH CHECK (owner_group_id IS NOT NULL AND public.user_belongs_to_group(auth.uid(), owner_group_id));
CREATE POLICY "group_members_delete_tags_encomendas" ON public.tags_encomendas FOR DELETE TO authenticated
  USING (owner_group_id IS NOT NULL AND public.user_belongs_to_group(auth.uid(), owner_group_id) AND padrao_sistema = false);

-- =================== TABELAS APENAS COM owner_group_id (sem coluna de usuário) ===================
-- contratos, propostas, planejamento_metas, planejamento_datas_comemorativas, fechamentos_mensais
-- Para essas, basta verificar pertencimento ao grupo.

DO $$
DECLARE
  t TEXT;
  tbls TEXT[] := ARRAY['contratos','propostas','planejamento_metas','planejamento_datas_comemorativas','fechamentos_mensais'];
BEGIN
  FOREACH t IN ARRAY tbls LOOP
    EXECUTE format('CREATE POLICY "group_members_select_%I" ON public.%I FOR SELECT TO authenticated USING (owner_group_id IS NOT NULL AND public.user_belongs_to_group(auth.uid(), owner_group_id))', t, t);
    EXECUTE format('CREATE POLICY "group_members_insert_%I" ON public.%I FOR INSERT TO authenticated WITH CHECK (owner_group_id IS NOT NULL AND public.user_belongs_to_group(auth.uid(), owner_group_id))', t, t);
    EXECUTE format('CREATE POLICY "group_members_update_%I" ON public.%I FOR UPDATE TO authenticated USING (owner_group_id IS NOT NULL AND public.user_belongs_to_group(auth.uid(), owner_group_id)) WITH CHECK (owner_group_id IS NOT NULL AND public.user_belongs_to_group(auth.uid(), owner_group_id))', t, t);
    EXECUTE format('CREATE POLICY "group_members_delete_%I" ON public.%I FOR DELETE TO authenticated USING (owner_group_id IS NOT NULL AND public.user_belongs_to_group(auth.uid(), owner_group_id))', t, t);
  END LOOP;
END $$;