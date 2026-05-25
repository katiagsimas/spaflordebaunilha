DELETE FROM public.historico_planos WHERE plano_novo = 'start' OR plano_anterior = 'start';
DELETE FROM public.planos WHERE id = 'start';