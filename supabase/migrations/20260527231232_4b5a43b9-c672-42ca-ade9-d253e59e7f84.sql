-- Re-seed default categorias and unidades de medida for all existing users
DO $$
DECLARE
  user_record RECORD;
BEGIN
  FOR user_record IN SELECT DISTINCT id FROM auth.users LOOP
    PERFORM public.criar_categorias_padrao(user_record.id);
    PERFORM public.criar_unidades_medida_padrao(user_record.id);
  END LOOP;
END $$;