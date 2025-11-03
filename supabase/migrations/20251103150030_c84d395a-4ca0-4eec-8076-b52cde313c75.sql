-- Adicionar coluna controlar_estoque nas tabelas ingredientes e embalagens
ALTER TABLE public.ingredientes
ADD COLUMN IF NOT EXISTS controlar_estoque BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE public.embalagens
ADD COLUMN IF NOT EXISTS controlar_estoque BOOLEAN NOT NULL DEFAULT false;

-- Comentários
COMMENT ON COLUMN public.ingredientes.controlar_estoque IS 'Define se o item deve ser controlado no estoque';
COMMENT ON COLUMN public.embalagens.controlar_estoque IS 'Define se o item deve ser controlado no estoque';