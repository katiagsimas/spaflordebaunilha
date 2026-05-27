
-- 1. Limpa todas as tags por usuário (não há uso em encomendas_tags)
DELETE FROM public.tags_encomendas;

-- 2. Insere as tags como padrão do sistema (user_id NULL, padrao_sistema true)
INSERT INTO public.tags_encomendas (nome, cor, descricao, user_id, padrao_sistema, ativo) VALUES
  ('Aniversário',   '#EF4444', 'Encomendas de aniversário', NULL, true, true),
  ('Bodas',          '#A855F7', 'Comemoração de bodas',     NULL, true, true),
  ('Casamento',      '#EC4899', 'Festas de casamento',       NULL, true, true),
  ('Corporativo',    '#6366F1', 'Eventos corporativos',      NULL, true, true),
  ('Delivery',       '#10B981', 'Entregas a domicílio',     NULL, true, true),
  ('Infantil',       '#F472B6', 'Festas infantis',           NULL, true, true),
  ('Mesversário',   '#F59E0B', 'Comemorações mensais',     NULL, true, true),
  ('Personalizado',  '#8B5CF6', 'Produtos personalizados',   NULL, true, true),
  ('Retirada',       '#3B82F6', 'Cliente retira no local',   NULL, true, true),
  ('Urgente',        '#DC2626', 'Pedidos urgentes',          NULL, true, true);

-- 3. Atualiza a função de provisionamento para não criar mais cópias por usuário
CREATE OR REPLACE FUNCTION public.criar_tags_padrao_encomendas(p_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- As tags padrão agora são do sistema (user_id NULL, padrao_sistema = true)
  -- e ficam visíveis para todos os usuários via RLS. Nada a fazer por usuário.
  RETURN;
END;
$$;
