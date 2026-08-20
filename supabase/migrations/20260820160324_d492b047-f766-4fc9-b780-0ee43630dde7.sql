
DO $$
DECLARE
    master_rec RECORD;
    next_code_val INTEGER;
    next_code_str TEXT;
BEGIN
    FOR master_rec IN SELECT DISTINCT master_user_id FROM public.groups WHERE master_user_id IS NOT NULL LOOP
        
        -- 1. Unidade (ou Unidades conforme o hook)
        IF NOT EXISTS (SELECT 1 FROM public.unidades_medida WHERE usuario_id = master_rec.master_user_id AND (nome ILIKE 'Unidade%' OR sigla = 'un')) THEN
            SELECT COALESCE(MAX(codigo::INTEGER), 0) + 1 INTO next_code_val FROM public.unidades_medida WHERE usuario_id = master_rec.master_user_id;
            next_code_str := LPAD(next_code_val::TEXT, 3, '0');
            
            INSERT INTO public.unidades_medida (usuario_id, nome, sigla, codigo, ativo, e_padrao)
            VALUES (master_rec.master_user_id, 'Unidades', 'un', next_code_str, true, true);
        END IF;

        -- 2. Gramas
        IF NOT EXISTS (SELECT 1 FROM public.unidades_medida WHERE usuario_id = master_rec.master_user_id AND (nome = 'Gramas' OR sigla = 'g')) THEN
            SELECT COALESCE(MAX(codigo::INTEGER), 0) + 1 INTO next_code_val FROM public.unidades_medida WHERE usuario_id = master_rec.master_user_id;
            next_code_str := LPAD(next_code_val::TEXT, 3, '0');

            INSERT INTO public.unidades_medida (usuario_id, nome, sigla, codigo, ativo, e_padrao)
            VALUES (master_rec.master_user_id, 'Gramas', 'g', next_code_str, true, true);
        END IF;

        -- 3. Centímetros
        IF NOT EXISTS (SELECT 1 FROM public.unidades_medida WHERE usuario_id = master_rec.master_user_id AND (nome = 'Centímetros' OR sigla = 'cm')) THEN
            SELECT COALESCE(MAX(codigo::INTEGER), 0) + 1 INTO next_code_val FROM public.unidades_medida WHERE usuario_id = master_rec.master_user_id;
            next_code_str := LPAD(next_code_val::TEXT, 3, '0');

            INSERT INTO public.unidades_medida (usuario_id, nome, sigla, codigo, ativo, e_padrao)
            VALUES (master_rec.master_user_id, 'Centímetros', 'cm', next_code_str, true, true);
        END IF;

    END LOOP;
END $$;
