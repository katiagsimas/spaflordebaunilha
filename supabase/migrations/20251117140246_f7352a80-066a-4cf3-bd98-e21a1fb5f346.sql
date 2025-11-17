-- =====================================================
-- PARTE 2: INSERIR TAGS PADRÃO DO SISTEMA
-- =====================================================

-- Inserir tags de ORIGEM DO PEDIDO (se não existirem)
INSERT INTO public.tags_encomendas (nome, cor, user_id, padrao_sistema, ativo, descricao)
SELECT 'instagram', '#64748b', NULL, true, true, NULL
WHERE NOT EXISTS (SELECT 1 FROM public.tags_encomendas WHERE nome = 'instagram' AND padrao_sistema = true);

INSERT INTO public.tags_encomendas (nome, cor, user_id, padrao_sistema, ativo, descricao)
SELECT 'whatsapp', '#64748b', NULL, true, true, NULL
WHERE NOT EXISTS (SELECT 1 FROM public.tags_encomendas WHERE nome = 'whatsapp' AND padrao_sistema = true);

INSERT INTO public.tags_encomendas (nome, cor, user_id, padrao_sistema, ativo, descricao)
SELECT 'indicação', '#64748b', NULL, true, true, NULL
WHERE NOT EXISTS (SELECT 1 FROM public.tags_encomendas WHERE nome = 'indicação' AND padrao_sistema = true);

INSERT INTO public.tags_encomendas (nome, cor, user_id, padrao_sistema, ativo, descricao)
SELECT 'google maps', '#64748b', NULL, true, true, NULL
WHERE NOT EXISTS (SELECT 1 FROM public.tags_encomendas WHERE nome = 'google maps' AND padrao_sistema = true);

INSERT INTO public.tags_encomendas (nome, cor, user_id, padrao_sistema, ativo, descricao)
SELECT 'fidelização interna', '#64748b', NULL, true, true, NULL
WHERE NOT EXISTS (SELECT 1 FROM public.tags_encomendas WHERE nome = 'fidelização interna' AND padrao_sistema = true);

INSERT INTO public.tags_encomendas (nome, cor, user_id, padrao_sistema, ativo, descricao)
SELECT 'parceria local', '#64748b', NULL, true, true, NULL
WHERE NOT EXISTS (SELECT 1 FROM public.tags_encomendas WHERE nome = 'parceria local' AND padrao_sistema = true);

-- Inserir tags de TIPO DE ENTREGA (se não existirem)
INSERT INTO public.tags_encomendas (nome, cor, user_id, padrao_sistema, ativo, descricao)
SELECT 'retirada', '#64748b', NULL, true, true, NULL
WHERE NOT EXISTS (SELECT 1 FROM public.tags_encomendas WHERE nome = 'retirada' AND padrao_sistema = true);

INSERT INTO public.tags_encomendas (nome, cor, user_id, padrao_sistema, ativo, descricao)
SELECT 'delivery', '#64748b', NULL, true, true, NULL
WHERE NOT EXISTS (SELECT 1 FROM public.tags_encomendas WHERE nome = 'delivery' AND padrao_sistema = true);

-- Inserir tags de RECORRÊNCIA (se não existirem)
INSERT INTO public.tags_encomendas (nome, cor, user_id, padrao_sistema, ativo, descricao)
SELECT 'primeira compra', '#64748b', NULL, true, true, NULL
WHERE NOT EXISTS (SELECT 1 FROM public.tags_encomendas WHERE nome = 'primeira compra' AND padrao_sistema = true);

INSERT INTO public.tags_encomendas (nome, cor, user_id, padrao_sistema, ativo, descricao)
SELECT 'cliente recorrente', '#64748b', NULL, true, true, NULL
WHERE NOT EXISTS (SELECT 1 FROM public.tags_encomendas WHERE nome = 'cliente recorrente' AND padrao_sistema = true);

INSERT INTO public.tags_encomendas (nome, cor, user_id, padrao_sistema, ativo, descricao)
SELECT 'assinatura', '#64748b', NULL, true, true, NULL
WHERE NOT EXISTS (SELECT 1 FROM public.tags_encomendas WHERE nome = 'assinatura' AND padrao_sistema = true);

