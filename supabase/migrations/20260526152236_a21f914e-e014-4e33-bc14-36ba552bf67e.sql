create extension if not exists pg_cron with schema extensions;
create extension if not exists pg_net with schema extensions;

-- Remove agendamento anterior se existir (idempotente)
do $$
begin
  if exists (select 1 from cron.job where jobname = 'aplicar-planos-pendentes-diario') then
    perform cron.unschedule('aplicar-planos-pendentes-diario');
  end if;
end $$;

select cron.schedule(
  'aplicar-planos-pendentes-diario',
  '15 3 * * *',
  $$
  select net.http_post(
    url:='https://lypifrxdzjfdgkcacubl.supabase.co/functions/v1/aplicar-planos-pendentes',
    headers:='{"Content-Type": "application/json", "apikey": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx5cGlmcnhkempmZGdrY2FjdWJsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAzOTc1ODksImV4cCI6MjA3NTk3MzU4OX0.mRZHTSP-e--k57vSgH7b8ZlPSoCr4WoK1NzKeHc9tXw"}'::jsonb,
    body:=concat('{"time": "', now(), '"}')::jsonb
  ) as request_id;
  $$
);