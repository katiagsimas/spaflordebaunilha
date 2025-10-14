-- Alterar coluna topo_imagem_url para suportar múltiplas imagens em formato JSON
ALTER TABLE public.encomendas 
DROP COLUMN IF EXISTS topo_imagem_url;

ALTER TABLE public.encomendas 
ADD COLUMN IF NOT EXISTS topo_imagens JSONB DEFAULT '[]'::jsonb;