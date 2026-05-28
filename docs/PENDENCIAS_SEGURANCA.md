# 🔒 PENDÊNCIAS DE SEGURANÇA — CAIXA DE AÇÚCAR

> Itens que dependem de ação externa ou decisão do time para serem resolvidos.
> Última atualização: 2026-05-28T23:20:00Z

---

## Pendências Ativas

| # | Severidade | Item | Responsável | Status | Observação |
|---|-----------|------|-------------|--------|------------|
| 6 | 🟡 Baixa | Customizar templates de email do Cloud | Admin/Infra | 🔲 Pendente | Emails usam template padrão |






---

## Pendências Resolvidas (Histórico)

| Data (UTC) | Item | Resolução |
| Data (UTC) | Item | Resolução |
|------------|------|-----------|
| 2026-05-28 | Storage — bucket `assinaturas` público (leitura aberta a anônimos) | Bucket convertido para privado. Removida policy `Assinaturas são publicamente acessíveis`; criada `Assinaturas: dono lê via folder` (SELECT owner-scoped via `foldername = auth.uid()`). `SeusDados.tsx` passa a salvar o **path** em `profiles.assinatura_url` e gera `createSignedUrl` (3600s) para exibição. Migração converte URLs públicas antigas em paths. |
| 2026-05-28 | Storage — bucket `topo-bolo` público (RLS de SELECT bypassada via URL pública) | Bucket convertido para privado. As policies owner-scoped (folder = `auth.uid()`) agora são efetivamente aplicadas em toda leitura. Uploads atuais já usam o bucket `encomendas`; `topo-bolo` só serve como fallback de remoção de URLs legadas. |
| 2026-05-27 | RLS — `historico_planos` sem acesso do próprio usuário | Adicionada policy `Users can view own plan history` (`user_id = auth.uid()`) para SELECT. Admin policy mantida; service_role segue inserindo via webhook. |
| 2026-05-27 | RLS — `imersao_notificacoes_log` lia emails de destinatários para qualquer admin | Policy de SELECT trocada de `has_role(...,'admin')` para `is_mother(auth.uid())`. Apenas operadores MOTHER da plataforma leem o log. |
| 2026-05-27 | RLS — `sso_token_log` sem políticas explícitas (linter 0008) | Adicionadas policies de negação explícita (`USING (false)`) para `authenticated` e `anon`. Acesso real continua apenas via `service_role` (bypass RLS) usado pelas edge functions de SSO. |
| 2026-05-26 | #3 — Rate limiting na Edge Function `criar-usuario` | Implementado rate limiting em memória: Map por IP, 10 req/60s, status 429 com `Retry-After` e body `{ error: 'rate_limit_exceeded', retry_after }`. Proteção contra burst simples (não persistente entre restarts). |
| 2026-05-26 | Limpeza — assets órfãos em `src/assets/` | Removidos `auth-background.png`, `donnas-box-logo.png`, `donnas-logo.png`, `doces-background.jpg`, `caixa-acucar-logo.png` e o duplicado `cda-logo-dourado.png` (mantido apenas em `public/`). |
|------------|------|-----------|
| 2026-05-26 | #9 — Vulnerabilidade `xlsx` (Prototype Pollution / ReDoS) | Pacote `xlsx` removido. Adicionado `exceljs@4.4.0`. Criado shim em `src/lib/xlsxShim.ts` com a mesma API mínima usada no app (`utils.json_to_sheet`, `utils.aoa_to_sheet`, `utils.book_new`, `utils.book_append_sheet`, `writeFile`). Todos os 18 imports de `xlsx` substituídos por `@/lib/xlsxShim` — comportamento de exportação preservado, sem necessidade de SheetJS Pro. |
| 2026-05-26 | #21 — Backups armazenados como JSONB no banco | Bucket privado `backups` criado com RLS owner-scoped (`auth.uid()` por pasta). Edge function `executar-backups-agendados` e tela `Backup.tsx` passam a fazer upload do JSON para Storage; `backups.dados` virou opcional para compatibilidade com backups antigos. Download/restore usa `storage.download()` quando há `storage_path`. |
| 2026-05-26 | #19 — Anon key armazenada em `private.config` | Migrada para `vault.secrets` (`cron_anon_key`); `private.get_anon_key()` agora lê do Vault; tabela `private.config` removida. |
| 2026-05-26 | #20 — Sem cap de uso para AI Gateway | Implementado P-3: edge function `ai-proxy` + `ai_usage_quotas` + RPCs SECURITY DEFINER. Lite=50/mês, Business=500/mês, MOTHER ilimitado. |
| 2026-03-08 | Loop infinito no AuthContext (`toast` nas deps) | Removido `toast` do array de dependências do `useEffect` |
| 2026-03-08 | `signUp` removido do AuthContext | Método removido da interface, implementação e Provider |
| 2026-03-09 | Rota `/auth/reset-password` inexistente | Criado `ResetPassword.tsx` com validação de token + formulário + redirect |
| 2026-03-09 | console.log com dados sensíveis (~247 ocorrências) | Removidos todos os console.log de debug |
| 2026-03-09 | Políticas RLS INSERT/UPDATE/DELETE em `tags_encomendas` | Políticas confirmadas + interface implementada |
| 2026-03-09 | OG Image URL temporária | Imagem em `public/og-image.png`; meta tags com path local |
| 2026-03-09 | PlanoGuard client-side only | Criada função DB `user_has_financial_access()` + 12 RLS RESTRICTIVE |
| 2026-03-09 | twitter:site @lovable_dev | Tag `twitter:site` removida do index.html |
| 2026-03-09 | Loading splash path `/src/assets/` | Logo copiada para `public/umbrella-logo-dourado.png` |
| 2026-03-09 | Sem `<noscript>` fallback | Tag `<noscript>` adicionada ao `index.html` |
| 2026-04-08 | Privilege escalation via profiles.plano_id | Trigger `protect_plan_fields()` bloqueia alteração por não-admin |
| 2026-04-08 | encomendas_tags permissivas | Políticas ownership-scoped |
| 2026-04-08 | tags sem ownership | Coluna `user_id` + RLS ownership |
| 2026-04-08 | topo-bolo storage sem ownership | Políticas com `foldername(name)[1] = auth.uid()` |
| 2026-04-08 | comprovantes-pagar sem UPDATE policy | Adicionada política UPDATE owner-scoped |
| 2026-04-08 | Bucket encomendas público | Tornado privado + SELECT owner-scoped + signedUrl |
| 2026-04-19 | Realtime sem RLS em `realtime.messages` | RLS + topic scoping por auth.uid() |
| 2026-04-19 | `historico_planos` policy permitindo bypass | Policy removida; service_role bypassa RLS |
| 2026-04-19 | Vazamento cross-tenant em categorias_plano_contas/plano_contas | SELECT restrito ao dono |
| 2026-04-19 | Bucket `topo-bolo` público sem scoping | SELECT exige folder == auth.uid() |
| 2026-04-19 | Bucket `comprovantes-receber` sem UPDATE | UPDATE owner-scoped |

---

*Mantido por Lovable AI — Umbrella Doce | Ká Simas*
