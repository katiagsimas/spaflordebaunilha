## Fluxo de Expiração — Imersão A Receita que Faltava

Objetivo: avisar alunas da Imersão (e a administradora) que o acesso de 30 dias está acabando, e direcioná-las para a página de upgrade externa.

E-mails: **enviados via Resend** (mesma infra já usada em `enviar-recuperacao-senha` e `criar-usuario`), reutilizando a secret `RESEND_API_KEY` já configurada no projeto.

---

### 1. Redirect para página de upgrade externa

Hoje `/upgrade` é uma página interna. Para alunas da Imersão (plano `aluna_imersao`), o sistema deve direcionar para:

`https://upcaixa.umbrelladoce.com.br`

Onde aplicar:
- `PlanoGuard.tsx`: se `plano.id === "aluna_imersao"` e a rota for bloqueada → `window.location.href = URL_EXTERNA` (em vez de `<Navigate to="/upgrade" />`).
- `AlertaExpiracaoPlano.tsx`: botão "Renovar acesso" → URL externa em nova aba (apenas para Imersão).
- Novo modal de expiração da Imersão (ver item 3) também aponta para essa URL.
- A página `/upgrade` interna continua existindo para os demais planos.

---

### 2. E-mails de aviso (D-7, D-3, D-1) via Resend

**Templates HTML inline** (no próprio edge function, padrão usado em `enviar-recuperacao-senha`):
- Aluna: assunto dinâmico ("Faltam 7 dias do seu acesso à Imersão", etc.), CTA grande "Renovar agora" → URL externa, branding Vinho/Dourado.
- Administradora (mãe): resumo diário com lista de alunas expirando (D-7, D-3, D-1 agrupadas).

**Edge Function nova:** `notificar-expiracao-imersao` (`verify_jwt = false`, chamada apenas pelo cron).

**Lógica:**
1. Buscar profiles com `plano_id = 'aluna_imersao'`, `ativo = true`, `plano_fim ∈ {hoje+7, hoje+3, hoje+1}`.
2. Para cada aluna: verificar em `imersao_notificacoes_log` se já foi enviado hoje para esse `(user_id, dias_restantes)`. Se não → enviar via Resend e logar.
3. E-mail consolidado para a administradora (e-mail definido em secret `EMAIL_ADMIN_IMERSAO`) com todas as alunas da execução.
4. Idempotência garantida pela tabela de log + unique constraint.

**Agendamento:** `pg_cron` diário às 12:00 UTC (09:00 BRT) chamando a edge function via `net.http_post`. Inserido via `supabase--insert` (contém URL/anon key).

---

### 3. Notificação em tela (aluna)

- `AlertaExpiracaoPlano` ganha CTA "Renovar agora" (URL externa) quando plano é Imersão.
- Novo `ModalExpiracaoImersao`: aparece uma vez por sessão em D-1 e D-0 com mensagem mais forte e CTA destacado.
- Em `Login.tsx`: se o erro de signIn for "plano expirou" e o e-mail pertencer a uma Imersão, mostrar link "Renovar acesso à Imersão" → URL externa.

---

### 4. Notificação para administradora (in-app)

- Card "Alunas da Imersão expirando" em `/configuracoes/usuarios`:
  - Lista alunas com `plano_fim` entre hoje e hoje+7.
  - Colunas: nome, turma, dias restantes, data de expiração.
- Badge no item de menu admin quando houver ≥1 aluna em D-7 ou menos.

---

### 5. Pós-expiração

Já implementado:
- `PlanExpirationWatcher` desativa profile e faz signOut.
- `AuthContext.signIn` bloqueia login com mensagem clara.
- Dados preservados para reativação manual via admin.

---

### Detalhes técnicos

**Migration:**
- Tabela `imersao_notificacoes_log`:
  - `id` uuid PK, `user_id` uuid, `dias_restantes` int, `tipo` text ('aluna'|'admin'), `enviado_em` timestamptz default now()
  - Unique `(user_id, dias_restantes, date(enviado_em))` — garante idempotência diária
  - RLS: admin SELECT tudo; service_role ALL; sem acesso para `authenticated` comum
  - Grants para `authenticated` (SELECT via has_role admin) e `service_role`

**Secrets necessárias (já existentes ou a confirmar):**
- `RESEND_API_KEY` ✅ (já em uso)
- `EMAIL_ADMIN_IMERSAO` — e-mail da Ká/admin para receber resumo (a pedir via `add_secret` se ainda não houver)

**Cron job (inserido via supabase--insert, não migration):**
```sql
select cron.schedule(
  'notificar-expiracao-imersao-diario',
  '0 12 * * *',
  $$ select net.http_post(
    url:='https://lypifrxdzjfdgkcacubl.supabase.co/functions/v1/notificar-expiracao-imersao',
    headers:='{"Content-Type":"application/json","apikey":"<ANON_KEY>"}'::jsonb,
    body:='{}'::jsonb
  ); $$
);
```

**Arquivos novos:**
- `supabase/functions/notificar-expiracao-imersao/index.ts` (Resend + templates HTML inline + log)
- `src/components/ModalExpiracaoImersao.tsx`
- `src/components/admin/AlunasImersaoExpirando.tsx`
- `src/lib/constants.ts` (`URL_UPGRADE_EXTERNO = "https://upcaixa.umbrelladoce.com.br"`)

**Arquivos editados:**
- `src/components/PlanoGuard.tsx`
- `src/components/AlertaExpiracaoPlano.tsx`
- `src/pages/auth/Login.tsx`
- `src/pages/admin/Usuarios.tsx`
- `supabase/config.toml` (registrar `[functions.notificar-expiracao-imersao] verify_jwt = false`)
- `docs/AUDITORIA.md`
- `mem://features/imersao-receita-que-faltava`

**Fora de escopo:**
- Reativação automática após pagamento (continua manual).
- Push notifications / WhatsApp.
- Dashboard de monitoramento de e-mails enviados (logs ficam apenas na tabela `imersao_notificacoes_log` e no Resend).
