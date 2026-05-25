-- Consolidar group-scoping: substituir user_in_group por user_belongs_to_group
-- em fechamentos_mensais e fechamento_checklist_itens

-- fechamentos_mensais
DROP POLICY IF EXISTS "Grupo vê fechamentos" ON public.fechamentos_mensais;
DROP POLICY IF EXISTS "Grupo insere fechamentos" ON public.fechamentos_mensais;
DROP POLICY IF EXISTS "Grupo atualiza fechamentos" ON public.fechamentos_mensais;
DROP POLICY IF EXISTS "Grupo deleta fechamentos" ON public.fechamentos_mensais;

CREATE POLICY "Grupo vê fechamentos"
ON public.fechamentos_mensais
FOR SELECT
USING (user_belongs_to_group(auth.uid(), owner_group_id));

CREATE POLICY "Grupo insere fechamentos"
ON public.fechamentos_mensais
FOR INSERT
WITH CHECK (user_belongs_to_group(auth.uid(), owner_group_id));

CREATE POLICY "Grupo atualiza fechamentos"
ON public.fechamentos_mensais
FOR UPDATE
USING (user_belongs_to_group(auth.uid(), owner_group_id))
WITH CHECK (user_belongs_to_group(auth.uid(), owner_group_id));

CREATE POLICY "Grupo deleta fechamentos"
ON public.fechamentos_mensais
FOR DELETE
USING (user_belongs_to_group(auth.uid(), owner_group_id));

-- fechamento_checklist_itens
DROP POLICY IF EXISTS "Grupo vê checklist" ON public.fechamento_checklist_itens;
DROP POLICY IF EXISTS "Grupo insere checklist" ON public.fechamento_checklist_itens;
DROP POLICY IF EXISTS "Grupo atualiza checklist" ON public.fechamento_checklist_itens;
DROP POLICY IF EXISTS "Grupo deleta checklist" ON public.fechamento_checklist_itens;

CREATE POLICY "Grupo vê checklist"
ON public.fechamento_checklist_itens
FOR SELECT
USING (EXISTS (
  SELECT 1 FROM public.fechamentos_mensais f
  WHERE f.id = fechamento_checklist_itens.fechamento_id
    AND user_belongs_to_group(auth.uid(), f.owner_group_id)
));

CREATE POLICY "Grupo insere checklist"
ON public.fechamento_checklist_itens
FOR INSERT
WITH CHECK (EXISTS (
  SELECT 1 FROM public.fechamentos_mensais f
  WHERE f.id = fechamento_checklist_itens.fechamento_id
    AND user_belongs_to_group(auth.uid(), f.owner_group_id)
));

CREATE POLICY "Grupo atualiza checklist"
ON public.fechamento_checklist_itens
FOR UPDATE
USING (EXISTS (
  SELECT 1 FROM public.fechamentos_mensais f
  WHERE f.id = fechamento_checklist_itens.fechamento_id
    AND user_belongs_to_group(auth.uid(), f.owner_group_id)
));

CREATE POLICY "Grupo deleta checklist"
ON public.fechamento_checklist_itens
FOR DELETE
USING (EXISTS (
  SELECT 1 FROM public.fechamentos_mensais f
  WHERE f.id = fechamento_checklist_itens.fechamento_id
    AND user_belongs_to_group(auth.uid(), f.owner_group_id)
));