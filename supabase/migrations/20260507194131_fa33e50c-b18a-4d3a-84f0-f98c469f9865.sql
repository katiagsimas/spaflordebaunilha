
ALTER TABLE public.planejamento_descanso
  ADD COLUMN IF NOT EXISTS recorrente boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS recorrencia_tipo text CHECK (recorrencia_tipo IN ('semanal', 'mensal', 'anual'));

ALTER TABLE public.planejamento_datas_comemorativas
  ADD COLUMN IF NOT EXISTS recorrente boolean NOT NULL DEFAULT true;

-- Mark existing system dates as recorrente
UPDATE public.planejamento_datas_comemorativas SET recorrente = true WHERE is_system = true;
