DO $$
DECLARE
    u_id uuid;
    g_id uuid;
BEGIN
    -- Busca um usuário mestre (dono de grupo) para associar o banco
    -- Em um sistema multi-tenant, bancos geralmente são específicos de cada grupo/usuário
    -- Mas o pedido fala em "cadastro do Banco", o que pode implicar um banco padrão para todos ou para o usuário atual.
    -- Dado o contexto de "persistência no banco de dados", faremos via migration/SQL.
    
    FOR u_id, g_id IN 
        SELECT p.id, p.active_group_id 
        FROM public.profiles p
        JOIN public.user_group_roles ugr ON p.id = ugr.user_id
        WHERE ugr.role_group = 'MOTHER'
    LOOP
        -- Insere se não existir para este grupo
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
            u_id, 
            g_id, 
            '301', 
            'EMANAPAY', 
            'Conta Corrente', 
            0, 
            TRUE, 
            FALSE, 
            TRUE
        )
        ON CONFLICT (usuario_id, codigo) DO NOTHING;
    END LOOP;
END $$;
