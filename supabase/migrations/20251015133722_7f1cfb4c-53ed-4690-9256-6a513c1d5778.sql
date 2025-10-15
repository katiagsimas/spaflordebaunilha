-- Criar tabela tipos_documento
CREATE TABLE IF NOT EXISTS public.tipos_documento (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  usuario_id UUID NOT NULL,
  codigo VARCHAR NOT NULL,
  descricao VARCHAR NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.tipos_documento ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view own tipos_documento" 
ON public.tipos_documento 
FOR SELECT 
USING (auth.uid() = usuario_id);

CREATE POLICY "Users can insert own tipos_documento" 
ON public.tipos_documento 
FOR INSERT 
WITH CHECK (auth.uid() = usuario_id);

CREATE POLICY "Users can update own tipos_documento" 
ON public.tipos_documento 
FOR UPDATE 
USING (auth.uid() = usuario_id)
WITH CHECK (auth.uid() = usuario_id);

CREATE POLICY "Users can delete own tipos_documento" 
ON public.tipos_documento 
FOR DELETE 
USING (auth.uid() = usuario_id);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_tipos_documento_updated_at
BEFORE UPDATE ON public.tipos_documento
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();