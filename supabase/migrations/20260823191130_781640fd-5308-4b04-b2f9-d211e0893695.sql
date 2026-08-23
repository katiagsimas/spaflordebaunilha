-- Renomear colunas para padrão receita se necessário, ou garantir que existam
-- Verificando estrutura atual via linter/erros de tipagem sugere que o código usa tempo_receita
-- mas o banco pode ter tempo_preparo ou similar.
-- Baseado no erro: Property 'tempo_receita' does not exist... Did you mean 'tempo_preparo'?

DO $$ 
BEGIN 
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'pre_preparos' AND column_name = 'tempo_preparo') THEN
        ALTER TABLE public.pre_preparos RENAME COLUMN tempo_preparo TO tempo_receita;
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'pre_preparos' AND column_name = 'tempo_preparo_unidade') THEN
        ALTER TABLE public.pre_preparos RENAME COLUMN tempo_preparo_unidade TO tempo_receita_unidade;
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'pre_preparos' AND column_name = 'modo_preparo') THEN
        ALTER TABLE public.pre_preparos RENAME COLUMN modo_preparo TO modo_receita;
    END IF;
END $$;
