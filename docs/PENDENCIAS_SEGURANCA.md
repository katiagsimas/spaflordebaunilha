# 🔒 PENDÊNCIAS DE SEGURANÇA — CAIXA DE AÇÚCAR

> Itens que dependem de ação externa ou decisão do time para serem resolvidos.
> Última atualização: 2026-05-26T02:05:00Z

---

## Pendências Ativas

| # | Severidade | Item | Responsável | Status | Observação |
|---|-----------|------|-------------|--------|------------|
| 3 | 🟡 Média | Rate limiting na Edge Function `criar-usuario` | Dev/Infra | ⏸️ Bloqueado | Plataforma ainda não tem primitivas próprias de rate limiting. Implementação ad-hoc possível, mas será refeita quando infra oficial chegar. |
| 6 | 🟡 Baixa | Customizar templates de email do Cloud | Admin/Infra | 🔲 Pendente | Emails usam template padrão |
| 10 | 🟡 Média | Leaked Password Protection desabilitado | Admin | ⏸️ Sem acesso | Lovable Cloud não expõe a toggle no painel; aguardando suporte nativo |
| 10 | 🟡 Média | Leaked Password Protection desabilitado | Admin | ⏸️ Sem acesso | Lovable Cloud não expõe a toggle no painel; aguardando suporte nativo |




---

## Pendências Resolvidas (Histórico)

| Data (UTC) | Item | Resolução |
|------------|------|-----------|
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
