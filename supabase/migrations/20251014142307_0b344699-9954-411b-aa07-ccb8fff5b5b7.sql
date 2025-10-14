-- Aumentar tamanho do campo cpf para suportar CNPJ formatado
ALTER TABLE public.profiles 
ALTER COLUMN cpf TYPE character varying(18);

-- Adicionar comentário explicativo
COMMENT ON COLUMN public.profiles.cpf IS 'Campo para CPF (14 chars com formatação) ou CNPJ (18 chars com formatação)';