-- Inserir tags de TIPO DE EVENTO (se não existirem)
INSERT INTO public.tags_encomendas (nome, cor, user_id, padrao_sistema, ativo, descricao)
SELECT 'aniversário infantil', '#64748b', NULL, true, true, NULL
WHERE NOT EXISTS (SELECT 1 FROM public.tags_encomendas WHERE nome = 'aniversário infantil' AND padrao_sistema = true);

INSERT INTO public.tags_encomendas (nome, cor, user_id, padrao_sistema, ativo, descricao)
SELECT 'aniversário adulto', '#64748b', NULL, true, true, NULL
WHERE NOT EXISTS (SELECT 1 FROM public.tags_encomendas WHERE nome = 'aniversário adulto' AND padrao_sistema = true);

INSERT INTO public.tags_encomendas (nome, cor, user_id, padrao_sistema, ativo, descricao)
SELECT 'mesversário', '#64748b', NULL, true, true, NULL
WHERE NOT EXISTS (SELECT 1 FROM public.tags_encomendas WHERE nome = 'mesversário' AND padrao_sistema = true);

INSERT INTO public.tags_encomendas (nome, cor, user_id, padrao_sistema, ativo, descricao)
SELECT 'batizado', '#64748b', NULL, true, true, NULL
WHERE NOT EXISTS (SELECT 1 FROM public.tags_encomendas WHERE nome = 'batizado' AND padrao_sistema = true);

INSERT INTO public.tags_encomendas (nome, cor, user_id, padrao_sistema, ativo, descricao)
SELECT 'casamento', '#64748b', NULL, true, true, NULL
WHERE NOT EXISTS (SELECT 1 FROM public.tags_encomendas WHERE nome = 'casamento' AND padrao_sistema = true);

INSERT INTO public.tags_encomendas (nome, cor, user_id, padrao_sistema, ativo, descricao)
SELECT 'noivado', '#64748b', NULL, true, true, NULL
WHERE NOT EXISTS (SELECT 1 FROM public.tags_encomendas WHERE nome = 'noivado' AND padrao_sistema = true);

INSERT INTO public.tags_encomendas (nome, cor, user_id, padrao_sistema, ativo, descricao)
SELECT 'chá de bebê', '#64748b', NULL, true, true, NULL
WHERE NOT EXISTS (SELECT 1 FROM public.tags_encomendas WHERE nome = 'chá de bebê' AND padrao_sistema = true);

INSERT INTO public.tags_encomendas (nome, cor, user_id, padrao_sistema, ativo, descricao)
SELECT 'chá de fraldas', '#64748b', NULL, true, true, NULL
WHERE NOT EXISTS (SELECT 1 FROM public.tags_encomendas WHERE nome = 'chá de fraldas' AND padrao_sistema = true);

INSERT INTO public.tags_encomendas (nome, cor, user_id, padrao_sistema, ativo, descricao)
SELECT 'empresarial', '#64748b', NULL, true, true, NULL
WHERE NOT EXISTS (SELECT 1 FROM public.tags_encomendas WHERE nome = 'empresarial' AND padrao_sistema = true);

-- =====================================================
-- PARTE 3: BLOQUEAR EXCLUSÃO DE TAGS DO SISTEMA
-- =====================================================

-- Criar política RLS para impedir DELETE de tags do sistema
DROP POLICY IF EXISTS "System tags cannot be deleted" ON public.tags_encomendas;

CREATE POLICY "Prevent delete system tags"
ON public.tags_encomendas
FOR DELETE
USING (
  padrao_sistema = false 
  OR padrao_sistema IS NULL
);

-- Comentário explicativo
COMMENT ON POLICY "Prevent delete system tags" ON public.tags_encomendas IS 
'Impede a exclusão de tags com padrao_sistema = true. Apenas tags criadas pelos usuários (padrao_sistema = false ou NULL) podem ser excluídas.';