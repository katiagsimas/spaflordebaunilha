-- Adicionar campo padrao_sistema e permitir user_id NULL para tags de sistema
ALTER TABLE tags_encomendas 
  ALTER COLUMN user_id DROP NOT NULL,
  ADD COLUMN IF NOT EXISTS padrao_sistema BOOLEAN DEFAULT false;

-- Inserir tags do grupo ORIGEM DO PEDIDO
INSERT INTO tags_encomendas (user_id, nome, cor, descricao, ativo, padrao_sistema) VALUES
  (NULL, 'Instagram', '#E4405F', 'Pedido originado do Instagram', true, true),
  (NULL, 'WhatsApp', '#25D366', 'Pedido originado do WhatsApp', true, true),
  (NULL, 'Indicação', '#64748B', 'Pedido por indicação de cliente', true, true),
  (NULL, 'Google Maps', '#4285F4', 'Pedido via Google Maps', true, true),
  (NULL, 'Fidelização Interna', '#8B5CF6', 'Cliente do programa de fidelidade', true, true),
  (NULL, 'Parceria Local', '#F59E0B', 'Pedido via parceria local', true, true);

-- Inserir tags do grupo TIPO DE ENTREGA
INSERT INTO tags_encomendas (user_id, nome, cor, descricao, ativo, padrao_sistema) VALUES
  (NULL, 'Retirada', '#10B981', 'Cliente retira no local', true, true),
  (NULL, 'Delivery', '#EF4444', 'Entrega a domicílio', true, true);

-- Inserir tags do grupo RECORRÊNCIA
INSERT INTO tags_encomendas (user_id, nome, cor, descricao, ativo, padrao_sistema) VALUES
  (NULL, 'Primeira Compra', '#06B6D4', 'Primeiro pedido do cliente', true, true),
  (NULL, 'Cliente Recorrente', '#84CC16', 'Cliente com pedidos anteriores', true, true),
  (NULL, 'Assinatura', '#A855F7', 'Cliente com assinatura ativa', true, true);

-- Inserir tags do grupo TIPO DE EVENTO
INSERT INTO tags_encomendas (user_id, nome, cor, descricao, ativo, padrao_sistema) VALUES
  (NULL, 'Aniversário Infantil', '#F472B6', 'Festa de aniversário infantil', true, true),
  (NULL, 'Aniversário Adulto', '#FB923C', 'Festa de aniversário adulto', true, true),
  (NULL, 'Mesversário', '#FDE047', 'Comemoração de mesversário', true, true),
  (NULL, 'Batizado', '#93C5FD', 'Festa de batizado', true, true),
  (NULL, 'Casamento', '#FCA5A5', 'Festa de casamento', true, true),
  (NULL, 'Noivado', '#FDA4AF', 'Festa de noivado', true, true),
  (NULL, 'Chá de Bebê', '#C4B5FD', 'Chá de bebê', true, true),
  (NULL, 'Chá de Fraldas', '#DDD6FE', 'Chá de fraldas', true, true),
  (NULL, 'Empresarial', '#64748B', 'Evento corporativo', true, true);

-- Atualizar RLS policies para permitir tags de sistema (user_id NULL)
DROP POLICY IF EXISTS "Users can manage own tags_encomendas" ON tags_encomendas;

CREATE POLICY "Users can view all active tags"
  ON tags_encomendas FOR SELECT
  USING (ativo = true AND (user_id IS NULL OR user_id = auth.uid()));

CREATE POLICY "Users can manage own tags"
  ON tags_encomendas FOR ALL
  USING (user_id = auth.uid() AND (padrao_sistema IS NULL OR padrao_sistema = false))
  WITH CHECK (user_id = auth.uid() AND (padrao_sistema IS NULL OR padrao_sistema = false));

-- Garantir que tags de sistema não possam ser excluídas
CREATE POLICY "System tags cannot be deleted"
  ON tags_encomendas FOR DELETE
  USING (padrao_sistema = false OR padrao_sistema IS NULL);