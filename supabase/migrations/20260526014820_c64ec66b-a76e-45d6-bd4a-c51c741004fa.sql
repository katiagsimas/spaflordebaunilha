-- Adicionar coluna offer_code
ALTER TABLE public.hotmart_produtos
  ADD COLUMN IF NOT EXISTS offer_code text;

-- Recriar PK como (product_id, offer_code)
-- NULL em offer_code é tratado como "qualquer oferta" (fallback)
ALTER TABLE public.hotmart_produtos
  DROP CONSTRAINT IF EXISTS hotmart_produtos_pkey;

-- Índice único que trata NULL como valor distinto (permite 1 linha com offer_code NULL por produto)
CREATE UNIQUE INDEX IF NOT EXISTS hotmart_produtos_product_offer_uniq
  ON public.hotmart_produtos (product_id, COALESCE(offer_code, ''));

-- Inserir ofertas do Caixa Business (product_id 7448785)
INSERT INTO public.hotmart_produtos (product_id, offer_code, plano_id, plano_tipo, descricao, ativo)
VALUES
  ('7448785', 'n20dvd6j', 'negocio', 'mensal', 'Caixa Business - Oferta Mensal', true),
  ('7448785', 'mto997mw', 'negocio', 'anual',  'Caixa Business - Oferta Anual',  true)
ON CONFLICT DO NOTHING;