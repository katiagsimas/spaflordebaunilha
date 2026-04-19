-- Tabela para configurações de agendamento de backup por usuário
CREATE TABLE IF NOT EXISTS public.backup_agendamentos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  usuario_id UUID NOT NULL UNIQUE,
  ativo BOOLEAN NOT NULL DEFAULT false,
  frequencia TEXT NOT NULL DEFAULT 'semanal' CHECK (frequencia IN ('diario','semanal','quinzenal','mensal')),
  horario TIME NOT NULL DEFAULT '08:00',
  ultimo_executado_em TIMESTAMPTZ,
  proximo_execucao_em TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.backup_agendamentos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuário vê seu próprio agendamento"
  ON public.backup_agendamentos FOR SELECT
  USING (auth.uid() = usuario_id);

CREATE POLICY "Usuário insere seu próprio agendamento"
  ON public.backup_agendamentos FOR INSERT
  WITH CHECK (auth.uid() = usuario_id);

CREATE POLICY "Usuário atualiza seu próprio agendamento"
  ON public.backup_agendamentos FOR UPDATE
  USING (auth.uid() = usuario_id);

CREATE POLICY "Usuário deleta seu próprio agendamento"
  ON public.backup_agendamentos FOR DELETE
  USING (auth.uid() = usuario_id);

CREATE TRIGGER trg_backup_agendamentos_updated_at
  BEFORE UPDATE ON public.backup_agendamentos
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Função para calcular próxima execução com base na frequência/horário
CREATE OR REPLACE FUNCTION public.calcular_proxima_execucao_backup(
  p_frequencia TEXT,
  p_horario TIME,
  p_referencia TIMESTAMPTZ DEFAULT now()
) RETURNS TIMESTAMPTZ
LANGUAGE plpgsql IMMUTABLE
SET search_path = public
AS $$
DECLARE
  v_data DATE := (p_referencia AT TIME ZONE 'America/Sao_Paulo')::date;
  v_hora_hoje TIMESTAMPTZ;
  v_intervalo INTERVAL;
BEGIN
  v_hora_hoje := ((v_data::text || ' ' || p_horario::text)::timestamp AT TIME ZONE 'America/Sao_Paulo');

  v_intervalo := CASE p_frequencia
    WHEN 'diario' THEN INTERVAL '1 day'
    WHEN 'semanal' THEN INTERVAL '7 days'
    WHEN 'quinzenal' THEN INTERVAL '15 days'
    WHEN 'mensal' THEN INTERVAL '1 month'
    ELSE INTERVAL '7 days'
  END;

  IF v_hora_hoje > p_referencia THEN
    RETURN v_hora_hoje;
  ELSE
    RETURN v_hora_hoje + v_intervalo;
  END IF;
END;
$$;