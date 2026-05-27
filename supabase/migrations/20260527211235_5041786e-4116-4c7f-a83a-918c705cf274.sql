-- Tags padrão do sistema: Origem
INSERT INTO public.tags_encomendas (user_id, nome, cor, padrao_sistema, ativo)
SELECT NULL, v.nome, v.cor, true, true
FROM (VALUES
  ('Instagram',           '#E1306C'),
  ('WhatsApp',            '#25D366'),
  ('Indicação',           '#F59E0B'),
  ('Google Maps',         '#4285F4'),
  ('Fidelização Interna', '#8B5CF6'),
  ('Parceria Local',      '#0EA5E9')
) AS v(nome, cor)
WHERE NOT EXISTS (
  SELECT 1 FROM public.tags_encomendas t
  WHERE t.user_id IS NULL
    AND t.padrao_sistema = true
    AND lower(t.nome) = lower(v.nome)
);

-- Tags padrão do sistema: Evento
INSERT INTO public.tags_encomendas (user_id, nome, cor, padrao_sistema, ativo)
SELECT NULL, v.nome, v.cor, true, true
FROM (VALUES
  ('Aniversário Infantil', '#F472B6'),
  ('Aniversário Adulto',   '#EF4444'),
  ('Mesversário',          '#FB923C'),
  ('Batizado',             '#60A5FA'),
  ('Casamento',            '#EC4899'),
  ('Noivado',              '#F9A8D4'),
  ('Chá de Bebê',          '#A7F3D0'),
  ('Chá de Fraldas',       '#FCD34D'),
  ('Empresarial',          '#6366F1')
) AS v(nome, cor)
WHERE NOT EXISTS (
  SELECT 1 FROM public.tags_encomendas t
  WHERE t.user_id IS NULL
    AND t.padrao_sistema = true
    AND lower(t.nome) = lower(v.nome)
);