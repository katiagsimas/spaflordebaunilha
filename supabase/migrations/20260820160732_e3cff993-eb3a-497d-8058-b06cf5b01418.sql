
-- Fix records with missing owner_group_id
DO $$
BEGIN
    -- Fix categorias
    UPDATE public.categorias AS c
    SET owner_group_id = g.id
    FROM public.groups AS g
    WHERE c.usuario_id = g.master_user_id
    AND c.owner_group_id IS NULL;

    -- Fix unidades_medida
    UPDATE public.unidades_medida AS u
    SET owner_group_id = g.id
    FROM public.groups AS g
    WHERE u.usuario_id = g.master_user_id
    AND u.owner_group_id IS NULL;

    -- Fix bancos
    UPDATE public.bancos AS b
    SET owner_group_id = g.id
    FROM public.groups AS g
    WHERE b.usuario_id = g.master_user_id
    AND b.owner_group_id IS NULL;

    -- Fix tipos_insumos
    UPDATE public.tipos_insumos AS t
    SET owner_group_id = g.id
    FROM public.groups AS g
    WHERE t.usuario_id = g.master_user_id
    AND t.owner_group_id IS NULL;

    -- Fix ingredientes
    UPDATE public.ingredientes AS i
    SET owner_group_id = g.id
    FROM public.groups AS g
    WHERE i.usuario_id = g.master_user_id
    AND i.owner_group_id IS NULL;

    -- Fix embalagens
    UPDATE public.embalagens AS e
    SET owner_group_id = g.id
    FROM public.groups AS g
    WHERE e.usuario_id = g.master_user_id
    AND e.owner_group_id IS NULL;

    -- Also check receitas and estoque just in case
    UPDATE public.receitas AS rec
    SET owner_group_id = g.id
    FROM public.groups AS g
    WHERE rec.usuario_id = g.master_user_id
    AND rec.owner_group_id IS NULL;

    UPDATE public.estoque AS est
    SET owner_group_id = g.id
    FROM public.groups AS g
    WHERE est.usuario_id = g.master_user_id
    AND est.owner_group_id IS NULL;

END $$;
