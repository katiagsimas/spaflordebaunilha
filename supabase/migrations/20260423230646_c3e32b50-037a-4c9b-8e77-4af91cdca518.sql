CREATE INDEX IF NOT EXISTS idx_tipos_documento_usuario_id
  ON public.tipos_documento(usuario_id);

CREATE INDEX IF NOT EXISTS idx_contas_receber_usuario_status
  ON public.contas_receber(usuario_id, status);

CREATE INDEX IF NOT EXISTS idx_encomendas_usuario_data_entrega
  ON public.encomendas(usuario_id, data_entrega);