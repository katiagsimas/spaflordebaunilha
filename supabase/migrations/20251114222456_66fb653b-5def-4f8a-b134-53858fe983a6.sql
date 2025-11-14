-- Adiciona campo categoria na tabela ingredientes para vincular com categorias_estoque
ALTER TABLE public.ingredientes 
ADD COLUMN categoria text;

-- Adiciona índice para melhor performance nas consultas
CREATE INDEX idx_ingredientes_categoria ON public.ingredientes(categoria);

-- Comentário explicativo
COMMENT ON COLUMN public.ingredientes.categoria IS 'ID da categoria de estoque (categorias_estoque.id)';