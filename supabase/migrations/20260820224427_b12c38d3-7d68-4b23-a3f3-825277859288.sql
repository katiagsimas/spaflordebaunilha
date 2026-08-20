-- Migration for Revenda Products
CREATE TABLE IF NOT EXISTS public.produtos_revenda (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    codigo TEXT,
    descricao TEXT NOT NULL,
    marca TEXT NOT NULL, -- 'natura', 'avon', 'casa_estilo'
    linha TEXT,
    quantidade_ml TEXT,
    quantidade_pontos NUMERIC DEFAULT 0,
    categoria_id UUID REFERENCES public.categorias(id),
    status TEXT DEFAULT 'Ativo' CHECK (status IN ('Ativo', 'Pausado')),
    owner_group_id UUID REFERENCES public.groups(id),
    usuario_id UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- RLS
ALTER TABLE public.produtos_revenda ENABLE ROW LEVEL SECURITY;

-- Grants
GRANT SELECT, INSERT, UPDATE, DELETE ON public.produtos_revenda TO authenticated;
GRANT ALL ON public.produtos_revenda TO service_role;

-- Policies
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'produtos_revenda' 
        AND policyname = 'Users can manage their own group products_revenda'
    ) THEN
        CREATE POLICY "Users can manage their own group products_revenda"
        ON public.produtos_revenda
        FOR ALL
        TO authenticated
        USING (owner_group_id = (SELECT active_group_id FROM public.user_active_session WHERE user_id = auth.uid()));
    END IF;
END
$$;

-- Update trigger for updated_at
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS tr_produtos_revenda_updated_at ON public.produtos_revenda;
CREATE TRIGGER tr_produtos_revenda_updated_at
    BEFORE UPDATE ON public.produtos_revenda
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();
