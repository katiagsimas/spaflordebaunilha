
DO $$
DECLARE
    new_user_id UUID := gen_random_uuid();
    v_email TEXT := 'katiagsimas@gmail.com';
    v_name TEXT := 'Spa Flor de Baunilha';
    v_password TEXT := 'W15k27g06g03@';
BEGIN
    -- 1. Create valid plans first
    INSERT INTO public.planos (id, nome, descricao, ativo)
    VALUES 
        ('base', 'Flor de Baunilha Lite', 'Plano básico', true),
        ('negocio', 'Flor de Baunilha Business', 'Plano completo', true)
    ON CONFLICT (id) DO NOTHING;

    -- 2. Create the user in auth.users
    INSERT INTO auth.users (
        id,
        instance_id,
        email,
        encrypted_password,
        email_confirmed_at,
        raw_app_meta_data,
        raw_user_meta_data,
        created_at,
        updated_at,
        role,
        confirmation_token,
        email_change,
        email_change_token_new,
        recovery_token
    )
    VALUES (
        new_user_id,
        '00000000-0000-0000-0000-000000000000',
        v_email,
        extensions.crypt(v_password, extensions.gen_salt('bf')),
        now(),
        '{"provider":"email","providers":["email"]}',
        jsonb_build_object('nome_completo', v_name),
        now(),
        now(),
        'authenticated',
        '',
        '',
        '',
        ''
    );

    -- 3. Create the identity
    INSERT INTO auth.identities (
        id,
        user_id,
        identity_data,
        provider,
        provider_id,
        last_sign_in_at,
        created_at,
        updated_at
    )
    VALUES (
        new_user_id,
        new_user_id,
        jsonb_build_object('sub', new_user_id::text, 'email', v_email),
        'email',
        new_user_id::text,
        now(),
        now(),
        now()
    );

    -- 4. Create the profile
    INSERT INTO public.profiles (
        id,
        email,
        nome_completo,
        nome_confeitaria,
        ativo,
        plano_id,
        plano_tipo,
        plano_inicio,
        plano_fim,
        primeiro_acesso,
        onboarding_concluido,
        onboarding_iniciado,
        origem_criacao
    )
    VALUES (
        new_user_id,
        v_email,
        v_name,
        v_name,
        true,
        'negocio',
        'anual',
        CURRENT_DATE,
        CURRENT_DATE + interval '100 years',
        false,
        true,
        true,
        'admin'
    );

    -- 5. Assign Admin Role
    INSERT INTO public.user_roles (user_id, role)
    VALUES (new_user_id, 'admin');

    -- 6. Create Group
    INSERT INTO public.groups (
        name,
        created_by_user_id,
        master_user_id,
        is_active
    )
    VALUES (
        v_name,
        new_user_id,
        new_user_id,
        true
    );

    -- 7. Assign Group Role
    INSERT INTO public.user_group_roles (
        user_id,
        group_id,
        role_group,
        permission_flags,
        is_active
    )
    SELECT 
        new_user_id,
        id,
        'ADMIN',
        '{"financeiro_view": true, "financeiro_edit": true, "metas_view": true, "metas_edit": true, "tarefas_view": true, "tarefas_edit": true, "cadastros_view": true, "cadastros_edit": true, "receitas_view": true, "receitas_edit": true, "encomendas_view": true, "encomendas_edit": true, "precificacao_view": true, "precificacao_edit": true, "admin_users_manage": true}',
        true
    FROM public.groups WHERE master_user_id = new_user_id;

    -- 8. Set Active Session
    INSERT INTO public.user_active_session (
        user_id,
        active_group_id,
        mode
    )
    SELECT 
        new_user_id,
        id,
        'group'
    FROM public.groups WHERE master_user_id = new_user_id;

END $$;
