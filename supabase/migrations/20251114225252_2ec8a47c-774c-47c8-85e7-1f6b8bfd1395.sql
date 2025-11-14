-- Adicionar colunas categoria_estoque_id e controlar_estoque na tabela tipos_insumos
ALTER TABLE public.tipos_insumos 
ADD COLUMN IF NOT EXISTS categoria_estoque_id uuid REFERENCES public.categorias_estoque(id),
ADD COLUMN IF NOT EXISTS controlar_estoque boolean DEFAULT false;

-- Criar índice para melhorar performance de queries
CREATE INDEX IF NOT EXISTS idx_tipos_insumos_categoria_estoque 
ON public.tipos_insumos(categoria_estoque_id);