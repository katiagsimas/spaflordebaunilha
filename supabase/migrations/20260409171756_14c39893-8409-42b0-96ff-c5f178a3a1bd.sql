DO $$
BEGIN
  UPDATE public.profiles
  SET plano_tipo = 'mensal',
      plano_inicio = CURRENT_DATE,
      plano_fim = CURRENT_DATE + 30
  WHERE plano_inicio IS NULL;
  
  RAISE NOTICE 'Rows updated: %', found;
END $$;