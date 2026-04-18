
CREATE OR REPLACE FUNCTION public.trigger_criar_ingredientes_padrao()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_gramas uuid;
  v_unidades uuid;
  v_mililitros uuid;
BEGIN
  SELECT id INTO v_gramas FROM public.unidades_medida WHERE usuario_id = NEW.id AND nome = 'Gramas' LIMIT 1;
  SELECT id INTO v_unidades FROM public.unidades_medida WHERE usuario_id = NEW.id AND nome = 'Unidades' LIMIT 1;
  SELECT id INTO v_mililitros FROM public.unidades_medida WHERE usuario_id = NEW.id AND nome = 'Mililitros' LIMIT 1;

  IF v_gramas IS NULL OR v_unidades IS NULL OR v_mililitros IS NULL THEN
    RETURN NEW;
  END IF;

  INSERT INTO public.tipos_insumos (usuario_id, tipo, descricao, quantidade_embalagem, unidade_medida_id) VALUES
    (NEW.id, 'ingrediente', 'Farinha de Trigo', 1000, v_gramas),
    (NEW.id, 'ingrediente', 'Açúcar Refinado', 1000, v_gramas),
    (NEW.id, 'ingrediente', 'Açúcar Cristal', 1000, v_gramas),
    (NEW.id, 'ingrediente', 'Açúcar Mascavo', 500, v_gramas),
    (NEW.id, 'ingrediente', 'Cacau em Pó', 1000, v_gramas),
    (NEW.id, 'ingrediente', 'Chocolate em Pó 50% Cacau', 1000, v_gramas),
    (NEW.id, 'ingrediente', 'Fermento Químico', 100, v_gramas),
    (NEW.id, 'ingrediente', 'Bicarbonato de Sódio', 80, v_gramas),
    (NEW.id, 'ingrediente', 'Amido de Milho', 500, v_gramas),
    (NEW.id, 'ingrediente', 'Ovos', 12, v_unidades),
    (NEW.id, 'ingrediente', 'Leite Ninho em Pó', 380, v_gramas),
    (NEW.id, 'ingrediente', 'Leite Integral', 1000, v_mililitros),
    (NEW.id, 'ingrediente', 'Manteiga sem Sal', 200, v_gramas),
    (NEW.id, 'ingrediente', 'Creme de Leite', 200, v_gramas),
    (NEW.id, 'ingrediente', 'Leite Condensado', 395, v_gramas),
    (NEW.id, 'ingrediente', 'Doce de Leite', 400, v_gramas),
    (NEW.id, 'ingrediente', 'Chantilly', 1000, v_mililitros),
    (NEW.id, 'ingrediente', 'Granulado', 500, v_gramas),
    (NEW.id, 'ingrediente', 'Pasta Americana', 800, v_gramas),
    (NEW.id, 'ingrediente', 'Essência de Baunilha', 250, v_mililitros),
    (NEW.id, 'ingrediente', 'Sal', 1000, v_gramas),
    (NEW.id, 'embalagem', 'Cake board 23cm', 1, v_unidades),
    (NEW.id, 'embalagem', 'Adesivo Redondo 5x5', 1000, v_unidades),
    (NEW.id, 'embalagem', 'Forminhas para Doces nº 05', 100, v_unidades)
  ON CONFLICT DO NOTHING;

  RETURN NEW;
END;
$$;
