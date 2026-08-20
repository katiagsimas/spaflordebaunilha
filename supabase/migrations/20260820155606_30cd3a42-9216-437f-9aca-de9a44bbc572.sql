
DO $$
DECLARE
    r RECORD;
BEGIN
    -- Busca todos os grupos e seus mestres para inserir o banco padrão
    FOR r IN 
        SELECT master_user_id as user_id, id as group_id
        FROM public.groups
        WHERE is_active = true
    LOOP
        INSERT INTO public.bancos (
            usuario_id, 
            owner_group_id, 
            codigo, 
            nome, 
            tipo, 
            saldo_inicial, 
            e_banco_oficial, 
            e_customizado, 
            habilitado
        )
        VALUES (
            r.user_id, 
            r.group_id, 
            '301', 
            'EMANAPAY', 
            'Conta Corrente', 
            0, 
            TRUE, 
            FALSE, 
            TRUE
        )
        ON CONFLICT (usuario_id, codigo) DO UPDATE 
        SET nome = EXCLUDED.nome, tipo = EXCLUDED.tipo, habilitado = TRUE;
    END LOOP;
END $$;
