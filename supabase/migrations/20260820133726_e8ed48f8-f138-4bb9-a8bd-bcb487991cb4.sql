DO $$
DECLARE
  f record;
  allowed text[] := ARRAY[
    'has_role','is_group_admin','is_mother','user_belongs_to_group','user_has_financial_access',
    'criar_bancos_padrao_para_usuario','criar_categorias_plano_padrao','criar_planos_contas_padrao',
    'criar_tipos_documento_padrao_para_usuario','gerar_proximo_codigo_estruturado','gerar_proximo_codigo_plano',
    'gerar_proximo_codigo_tipo_documento','proximo_numero_contrato','proximo_numero_proposta',
    'realizar_transferencia','verificar_tipo_documento_em_uso','fechar_mes'
  ];
BEGIN
  FOR f IN
    SELECT p.oid::regprocedure AS sig, p.proname
      FROM pg_proc p
      JOIN pg_namespace n ON n.oid = p.pronamespace
     WHERE n.nspname = 'public' AND p.prosecdef
  LOOP
    EXECUTE format('REVOKE ALL ON FUNCTION %s FROM PUBLIC, anon, authenticated', f.sig);
    EXECUTE format('GRANT EXECUTE ON FUNCTION %s TO service_role', f.sig);
    IF f.proname = ANY(allowed) THEN
      EXECUTE format('GRANT EXECUTE ON FUNCTION %s TO authenticated', f.sig);
    END IF;
  END LOOP;
END $$;

DROP POLICY IF EXISTS "Mother or Admin can update group roles" ON public.user_group_roles;
CREATE POLICY "Mother or Admin can update group roles"
ON public.user_group_roles
FOR UPDATE
TO authenticated
USING (
  public.is_mother(auth.uid())
  OR (public.is_group_admin(auth.uid(), group_id) AND role_group = 'USER'::role_group)
)
WITH CHECK (
  public.is_mother(auth.uid())
  OR (public.is_group_admin(auth.uid(), group_id) AND role_group = 'USER'::role_group)
);