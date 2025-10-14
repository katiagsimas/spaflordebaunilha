-- Create table for encomenda items
CREATE TABLE IF NOT EXISTS public.encomenda_itens (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  encomenda_id UUID NOT NULL,
  receita_id TEXT NOT NULL,
  produto TEXT NOT NULL,
  quantidade NUMERIC NOT NULL,
  unidade_medida TEXT NOT NULL,
  valor_unitario NUMERIC NOT NULL,
  subtotal NUMERIC NOT NULL,
  usuario_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.encomenda_itens ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view own encomenda_itens" 
ON public.encomenda_itens 
FOR SELECT 
USING (auth.uid() = usuario_id);

CREATE POLICY "Users can insert own encomenda_itens" 
ON public.encomenda_itens 
FOR INSERT 
WITH CHECK (auth.uid() = usuario_id);

CREATE POLICY "Users can update own encomenda_itens" 
ON public.encomenda_itens 
FOR UPDATE 
USING (auth.uid() = usuario_id)
WITH CHECK (auth.uid() = usuario_id);

CREATE POLICY "Users can delete own encomenda_itens" 
ON public.encomenda_itens 
FOR DELETE 
USING (auth.uid() = usuario_id);

-- Add trigger for updated_at
CREATE TRIGGER update_encomenda_itens_updated_at
BEFORE UPDATE ON public.encomenda_itens
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();