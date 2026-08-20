
DO $$
DECLARE
    master_rec RECORD;
BEGIN
    FOR master_rec IN SELECT DISTINCT master_user_id FROM public.groups WHERE master_user_id IS NOT NULL LOOP
        -- Escalda Pés
        IF NOT EXISTS (SELECT 1 FROM public.categorias WHERE usuario_id = master_rec.master_user_id AND nome = 'Escalda Pés') THEN
            INSERT INTO public.categorias (usuario_id, nome, ativo, padrao_sistema)
            VALUES (master_rec.master_user_id, 'Escalda Pés', true, false);
        END IF;

        -- Jelly Spa
        IF NOT EXISTS (SELECT 1 FROM public.categorias WHERE usuario_id = master_rec.master_user_id AND nome = 'Jelly Spa') THEN
            INSERT INTO public.categorias (usuario_id, nome, ativo, padrao_sistema)
            VALUES (master_rec.master_user_id, 'Jelly Spa', true, false);
        END IF;
    END LOOP;
END $$;
