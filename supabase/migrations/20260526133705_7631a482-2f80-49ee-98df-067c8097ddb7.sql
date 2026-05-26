CREATE TABLE public.imersao_notificacoes_log (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NULL,
  dias_restantes int NOT NULL,
  tipo text NOT NULL CHECK (tipo IN ('aluna','admin')),
  email_destinatario text NOT NULL,
  enviado_em timestamptz NOT NULL DEFAULT now(),
  erro text NULL
);

CREATE UNIQUE INDEX imersao_notif_log_unique_dia
  ON public.imersao_notificacoes_log (
    coalesce(user_id::text, 'admin'),
    dias_restantes,
    tipo,
    (date(enviado_em AT TIME ZONE 'America/Sao_Paulo'))
  );

CREATE INDEX imersao_notif_log_user_idx ON public.imersao_notificacoes_log (user_id, enviado_em DESC);

GRANT SELECT ON public.imersao_notificacoes_log TO authenticated;
GRANT ALL ON public.imersao_notificacoes_log TO service_role;

ALTER TABLE public.imersao_notificacoes_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin pode ver todos os logs de notificacao"
  ON public.imersao_notificacoes_log
  FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Service role gerencia logs"
  ON public.imersao_notificacoes_log
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);