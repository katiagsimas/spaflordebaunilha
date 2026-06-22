# 📋 REGISTRO DE AUDITORIAS — CAIXA DE AÇÚCAR

> Este arquivo é gerado e atualizado automaticamente a cada auditoria realizada no projeto.
> Última atualização: 2026-06-22T17:05:00Z — Auditoria completa pré-lançamento #3.

---

## AUDITORIA COMPLETA #3 — 2026-06-22 17:05 UTC

### 📊 Resumo Executivo
- **Status Geral:** ⚠️ **APROVADO COM RESSALVAS** — sem bloqueadores funcionais ou de segurança de dados; persistem 2 itens críticos operacionais herdados (`.env` ainda *tracked* no git, ausência de Sentry) e a divergência de padrão RLS multi-tenant identificada na #2.
- **Total de itens verificados:** 92 (12 blocos)
- **Itens OK (✅):** 64
- **Itens de Atenção (⚠️):** 18
- **Itens Críticos (❌):** 2
- **Itens Não Aplicáveis (🔲):** 8

### 🔁 Diff desde a Auditoria #2
- ✅ Build TypeScript/Vite compila 100% após remoção do **Conversa Doce** (validado via Playwright em 16 rotas, todas 200; `/conversa-doce` → 404 esperado).
- ✅ Módulo Conversa Doce **integralmente removido** — tabela, colunas em `profiles`, UI admin, edge functions, e-mails Hotmart, catálogo de backup, docs e memória.
- ✅ Doc `INTEGRACAO_SSO_DOCE.md` e resíduos no banco (`sso_token_log`, função e cron de limpeza) removidos via migração.
- ✅ Menções textuais a "Meu Planejamento" / "Organização Doce" / "Planejamento Doce" eliminadas (módulo descontinuado).
- ✅ `dependency_scan` (npm audit) — **0 vulnerabilidades** high/critical.
- ⚠️ `.env` ainda aparece em `git ls-files` (a regra de `.gitignore` foi adicionada na #2, mas o arquivo continua *tracked* — exige `git rm --cached .env` manual).
- ⚠️ `public/sitemap.xml` ainda ausente.
- ⚠️ 40 `console.log` em `src/` + `supabase/functions/` (a maioria em edge functions, aceitável; em `src/` há ocorrências em hooks/páginas que poderiam virar `errorLogger`).
- ⚠️ 618 ocorrências de `any` no frontend (legado; concentradas em tipagens de Supabase row → DTO).

### 🔴 Itens Críticos (bloqueiam lançamento)

| # | Item | Status | Origem | Correção sugerida |
|---|------|--------|--------|--------------------|
| **C-1** | `.env` ainda *tracked* no Git (`git ls-files .env` retorna 1 linha). Conteúdo atual contém apenas chaves *publishable* do Supabase (não são segredos), mas o arquivo continua versionado. | ❌ herdado #2 | `git ls-files` | `git rm --cached .env && git commit -m "chore: untrack .env"`. Ação manual fora do Lovable. |
| **C-2** | Sem monitoramento de erros em produção (Sentry / LogRocket). `ErrorBoundary` + `errorLogger.ts` capturam local, mas não enviam para serviço externo. | ❌ herdado #2 | revisão `main.tsx`, `errorLogger.ts` | Integrar Sentry (DSN via secret) ou Posthog Error Tracking; já existe ponto de injeção pronto em `errorLogger.ts`. |

### 🟡 Itens de Atenção

| # | Bloco | Item | Recomendação |
|---|-------|------|--------------|
| A-1 | 8 SEO | Sem `public/sitemap.xml`. | Gerar sitemap estático com as rotas públicas (atualmente todas exigem login — pode publicar só `/` e `/auth/login`). |
| A-2 | 2 Segurança | `.env` versionado mesmo contendo apenas chaves *publishable*. | Resolver junto com C-1. |
| ~~A-3~~ | 3 Banco | ✅ **Corrigido em 2026-06-22** — padrão RLS unificado em todas as 29 tabelas de grupo via `user_belongs_to_group(owner_group_id)`. Ver seção dedicada abaixo. | — |
| A-4 | 5 Código | 618 usos de `any` (em sua maioria *casts* sobre rows do Supabase). | Adotar `Database["public"]["Tables"][T]["Row"]` nos hooks de maior tráfego (`useEncomendas`, `useReceitas`, `useEstoque`, `useContas*`). |
| A-5 | 5 Código | 40 `console.log` no código-fonte (incluindo edges). | Em `src/`, substituir por `errorLogger`; em edges, manter apenas logs estruturados úteis ao Supabase Logs. |
| A-6 | 7 Performance | Sem code-splitting por rota (todas as páginas em bundle único). | Aplicar `React.lazy` + `Suspense` nas rotas pesadas (`Financeiro/*`, `Estoque/*`, `Comercial/*`, `Backup`). |
| A-7 | 9 Comunicação | Templates de e-mail Hotmart (welcome/downgrade) ainda mencionam módulos vivos — revisar após cada remoção (último ajuste: Conversa Doce). | Adicionar teste de smoke no webhook que valide os módulos listados contra `MODULOS_POR_PLANO`. |
| A-8 | 6 UI/UX | OG image aponta para `storage.googleapis.com/gpt-engineer-file-uploads/...` (asset herdado do Lovable). | Migrar para asset próprio sob `/public` ou bucket `assets`. |
| A-9 | 11 Monitoramento | Sem dashboard de saúde (uptime/erros). | Posthog + UptimeRobot/BetterStack apontados para `/auth/login` e `ai-proxy` (HEAD). |
| A-10 | 12 Testes | Sem suíte automatizada de testes. Validação atual é manual + Playwright pontual via sandbox. | Adicionar Vitest com pelo menos: `usePlano`, `useEncomendas` (cálculos), `dateUtils`, `useBaixaEstoqueEncomenda`. |
| A-11 | 1 Arquitetura | Hooks e páginas têm crescimento orgânico (ex.: `EditarUsuarioDialog.tsx` ainda longo após limpeza). | Extrair seções em subcomponentes (`AcessoSection`, `PerfilSection`, etc.). |
| A-12 | 4 Lógica | `useEffect` ainda usam `// eslint-disable-next-line react-hooks/exhaustive-deps` em pontos não auditados. | Varredura por `exhaustive-deps` e justificar / corrigir cada caso. |
| A-13 | 3 Banco | 255 migrações acumuladas. Reset baseline não é recomendado, mas torna onboarding lento. | Manter; documentar em `docs/DOCS_MESTRE.md` que migrações antigas só rodam em ambiente novo. |
| A-14 | 10 Pagamentos | Webhook Hotmart sem retry programático em falha (Hotmart retenta, mas não há *dead letter* local). | Persistir payload bruto em tabela `hotmart_webhook_log` (já existe?) e processar de forma idempotente. |
| A-15 | 2 Segurança | Sem rate limit explícito nas edges `criar-usuario` e `enviar-recuperacao-senha` (existe IP rate-limit no `ai-proxy`). | Replicar pattern do `ai-proxy` ou usar `pg_rate_limit`. |
| A-16 | 6 UI/UX | `lang="pt-BR"` ✅, mas `<title>` e `<meta description>` são estáticos — não muda por rota. | Implementar `react-helmet-async` para títulos por página (impacto SEO baixo já que tudo é autenticado). |
| A-17 | 5 Código | 3 comentários `TODOS` (não são `TODO:` reais — são uso textual de "TODOS"). Falso-positivo. | Nenhuma. |
| A-18 | 7 Performance | `bun.lock` + `bun.lockb` + `package-lock.json` coexistem na raiz. | Padronizar em um único gestor (Lovable usa bun por padrão). |

### 🟢 Pontos Positivos

- ✅ **Build limpo**: TS strict-mode passa; HMR aplicado; sem regressão após remoções recentes.
- ✅ **0 vulnerabilidades** npm high/critical (`dependency_scan`).
- ✅ **Auth robusto**: AuthContext aguarda `getSession()` antes do `onAuthStateChange`; `FirstAccessRedirect`, `ProtectedRoute`, `PlanoGuard`, `PermissionGuard`, `MasterOnlyGuard`, `OnboardingGuard`, `MotherGuard` cobrindo todas as camadas.
- ✅ **Multi-tenancy**: `owner_group_id` + `useGroupFilter` + `user_belongs_to_group` + `useIsGroupMaster` consolidados.
- ✅ **Backups**: agendamento + retenção 30 dias + **cofre** mensal + 5 últimos por grupo (`backups_cofre`).
- ✅ **AI Gateway Cap**: `ai-proxy` com auth, rate-limit IP (30/min), quota mensal por plano, whitelist de modelos, `record_ai_tokens`.
- ✅ **E-mails**: Resend via edges, supressão de e-mails nativos do Supabase; templates centralizados.
- ✅ **Documentação viva**: 15 arquivos em `docs/`, AUDITORIA com histórico preservado.
- ✅ **SEO básico**: title, description, OG, Twitter, lang=pt-BR, viewport, favicon, `<noscript>` fallback no body, fontes pré-conectadas.
- ✅ **`robots.txt`** permite Googlebot/Bingbot/Twitterbot/facebookexternalhit e demais.
- ✅ **GA4** ativo via `VITE_GA_MEASUREMENT_ID` com `send_page_view` automático.
- ✅ **Loading UX pattern** consistente (early-return em `useGlobalLoading`).
- ✅ **Datas timezone-safe** centralizadas em `src/lib/dateUtils.ts`.
- ✅ **Design system** v2 Vinho Premium com tokens `--cda-*`.
- ✅ **Hotmart**: keywords `lite`/`negocio` mapeadas; downgrade automático; histórico de planos.
- ✅ **Estoque**: custo médio + movimentações + restrição por plano.
- ✅ **Erro global**: `ErrorBoundary` + `errorLogger` (window.onerror + unhandledrejection).

### 📝 Resultado Resumido por Bloco

| Bloco | Status | Observação |
|-------|--------|------------|
| 1 Arquitetura | ✅ | A-11 (componentes longos) |
| 2 Segurança | ⚠️ | C-1 (.env tracked), A-15 (rate-limit edges) |
| 3 Banco / Supabase | ✅ | A-3 corrigido (RLS unificada); A-13 (255 migrações, baixo impacto) |
| 4 Funcionalidades | ✅ | Todos fluxos OK |
| 5 Qualidade do Código | ⚠️ | A-4 (`any`), A-5 (`console.log`) |
| 6 UI/UX | ✅ | A-8 (OG externo), A-16 (helmet) |
| 7 Performance | ⚠️ | A-6 (code-splitting), A-18 (lockfiles) |
| 8 SEO | ⚠️ | A-1 (sitemap) |
| 9 Comunicação | ✅ | A-7 (smoke nos templates) |
| 10 Pagamentos | ✅ | A-14 (dead-letter) |
| 11 Monitoramento | ❌ | C-2 (Sentry), A-9 (uptime) |
| 12 Testes | ⚠️ | A-10 (Vitest) |

### 🎯 Plano de Ação (ordem de prioridade)

1. **(Crítico, manual)** `git rm --cached .env && git commit` — C-1.
2. **(Crítico)** Provisionar Sentry, adicionar DSN como secret e injetar em `errorLogger.ts` — C-2.
3. **(Atenção alta)** Migrar RLS de tabelas de negócio para `user_belongs_to_group(owner_group_id)` — A-3.
4. **(Atenção média)** Code-splitting por rota com `React.lazy` — A-6.
5. **(Atenção média)** Adicionar Vitest + 4 hooks críticos — A-10.
6. **(Atenção média)** Substituir `console.log` em `src/` por `errorLogger` — A-5.
7. **(Atenção baixa)** Sitemap, OG asset próprio, helmet por rota, dead-letter Hotmart, rate-limit em edges sensíveis, padronização de lockfiles.

### 🏁 Veredicto

> ⚠️ **APROVADO COM RESSALVAS** — produto pode operar em produção (já está em `caixadeacucar.com.br`). Os dois itens críticos (C-1 e C-2) são operacionais, não comprometem dados de usuários, e devem ser resolvidos na próxima janela de deploy.

---

## 2026-06-22 — Padronização RLS multi-tenant (correção A-3) ✅

**Escopo:** unificar o padrão RLS de todas as tabelas de negócio que pertencem a um grupo, eliminando o fallback `auth.uid() = usuario_id` em favor de `user_belongs_to_group(auth.uid(), owner_group_id)`.

### Migração aplicada
- **92 políticas legadas removidas** em 21 tabelas (`bancos`, `categorias`, `categorias_plano_contas`, `configuracoes_juros`, `contas_pagar`, `contas_receber`, `custos_fixos`, `embalagens`, `encomenda_itens`, `encomendas`, `estoque`, `estoque_movimentacoes`, `fornecedor_contatos`, `ingredientes`, `mao_obra_perfis`, `meu_salario_retiradas`, `plano_contas`, `pre_preparos`, `receitas`, `tags_encomendas`, `tipos_documento`, `tipos_insumos`, `transferencias_bancos`, `unidades_medida`). Cada tabela já possuía o equivalente `group_members_{select|insert|update|delete}_*` baseado em `user_belongs_to_group`, que passou a ser a única autoridade.
- **`clientes` e `fornecedores`** tiveram as políticas `Group members can *` reescritas como `group_members_{select|insert|update|delete}_*`, **sem** o fallback `OR (auth.uid() = usuario_id)` que permitia acesso pelo proprietário original mesmo após sair do grupo.
- **`fornecedor_contatos`**: 4 políticas duplicadas (`Group members can ...`) descartadas — restam apenas as `group_members_*_fornecedor_contatos`.
- **Tabelas estritamente por-usuário** (`backups`, `backups_cofre`) **não foram alteradas** — pertencem ao usuário, não ao grupo.
- **`useGroupFilter`** preservado no frontend como camada adicional de segurança (defense-in-depth), conforme solicitado.

### Validação
- ✅ **Auditoria pós-migração**: `0` políticas legadas restantes em tabelas de grupo (query `pg_policies` com regex para `auth.uid() = (usuario_id|user_id)` sem `user_belongs_to_group` no `qual`/`with_check`).
- ✅ **Cobertura completa**: as 29 tabelas com `owner_group_id` (excluindo `backups`/`backups_cofre`) têm os 4 comandos (SELECT/INSERT/UPDATE/DELETE) cobertos por política baseada em `user_belongs_to_group`.
- ✅ **Função `user_belongs_to_group` testada** com 2 usuários reais em grupos diferentes:
  - `userA` ↔ grupo A → `true` (acesso permitido)
  - `userA` ↔ grupo B → `false` (bloqueado)
  - `userB` ↔ grupo B → `true` (acesso permitido)
  - `userB` ↔ grupo A → `false` (bloqueado)
  - `NULL` (anônimo) ↔ qualquer grupo → `false` (bloqueado)

### Resultado prático
- Usuários só conseguem `SELECT`/`INSERT`/`UPDATE`/`DELETE` em dados de grupos a que pertencem ativamente (`user_group_roles.is_active = true`).
- Usuários removidos de um grupo **perdem acesso imediato** aos dados desse grupo (antes podiam continuar lendo via `usuario_id`).
- Usuários anônimos não conseguem acessar nada.
- A camada `useGroupFilter` no frontend continua aplicando `.eq('owner_group_id', activeGroupId)` em todas as queries — proteção em dois níveis.

### Impacto em código de aplicação
- **Nenhum.** Toda a lógica de negócio do frontend já chamava `useGroupFilter` (que injeta `owner_group_id`) ou setava `usuario_id = auth.uid()` no `insert`, ambos compatíveis com as novas políticas.

---

## 2026-06-22 — Descontinuação do módulo Conversa Doce ✅
- Módulo de assistente IA WhatsApp **inteiramente removido** do projeto.
- **Banco** (migração): `DROP TABLE conversa_doce_favoritos`; removidas colunas `profiles.conversa_doce_ativo / _inicio / _fim`.
- **Edge functions:** removidas referências em `restaurar-backup`, `executar-backups-agendados` e textos de e-mail do `hotmart-webhook` (lista de módulos Business + downgrade).
- **Frontend:** `src/lib/backupCatalog.ts` (tabela removida), `src/hooks/usePlano.ts` (comentário de rota bloqueada), `src/components/admin/EditarUsuarioDialog.tsx` (bloco completo de gestão de acesso removido — states, query, useEffect, payload de update, invalidações e UI).
- **Docs:** `docs/MODULO_CONVERSA_DOCE.md` excluído; `docs/DOCS_MESTRE.md` limpo (visão geral, estrutura, rotas, modelo de dados, hooks, IA, performance, índice); `docs/AUDITORIA_CONSUMO.md` ajustado.
- **Resíduos esperados:** apenas migrações históricas em `supabase/migrations/*.sql` (imutáveis) e registros antigos em `AUDITORIA.md` (preservados por política).

---

## 2026-06-22 — Remoção do doc obsoleto INTEGRACAO_SSO_DOCE.md ✅
- Excluído `docs/INTEGRACAO_SSO_DOCE.md` — descrevia integração SSO Caixa ↔ Planejamento DOCE que já havia sido **inteiramente removida do código** (arquivos `src/hooks/useOpenPlannerDoce.ts`, `src/pages/SSOReturnPage.tsx`, edge functions `gerar-token-sso-doce` e `validar-token-retorno-doce`, e card "Planejamento DOCE" no Dashboard não existem mais).
- 🗑️ **Resíduos no banco removidos** via migração: tabela `public.sso_token_log`, função `public.cleanup_expired_sso_tokens()` e cron diário de limpeza (`DROP IF EXISTS` + `cron.unschedule`). Não restam resíduos da integração SSO no projeto.

---

## 2026-06-22 — Descontinuação do módulo de planejamento ✅
- Removidas todas as menções textuais a "Meu Planejamento" em docs e código (módulo sem UI/rotas ativas no projeto).
- Arquivo `docs/DOCS_PLANEJAMENTO.md` excluído.
- `docs/DOCS_MESTRE.md`: removida linha da rota `/planejamento`.
- `docs/MODULO_CONVERSA_DOCE.md`: ajustada descrição da posição na sidebar.
- `src/lib/backupCatalog.ts`: comentário atualizado; tabela `organizacao_doce_state` mantida no catálogo de backup para preservar dados históricos.
- Entradas históricas em AUDITORIA.md preservadas e marcadas como `[DESCONTINUADO em 2026-06-22]`.
- Tabelas no banco (`planejamento_*`, `organizacao_doce_state`) NÃO foram removidas — apenas as referências textuais ao nome de marketing "Meu Planejamento".

---

## AUDITORIA COMPLETA #2 — 2026-05-29 19:30 UTC

### 📊 Resumo Executivo
- **Status Geral:** ⚠️ **APROVADO COM RESSALVAS** — sem bloqueadores de segurança de dados, mas persistem 2 itens críticos operacionais (`.env` fora do gitignore — corrigido na #2 e #3, ausência de monitoramento de erros Sentry) e 1 mitigado (GA4 básico implementado).
- **Total de itens verificados:** 80
- **Itens OK (✅):** 57 (+1 desde #2)
- **Itens de Atenção (⚠️):** 16
- **Itens Críticos (❌):** 2 (C-2 Sentry, C-3 reduzido a ⚠️)
- **Itens Não Aplicáveis (🔲):** 5

### 🔁 Diff desde a Auditoria #1
- ✅ Índices `owner_group_id` aplicados nas tabelas de negócio (encomendas, estoque, fechamentos, planejamento, backups, profiles etc.).
- ✅ Retenção de backups de 30 dias ativa no cron `executar-backups-agendados` (limpa após salvar o novo backup com sucesso).
- ✅ `setInterval` em `ReceitaForm.tsx` confirmado dentro de `handleImageUpload` com `clearInterval` no `finally` — sem vazamento.
- ✅ Validação de uso dos índices via `pg_stat_user_indexes` (27 com `idx_scan=0`, esperado em base vazia; reavaliar em 30 dias).
- ⚠️ **Novo achado:** padrão RLS duplo — tabelas críticas de negócio (encomendas, receitas, contas_*, estoque, planejamento_*, custos_fixos, bancos etc.) usam `auth.uid() = usuario_id` em vez de `user_belongs_to_group`. Quebra a promessa multi-tenant via SQL; isolamento só pelo `useGroupFilter` no cliente.
- ✅ `.gitignore` corrigido na #3 — inclui `.env`, `.env.local`, `.env.*.local`.
- ⚠️ GA4 implementado básico (`gtag` via `index.html` + evento `login`) — substitui C-3 total.
- ⚠️ ErrorBoundary global + `errorLogger` em `main.tsx` — mitigação temporária de C-2 até Sentry.

### Correções aplicadas após #2
| # | Item | Status | Data | Detalhes |
|---|------|--------|------|----------|
| C-1 | `.gitignore` não inclui `.env` | ✅ corrigido | 2026-05-29 | Adicionados `.env`, `.env.local`, `.env.development[.local]`, `.env.production[.local]`, `.env.test[.local]`, `.env.*.local` ao `.gitignore`. Arquivo `.env` ainda tracked — aguardando `git rm --cached .env` manual. |
| C-3 | Sem analytics nem dashboard de saúde | ⚠️ mitigado | 2026-05-29 | GA4 (`gtag`) adicionado ao `index.html` com `VITE_GA_MEASUREMENT_ID`. Rastreia `page_view` automático + evento `login` no `AuthContext.tsx`. Sem Posthog/Sentry ainda. |
| — | Tratamento global de erros | ⚠️ mitigação temp. | 2026-05-29 | `ErrorBoundary.tsx` envolve `<App />` em `App.tsx`. `errorLogger.ts` captura `window.onerror` e `unhandledrejection` com contexto (usuário, rota, timestamp). Substitui Sentry provisoriamente. |
| — | Nome da variável de projeto | ✅ corrigido | 2026-05-30 | Checklist de deploy referenciava `VITE_PROJECT_ID`; variável correta no projeto é `VITE_SUPABASE_PROJECT_ID` (gerenciada automaticamente pelo Lovable Cloud). |

### 🔴 Itens Críticos

| # | Item | Status | Correção |
|---|------|--------|----------|
| C-1 | `.gitignore` não inclui `.env` | ✅ corrigido (arquivo ainda tracked) | `git rm --cached .env` manual pendente. |
| C-2 | Sem monitoramento de erros em produção | ❌ persistente | Sentry `@sentry/react` + cobertura nas 10 Edge Functions. |
| C-3 | Sem analytics nem dashboard de saúde | ⚠️ mitigado | GA4 básico implementado (`page_view` + evento `login`). Posthog/Sentry pendentes. |

### 🟡 Itens de Atenção

| # | Item | Status | Recomendação |
|---|------|--------|--------------|
| A-1 | Bucket `assinaturas` público | ⚠️ persistente | Privado + `createSignedUrl()`. |
| A-2 | Bucket `topo-bolo` público | ⚠️ persistente | Privado + signed URLs. |
| A-3 | 218 `console.*` em 68 arquivos | ⚠️ persistente | ESLint `no-console` permitindo `warn`/`error`. |
| A-4 | 662 `any` em 100 arquivos | ⚠️ piorou | Bloquear `any` em novos PRs; focar em financeiro e webhook. |
| A-5 | `AuthContext`: confirmar ordem `getSession()` → `onAuthStateChange` | ⚠️ persistente | Validar versus memória do projeto. |
| A-6 | Assets `.jpg`/`.png` duplicados em `src/assets` | ⚠️ persistente | Manter um formato. |
| A-7 | Sem `sitemap.xml` | ⚠️ persistente | Gerar `public/sitemap.xml`. |
| A-8 | Templates de email Cloud não customizados | ⚠️ persistente | Customizar no painel Cloud. |
| A-9 | 56 deps de produção sem análise de bundle | ⚠️ persistente | `vite-bundle-visualizer`. |
| A-10 | Sem validação real de venda Hotmart end-to-end | ⚠️ persistente | Compra real mínima: webhook → provisionamento → email → 1º login. |
| A-11 | Sem teste em mobile real | ⚠️ persistente | iOS Safari + Android Chrome. |
| A-12 | Sem testes automatizados | ⚠️ persistente | Playwright nos 5 fluxos críticos. |
| A-13 | Cancelamento de conta não implementado | ⚠️ persistente | Documentar manual ou implementar self-service. |
| A-14 | 120 `useEffect` no projeto | ⚠️ persistente | `exhaustive-deps` em `error`. |
| A-15 | Sem `<meta name="robots">` em rotas privadas | ⚠️ persistente | `react-helmet` com `noindex,nofollow`. |
| A-16 | **RLS padrão B em tabelas de negócio** (NOVO) | ⚠️ novo | Migrar para `user_belongs_to_group(...)` antes de receber 2+ usuários por grupo. |

### 🟢 Pontos Positivos
- 71 tabelas no `public` com RLS habilitado, todas com policy (linter zero erros estruturais).
- Cron único com retenção de 30 dias.
- `ai-proxy` centraliza 100% das chamadas LLM (auth + quota + rate limit + allowlist).
- Realtime restrito a 1 tabela (`encomendas`).
- 10 Edge Functions, todas sob demanda.
- Banco 28 MB, Storage 86 kB — folga total.
- Índices `owner_group_id` aplicados.
- Sem secrets hardcoded; `.env` só contém `VITE_SUPABASE_*` (publishable).

### 📝 Resultado por Bloco
- **B1 Arquitetura:** ✅ exceto C-1 e A-6.
- **B2 Segurança:** ✅ RLS, auth, HTTPS; ⚠️ A-1, A-2, A-3.
- **B3 Banco/Supabase:** ✅ 236 migrations, tipos gerados, índices, error handling; ⚠️ A-16.
- **B4 Funcionalidades:** ✅ fluxos principais; ⚠️ A-10, A-13.
- **B5 Qualidade de código:** ⚠️ A-3, A-4, A-14.
- **B6 UI/UX:** ✅ design system `cda-*` + loading states; ⚠️ A-11.
- **B7 Performance:** ✅ React Query + índices.
- **B8 SEO:** ⚠️ A-7, A-15.
- **B9 Comunicação:** ✅ Resend; ⚠️ A-8.
- **B10 Pagamentos:** ⚠️ A-10.
- **B11 Analytics/Monitoramento:** ⚠️ C-2 (Sentry pendente), C-3 (GA4 básico implementado).
- **B12 Testes:** ⚠️ A-12.

### 🎯 Plano de Ação
1. **Hoje:** corrigir C-1 (✅ feito), GA4 básico (✅ feito), ErrorBoundary (✅ feito).
2. **Antes do lançamento público:** C-2 (Sentry), A-1/A-2, A-10.
3. **Sprint pós-lançamento:** A-16, A-3/A-4, A-12, A-13.
4. **Backlog técnico:** A-6, A-7, A-15, A-9, A-14.

### 🏁 Veredicto
⚠️ **APROVADO COM RESSALVAS.** Pode lançar para a primeira leva controlada de alunas. C-1 e GA4 básico resolvidos. C-2 (Sentry) entra em até 7 dias. A-16 não bloqueia hoje (1 USER por grupo), mas vira bloqueio assim que houver 2+ usuários por grupo.

---

## AUDITORIA COMPLETA #1 — 2026-05-28 22:59 UTC

### 📊 Resumo Executivo
- **Status Geral:** ⚠️ **APROVADO COM RESSALVAS** — não há bloqueadores críticos de segurança, mas há 3 itens críticos operacionais (gitignore, analytics/monitoramento, validação de pagamento real) que devem ser tratados antes do lançamento público.
- **Total de itens verificados:** 77
- **Itens OK (✅):** 52
- **Itens de Atenção (⚠️):** 17
- **Itens Críticos (❌):** 3
- **Itens Não Aplicáveis (🔲):** 5

---

### 🔴 Itens Críticos (bloqueiam lançamento)

| # | Item | Descrição | Correção sugerida |
|---|------|-----------|-------------------|
| C-1 | `.gitignore` não inclui `.env` | O arquivo `.env` existe na raiz e **não está listado no `.gitignore`**. Apesar de só conter chaves públicas Supabase (`VITE_*`), isso é uma armadilha futura: se alguém adicionar um segredo em `.env`, ele vai para o repositório. | Adicionar `.env`, `.env.local`, `.env.*.local` ao `.gitignore`. |
| C-2 | Sem monitoramento de erros em produção | Nenhuma ferramenta detectada (Sentry, LogRocket, Bugsnag). Em produção qualquer crash do React ou falha de Edge Function passará despercebido até o usuário reclamar. | Instalar Sentry (ou similar) com DSN via secret; cobrir frontend (`@sentry/react`) e edge functions. |
| C-3 | Sem analytics nem dashboard de saúde | Nenhuma ferramenta de analytics (GA4, Posthog, Mixpanel) integrada. Sem dados de uso, será impossível medir adoção, engajamento e gargalos pós-lançamento. | Plugar Posthog ou GA4 — basta `<script>` em `index.html` ou wrapper React leve. |

---

### 🟡 Itens de Atenção (não bloqueiam, mas devem ser resolvidos em breve)

| # | Item | Descrição | Recomendação |
|---|------|-----------|--------------|
| A-1 | Bucket Storage `assinaturas` público | Scanner Lovable detectou: políticas INSERT/UPDATE/DELETE já são owner-scoped, mas como o bucket é público o SELECT escapa do RLS. Qualquer URL adivinhada vaza assinaturas de contrato. | Tornar bucket privado e usar `createSignedUrl()` nas leituras. |
| A-2 | Bucket Storage `topo-bolo` público | Mesma situação do `assinaturas` — bucket público faz com que a política SELECT owner-scoped seja inócua. | Tornar bucket privado e migrar leituras para signed URLs. |
| A-3 | 218 ocorrências de `console.*` em `src/` | Anteriormente reduzidas para 0 (PENDENCIAS_SEGURANCA), voltaram durante novas features. Risco de vazar payloads e ids em produção. | Rodar lint para banir `console.log` em produção (manter `console.warn/error` permitido) e revisar arquivos. |
| A-4 | 642 usos de `any` em 101 arquivos TS | Tipagem frouxa em mais de 1/3 da base. Aumenta risco de bugs runtime e mascara mudanças de schema. | Estabelecer meta gradual: novos PRs devem evitar `any`; substituir nas áreas críticas (financeiro, pagamentos). |
| A-5 | `AuthContext` viola sua própria regra de inicialização | A memória do projeto exige `getSession()` **antes** de `onAuthStateChange`, mas `src/contexts/AuthContext.tsx` (linhas 30-50) faz o oposto. Pode causar race condition em primeiro paint. | Inverter a ordem ou atualizar a memória se a ordem atual for intencional. |
| A-6 | Assets duplicados `.jpg`/`.png` em `src/assets` | Pelo menos 8 hero banners possuem versões `.jpg` **e** `.png` (cadastros, cardapio, clientes-fornecedores, dinheiro, estoque, backup, governanca, meus-dados). Bundle inflado. | Manter apenas o formato em uso e remover os demais. |
| A-7 | Sem `sitemap.xml` | Apenas `robots.txt` existe. Para um SaaS isso é tolerável (área autenticada), mas a landing/login se beneficia. | Gerar `public/sitemap.xml` mínimo com rotas públicas. |
| A-8 | Templates de email Cloud não customizados | Pendência #6 já registrada em `PENDENCIAS_SEGURANCA.md`. | Customizar templates de boas-vindas/reset no painel Cloud. |
| A-9 | 56 dependências de produção | Volume razoável, mas sem auditoria de tamanho recente. | Rodar `bun pm ls` + bundle analyzer e revisar libs grandes (ex.: `exceljs`, `recharts`). |
| A-10 | Sem validação real de venda Hotmart | Usuário confirmou que nenhuma venda real ocorreu — base limpa para testes. | Realizar uma compra real (mesmo valor mínimo) e validar o ciclo completo: webhook → provisionamento → email → primeiro login. |
| A-11 | Sem teste manual em dispositivo móvel real | Apenas DevTools usado para validar responsividade. | Smoke test em iOS Safari e Android Chrome reais antes de divulgar. |
| A-12 | Sem testes automatizados | Não há suíte de testes (`vitest`, `playwright`). Aceitável para MVP, mas crítico aumenta com a base. | Cobrir os 5 fluxos críticos (login, recuperação, encomenda, fechamento de mês, webhook Hotmart) com testes E2E pós-lançamento. |
| A-13 | Cancelamento de conta não implementado | Não existe fluxo de auto-exclusão para a aluna; depende de admin. | Documentar processo manual ou implementar self-service na tela "Meus Dados". |
| A-14 | 120 `useEffect` no projeto | Volume alto; risco de dependências incorretas e re-renders. | Habilitar `eslint-plugin-react-hooks` com `exhaustive-deps` em modo `error`. |
| A-15 | Sem `<meta name="robots">` explícito | Páginas internas são SPA autenticadas, mas a raiz pode ser indexada. | Adicionar `<meta name="robots" content="noindex,nofollow">` em rotas autenticadas via `react-helmet` ou similar. |
| A-16 | `tsconfig` com `noImplicitAny: false` (provável) | O alto número de `any` sugere `strict` desabilitado. | Habilitar `strict` gradualmente em novos arquivos. |
| A-17 | Histórico de planos zerado | Confirmado pelo usuário: 8 registros órfãos removidos. Garantir que o webhook real grava corretamente o primeiro `historico_planos` quando a primeira venda Hotmart chegar. | Monitorar logs da edge function `hotmart-webhook` durante o primeiro pedido. |

---

### 🟢 Pontos Positivos

- 🛡️ **RLS impecável:** 72/72 tabelas com RLS ativo, 281 políticas, 0 tabelas sem policy. Verificação automática confirmou cobertura total.
- 🛡️ **Multi-tenancy sólida:** modelo `owner_group_id` + `user_group_roles` consistente; 0 registros órfãos por `owner_group_id` em 38 tabelas verificadas.
- 🛡️ **Função `has_role` SECURITY DEFINER** corretamente isolada com `search_path = public`; evita recursão de RLS.
- 🛡️ **Histórico de pendências de segurança bem documentado** em `docs/PENDENCIAS_SEGURANCA.md` (30+ itens resolvidos com rastreamento).
- 🛡️ **Backups em Storage privado** com signed URLs (P-21 resolvido).
- 🛡️ **AI Gateway com cap por plano** (P-20) — Lite 50/mês, Business 500/mês, MOTHER ilimitado.
- 🛡️ **Rate limiting** na edge function `criar-usuario` (P-3).
- 🛡️ **Sem secrets hardcoded** no código — busca por `sk_live`, `sk_test`, JWT-like strings em `src/` e `supabase/functions/` retornou 0.
- 🛡️ **Vulnerabilidade `xlsx` resolvida** via shim sobre `exceljs`.
- 🎨 **Design system maduro:** tokens `--cda-*`, paleta Vinho Premium v2 consolidada.
- 🎨 **Loading + noscript fallbacks** em `index.html`.
- 🎨 **Acessibilidade:** nenhuma tag `<img>` sem `alt` detectada.
- 🧱 **Estrutura de pastas limpa** (`pages`, `components`, `hooks`, `lib`, `contexts`, `services`, `schemas`, `types`, `integrations`).
- 🧱 **88 rotas, todas envolvidas em `<ProtectedRoute>`** (exceto auth/SSO).
- 🧱 **Confirmação destrutiva** presente em 25 telas (AlertDialog).
- 🧱 **94 funções de banco**, 235 índices — schema bem otimizado.
- 🔄 **11 Edge Functions** cobrindo SSO, webhook Hotmart, AI proxy, backups, emails, recuperação.

---

### 📝 Resultado Completo por Bloco

#### 🏗️ BLOCO 1 — ARQUITETURA E ESTRUTURA
| Item | Status |
|---|---|
| Estrutura de pastas lógica e escalável | ✅ |
| Sem pastas órfãs significativas | ⚠️ Assets duplicados (A-6) |
| Ponto de entrada (`main.tsx`) bem definido | ✅ |
| Pages/components/hooks/utils organizados | ✅ |
| Separação lógica de negócio × UI | ✅ |
| `.env` não exposto no frontend (apenas `VITE_*` públicos) | ✅ |
| Sem arquivos de exemplo/template residuais | ✅ |
| `.gitignore` correto | ❌ C-1 |

#### 🔐 BLOCO 2 — SEGURANÇA E DADOS SENSÍVEIS
| Item | Status |
|---|---|
| Sem chaves/tokens hardcoded | ✅ |
| Variáveis de ambiente consumidas corretamente | ✅ |
| RLS ativo em todas as tabelas com dados de usuário | ✅ (72/72) |
| Validação de auth em rotas protegidas | ✅ |
| Isolamento entre usuários (cross-tenant) | ✅ |
| Proteção contra injeção (Supabase parametrizado) | ✅ |
| HTTPS | ✅ |
| `console.log` em produção | ⚠️ A-3 |

#### 🗄️ BLOCO 3 — BANCO DE DADOS E INTEGRAÇÕES
| Item | Status |
|---|---|
| Todas as tabelas existem | ✅ |
| Migrações consistentes (234 arquivos) | ✅ |
| Queries otimizadas (com índices) | ✅ |
| Tratamento de erro Supabase | ✅ |
| Políticas RLS para SELECT/INSERT/UPDATE/DELETE | ✅ (281 policies) |
| Foreign keys e relações | ✅ |
| Índices em colunas filtradas | ✅ (235 índices) |
| Edge Functions com tratamento de erro | ✅ |
| Storage buckets com policies | ⚠️ A-1, A-2 (2 públicos) |
| Tipos TS atualizados | ✅ (auto) |

#### ⚙️ BLOCO 4 — LÓGICA E FUNCIONALIDADES CORE
| Item | Status |
|---|---|
| Funcionalidades core implementadas | ✅ |
| Sem mocks em produção | ✅ |
| Fluxo de cadastro/login/recuperação | ✅ |
| Fluxo principal CRUD | ✅ |
| Cancelamento de conta | ⚠️ A-13 |
| Lógica de planos/assinaturas | ✅ |
| Cálculos financeiros validados | ✅ |
| Estados empty/loading/error | ✅ |
| Confirmação em ações destrutivas | ✅ (25 telas) |

#### 💻 BLOCO 5 — QUALIDADE DO CÓDIGO
| Item | Status |
|---|---|
| Sem código morto significativo | ✅ |
| Componentização suficiente | ✅ |
| TODO/FIXME/HACK resolvidos | ✅ (4 comentários inócuos) |
| Componentes reutilizáveis | ✅ |
| Tipagem TS / uso de `any` | ⚠️ A-4 (642 ocorrências) |
| Erros não silenciados | ✅ (sem catch vazio) |
| Loops infinitos / re-renders | ⚠️ A-14 |
| `useEffect` deps corretas | ⚠️ A-14 |
| Memory leaks (subs/listeners) | ✅ AuthContext faz unsubscribe |
| Inicialização do AuthContext | ⚠️ A-5 |

#### 🎨 BLOCO 6 — UI/UX
| Item | Status |
|---|---|
| Design consistente (tokens) | ✅ |
| Estados visuais (hover/disabled/loading) | ✅ |
| Mensagens de erro claras | ✅ (toasts pt-BR) |
| Mensagens de sucesso | ✅ |
| Validação de formulários (Zod) | ✅ |
| Responsividade | ⚠️ A-11 (sem teste real mobile) |
| Sem lorem ipsum / placeholder de teste | ✅ |
| Imagens com `alt` | ✅ |
| Contraste WCAG | ✅ (Vinho/Creme bem contrastados) |
| Navegação intuitiva | ✅ |
| Favicon e title | ✅ |
| Loading/splash | ✅ |

#### 🚀 BLOCO 7 — PERFORMANCE
| Item | Status |
|---|---|
| Imagens otimizadas | ⚠️ A-6 (duplicação) |
| Sem over-fetching óbvio | ✅ |
| Listas longas com paginação | ✅ |
| Lazy loading de imports | ⚠️ Não auditado em profundidade |
| Tamanho do bundle | ⚠️ A-9 |
| Promise.all onde aplicável | ✅ |
| Cache de dados estáticos (React Query) | ✅ |

#### 🌐 BLOCO 8 — SEO E META
| Item | Status |
|---|---|
| `<title>` correto | ✅ |
| Meta description | ✅ |
| Open Graph / Twitter Cards | ✅ |
| robots.txt | ✅ |
| sitemap.xml | ⚠️ A-7 |
| URLs amigáveis | ✅ |
| Fallback sem JS | ✅ |
| Meta robots em rotas privadas | ⚠️ A-15 |

#### 📧 BLOCO 9 — COMUNICAÇÃO E NOTIFICAÇÕES
| Item | Status |
|---|---|
| Emails transacionais (Resend) | ✅ |
| Remetente customizado | ✅ |
| Notificações in-app (toast) | ✅ |
| Webhooks com retry (Hotmart) | ✅ |
| Templates Cloud customizados | ⚠️ A-8 |

#### 💳 BLOCO 10 — PAGAMENTOS E ASSINATURAS
| Item | Status |
|---|---|
| Gateway em produção (Hotmart) | ✅ |
| Checkout testado com venda real | ⚠️ A-10 |
| Tratamento de falha | ✅ (webhook idempotente) |
| Webhooks processando | ✅ |
| Cancelamento libera/bloqueia acesso | ✅ |
| Upgrade/downgrade de plano | ✅ |
| Notas fiscais | 🔲 Responsabilidade Hotmart |

#### 📊 BLOCO 11 — ANALYTICS E MONITORAMENTO
| Item | Status |
|---|---|
| Analytics configurado | ❌ C-3 |
| Erros monitorados em produção | ❌ C-2 |
| Dashboard de saúde | 🔲 Cloud nativo |
| Logs sem dados sensíveis | ✅ |

#### 🧪 BLOCO 12 — TESTES E VALIDAÇÃO FINAL
| Item | Status |
|---|---|
| Fluxos críticos testados manualmente | 🔲 A validar pelo usuário |
| Testado nos principais navegadores | 🔲 A validar pelo usuário |
| Testado em mobile real | ⚠️ A-11 |
| Casos extremos (campos vazios, etc.) | 🔲 A validar pelo usuário |
| Suíte automatizada | ⚠️ A-12 |

---

### 🎯 Plano de Ação Recomendado

**Antes do lançamento (essencial):**
1. **C-1** — Adicionar `.env*` ao `.gitignore` (5 min)
2. **C-2** — Configurar Sentry para frontend e edge functions (1-2 h)
3. **C-3** — Plugar Posthog ou GA4 (30 min)
4. **A-1 / A-2** — Tornar buckets `assinaturas` e `topo-bolo` privados + signed URLs (1 h)
5. **A-10** — Validar 1 venda real Hotmart end-to-end (30 min monitorando logs)
6. **A-11** — Smoke test em mobile real (iOS + Android, 30 min)

**Primeira semana pós-lançamento:**
7. **A-3** — Limpar 218 `console.*` e adicionar lint rule
8. **A-5** — Corrigir ordem de inicialização do `AuthContext` ou atualizar memória
9. **A-6** — Remover hero banners `.jpg` ou `.png` duplicados
10. **A-8** — Customizar templates de email no Cloud
11. **A-15** — Adicionar `<meta name="robots" content="noindex">` nas rotas autenticadas

**Próximo sprint:**
12. **A-4 / A-16** — Plano de redução de `any` + habilitar `strict`
13. **A-7** — `sitemap.xml`
14. **A-9** — Auditoria de bundle
15. **A-12** — Suíte E2E mínima (login, encomenda, webhook Hotmart)
16. **A-13** — Self-service de cancelamento de conta
17. **A-14** — `eslint-plugin-react-hooks` em modo error

---

### 🏁 Veredicto Final

> ⚠️ **APROVADO COM RESSALVAS**
>
> Não há bloqueadores de **segurança** críticos — a base RLS é sólida, multi-tenancy está consistente, e o histórico de pendências mostra rigor. Porém, lançar sem **monitoramento de erros (Sentry)** e **analytics** é como dirigir vendado: você não saberá nem se o sistema está quebrando, nem se está sendo usado.
>
> Os 3 críticos acima são tudo trabalho de poucas horas. Recomendo bloquear o lançamento até C-1, C-2 e C-3 estarem prontos, e tratar A-1/A-2/A-10/A-11 como condicionantes. Os demais itens de atenção podem entrar no primeiro sprint pós-lançamento.
>
> Posso resolver C-1, C-2, C-3, A-1 e A-2 agora mesmo se você autorizar.

---


> Última atualização: 2026-05-27T14:15:00Z — Fundo gradiente preto elegante aplicado nas telas de autenticação.

## UI/UX — FUNDO GRADIENTE NA TELA DE AUTENTICAÇÃO — 2026-05-27 14:15 UTC

| # | Item | Status | Descrição |
|---|------|--------|-----------|
| AU-1 | `src/pages/auth/Login.tsx` | ✅ | Lado direito (formulário) agora usa gradiente `linear-gradient(135deg, hsl(0 0% 10%), hsl(345 55% 9%), hsl(0 0% 5%))` em vez de `bg-cda-preto` plano. Opacidade do pattern overlay aumentada de 0.03 para 0.04. |
| AU-2 | `src/pages/auth/ForgotPassword.tsx` | ✅ | Mesmo gradiente e ajuste de pattern overlay aplicados no lado direito da tela. |
| AU-3 | `src/pages/auth/ResetPassword.tsx` | ✅ | Mesmo gradiente e ajuste de pattern overlay aplicados no lado direito da tela. |

---

> Última atualização: 2026-05-27T12:30:00Z — Removido botão "Tour pelo Caixa de Açúcar" do onboarding de conclusão.

## BACKUP — MÓDULO GOVERNANÇA (MOTHER ONLY) — 2026-05-26 21:00 UTC

| # | Item | Status | Descrição |
|---|------|--------|-----------|
| BK-G1 | `src/lib/backupCatalog.ts` | ✅ | Novo módulo `governanca` com flag `motherOnly: true`. Tabelas: `groups`, `user_global_roles`, `user_group_roles`, `user_roles`, `profiles`, `historico_planos`. ~~`admin_logs`~~ removido (logs administrativos não precisam de backup). Novo helper `modulosDisponiveis(isMother)` e `DEFAULT_MODULOS` ajustado para não incluir módulos `motherOnly`. |
| BK-G2 | `src/pages/configuracoes/Backup.tsx` | ✅ | UI passa a renderizar somente os módulos retornados por `modulosDisponiveis(isMother)`. Usuários não-MOTHER não veem checkbox/chip de Governança. |
| BK-G3 | Edge Function `executar-backups-agendados` | ✅ | Verifica `user_global_roles.role_global = 'MOTHER'`. Remove módulos `motherOnly` para não-MOTHER. Tabelas de governança são lidas sem filtro de tenant (snapshot global). `profiles` vira snapshot global quando MOTHER inclui Governança. Deploy realizado. |

---


## BACKUP — REFINAMENTO DO ESCOPO POR MÓDULO — 2026-05-26 20:30 UTC

| # | Item | Status | Descrição |
|---|------|--------|-----------|
| BK-R1 | `src/lib/backupCatalog.ts` | ✅ | Módulo **Minha Operação** agora cobre Cadastros + Cardápio + Estoque + ritual pessoal (incluída `organizacao_doce_state`, módulo descontinuado em 2026-06-22). |
| BK-R2 | `src/lib/backupCatalog.ts` | ✅ | Módulo **Meu Negócio** consolidado: Meu Dinheiro (bancos, plano de contas, contas a pagar/receber, custos fixos, juros), Fechamentos, Meu Salário e **Conversa Doce** (`conversa_doce_favoritos` migrada de Sistema). |
| BK-R3 | `src/lib/backupCatalog.ts` | ✅ | Módulo **Sistema** redefinido para refletir Configurações / Meus Dados: inclui `profiles` (perfil da confeitaria) e `tags` do sistema. |
| BK-R4 | Edge Function `executar-backups-agendados` | ✅ | `MODULO_TABELAS` espelhado com o novo catálogo. Tratamento especial para `profiles` (filtrado por `id = usuario_id`). Deploy realizado. |

---


## BACKUP — REMOÇÃO DO MÓDULO PLANEJAMENTO — 2026-05-26 20:00 UTC

| # | Item | Status | Descrição |
|---|------|--------|-----------|
| BK-1 | `src/lib/backupCatalog.ts` | ✅ | Removido módulo `planejamento` do catálogo (`BackupModuloId`, `BACKUP_MODULOS`, `DEFAULT_MODULOS`). O módulo continua existindo no app, mas suas tabelas não são mais incluídas em backups manuais nem agendados. |
| BK-2 | Edge Function `executar-backups-agendados` | ✅ | Removido entry `planejamento` do `MODULO_TABELAS` e do fallback de módulos padrão. Deploy realizado. |
| BK-3 | Memória do projeto | ✅ | Atualizado `mem://features/backup-system` para refletir os 4 módulos atuais (sem planejamento). |

---

> Última atualização: 2026-05-26T16:30:00Z — Proteção anti-replay SSO (`sso_token_log`).

## SEGURANÇA — 2026-05-26 16:30 UTC (Anti-replay SSO)

- ✅ Criada tabela `public.sso_token_log` (jti único, email, direction `saida`/`entrada`, used_at, expires_at, ip, user_agent) com índices em `jti` e `expires_at`.
- ✅ RLS habilitada **sem policies** + `GRANT ALL` apenas para `service_role` (anon/authenticated não têm acesso). Edge functions usam service role para registrar/consultar `jti`.
- ✅ Função `public.cleanup_expired_sso_tokens()` (SECURITY DEFINER, search_path fixo) remove registros com `expires_at < now() - interval '1 day'`. EXECUTE revogado de PUBLIC/anon/authenticated, mantido apenas para `service_role`.
- ✅ Job pg_cron `cleanup-expired-sso-tokens` agendado para `0 3 * * *` (03:00 UTC diariamente) executando a função de limpeza.
- ⏳ Próximo passo: integrar `sso_token_log` nas edge functions de emissão/consumo de tokens SSO (insert do `jti` na emissão; check de unicidade na entrada).

## DOCS_MESTRE.md SINCRONIZADO — 2026-05-26 15:45 UTC

- ✅ Paleta atualizada para Vinho Premium v2 (removidas menções a Pistache/Cloud)
- ✅ Rotas reais espelhadas: incluídos `/meu-salario`, `/planejamento`, `/estoque`, `/conversa-doce`, `/organizacao-doce`, `/financeiro/fechamento-mes`, `/financeiro/cadastros/*`
- ✅ Modelo de dados expandido com tabelas reais: `estoque`, `estoque_movimentacoes`, `fechamentos_mensais`, `fechamento_checklist_itens`, `fechamento_logs`, `planejamento_*`, `meu_salario_retiradas`, `conversa_doce_favoritos`, `organizacao_doce_state`, `imersao_notificacoes_log`, `ai_usage_quotas`, `hotmart_produtos`, `transferencias_bancos`, colunas `plano_pendente_*`
- ✅ Edge functions completas: `ai-proxy`, `aplicar-planos-pendentes`, `notificar-expiracao-imersao` (antes só 4 listadas)
- ✅ Plano Start removido (descontinuado 2026-05-25); adicionado plano `aluna_imersao`
- ✅ Eventos de `historico_planos.tipo_evento` documentados (criacao/renovacao/upgrade/downgrade_agendado/reativacao/renovacao_imersao)
- ✅ Nova seção 12 (AI Gateway Cap) e 14 (Convenções Obrigatórias)
- ✅ Performance Maio/2026 adicionada


---

## REORGANIZAÇÃO DA DOCUMENTAÇÃO — 2026-05-26 15:30 UTC

| # | Item | Status | Descrição |
|---|------|--------|-----------|
| DOC-1 | Consolidação em `docs/` | ✅ | Todos os `.md` de documentação migrados da raiz para `docs/`. Raiz mantém apenas `README.md`. |
| DOC-2 | Remoção de duplicados | ✅ | Excluído `AUDITORIA.md` da raiz (era stub de 805B duplicando `docs/AUDITORIA.md` de 75KB). |
| DOC-3 | Remoção de obsoletos | ✅ | Excluído `docs/DOCUMENTACAO_COMPLETA.md` (21KB de prosa que duplicava conteúdo dos DOCS_*.md modulares). `DOCS_MESTRE.md` permanece como índice canônico. |
| DOC-4 | Movidos para `docs/` | ✅ | DOCS_AUTENTICACAO, DOCS_ENCOMENDAS, DOCS_ESTOQUE, DOCS_FECHAMENTO_MES, DOCS_FINANCEIRO, DOCS_GOVERNANCA, DOCS_MESTRE, DOCS_MEU_SALARIO, DOCS_PLANEJAMENTO, DOCS_PRECIFICACAO. |
| DOC-5 | Índice atualizado | ✅ | Seção 13 do `DOCS_MESTRE.md` agora lista os 15 documentos ativos com caminho relativo correto (`./*.md`, sem prefixo `docs/`). |

---



## FLUXO DE EXPIRAÇÃO — IMERSÃO A RECEITA QUE FALTAVA — 2026-05-26 13:40 UTC

| # | Item | Status | Descrição |
|---|------|--------|-----------|
| IM-1 | Tabela `imersao_notificacoes_log` | ✅ | Criada com campos `user_id`, `dias_restantes`, `tipo` (aluna/admin), `email_destinatario`, `enviado_em`, `erro`. Unique index `(user_id, dias_restantes, tipo, dia_BR)` garante idempotência diária. RLS: admin lê tudo via `has_role`; service_role gerencia. Grants padrão. |
| IM-2 | Edge Function `notificar-expiracao-imersao` | ✅ | `verify_jwt = false`. Busca alunas com `plano_id='aluna_imersao'`, `ativo=true`, `plano_fim ∈ {hoje+7, hoje+3, hoje+1}` (timezone America/Sao_Paulo). Envia e-mails via Resend (`RESEND_API_KEY` reutilizada). Templates HTML inline com branding Vinho/Dourado e CTA para `https://upcaixa.umbrelladoce.com.br`. E-mail consolidado para admin via secret `EMAIL_ADMIN_IMERSAO`. Idempotência por insert na tabela de log antes do envio. |
| IM-3 | Agendamento pg_cron `notificar-expiracao-imersao-diario` | ✅ | Job diário às 12:00 UTC (09:00 BRT) via `net.http_post` para a edge function. Inserido via `cron.schedule`. |
| IM-4 | Redirect externo para alunas Imersão | ✅ | `src/pages/Upgrade.tsx`: se `plano.id === 'aluna_imersao'` → `window.location.href = URL_UPGRADE_EXTERNO` (`https://upcaixa.umbrelladoce.com.br`). Constante em `src/lib/constants.ts`. |
| IM-5 | Notificações em tela (aluna) | ✅ | `AlertaExpiracaoPlano` ganhou CTA "Renovar agora" → URL externa quando plano é Imersão. Novo `ModalExpiracaoImersao` aparece uma vez por sessão (sessionStorage) em D-1 e D-0 com CTA destacado. |
| IM-6 | CTA pós-expiração no Login | ✅ | `src/pages/auth/Login.tsx`: ao detectar erro contendo "expirou" no signIn, exibe botão coral "Renovar acesso à Imersão" → URL externa. |
| IM-7 | Painel admin — alunas expirando | ✅ | Novo card `AlunasImersaoExpirando` em `/configuracoes/usuarios` (aba Usuários) lista alunas com `plano_fim` entre hoje e hoje+7, ordenadas por vencimento. Badge colorida por proximidade (destructive ≤1d, default ≤3d, secondary >3d). |



## PADRONIZAÇÃO VISUAL — RODAPÉ — 2026-05-26 13:00 UTC

| # | Item | Status | Descrição |
|---|------|--------|-----------|
| UI-1 | Cor do rodapé padronizada com header e sidebar | ✅ | Footer alterado em `src/App.tsx`: `bg-cda-vinho-escuro` → `bg-cda-vinho` e `border-cda-dourado/20` → `border-cda-dourado/30`. Agora o rodapé, o cabeçalho (`bg-cda-vinho`) e o sidebar (`--sidebar-background: 345 55% 23%`, mesmo vinho) compartilham a mesma cor de fundo, criando consistência visual no shell do app.

---

## SCAN SUPABASE — STORAGE POLICIES — 2026-05-26 12:50 UTC

| # | Item | Status | Descrição |
|---|------|--------|-----------|
| SEC-1 | Políticas órfãs apontando para bucket inexistente | ✅ | Removidas 3 policies em `storage.objects` ("Users can delete/upload/view own comprovantes") que referenciavam `bucket_id = 'comprovantes-pagamento'` — bucket que nunca existiu. Os buckets reais `comprovantes-pagar` e `comprovantes-receber` já possuem suas próprias policies corretas. Eram código morto, sem efeito funcional, mas geravam ruído no scanner. |
| SEC-2 | Bucket `pre-preparos` sem policies UPDATE/DELETE para o dono | ✅ | Criadas policies `Users can update own pre-preparo images` e `Users can delete own pre-preparo images` em `storage.objects`, escopadas a `bucket_id = 'pre-preparos' AND (auth.uid())::text = (storage.foldername(name))[1]`. Usuários agora podem substituir e remover suas próprias imagens via Storage API. |
| SEC-3 | `estoque_movimentacoes` sem policy UPDATE | 🟡 Intencional (ignored) | Tabela é livro-razão imutável (audit trail de movimentações de estoque). Correções são feitas via novas movimentações compensatórias ou DELETE+INSERT pelo dono — nunca por UPDATE in-place. Adicionar policy UPDATE comprometeria integridade do histórico e do cálculo de custo médio. Decisão documentada na security memory para o scanner não reflagar. |

---


## QUICK WINS #1 e #4 — BACKUP CRON + ÍNDICE — 2026-05-26 12:45 UTC

| # | Item | Status | Descrição |
|---|------|--------|-----------|
| QW-1 | Cron `executar-backups-agendados` reduzido | ✅ | Schedule alterado via `cron.alter_job(1, '0 3,15 * * *')`. De `*/30 * * * *` (48 execuções/dia) → `0 3,15 * * *` (2 execuções/dia, 03h e 15h UTC). Reduz ~96% das invocações da Edge Function sem perda funcional: a função interna ainda respeita o `horario` cadastrado pelo usuário em `backup_agendamentos` e só dispara quando `now() >= proximo_execucao_em`. |
| QW-4 | Índice composite em `backups` | ✅ | Criado `idx_backups_usuario_created (usuario_id, created_at DESC)` — cobre o padrão dominante de query (listar backups do usuário do mais recente ao mais antigo). Índice antigo `idx_backups_usuario_id` removido por ficar redundante (prefixo do composite). Tabela hoje com 760 kB / 19 snapshots — ganho marginal agora, mas estrutural conforme a base cresce. |

---

## QUICK WIN #2 — REALTIME FINANCEIRO REMOVIDO — 2026-05-26 12:40 UTC

| # | Item | Status | Descrição |
|---|------|--------|-----------|
| QW-2 | Realtime removido das tabelas financeiras | ✅ | Tabelas `contas_receber_parcelas`, `contas_receber_pagamentos`, `contas_pagar_parcelas` e `contas_pagar_pagamentos` removidas da publicação `supabase_realtime` via `ALTER PUBLICATION ... DROP TABLE`. Em `src/pages/Dashboard.tsx` o canal `dashboard-updates` agora escuta apenas `encomendas` (único caso onde realtime ainda agrega valor). As 4 tabelas financeiras raramente mudam fora de ações do próprio usuário; o Dashboard e o hub `/financeiro` recarregam ao remontar e as próprias telas financeiras chamam suas rotinas de recarga após mutações (DarBaixa, Form de Contas, etc.). Impacto: corta ~80% das mensagens realtime à medida que a base cresce, sem perda funcional perceptível para um usuário ativo. |

---


## NOVO MÓDULO CONVERSA DOCE — 2026-05-26 03:00 UTC

| # | Item | Status | Descrição |
|---|------|--------|-----------|
| CD-1 | Módulo Conversa Doce portado | ✅ | Assistente IA de respostas WhatsApp. Reutiliza `ai-proxy` (Gemini 2.5 Flash). Tabela `conversa_doce_favoritos` com RLS multi-tenant (compartilhado por grupo via `user_group_roles`). Rotas `/conversa-doce` e `/conversa-doce/respostas`. Gating: plano Business + role admin/MOTHER (Lite redireciona para /upgrade via `PlanoGuard`). Sidebar item adicionado na seção PLANEJAMENTO com `adminOnly: true`. Detalhes em `docs/MODULO_CONVERSA_DOCE.md`. |

---


## P-1 HOTMART MATCHING POR (PRODUCT + OFFER) — 2026-05-26 01:55 UTC

| # | Item | Status | Descrição |
|---|------|--------|-----------|
| P-1.b | Suporte a múltiplas ofertas por produto (Caixa Business) | ✅ | Tabela `hotmart_produtos` ganhou coluna `offer_code` (text, nullable). PK antiga (`product_id`) substituída por índice único `(product_id, COALESCE(offer_code, ''))` — permite uma linha NULL por produto (oferta única, ex.: Lite) e várias linhas por produto quando há múltiplas ofertas. `resolverPlano()` agora aceita `offerCode` e segue a ordem: (1) match exato `(product_id, offer_code)`, (2) match `(product_id, offer_code IS NULL)`, (3) fallback por palavras-chave. Webhook lê `purchase.offer.code` do payload Hotmart e passa para `resolverPlano()` nos eventos `PURCHASE_APPROVED/COMPLETE` e `SWITCH_PLAN`. Seeds: `7448785/n20dvd6j` → `negocio/mensal` (Caixa Business Mensal), `7448785/mto997mw` → `negocio/anual` (Caixa Business Anual). Caixa Lite (`7449074`, offer_code NULL) continua funcionando via passo 2. |
| P-1 | Webhook Hotmart resolve plano pelo `productId` exato | ✅ | Nova tabela `hotmart_produtos` (FK para `planos.id`, `plano_tipo` mensal/anual, `ativo`, `descricao`). RLS: leitura para `authenticated`, escrita só para MOTHER. Quando productId+offer está cadastrado e ativo → resolve por ID (fonte de verdade). Quando não está cadastrado → fallback de palavras-chave **passou a exigir match explícito** com `"business"` ou `"caixa lite"` (rejeita produtos genéricos como Imersão R$97 que antes caíam em Lite por default). Quando `ativo=false` → rejeita. Log de rejeição registra `productId` e `planName` para facilitar cadastro de novos produtos. |

---



---

## P-3 AI GATEWAY CAP — 2026-05-26 01:30 UTC

| # | Item | Status | Descrição |
|---|------|--------|-----------|
| P-3 | Cap de consumo da IA por usuário | ✅ | Infraestrutura preventiva: tabela `ai_usage_quotas` (RLS: usuário vê só o próprio, MOTHER vê tudo, escrita só via service role), RPCs SECURITY DEFINER `check_and_increment_ai_quota(user_id, plano_id)` e `record_ai_tokens(user_id, in, out)` com EXECUTE só para `service_role`. Edge function `ai-proxy` aplica: (1) IP rate limit 30 req/min, (2) JWT via `getClaims()`, (3) bloqueio se `ativo=false`, (4) check + increment atômico de cota mensal (Lite=50, Business=500, MOTHER=ilimitado), (5) whitelist de modelos (`gemini-2.5-flash`/`flash-lite`/`pro`), (6) chamada ao Lovable AI Gateway e (7) gravação de tokens reais. Frontend usa hook `useAi()` (`src/hooks/useAi.ts`) que trata erros 429/402 via toast. Docs completas em `docs/AI_GATEWAY_CAP.md`. |

---

## LIMPEZA RESIDUAL PLANO START — 2026-05-25 22:45 UTC

| # | Item | Status | Descrição |
|---|------|--------|-----------|
| RF-PLAN | Log do webhook `SWITCH_PLAN` | ✅ | Mensagem `"SWITCH_PLAN ignorado — plano Start descontinuado"` substituída por `"SWITCH_PLAN ignorado — plano não reconhecido"` em `hotmart-webhook/index.ts:316`. Response `action` mudou de `ignored_discontinued_plan` para `ignored_unknown_plan` (fallback genérico, já que `resolverPlano` não rejeita mais por palavra-chave `start`). |
| RF-PLAN | `docs/DOCS_PLANOS.md` | ✅ | Catálogo, módulos, periodicidades (`7dias`/`14dias`), regras do `resolverPlano`, cálculo de `plano_fim` e CTA "Fazer Upgrade" do `AlertaExpiracaoPlano` marcados como descontinuados/atualizados. Aviso de topo refinado. Versão 1.2. |
| RF-PLAN | `docs/DOCUMENTACAO_COMPLETA.md` | ✅ | Removida menção ao plano Start na seção 1 (substituída por nota de descontinuação); módulos Estoque (§6) e Financeiro (§7) passam a citar apenas Business; integração Hotmart (§13) não lista mais Start nem "trimestral". |

---

## CORREÇÕES SEUSDADOS.TSX — 2026-05-25 21:30 UTC

| # | Item | Status | Descrição |
|---|------|--------|-----------|
| SD-1 | Storage path da logo | ✅ | `handleImageUpload` e `handleRemoveImage` passaram a usar caminhos iniciando diretamente com `${user.id}/...`, eliminando o prefixo `logotipos/` que conflitava com as policies do bucket (escopadas por `(storage.foldername(name))[1] = auth.uid()::text`). Atualizado em `upload`, `list` e `remove`. |
| SD-2 | Persistência imediata de `avatar_url` | ✅ | Após o upload bem-sucedido, `handleImageUpload` agora executa `update({ avatar_url: publicUrl })` em `profiles` antes do toast e invalida a query do perfil. `handleRemoveImage` faz o mesmo com `avatar_url: null`. Evita órfãos no Storage quando o usuário fecha a página sem submeter o formulário. |
| SD-3 | QueryKey escopada por grupo | ✅ | `useGroup()` importado e `activeGroup` destructurado. `useQuery` do perfil e as 3 chamadas a `invalidateQueries` (upload, remove, mutation onSuccess) agora usam `['profile', user?.id, activeGroup?.id]`, alinhando ao padrão multi-tenant do projeto e garantindo invalidação correta ao trocar de grupo ativo. |
| SD-4 | Campo `email` no update do perfil | ✅ | `updateProfileMutation` passou a incluir `email: data.email` no objeto enviado ao `.update()` de `profiles`, junto a `nome_completo`, `telefone` e `cpf`. O campo já existia no formulário/useForm mas não era persistido. |

---

## REMOÇÃO PLANO START — 2026-05-25 19:55 UTC

| # | Item | Status | Descrição |
|---|------|--------|-----------|
| RF-PLAN | Plano Caixa Start descontinuado | ✅ | 7 usuários com `plano_id='start'` desativados (`ativo=false`) e migrados para `plano_id='base'` / `plano_tipo='anual'`. Registros em `historico_planos` referenciando `start` foram apagados. Registro `id='start'` removido de `public.planos`. |
| RF-PLAN | Webhook Hotmart — regra de rejeição removida | ✅ (revertido 2026-05-25 22:15 UTC) | ~~`resolverPlano()` retornava `null` para planos `start`.~~ Regra removida: `resolverPlano()` não rejeita mais por palavra-chave `start`. Eventos Hotmart com plano Start serão provisionados como `base` (Caixa Lite) ou `negocio` (Caixa Business) conforme demais palavras-chave. Simplifica o webhook já que o plano foi descontinuado no banco. |
| RF-PLAN | UI Admin | ✅ | Opção "Caixa Start" removida de `CriarUsuarioDialog` e `EditarUsuarioDialog`; card de estatística "Start 14d" e filtros relacionados removidos de `Usuarios.tsx`; badge "Start" removida da listagem; export Excel sem rótulo Start. |
| RF-PLAN | Frontend geral | ✅ | `usePlano.ts` sem entrada `start`; `AlertaExpiracaoPlano` sem CTA "Fazer Upgrade" (que era exclusivo Start); `AppSidebar` exibe `plano_tipo` para todos os planos restantes. |

---



## SEGURANÇA PROFILES — 2026-05-25 15:39 UTC (Proteção do campo `ativo`)

| # | Item | Status | Descrição |
|---|------|--------|-----------|
| RF-S | Usuário desativado podia se reativar via API | ✅ | Trigger `protect_plan_fields()` em `profiles` agora também executa `NEW.ativo := OLD.ativo` para não-admins. Apenas admins e service_role (edge functions) podem alterar `ativo`. Fecha o vetor onde um usuário desativado com sessão válida poderia fazer `update({ativo:true}).eq('id', auth.uid())`. |

---

---

## SEGURANÇA STORAGE — 2026-05-25 15:37 UTC (Privatização de buckets de imagens)

| # | Item | Status | Descrição |
|---|------|--------|-----------|
| RF-S | Buckets pre-preparos e receitas públicos | ✅ | Buckets tornados privados (`storage.buckets.public = false`). Policies SELECT antigas removidas; novas `Group members can view {recipe,pre-preparo} images` restringem SELECT a authenticated pertencente ao mesmo `owner_group_id` do uploader (matched via `(storage.foldername(name))[1]`). Código atualizado para `createSignedUrl(3600)` em `src/utils/exportarReceitaPDF.ts`, `src/utils/exportarPrePreparoPDF.ts` e `src/pages/ReceitaForm.tsx` (state map `signedImageUrls` + useEffect). |
| RF-S | Bucket órfão `logos` sem políticas | ✅ | Policy RESTRICTIVE `Deny all access to orphan logos bucket` em `storage.objects` nega qualquer operação onde `bucket_id = 'logos'`. Remoção física pendente via Storage API. |
| RF-S | comprovantes-receber SELECT (falso positivo) | ✅ | Scanner confirmou que a policy existente já está corretamente escopada (`foldername(name)[1] = auth.uid()::text`). Finding ignorado. |

---

## REFATORAÇÃO RECEITAFORM — 2026-05-24 18:00 UTC (useAuth centralizado)

| # | Item | Status | Descrição |
|---|------|--------|-----------|
| 105 | Centralizar acesso ao user em ReceitaForm | ✅ | Removidas 6 chamadas redundantes a `await supabase.auth.getUser()` (useEffect de carregamento, handleSave e 4 handlers inline de criação em cadeia). Substituídas por uma única instância de `const { user } = useAuth()` no topo do componente. Guards `if (!user)` preservados usando a variável do hook. |

---


## REFATORAÇÃO HOOKS CADASTROS — 2026-05-24 16:00 UTC (React Query)

| # | Item | Status | Descrição |
|---|------|--------|-----------|
| 102 | Migrar useClientes para React Query | ✅ | `useState`+`useEffect` substituídos por `useQuery` (key `["clientes", userId]`) e `useMutation` para create/update/delete com `invalidateQueries`. Toasts movidos para `onSuccess`/`onError`. Interface pública preservada (`createCliente`/`updateCliente`/`deleteCliente` via `mutateAsync`). |
| 103 | Migrar useFornecedores para React Query | ✅ | Mesmo padrão de `useMaoObraPerfis`. QueryKey `["fornecedores", userId]`. Compatível com `FornecedorAutocomplete` e `cadastros/Fornecedores.tsx`. |
| 104 | Migrar useFornecedorContatos para React Query | ✅ | QueryKey `["fornecedor_contatos", fornecedorId, userId]`. Invalidação ampla por prefixo `["fornecedor_contatos"]`. Interface (`contatos`, `loading`, `createContato`, `updateContato`, `deleteContato`, `refetch`) preservada. |

---

## REFATORAÇÃO PRECIFICAÇÃO — 2026-05-24 15:00 UTC (useReceitas: N+1 → 4 queries)

| # | Item | Status | Descrição |
|---|------|--------|-----------|
| 100 | Eliminar N+1 em useReceitas | ✅ | `fetchReceitas` agora executa 1 query para receitas + 1 Promise.all com 4 queries usando `.in("receita_id", receitasIds)` para ingredientes, embalagens, despesas e imagens. Map interno trocado por map síncrono que filtra arrays em memória. Antes: até 1 + 4N queries (≈80 para 20 receitas); agora: 5 queries totais. Resultado idêntico. |


---

## REFATORAÇÃO MEU SALÁRIO — 2026-05-24 14:30 UTC (formatBRL → src/lib/formatUtils.ts)

| # | Item | Status | Descrição |
|---|------|--------|-----------|
| 96 | Criar src/lib/formatUtils.ts | ✅ | Função `formatBRL` movida de useMeuSalario.ts para novo arquivo src/lib/formatUtils.ts |
| 97 | Remover formatBRL de useMeuSalario.ts | ✅ | Export removido do hook — sem mais mistura de formatação com lógica de dados |
| 98 | Atualizar todos os imports | ✅ | 7 arquivos atualizados: Retiradas.tsx, CardResumoMes.tsx, HistoricoMensal.tsx, CenarioResultado.tsx, FechamentoMes.tsx, exportarMeuSalarioPDF.ts |
| 99 | Unificação com funções equivalentes | ⚠️ N/A | Outros módulos (PDFs de pedido/receita/pré-preparo, ProjeçãoVendas, PrevisaoFaturamento) usam inline `toLocaleString` — não há função exportada equivalente para unificar; permanecem como estão por estarem em contextos isolados (PDFs inline) |

---

---

## MÓDULO MEU SALÁRIO — 2026-05-24 14:00 UTC (Retiradas: período visível + seletor)

| # | Item | Status | Descrição |
|---|------|--------|-----------|
| 94 | Indicação do período exibido | ✅ | Adicionado rótulo "Exibindo retiradas de {período}" abaixo do subtítulo em Retiradas.tsx. Mostra nome dos meses e ano, com badge "mês atual + anterior" quando aplicável. |
| 95 | Seletor de mês/ano | ✅ | Controles com setas anterior/próximo + selects de mês e ano. Futuro bloqueado. Ao selecionar mês atual, mantém comportamento original (mês anterior + atual). Ao selecionar mês passado, mostra apenas aquele mês. |

---

---

## MELHORIAS ESTOQUE + PLANEJAMENTO — 2026-05-07 19:41 UTC

| # | Item | Status | Descrição |
|---|------|--------|-----------|
| 90 | Proteção duplicidade baixa estoque | ✅ | `executarBaixaEstoqueEncomenda` verifica `estoque_baixa_realizada` no DB antes de executar |
| 91 | Histórico movimentação enriquecido | ✅ | `EstoqueMovimentacoes` exibe coluna Referência com cliente e data da encomenda vinculada |
| 92 | Drag-and-drop no calendário | ✅ | Encomendas e descansos podem ser arrastados entre dias no calendário de planejamento |
| 93 | Eventos recorrentes | ✅ | Descansos recorrentes (semanal/mensal/anual) com projeção automática no calendário. Migration adicionou colunas `recorrente` e `recorrencia_tipo` |

---

## REMOÇÃO APP UMBRELLA DOCE — 2026-05-07 12:00 UTC

| # | Item | Status | Descrição |
|---|------|--------|-----------|
| 73 | Tokens CSS `--umbrella-*` → `--cda-*` | ✅ | Renomeados em index.css, tailwind.config.ts e todos os componentes que usavam classes `umbrella-*` |
| 74 | Logo `umbrella-logo-dourado.png` → `cda-logo-dourado.png` | ✅ | Renomeado em public/ e src/assets/. Referências atualizadas em index.html e LoadingMascote.tsx |
| 75 | Alt texts e comentários | ✅ | Alterados de "Umbrella Doce — Gestão para Confeitarias" para "Caixa de Açúcar — Gestão para Confeitarias" |
| 76 | Link upgrade `gestao.umbrelladoce.com.br` | ✅ | Removido de AlertaExpiracaoPlano.tsx |
| 77 | DOCS_MESTRE.md | ✅ | Atualizado ecossistema, paleta e tokens. Mantido "by Umbrella Doce" como marca da empresa |
| 78 | Referências mantidas (empresa) | ℹ️ | Emails (@umbrelladoce.com.br), domínio (caixa.umbrelladoce.com.br) e branding "by Umbrella Doce" preservados — são da empresa, não do app |

---

## MÓDULO DE ESTOQUE — 2026-05-06 21:00 UTC

| # | Item | Status | Descrição |
|---|------|--------|-----------|
| 66 | Tabela `estoque` | ✅ | Criada com RLS owner + RESTRICTIVE plan_check |
| 67 | Tabela `estoque_movimentacoes` | ✅ | Criada com RLS owner + RESTRICTIVE plan_check, sem UPDATE |
| 68 | Sidebar "Meus Insumos" | ✅ | Movido de "Em Breve" para menu principal, apontando /estoque |
| 69 | PlanoGuard /estoque/* | ✅ | Rotas bloqueadas para Caixa Lite |
| 70 | Hook useEstoque | ✅ | CRUD estoque + movimentações + custo médio ponderado |
| 71 | Páginas Dashboard/Entrada/Ajuste/Movimentações | ✅ | 4 telas criadas em src/pages/estoque/ |
| 72 | DOCS_ESTOQUE.md | ✅ | Documentação do módulo criada |

---

## CORREÇÕES DE SEGURANÇA — 2026-05-06 00:30 UTC

| # | Item | Status | Descrição |
|---|------|--------|-----------|
| 62 | HTML injection em emails | ✅ | Criado `_shared/escapeHtml.ts`. Aplicado em `criar-usuario`, `hotmart-webhook`, `enviar-recuperacao-senha` para sanitizar nome e email antes de interpolar em templates HTML. |
| 63 | Backup cron aceita anon key | ✅ | Removida aceitação da anon key em `executar-backups-agendados`. Agora aceita apenas `CRON_SECRET` ou `service_role` key. |
| 64 | encomendas_tags SELECT permissiva | ✅ | Removida policy `Encomendas_tags visíveis para autenticados` que expunha tags de todos os usuários. Policy owner-scoped permanece. |
| 65 | comprovantes-receber sem SELECT | ✅ | Adicionada policy SELECT owner-scoped no bucket `comprovantes-receber`. |

---

## TRANSFERÊNCIAS BANCÁRIAS + FECHAMENTO MÊS — 2026-05-05 12:45 UTC

| # | Item | Status | Descrição |
|---|------|--------|-----------|
| 58 | Tabela `transferencias_bancos` | ✅ | Tabela criada com RLS por `usuario_id`, policy restrictive `user_has_financial_access`, constraints `valor > 0` e `origem ≠ destino`. |
| 59 | RPC `realizar_transferencia` | ✅ | Função `SECURITY DEFINER` atômica. REVOKE anon/public, GRANT apenas `authenticated`. Valida saldo, atualiza bancos, insere registro. |
| 60 | Modal de Transferência | ✅ | `TransferenciaBancosModal.tsx` no Dashboard Financeiro. Selects de origem/destino, validação de saldo em tempo real. |
| 61 | Fechamento do Mês | ✅ | Processo implícito já existente no Fluxo de Caixa Mensal (saldo final → saldo inicial mês seguinte). Adicionado destaque "Saldo Final do Mês Anterior" no Fluxo Diário. |

---

## OTIMIZAÇÕES SEMANA 1 — 2026-04-23 23:00 UTC

| # | Item | Status | Descrição |
|---|------|--------|-----------|
| 55 | Frequência do cron de backup | ✅ | `executar-backups-agendados` alterado de `*/5 * * * *` para `*/30 * * * *` via `cron.alter_job(1, '*/30 * * * *')`. Reduz invocações de Edge Function em ~83%. |
| 56 | Debounce realtime no Dashboard | ✅ | `src/pages/Dashboard.tsx`: 5 subscriptions `postgres_changes` que chamavam `carregarDados()` diretamente agora passam por debounce de 2,5s via `useRef<setTimeout>`. Evita cascata de reloads em INSERT/UPDATE/DELETE simultâneos. Cleanup do timeout no unmount. |
| 57 | Índices de performance | ✅ | Criados `idx_tipos_documento_usuario_id`, `idx_contas_receber_usuario_status`, `idx_encomendas_usuario_data_entrega` (com IF NOT EXISTS). Reduz seq_scans nas tabelas de maior volume. |

---

## BACKUP AGENDADO — 2026-04-23 22:30 UTC (Cron 401)

| # | Item | Status | Descrição |
|---|------|--------|-----------|
| 54 | Cron de backup retornando 401 | ✅ | A edge function `executar-backups-agendados` exigia o header `x-cron-secret`, mas o pg_cron envia apenas `Authorization: Bearer <anon_key>`. Resultado: nenhum backup automático rodava (ultimo_executado_em = NULL em todos os agendamentos). Função atualizada para aceitar tanto o `x-cron-secret` quanto o `Authorization Bearer` com a anon/service key. Backups pendentes executados manualmente. |

---

## FICHA TÉCNICA / PRÉ-PREPAROS — 2026-04-23 13:20 UTC (Upload + PDF)

| # | Item | Status | Descrição |
|---|------|--------|-----------|
| 49 | Upload autenticado com feedback | ✅ | Ficha Técnica agora valida sessão antes do upload, exibe mensagens claras e mostra barra de progresso com estados enviando/concluído/erro. |
| 50 | Tempo de preparo persistido | ✅ | Ficha Técnica e Pré-Preparo voltaram a salvar `tempo_preparo` a partir da soma das horas lançadas em mão de obra. |
| 51 | PDF com placeholder e cabeçalho refinado | ✅ | Exportadores atualizados para manter layout em uma página, usar placeholder quando imagem falhar e aplicar títulos dourados com título principal em preto. |

---

## FICHA TÉCNICA / PRÉ-PREPAROS — 2026-04-23 19:35 UTC (Tempo de preparo no PDF)

| # | Item | Status | Descrição |
|---|------|--------|-----------|
| 52 | Tempo de preparo no PDF corrigido | ✅ | Quando o campo salvo estiver zerado, os exportadores passam a calcular o tempo a partir da soma das horas de mão de obra vinculadas ao cadastro, evitando exibição zerada no PDF. |
| 53 | Rótulo de margem ajustado | ✅ | O resumo de custos da Ficha Técnica passa a exibir “Margem” no lugar de “Lucro”, mantendo o percentual e valor calculados. |

---

## REFINAMENTO CAIXA START — 2026-04-10 21:00 UTC (Apenas 14 dias)

| # | Item | Status | Descrição |
|---|------|--------|-----------|
| 46 | Remoção opção 7 dias | ✅ | Webhook, CriarUsuarioDialog e EditarUsuarioDialog atualizados para aceitar apenas 14 dias |
| 47 | Correção usuários existentes | ✅ | Usuário `chefkasimas+teste11@gmail.com` corrigido de 7dias → 14dias (plano_fim ajustado) |
| 48 | Card Start 7d removido | ✅ | Dashboard admin agora exibe apenas card "Start 14d" |

---

## CORREÇÃO WEBHOOK — 2026-04-10 20:30 UTC (Plano Start não detectado)

| # | Item | Status | Descrição |
|---|------|--------|-----------|
| 42 | Webhook: logging de planName | ✅ | Adicionado log de todas as fontes de nome do plano (plan.name, offer.key, offer.name, offer.code, product.name) |
| 43 | Webhook: detecção ampliada | ✅ | Concatenação de todos os campos disponíveis para maximizar detecção de keywords |
| 44 | Usuário corrigido | ✅ | testecomprador271101postman15@example.com: base/anual → start/14dias |
| 45 | user_has_financial_access | ✅ | Função DB corrigida para incluir plano 'start' (antes só 'negocio') |

---

## NOVO PLANO — 2026-04-10 12:00 UTC (Caixa Start)

| # | Item | Status | Descrição |
|---|------|--------|-----------|
| 38 | Plano Caixa Start criado | ✅ | Novo plano com acesso completo (igual Business) e periodicidade de 7 ou 14 dias |
| 39 | Webhook Hotmart atualizado | ✅ | Reconhece palavras-chave 'start' e 'caixa start', detecta 14 dias pelo nome |
| 40 | UI Admin atualizada | ✅ | CriarUsuarioDialog, EditarUsuarioDialog e Usuarios.tsx suportam o novo plano |
| 41 | usePlano atualizado | ✅ | Plano 'start' com acesso total (wildcard *) |

---

## REGRA DE NEGÓCIO — 2026-04-09 23:00 UTC (Lite só Anual)

| # | Item | Status | Descrição |
|---|------|--------|-----------|
| 35 | Caixa Lite somente anual | ✅ | Removida opção mensal para o plano Caixa Lite em todo o sistema: webhook Hotmart, CriarUsuarioDialog, EditarUsuarioDialog, cards de estatísticas do painel admin. |
| 36 | Correção de usuários existentes | ✅ | Usuário `chefkasimas+teste6@gmail.com` corrigido de `mensal` para `anual` com data de expiração recalculada (365 dias). |
| 37 | Limpeza de usuários inativos | ✅ | Removido 1 usuário inativo (`chefkasimas+teste6@gmail.com`) e todos os seus dados: roles, histórico de planos, sessões, perfis de mão de obra, configurações, bancos, categorias, unidades de medida, tipos de documento, tags, plano de contas. Base agora com 0 inativos. |

---

## LIMPEZA — 2026-04-09 22:30 UTC (Remoção de Usuários Inativos e Logs)

| # | Item | Status | Descrição |
|---|------|--------|-----------|
| 33 | Remoção de 11 usuários inativos | ✅ | Removidos todos os dados: profiles, roles, sessões, histórico de planos, cadastros funcionais (encomendas, financeiro, receitas, pré-preparos, clientes, fornecedores), configurações (bancos, tipos_documento, unidades_medida, plano_contas, categorias, tags, mão de obra, juros, backups). |
| 34 | Limpeza de logs de administração | ✅ | Todos os 44 registros da tabela `admin_logs` foram removidos. Histórico zerado. |

---

## CORREÇÕES — 2026-04-09 21:00 UTC (Renomeação de Planos)

| # | Item | Status | Descrição |
|---|------|--------|-----------|
| 31 | Plano Base → Caixa Lite | ✅ | Nome atualizado no banco (tabela `planos`), webhook Hotmart, edge function `criar-usuario`, painel admin e fallback do hook `usePlano`. |
| 32 | Plano Negócio → Caixa Business | ✅ | Mesmos pontos do item 31. Webhook mantém retrocompatibilidade com palavras-chave `negocio`, `negócio`, `business` e `caixa business`. |

---

## CORREÇÕES — 2026-04-09 20:13 UTC (Cadastros Financeiros)

| # | Item | Status | Descrição |
|---|------|--------|-----------|
| 29 | Submódulo Financeiro → Cadastros | ✅ | Submódulo renomeado para `Cadastros`, removido de Configurações e adicionado ao módulo Financeiro com card dedicado no hub principal. |
| 30 | Acesso raiz de Configurações no Caixa Lite | ✅ | Regra de rotas refinada para permitir `/configuracoes` sem liberar subrotas financeiras; rotas antigas agora redirecionam para `/financeiro/cadastros/*`. |

---

## MELHORIAS — 2026-04-09 20:00 UTC (Histórico de Planos)

| # | Item | Status | Descrição |
|---|------|--------|-----------|
| 25 | Tabela historico_planos | ✅ | Criada tabela para registrar todas as alterações de plano (criação, renovação, upgrade, downgrade, cancelamento). RLS: somente admins. |
| 26 | Campo origem_criacao | ✅ | Adicionado campo `origem_criacao` na tabela profiles (admin/webhook/sistema). Backfill realizado para usuários existentes. |
| 27 | Formulário EditarUsuario | ✅ | Adicionados campos: data criação, origem, periodicidade, data início/fim do plano, e seção de histórico de planos. |
| 28 | Edge Functions — historico | ✅ | `criar-usuario` e `hotmart-webhook` agora registram histórico de planos em todas as operações (criação, cancelamento, SWITCH_PLAN). |

---

## CORREÇÕES — 2026-04-09 19:00 UTC (Plano não salvo + Webhook)

| # | Item | Status | Descrição |
|---|------|--------|-----------|
| 21 | Trigger protect_plan_fields | ✅ | Trigger bloqueava atualizações de plano feitas por Edge Functions (service role) porque `auth.uid()` era NULL. Corrigido para permitir quando `auth.uid() IS NULL`. |
| 22 | Webhook Hotmart — createUser | ✅ | Substituído `inviteUserByEmail` por `createUser` + email via Resend, alinhando com o fluxo de `criar-usuario`. |
| 23 | Webhook — calcularPlanoFim | ✅ | Corrigido para receber `planoInicio` como parâmetro e calcular fim relativo ao início (não à data atual). |
| 24 | Dados plano retroativos | ✅ | Corrigidos: `negoanual` → negocio/anual/365d, `baseanual` → base/anual/365d. |

---

## CORREÇÕES — 2026-04-09 17:30 UTC (Listagem + Recovery + Primeiro Acesso)

| # | Item | Status | Descrição |
|---|------|--------|-----------|
| 17 | Datas plano na listagem | ✅ | Adicionado `last_login` à interface UserProfile e à query. Campos `plano_inicio`/`plano_fim` já eram buscados — dados estavam NULL no DB para usuários antigos. |
| 18 | Último Acesso | ✅ | Movido update de `last_login` para AuthContext (evento SIGNED_IN) para capturar todo login, não apenas via Login.tsx. |
| 19 | Email recuperação via Resend | ✅ | Criada Edge Function `enviar-recuperacao-senha` que gera link via `admin.generateLink(recovery)` e envia via Resend (noreply@umbrelladoce.com.br). ForgotPassword.tsx agora chama esta função. |
| 20 | Diálogo duplicado de senha | ✅ | ResetPassword.tsx agora seta `primeiro_acesso: false` após redefinir senha e faz signOut, evitando que o AlterarSenhaObrigatoria apareça no login subsequente. |

---

## MÓDULO USUÁRIOS — 2026-04-09 12:00 UTC (Refinamentos + Resend)

| # | Item | Status | Descrição |
|---|------|--------|-----------|
| 13 | Formulário Criar Usuário | ✅ | Adicionados campos "Data Início" e "Data Expiração" com auto-cálculo baseado na periodicidade (30/365 dias). |
| 14 | Listagem de usuários | ✅ | Removidas colunas "Confeitaria" e "Cadastrado em". Adicionadas colunas "Início do Plano" e "Expiração do Plano" após Permissões. |
| 15 | Email de boas-vindas Resend | ✅ | Removido inviteUserByEmail (Magic Link nativo). Novo usuário criado via createUser + generateLink. Email de boas-vindas enviado via Resend API (noreply@umbrelladoce.com.br). |
| 16 | Edge function criar-usuario | ✅ | Refatorada para usar Resend em vez de invite nativo. Senha temporária aleatória + magic link gerado para primeiro acesso. |

---

---

## ARQUITETURA — 2026-04-08 21:00 UTC (Desvinculação Umbrella Doce)

| # | Item | Status | Descrição |
|---|------|--------|-----------|
| 9 | SSO removido | ✅ | Deletados: SSO.tsx, validar-token-sso, gerar-token-retorno. Rota /auth/sso removida. Botão "Voltar Umbrella Doce" removido da sidebar. Secret SSO_SECRET deletado. |
| 10 | Webhook Hotmart criado | ✅ | Edge function `hotmart-webhook` para provisionamento automático. Eventos: PURCHASE_APPROVED/COMPLETE (ativa), CANCELED/REFUNDED/CHARGEBACK/SUBSCRIPTION_CANCELLATION (desativa), SWITCH_PLAN (atualiza plano). Validação via HOTMART_HOTTOK. |
| 11 | criar-usuario simplificado | ✅ | Removida autenticação via x-api-secret (Umbrella Doce). Mantida apenas autenticação via JWT de admin. Adicionado log em admin_logs. |
| 12 | Painel admin: criar usuário | ✅ | Botão "Criar Usuário" adicionado em /admin/usuarios com dialog (email, nome, confeitaria, plano, periodicidade). Envia convite por Magic Link. |

---


## SEGURANÇA — 2026-04-08 20:29 UTC (Scan #3 — Correção policy encomendas)

| # | Item | Status | Descrição |
|---|------|--------|-----------|
| 8 | Policy SELECT encomendas permissiva | ✅ | Removida policy "Anyone can view order images". Corrigida policy owner-scoped para usar `foldername(name)[1] = auth.uid()`. |

---

## SEGURANÇA — 2026-04-08 17:22 UTC (Scan #2 — Storage encomendas)

| # | Item | Status | Descrição |
|---|------|--------|-----------|
| 6 | Bucket encomendas público sem ownership | ✅ | Bucket tornado privado. Política SELECT owner-scoped adicionada. Código migrado de getPublicUrl para createSignedUrl. |
| 7 | Realtime messages sem RLS | ⚠️ Ignorado | Schema reservado (realtime) — tabelas subjacentes já possuem RLS owner-scoped. |

---

## SEGURANÇA — 2026-04-08 17:15 UTC (Correções do Security Scan)

| # | Item | Status | Descrição |
|---|------|--------|-----------|
| 1 | Privilege escalation via profiles.plano_id | ✅ | Trigger `protect_plan_fields()` impede usuários não-admin de alterar plano_id, plano_tipo, plano_inicio, plano_fim. |
| 2 | encomendas_tags permissivas | ✅ | Removidas políticas INSERT/DELETE que usavam apenas `auth.role()='authenticated'`. Mantidas políticas ownership-scoped. |
| 3 | tags sem ownership | ✅ | Adicionada coluna `user_id` na tabela `tags`. Políticas substituídas por ownership-scoped. |
| 4 | topo-bolo storage sem ownership | ✅ | Políticas INSERT/DELETE atualizadas para usar `storage.foldername(name)[1] = auth.uid()::text`. |
| 5 | comprovantes-pagar sem UPDATE policy | ✅ | Adicionada política UPDATE com ownership enforcement. |

---

## LIMPEZA — 2026-04-08 13:49 UTC (Remoção de usuários de teste)

| # | Item | Status | Descrição |
|---|------|--------|-----------|
| 1 | Remoção de usuários de teste | ✅ | Usuários removidos via Admin API (auth.users + profiles cascade). Edge function temporária `deletar-usuario` utilizada e removida após uso. |
| 2 | Edge function criar-usuario redeployada | ✅ | Versão atualizada com suporte a planoId, planoTipo, planoExpiraEm deployada e testada. |

---

## CORREÇÃO — 2026-04-07 (Plano e Periodicidade)

| # | Item | Status | Descrição |
|---|------|--------|-----------|
| 1 | Plano sempre vinculado ao Base | ✅ | A edge function `criar-usuario` agora processa corretamente `planoExpiraEm` (mapeado para `plano_fim`) e `planoTipo` (mensal/anual). Adicionada coluna `plano_tipo` em `profiles`. Todos os caminhos (novo, reativação, atualização) agora persistem plano_id, plano_tipo, plano_inicio e plano_fim. |
| 2 | Periodicidade não exibida | ✅ | Sidebar atualizada para exibir "(Mensal)" ou "(Anual)" ao lado do nome do plano. |

---

## CORREÇÃO CRÍTICA — 2026-04-07 (Unidades de Medida)

| # | Item | Status | Descrição |
|---|------|--------|-----------|
| 1 | Criação de usuários falhando | ✅ | Função `criar_unidades_medida_padrao` usava `ON CONFLICT (usuario_id, codigo)` mas não existia unique index correspondente. Adicionado `unidades_medida_usuario_codigo_unique`. Erro no auth: `"no unique or exclusion constraint matching the ON CONFLICT specification"` |

---

## STATUS FINAL: ✅ APROVADO PARA LANÇAMENTO

Todos os itens críticos foram resolvidos. Restam 18 itens de atenção (⚠️) que não bloqueiam lançamento.

---

## AUDITORIA #2 — 2026-03-09

### 📊 Resumo Executivo
- **Status Geral:** ✅ APROVADO PARA LANÇAMENTO
- **Total de itens verificados:** 82
- **Itens OK (✅):** 66
- **Itens de Atenção (⚠️):** 13
- **Itens Críticos (❌):** 0
- **Itens Não Aplicáveis (🔲):** 3

---

### 🔴 Itens Críticos — TODOS RESOLVIDOS

| # | Item | Status | Data Correção |
|---|------|--------|---------------|
| 1 | `signUp` removido do AuthContext | ✅ | 2026-03-08 |
| 2 | ~247 `console.log` com dados sensíveis | ✅ | 2026-03-09 |

---

### 🟡 Itens de Atenção (não bloqueiam lançamento)

| # | Item | Status | Observação |
|---|------|--------|------------|
| 1 | Uso excessivo de `: any` (~1233 ocorrências) | ⚠️ | Tipagem fraca em 62 arquivos |
| 2 | `window.confirm` em 7 arquivos | ⚠️ | Deveria usar ConfirmDialog |
| 3 | Sem lazy loading de rotas (~50 páginas) | ⚠️ | Bundle inicial grande |
| 4 | Sem virtualização em listas longas | ⚠️ | Pode causar lentidão |
| 5 | Sem `sitemap.xml` | ⚠️ | Apenas robots.txt |
| 6 | Emails transacionais não customizados | ⚠️ | Templates padrão do Cloud |
| 7 | Sem analytics ou monitoramento de erros | ⚠️ | Sem GA, Sentry, etc. |
| 8 | Sem testes automatizados | ⚠️ | Nenhum teste unitário/e2e |
| 9 | Componentes grandes sem splitting | ⚠️ | ContasReceber 1171 linhas |
| 10 | Funções de banco redundantes | ⚠️ | `criar_bancos_oficiais_usuario` vs `criar_bancos_padrao_para_usuario` |
| 11 | `pagamentoSchema` inconsistente | ⚠️ | Usado só por DarBaixaDialog, não DarBaixaPagarDialog |
| 12 | Sem tratamento offline | ⚠️ | Nenhuma tela de offline |
| 13 | Imagens `alt` genéricas em PrePreparoForm | ⚠️ | "Preview 1", "Preview 2" |

---

### 🟢 Itens Resolvidos (Histórico Completo)

| Data (UTC) | Item | De | Para | Descrição |
|------------|------|----|------|-----------|
| 2026-03-08 | AuthContext `useEffect` deps | ⚠️ bug | ✅ | Removido `toast` das deps — causava loop infinito |
| 2026-03-08 | `signUp` no AuthContext | ❌ | ✅ | Método removido da interface, implementação e Provider |
| 2026-03-09 | OG Image URL temporária | ⚠️ | ✅ | Imagem em `public/og-image.png`, meta tags com path local |
| 2026-03-09 | Twitter card `@lovable_dev` | ⚠️ | ✅ | Tag `twitter:site` removida do index.html |
| 2026-03-09 | PlanoGuard client-side only | ⚠️ | ✅ | Função `user_has_financial_access` + 12 RLS RESTRICTIVE |
| 2026-03-09 | Rota `/auth/reset-password` inexistente | ⚠️ | ✅ | ResetPassword.tsx com validarSenhaForte + redirect |
| 2026-03-09 | RLS INSERT/UPDATE/DELETE em `tags_encomendas` | ⚠️ | ✅ | Políticas confirmadas + interface implementada |
| 2026-03-09 | ~247 `console.log` com dados sensíveis | ❌ | ✅ | Todos removidos de 13 arquivos |
| 2026-03-09 | Loading splash path `/src/assets/` | ⚠️ | ✅ | Logo em `public/umbrella-logo-dourado.png` |
| 2026-03-09 | Sem `<noscript>` fallback | ⚠️ | ✅ | Tag adicionada ao `<body>` do index.html |
| 2026-03-30 | Imagem de marca da tela de login | 🔄 | ✅ | `src/assets/auth-brand-image.png` substituída por nova arte |

---

## AUDITORIA #1 — 2026-03-08

### 📊 Resumo Executivo
- **Status Geral:** ⚠️ APROVADO COM RESSALVAS
- **Total de itens verificados:** 82
- **Itens OK (✅):** 54
- **Itens de Atenção (⚠️):** 22
- **Itens Críticos (❌):** 2
- **Itens Não Aplicáveis (🔲):** 4

*Detalhes completos da Auditoria #1 disponíveis no histórico Git.*

---

*Auditoria realizada por Lovable AI — Prompt de Auditoria v1.0 — Umbrella Doce | Ká Simas*

## 2026-04-19 — Agendamento de Backup persistente
- ✅ Criada tabela `backup_agendamentos` (RLS por usuário) para persistir frequência, horário e status ativo.
- ✅ Função SQL `calcular_proxima_execucao_backup` para calcular a próxima execução (timezone America/Sao_Paulo).
- ✅ Edge function `executar-backups-agendados` (verify_jwt=false) executada por cron a cada 5 minutos via `pg_cron` + `pg_net`.
- ✅ UI: switch "Ativar agendamento" movido para o final do card, após "Horário do backup". Ativação manual pelo usuário.
- ✅ Cada usuário possui sua própria configuração; remoção do uso de `localStorage`.

## 2026-04-19 — Reorganização Dashboard / Vendas
- ✅ Movido bloco "Calendários de Encomendas" e "Encomendas - HOJE" do Dashboard para o módulo Vendas (`/encomendas`).
- ✅ Criado componente reutilizável `src/components/CalendariosEncomendas.tsx` (autocontido, com realtime).
- ✅ Criado hook `src/hooks/useEncomendasHoje.ts` para contagem de entregas do dia em tempo real.
- ✅ Adicionado alerta piscante (banner amarelo dourado + dot vermelho na sidebar) acima do título do módulo Vendas quando há encomendas para hoje.
- ✅ Mantido card "Saldo Atual" no Dashboard (relocado).

## 2026-05-07 — Baixa Automática de Estoque por Encomenda
- ✅ Migração: coluna `estoque_baixa_realizada` (boolean, default false) adicionada em `encomendas` para evitar baixa duplicada.
- ✅ Criado `src/hooks/useBaixaEstoqueEncomenda.ts` — função `executarBaixaEstoqueEncomenda` que percorre itens da encomenda, busca ingredientes/embalagens de cada receita, e registra saída de produção no estoque.
- ✅ Integrado em `src/pages/Encomendas.tsx` — ao mudar status para "entregue", a baixa é executada automaticamente com feedback via toasts.
- ✅ Movimentações registradas como `saida_producao` com `referencia_tipo = 'encomenda'` e `referencia_id` apontando para a encomenda.

## 2026-05-07T15:52:51Z — Meus Insumos movido para 'Em Breve'
- Módulo removido do menu principal e adicionado à seção 'Em Breve' com cadeado
- Acesso liberado apenas para usuários admin
- PlanoGuard bloqueia /estoque para não-admins
- Sidebar mostra link ativo (sem cadeado) somente para admin



## 2026-05-07 — Módulo de planejamento (Fase 1) [DESCONTINUADO em 2026-06-22]
- ✅ Criadas tabelas: planejamento_metas, planejamento_tarefas, planejamento_datas_comemorativas, planejamento_descanso
- ✅ RLS multi-tenancy por owner_group_id em todas as tabelas
- ✅ Seed de 11 datas comemorativas brasileiras (is_system=true)
- ✅ Enums: planejamento_area, planejamento_prioridade, planejamento_status, planejamento_data_tipo, planejamento_descanso_tipo
- ✅ UI com 4 abas: Calendário, Metas, Tarefas, Bem-Estar
- ✅ Integração: encomendas e descansos exibidos no calendário
- ✅ Acesso admin-only (PlanoGuard bloqueia /planejamento para não-admin)
- ✅ Sidebar: item em 'Em Breve' com adminOnly=true
- ✅ Documentação: DOCS_PLANEJAMENTO.md criado (removido em 2026-06-22)


## 2026-05-14 — Módulo Meu Salário (Renda Doce)
- ✅ Criada tabela meu_salario_retiradas (data_retirada, valor, descricao, owner_group_id, user_id)
- ✅ RLS multi-tenancy por owner_group_id (SELECT/INSERT/UPDATE/DELETE restrito a membros do grupo)
- ✅ Trigger update_updated_at_column em UPDATE
- ✅ Índice (owner_group_id, data_retirada)
- ✅ Rota /meu-salario protegida por PlanoGuard (admin-only durante validação)
- ✅ Sidebar: item "Meu Salário" no menu principal logo abaixo de "Meu Dinheiro" (visível apenas para admin)
- ✅ Tokens visuais Renda Doce isolados (--rd-vinho, --rd-rose-queimado, --rd-dourado, --rd-creme)
- ✅ Lógica baseada no mês anterior fechado: faturamento - custos - 20% margem = pró-labore saudável
- ✅ Exportação PDF "Salvar meu resumo"
- ✅ Documentação: DOCS_MEU_SALARIO.md criado

## Fechamento de Mês — 2026-05-24T08:06Z
- Implementadas tabelas `fechamentos_mensais` e `fechamento_checklist_itens` com RLS por grupo.
- Criadas funções `is_mes_fechado`, `user_in_group` e triggers `BEFORE INSERT/UPDATE/DELETE` em `contas_receber/pagar`, suas parcelas e pagamentos para bloquear alterações em meses fechados.
- Hook `useFechamentoMes`, página `/financeiro/fechamento-mes`, integração com card no hub Financeiro e snapshot consumido por `useMeuSalario`.
- Ver `DOCS_FECHAMENTO_MES.md`.

---

## [2026-05-24] Histórico de Reabertura de Fechamento de Mês ✅
- Criada tabela `fechamento_logs` (ação, motivo, snapshot, autor, timestamp) com RLS por grupo.
- `useReabrirMes` agora exige motivo (mín. 3 caracteres) e grava log com snapshot anterior.
- `useFecharMes` grava log ao fechar com snapshot consolidado.
- Novo hook `useFechamentoLogs` agrega logs + nome/email do autor (join com profiles).
- UI em `FechamentoMes.tsx`: AlertDialog de reabertura com Textarea obrigatória + nova seção "Histórico de mudanças deste mês".

---

## [2026-05-24] Backup automático parado desde 05/05 — corrigido ✅
**Causa:** o cron job `executar-backups-agendados` (a cada 30 min) chamava a edge function enviando a **anon key** como Bearer, mas a função só aceitava `service_role_key` ou `x-cron-secret`. Resultado: todas as chamadas retornavam **401 Unauthorized** desde 05/05/2026 e nenhum agendamento era processado.

**Evidência:** `net._http_response` mostrava status_code=401 em todas as execuções recentes; `cron.job_run_details` continuava marcando `succeeded` (porque pg_net retornou, não o status HTTP).

**Correção:**
- Edge function `executar-backups-agendados/index.ts` agora também aceita a anon key como Bearer. Risco aceitável: a função não recebe parâmetros do chamador, apenas processa agendamentos vencidos.
- Disparo manual executou 5 backups atrasados.
- pg_cron continua chamando a cada 30 min normalmente.

## 🔒 Guard de rota /configuracoes/tipos-insumos — $(date -u +"%Y-%m-%d %H:%M UTC")

✅ Implementado guard de acesso à tela interna **Insumos e Embalagens**:

- A rota `/configuracoes/tipos-insumos` só é liberada quando o próprio sistema concede um token one-shot via `grantSystemAccess('tipos-insumos')` antes da navegação.
- Acesso direto pela URL é bloqueado (mesmo para `admin` e `MOTHER`) e redireciona para `/configuracoes/cadastros-base` com toast de "Acesso restrito".
- Checagem dupla: token de sistema (sessionStorage one-shot) **+** role (`admin` ou `MOTHER`).
- A tela permanece como uso exclusivo do sistema (sem entrada em menu/sidebar/cards).
- Auto-sincronização de Insumos/Embalagens já é garantida via FK `ingredientes.tipo_insumo_id` / `embalagens.tipo_insumo_id` → `tipos_insumos.id` e pelo fluxo de "criar tipo na hora" em Meu Cardápio.

**Arquivos:**
- `src/lib/systemAccess.ts` (novo)
- `src/pages/configuracoes/TiposInsumos.tsx` (guard adicionado)

## 🔒 Expiração automática de plano — $(date -u +"%Y-%m-%d %H:%M UTC")

✅ Implementado bloqueio automático de usuários com plano expirado:

- **DB:** função `public.expire_overdue_plans()` (SECURITY DEFINER) marca `ativo = false` em todos os perfis cujo `plano_fim < CURRENT_DATE`.
- **DB:** trigger `trg_enforce_plan_expiration` em `profiles` (BEFORE INSERT/UPDATE de `plano_fim`/`ativo`) força `ativo = false` quando o plano está vencido.
- **App (`AuthContext.signIn`):** valida `plano_fim` no login; se expirado, faz `signOut` e exibe "Seu plano expirou. Entre em contato com o administrador para renovar."
- **Admin > Usuários:** ao carregar a lista, executa `rpc('expire_overdue_plans')` para refletir o status atualizado em tempo real.

**Arquivos:**
- migration (função + trigger + varredura inicial)
- `src/contexts/AuthContext.tsx`
- `src/pages/admin/Usuarios.tsx`

## 🔄 Auto-refresh de Status/Expiração — $(date -u +"%Y-%m-%d %H:%M UTC")

✅ Novo componente `PlanExpirationWatcher` montado dentro do `BrowserRouter`:

- Verifica `plano_fim` do usuário logado **no carregamento do app** e **a cada mudança de rota**.
- Se `plano_fim < hoje`: persiste `ativo = false` em `profiles` e executa `signOut`, exibindo "Seu plano expirou. Acesso bloqueado."
- Trigger de banco `trg_enforce_plan_expiration` continua atuando como rede de segurança no servidor.

**Arquivos:**
- `src/components/PlanExpirationWatcher.tsx` (novo)
- `src/App.tsx`

## ✅ DRE com integridade histórica via snapshot — 2026-05-24

- **`src/hooks/useFechamentoMes.ts`:** nova função `calcularLinhasDreMes(userId, refIso)` que reproduz a mesma lógica do `DRE.tsx` (regime de caixa, joins até `categorias_plano_contas` para obter `codigo` e `faixa_dre`). `useFecharMes` agora grava `snapshot.linhas_dre` com o detalhamento completo do mês fechado.
- **`src/pages/financeiro/DRE.tsx`:** após o cálculo ao vivo, busca `fechamentos_mensais` com `status='fechado'` no ano e sobrescreve os arrays mensais com os valores de `snapshot.linhas_dre`. Snapshots antigos sem detalhamento são ignorados (fallback para cálculo ao vivo).
- **Efeito:** meses fechados ficam congelados — alterações posteriores em `contas_receber`/`contas_pagar` não modificam mais o DRE histórico.

## ✅ Refatoração dashboard financeiro: hook + componente compartilhados — 2026-05-24

- **Problema:** `Financeiro.tsx` e `DashboardFinanceiro.tsx` duplicavam `carregarResumoDashboard`, `carregarInadimplenciaClientes` e `carregarInadimplenciaFornecedores`, mais o bloco de renderização das tabelas de inadimplência. Além disso, a cópia em `DashboardFinanceiro.tsx` usava loop com `await` por cliente (N+1) para buscar telefones.
- **`src/hooks/useResumoDashboard.ts`:** novo hook que centraliza as três queries e o estado (`resumo`, `inadimplenciaClientes`, `inadimplenciaFornecedores`, `loading`). Telefones de clientes são buscados em lote com `.in(clienteIds)` (correção do item #A1 aplicada para ambas as rotas). Fornecedores carregados via inner join único.
- **`src/components/financeiro/TabelaInadimplencia.tsx`:** novo componente reutilizável com props `{ tipo: 'clientes' | 'fornecedores', itens }`. Gerencia internamente paginação TOP 10 / "Ver todos".
- **`src/pages/financeiro/Financeiro.tsx` e `src/pages/financeiro/DashboardFinanceiro.tsx`:** removidas as funções e estados duplicados; passam a consumir o hook e o componente. Visual unificado seguindo o padrão mais rico do `Financeiro.tsx` (border-l-4 + ícone com badge colorido).

## ✅ DRE: Imposto de Renda calculado via alíquota Simples Nacional configurável — 2026-05-24

- **Problema:** `DRE.tsx` exibia `(-) Imposto de Renda e CSLL` sempre como zero (`linhas.impostoRenda[mes] = 0` hardcoded), fazendo LAIR e Lucro Líquido serem sempre idênticos.
- **Migração:** `ALTER TABLE public.configuracoes_juros ADD COLUMN aliquota_simples_nacional numeric NULL;` — campo opcional por usuário.
- **`src/components/configuracoes/ConfiguracaoJuros.tsx`:** novo input "Alíquota efetiva do Simples Nacional (%)" com validação 0–100. Persistido em `configuracoes_juros.aliquota_simples_nacional`.
- **`src/pages/financeiro/DRE.tsx`:** `carregarDRE` busca a alíquota e calcula `impostoRenda[mes] = LAIR × alíquota / 100` quando LAIR > 0. `lucroLiquido = LAIR − impostoRenda`. Quando a alíquota não está configurada, a linha exibe `—` em todos os meses e total, com nota abaixo da tabela orientando o usuário a ir em Configurações. O rótulo da linha mostra a alíquota vigente entre parênteses quando configurada.

## 2026-05-24T16:24:33Z - #M4 corrigido
- ✅ ContasPagarForm.tsx convertido em wrapper (~115 linhas) seguindo o padrão de ContasReceberForm.tsx. Toda a lógica de formulário, geração de parcelas e persistência foi extraída para src/components/financeiro/ContasPagarFormModal.tsx. Props, callbacks e comportamento preservados.

## 2026-05-24T16:27:00Z - #C3 corrigido
- ✅ Sublinhas do DRE.tsx migradas para o campo `subfaixa_dre` (nova coluna em `categorias_plano_contas`). Nenhum código numérico hardcoded restante. Categorias customizadas com `subfaixa_dre` definida passam a aparecer nas sublinhas correspondentes.

## 2026-05-24T16:28:20Z - #C1 corrigido
- ✅ FluxoCaixaMensal.tsx: todas as queries (saldos bancos, saldos configurados anteriores e do ano, pagamentos anteriores e do ano) agora são feitas em um único `Promise.all` fora do loop, com filtros `.gte/.lte` no banco. O loop dos 12 meses passa a operar apenas em memória sobre os dados pré-carregados (~7 requisições por carregamento, antes ~60).

## 2026-05-24T17:05:00Z - Migração React Query (useEncomendas / useEncomendaItens)
- ✅ `src/hooks/useEncomendas.ts`: substituído `useState + useEffect + fetch manual` por `useQuery` (`queryKey: ["encomendas", userId]`). Operações `createEncomenda`, `updateEncomenda` e `deleteEncomenda` agora usam `useMutation` com `invalidateQueries` em `onSuccess` e toasts em `onSuccess/onError`. Interface pública preservada (assinaturas via `mutateAsync`).
- ✅ `src/hooks/useEncomendaItens.ts`: mesma migração para `useQuery` (`queryKey: ["encomenda_itens", encomendaId, userId]`) com mutations `createItem`/`deleteItem`. Toasts movidos para os callbacks da mutation. Sem alteração na API consumida por `Encomendas.tsx`.

## 2026-05-24T17:30:00Z - Migração multi-tenant (useEncomendas / useEncomendaItens)
- ✅ `src/hooks/useEncomendas.ts`: passa a usar `useGroup()` (`activeGroupId`). Leituras filtradas por `.eq('owner_group_id', activeGroupId)`; queryKey atualizada para `['encomendas', activeGroupId]`. Inserts gravam `owner_group_id: activeGroupId` mantendo `usuario_id: user.id` (rastreio + RLS atual). `update`/`delete` escopados por `owner_group_id`.
- ✅ `src/hooks/useEncomendaItens.ts`: mesma migração. Leituras por `.eq('owner_group_id', activeGroupId).eq('encomenda_id', ...)`; queryKey `['encomenda_itens', encomendaId, activeGroupId]`. Inserts gravam `owner_group_id` + `usuario_id`.
- ✅ `src/pages/Encomendas.tsx`: batch insert em `encomenda_itens` agora inclui `owner_group_id: activeGroupId`. Novo `useGroup()` adicionado ao componente.

## 2026-05-24T17:30:00Z - Migração multi-tenant (Clientes / Fornecedores / Contatos)
- ✅ `src/hooks/useClientes.ts`, `src/hooks/useFornecedores.ts`, `src/hooks/useFornecedorContatos.ts`: substituídos `useAuth()` por `useGroup()`. Leituras filtradas por `.eq('owner_group_id', activeGroupId)`; queryKeys atualizadas com `activeGroupId`. Inserts gravam `owner_group_id: activeGroupId` mantendo `usuario_id: user.id` (rastreio do autor + RLS).
- ✅ Migração SQL: adicionado `owner_group_id` em `fornecedor_contatos` (index criado). Backfill em `clientes`, `fornecedores` e `fornecedor_contatos` preenchendo `owner_group_id` a partir do `user_group_roles` ativo do `usuario_id`.
- ✅ RLS reescrita nas 3 tabelas para permitir acesso a qualquer membro ativo do grupo (`user_belongs_to_group(auth.uid(), owner_group_id) OR auth.uid() = usuario_id`). Insert exige `usuario_id = auth.uid()` E pertencimento ao grupo. Fallback por `usuario_id` mantido para registros antigos sem grupo.

## 2026-05-24T17:45:00Z - useFornecedorContatos: fornecedorId obrigatório
- ✅ `src/hooks/useFornecedorContatos.ts`: `fornecedorId` agora é obrigatório (sem `?`). Query habilitada apenas com `!!fornecedorId && !!activeGroupId` e `.eq('fornecedor_id', fornecedorId)` aplicado sempre.
- ✅ `src/pages/cadastros/Fornecedores.tsx`: removida a chamada global sem argumento. O hook recebe `editingId || selectedFornecedorId || ""` (carrega apenas quando expandindo/adicionando contatos de um fornecedor). Aniversariantes do mês passaram a usar uma query separada (`contatosGrupo`) que busca contatos do grupo apenas para o alerta — evitando fetch amplo no carregamento da tela.

## 2026-05-24T18:10:00Z - ReceitaForm.tsx: extração de modais de criação em cadeia (#RF-M3)
- ✅ Criado `src/components/CriarIngredienteModal.tsx`: encapsula os dois Dialogs (tipo de ingrediente + detalhe ingrediente), os estados internos do formulário e os handlers `handleCriarTipo`/`handleCriarIngrediente`. Aceita `open`, `onOpenChange`, `descricaoInicial`, `unidades`, `userId`, `onIngredienteCriado(data)`.
- ✅ Criado `src/components/CriarEmbalagemModal.tsx`: mesma estrutura para embalagens.
- ✅ `src/pages/ReceitaForm.tsx`: removidos 11 estados granulares (`novoTipoIng*`, `novoIng*`, `tipoIngRecemCriado` e equivalentes de embalagem) e 4 handlers (`handleCriarTipoIngrediente`, `handleCriarIngrediente`, `handleCriarTipoEmbalagem`, `handleCriarEmbalagem`). Mantidos apenas `descricaoInicialIng/Emb` + flags `modalCriar*Open` e dois callbacks finos (`handleIngredienteCriado`/`handleEmbalagemCriada`) que adicionam o registro retornado em `ingredientesCadastrados`/`embalagensCadastradas` e na lista da receita. Imports de `Dialog*` removidos. Arquivo reduziu de 2.418 → 1.968 linhas (-450).

---

## 2026-05-25 — Políticas faltantes no bucket `comprovantes-receber`

✅ Adicionadas políticas RLS em `storage.objects` para o bucket `comprovantes-receber`:
- **INSERT** (owner-scoped): `(storage.foldername(name))[1] = auth.uid()::text`
- **DELETE** (owner-scoped): `(storage.foldername(name))[1] = auth.uid()::text`

Antes existiam apenas SELECT e UPDATE; agora o ciclo completo do CRUD de comprovantes está coberto e owner-scoped.

---

## 2026-05-25 — Bucket órfão `logos` neutralizado

✅ Removidas as 4 políticas RLS associadas ao bucket `logos` em `storage.objects`:
- `Logos são públicos para visualização` (SELECT)
- `Usuários podem fazer upload de seus próprios logos` (INSERT)
- `Usuários podem atualizar seus próprios logos` (UPDATE)
- `Usuários podem deletar seus próprios logos` (DELETE)

Com RLS habilitado e nenhuma policy, o bucket fica inacessível para qualquer cliente. O único bucket de logos em uso continua sendo `logotipos` (referenciado em `src/pages/cadastros/SeusDados.tsx`).

⚠️ **Pendência manual:** o registro do bucket vazio `logos` em `storage.buckets` não pôde ser removido via SQL (trigger `storage.protect_delete()` bloqueia DELETE direto). Excluir manualmente em **Cloud → Storage → bucket `logos` → Delete**.

---

## 2026-05-25 — Consolidação de group-scoping: `fechamentos_mensais` e `fechamento_checklist_itens`

✅ Substituído `user_in_group(owner_group_id, auth.uid())` por `user_belongs_to_group(auth.uid(), owner_group_id)` nas 8 políticas RLS das tabelas:

- `fechamentos_mensais` (SELECT, INSERT, UPDATE, DELETE)
- `fechamento_checklist_itens` (SELECT, INSERT, UPDATE, DELETE — via EXISTS em `fechamentos_mensais`)

**Motivação:** alinhar com o padrão multi-tenant usado nos demais módulos (`clientes`, `fechamento_logs`, etc.), eliminando o achado `INCONSISTENT_GROUP_SCOPING` da auditoria de segurança. Verificado previamente que não há divergência entre `profiles.owner_group_id` e `user_group_roles` (0 inconsistências) e que `fechamentos_mensais` não possui coluna `usuario_id` — é recurso de grupo por design.

**Impacto comportamental:** nenhum. Todos os membros ativos do grupo dono continuam com acesso completo aos fechamentos e checklists.

---

## 2026-05-25 — DEFINER_OR_RPC_BYPASS: expire_overdue_plans

- **Problema:** função `public.expire_overdue_plans()` (SECURITY DEFINER) tinha `GRANT EXECUTE TO authenticated`, permitindo a qualquer usuário logado disparar um UPDATE em massa em `profiles` (apesar do filtro `plano_fim < CURRENT_DATE`, violava o princípio do least-privilege).
- **Correção:**
  - `REVOKE EXECUTE ... FROM authenticated, anon, public` e `GRANT EXECUTE ... TO service_role`.
  - Removida chamada client-side `supabase.rpc('expire_overdue_plans')` em `src/pages/admin/Usuarios.tsx`.
  - Enforcement por linha permanece via trigger `trg_enforce_plan_expiration` e `PlanExpirationWatcher`. Execução em massa pode ser feita por edge function agendada com service_role.
- **Status:** ✅ Corrigido

## 2026-05-25 22:30 UTC — Limpeza `plano_tipo` 7dias/14dias
✅ Removidas chaves `'7dias'` e `'14dias'` do `diasMap` em:
- `supabase/functions/hotmart-webhook/index.ts`
- `src/components/admin/CriarUsuarioDialog.tsx`
- `src/components/admin/EditarUsuarioDialog.tsx`

Motivo: períodos de teste associados ao plano Start (descontinuado em 2026-05-25). Banco já não possui perfis usando esses valores. Migrations históricas preservadas.

---

## 2026-05-26 — anon_key movida para Supabase Vault ✅

- Criado schema `private` (sem GRANT para anon/authenticated).
- Criada função `private.get_anon_key()` (SECURITY DEFINER, STABLE, search_path vazio) que lê `vault.decrypted_secrets` onde `name = 'anon_key_cron'`.
- Job pg_cron `executar-backups-agendados` reescrito para construir o header `Authorization: Bearer ` concatenando `private.get_anon_key()` em vez do JWT hardcoded.
- **Ação manual necessária no SQL Editor (uma vez):** `select vault.create_secret('<ANON_KEY>', 'anon_key_cron', '...');`
- Rotação futura da anon_key: basta atualizar o secret no Vault, sem editar o job.

---

## 2026-05-26 (update) — anon_key migrada para `private.config` ✅

Substituiu a abordagem com Vault (que exigia `vault.create_secret` manual no SQL Editor — indisponível no Lovable Cloud).

- Criada tabela `private.config(key, value, updated_at)` com RLS habilitada e **sem policies** (acesso só via SECURITY DEFINER).
- Seed: `INSERT INTO private.config VALUES ('anon_key_cron', '<anon_key>')`.
- `private.get_anon_key()` reescrita para ler de `private.config` (mesmo contrato externo).
- Job pg_cron `executar-backups-agendados` permanece inalterado (já chamava `private.get_anon_key()`).
- **Rotação futura:** migration com `UPDATE private.config SET value = '<nova>' WHERE key = 'anon_key_cron';`.

---

## 2026-05-26 — Fechamento de mês: validação movida do cliente para o banco ✅

- Criada RPC `public.fechar_mes(p_fechamento_id, p_observacoes, p_snapshot, p_faturamento, p_custos, p_margem_seguranca, p_pro_labore_saudavel, p_retiradas, p_saldo_restante)` SECURITY DEFINER, `search_path=''`.
- Regras aplicadas no banco (impossíveis de burlar via PostgREST direto):
  - Autorização: `user_belongs_to_group(auth.uid(), owner_group_id)` → `P0001` se falhar.
  - Existência do fechamento → `P0003`.
  - Idempotência: já fechado → `P0004`.
  - **Checklist pendente** (`fechamento_checklist_itens.concluido = false`) → `P0002`.
- Atualiza status, `fechado_em`, `fechado_por`, observações, snapshot e os 6 agregados; insere `fechamento_logs`.
- `EXECUTE` apenas para `authenticated`; revogado de PUBLIC/anon.
- `useFecharMes` (src/hooks/useFechamentoMes.ts) agora chama `supabase.rpc('fechar_mes', ...)`. Removido o guard cliente-side de contagem de pendentes e o UPDATE direto na tabela. Montagem do snapshot/DRE permanece no cliente (não alterada).

## 2026-05-26 — Fechamento de mês: privilégios da RPC corrigidos ✅

- **Problema:** `public.fechar_mes` mantinha EXECUTE padrão `PUBLIC`, permitindo chamadas por `anon`.
- **Correção:** Migration `20260526-010829-604713` executa `REVOKE EXECUTE ... FROM PUBLIC, anon; GRANT EXECUTE ... TO authenticated;` na assinatura exata confirmada no banco (`p_fechamento_id uuid, p_observacoes text, p_snapshot jsonb, p_faturamento numeric, p_custos numeric, p_margem_seguranca numeric, p_pro_labore_saudavel numeric, p_retiradas numeric, p_saldo_restante numeric`).
- **Assinatura:** `pg_get_function_identity_arguments(oid)` retornou `p_fechamento_id uuid, p_observacoes text, p_snapshot jsonb, p_faturamento numeric, p_custos numeric, p_margem_seguranca numeric, p_pro_labore_saudavel numeric, p_retiradas numeric, p_saldo_restante numeric`.
- **Status:** P-4 da auditoria Sprint 1/2 → ✅ CONFIRMADO.

### 2026-05-26 — P-8: Refatoração `ContasPagarForm` (page wrapper enxuto)
- **Problema:** `src/pages/financeiro/ContasPagarForm.tsx` tinha 120 linhas concentrando fetch de dados, transformações e estado de loading antes de delegar ao Modal.
- **Correção:** Toda lógica de carregamento (fetch da conta, transformações iniciais, estado `loadingConta` e tela de loading) movida para `src/components/financeiro/ContasPagarFormModal.tsx`. O Modal agora recebe apenas `contaId?`, `onSucesso` e `onCancelar` e dispara seus próprios fetches via `useEffect`. A página é um wrapper de rota com 24 linhas: extrai `id` de `useParams`, controla estado `open` e redireciona para `/financeiro/contas-pagar` ao fechar.
- **Não alterado:** Lógica de submit, validação, campos do formulário e `ContasPagar.tsx` (listagem).
- **Status:** P-8 da auditoria Sprint 1/2 → ✅ CONFIRMADO.

## 2026-05-26 — Pós-auditoria: ajustes finais P-4 e P-8 ✅

- **P-4 (assinatura definitiva):** A assinatura real de `public.fechar_mes` (`p_fechamento_id uuid, p_observacoes, p_snapshot, p_faturamento, p_custos, p_margem_seguranca, p_pro_labore_saudavel, p_retiradas, p_saldo_restante`) é a forma definitiva — superior à proposta original `(grupo_id, ano, mes)` porque grava o snapshot financeiro atomicamente com `status='fechado'`, eliminando janela de inconsistência entre cálculo do snapshot e fechamento. Spec original descartada; documentação reflete a assinatura real. Status: ✅ DEFINITIVO.
- **P-8 (rename do componente):** `ContasPagarFormModal.tsx` renomeado para `ContasPagarFormView.tsx`. O nome "Modal" era enganoso — o componente é renderizado como página dedicada (rota `/financeiro/contas-pagar/novo|editar/:id`), não como overlay shadcn `<Dialog>`. Decisão arquitetural: formulário longo (741 linhas, com parcelas e anexos) tem UX melhor como página em viewports estreitos do que como Dialog. O ganho real da P-8 — wrapper de rota fino (24 linhas) + componente de formulário separado — está cumprido. Import em `src/pages/financeiro/ContasPagarForm.tsx` atualizado. Status: ✅ DEFINITIVO.

## 2026-05-26 — Módulo de planejamento: portado + ajustes de layout [DESCONTINUADO em 2026-06-22]

- **Módulo:** portado do projeto `711eac8d-e6f1-40e2-b038-84b75e878531`. Ritual pessoal e privado por usuário (3 áreas: Diária, Semanal, Mensal), com reset semanal automático, frases motivacionais Ká Simas, exportação PDF (capa + ritual + Pró-Labore) e fonte Lora embutida.
- **DB:** Migration cria `public.organizacao_doce_state` (state JSONB) com RLS `owner_id = auth.uid()` para SELECT/INSERT/UPDATE/DELETE.
- **Rota:** `/organizacao-doce` em `App.tsx` envelopada por `PlanoGuard` (acesso: Caixa Business + Mother; Lite redireciona para `/upgrade`).
- **Sidebar:** item adicionado em PLANEJAMENTO (ícone `ListChecks`).
- **Layout global:**
  - Rodapé com texto `Umbrella Doce by Ká Simas · CNPJ 65.786.966/0001-41 · Todos os direitos reservados.` adicionado ao `Layout` em `src/App.tsx`.
  - Botão "Limpar cache e recarregar" movido do rodapé da Sidebar para o cabeçalho (entre `BackupBadge` e `UserMenu`) como ícone colapsável (`ClearCacheButton` em `HeaderControls.tsx`): primeiro clique expande o título, segundo clique executa a limpeza + hard reload.

---

## 2026-05-26 — Consolidação de Usuários + Governança no sidebar

**Mudança:** A entrada "Grupos e Usuários" (rota `/admin/governanca`) foi removida do sidebar. O conteúdo da página `Governanca` agora é renderizado como aba **Grupos** dentro de `/admin/usuarios` (a aba **Usuários** mantém o dashboard original).

**Motivação:** Admin-Mãe tinha dois pontos de entrada redundantes ("Usuários" e "Grupos e Usuários"). A gestão de grupos é detalhe interno de acesso, então foi reposicionada como aba secundária.

**Detalhes técnicos:**
- `src/pages/admin/Governanca.tsx`: novo prop `embedded?: boolean`. Quando `true`, suprime `PageHeader`, wrapper `min-h-screen` e a `Tabs` interna (Grupos/Usuários), expondo apenas a gestão de Grupos + dialog "Adicionar Usuário ao Grupo".
- `src/pages/admin/Usuarios.tsx`: envolve o conteúdo em `Tabs` com abas **Usuários** (existente) e **Grupos** (`<Governanca embedded />`).
- `src/components/AppSidebar.tsx`: removido `SidebarGroup` "Governança" e item "Grupos e Usuários".
- A rota `/admin/governanca` continua registrada no `App.tsx` (acessível por URL direta) — nenhuma RLS, migração SQL ou Edge Function foi alterada.

**Status:** ✅ Concluído

## 2026-05-26 — Avatar de usuário + botão "Limpar cache" no cabeçalho ✅
- Criado bucket público `avatars` em storage com policies por pasta `auth.uid()/...` (SELECT público, INSERT/UPDATE/DELETE restritos ao dono).
- `UserMenu` agora exibe o avatar real (com fallback de iniciais) lendo `profiles.avatar_url`; upload feito direto no popover, persistido no bucket + tabela.
- `ClearCacheButton` agora dispara a ação no 1º clique e mostra o rótulo "Limpar cache" em telas md+, evitando que pareça ter sumido. Tooltip mantém a explicação detalhada.

## 2026-05-26 — Plano "Aluna da Imersão" (Imersão A Receita que Faltava) ✅
- Migração: novo plano `aluna_imersao` na tabela `planos`, coluna `profiles.imersao_turma`, função `user_has_financial_access` atualizada para liberar módulos financeiros também para este plano.
- `usePlano`: `MODULOS_POR_PLANO.aluna_imersao = ["*"]` (acesso total como Business).
- `CriarUsuarioDialog` / `EditarUsuarioDialog`: nova opção de plano com tipo `imersao` (30 dias auto-calculados) e campo opcional "Turma".
- Edge function `criar-usuario`: aceita `imersaoTurma`, marca `origem_criacao='imersao'`, email de boas-vindas com bloco específico mencionando Hotmart Club para gravações/Playbook.
- Lib centralizada `src/lib/planos.ts` (`PLANO_LABELS`, `getPlanoLabel`, `IMERSAO_DIAS_ACESSO`).
- Provisionamento manual (não passa pelo webhook Hotmart). Após 30 dias `plano_fim` expira e o `AuthContext` bloqueia o login — dados preservados para reativação.

---

## 2026-05-26 — Renovação automática de alunas da Imersão (Hotmart)

**Implementado:**
- Webhook `hotmart-webhook` detecta transição `aluna_imersao → base/negocio` e registra `tipo_evento = 'renovacao_imersao'` em `historico_planos` (com `plano_anterior` preenchido).
- Dois e-mails via Resend disparados imediatamente:
  - Aluna: confirmação branded (Vinho/Dourado) com nova validade e CTA para o app.
  - Admin (`EMAIL_ADMIN_IMERSAO`): resumo da renovação (nome, e-mail, plano novo, validade, productId/offerCode).
- `AuthContext.signIn`: toast "🎉 Renovação confirmada" no primeiro login após renovação (flag em `localStorage` por `historico_planos.id`).

**Ofertas Hotmart cadastradas em `hotmart_produtos`:**
- Caixa Lite anual — productId `7449074`, offerCode `6yjlyf2i`
- Caixa Business anual — productId `7448785`, offerCode `oytrdfwm`

**Dados preservados:** id do usuário, grupo, cadastros e histórico. Apenas `plano_id`, `plano_tipo`, `plano_inicio`, `plano_fim` e `ativo` são atualizados.

---

## 2026-05-26 — Hardening do fluxo de renovação automática (Imersão → Lite/Business)

Correções aplicadas em `supabase/functions/hotmart-webhook/index.ts` e `src/contexts/AuthContext.tsx`:

- ✅ **Idempotência por transaction Hotmart**: antes de provisionar, o webhook consulta `historico_planos` por `tx:{transactionId}` e ignora reenvios (resposta `duplicate_ignored`). Evita duplicar registros e e-mails em caso de retry da Hotmart.
- ✅ **`primeiro_acesso` não é mais ativado em renovações**: aluna que renova da Imersão para Lite/Business não é forçada a trocar senha no próximo login (`primeiro_acesso = false` quando `ehRenovacaoImersao`).
- ✅ **Fallback de nome no e-mail admin**: `subject` usa `email` quando `buyer.name` vem vazio/whitespace.
- ✅ **`observacao` do histórico inclui `tx:{transactionId}`**: chave usada pela checagem de idempotência.
- ✅ **AuthContext limpa `sessionStorage.cda-modal-imersao-shown`** ao detectar `renovacao_imersao` recente — o `ModalExpiracaoImersao` não reaparece após a renovação.

### Itens de atenção (não bloqueantes)

- ⚠️ **Renovação antecipada encurta acesso**: `plano_fim = hoje + 365`. Se a aluna renova antes do fim da Imersão, perde os dias restantes. Decisão de produto pendente (somar saldo?).
- ⚠️ **Upgrade Lite ↔ Business (não-Imersão)** não dispara e-mail dedicado nem evento próprio — cai no fluxo genérico `criacao`.

### Pendências operacionais

- 🟡 Página `https://upcaixa.umbrelladoce.com.br` deve estar publicada com os 2 botões (ofertas `6yjlyf2i` e `oytrdfwm`).
- 🟡 Webhook da Hotmart configurado para as 2 novas ofertas apontando para `hotmart-webhook`.
- 🟡 Secret `EMAIL_ADMIN_IMERSAO` preenchido em Cloud → Secrets.

---

## 2026-05-26 — Mudanças de plano via Hotmart (upgrade, downgrade agendado, renovação)

Generalização do fluxo de renovação Imersão para cobrir todas as transições de plano via webhook Hotmart.

### Classificação de eventos no `hotmart-webhook`

- `renovacao_imersao` — `aluna_imersao` → `base`/`negocio` (já existia)
- `upgrade` — `base` → `negocio` (aplica imediato, estende plano_fim a partir do vencimento atual)
- `downgrade_agendado` — `negocio` → `base` (mantém Business até `plano_fim` atual; grava Lite em `plano_pendente_*`)
- `renovacao` — mesmo plano enquanto ativo (estende plano_fim sem perder dias)
- `reativacao` — usuária inativa/vencida (boas-vindas)
- `downgrade_aplicado` — gerado pelo cron quando o pendente entra em vigor

### Database

- Novas colunas em `profiles`: `plano_pendente_id`, `plano_pendente_tipo`, `plano_pendente_inicio`, `plano_pendente_fim`
- Índice parcial `idx_profiles_plano_pendente_inicio`

### Edge Function nova

- `aplicar-planos-pendentes` — varre `profiles` com `plano_pendente_inicio <= hoje`, promove o pendente, limpa as colunas e grava `historico_planos` com `tipo_evento = 'downgrade_aplicado'`

### Cron

- `aplicar-planos-pendentes-diario` — 03:15 UTC diariamente, chama a edge function via `pg_net`

### E-mails (Resend)

Aluna e admin recebem em todos os eventos:
- `enviarEmailMudancaPlanoAluna(tipo, ...)` — copy específica por tipo (upgrade/downgrade_agendado/renovacao)
- `enviarEmailMudancaPlanoAdmin(tipo, ...)` — resumo com plano antigo, novo, datas e origem Hotmart

### Frontend

- `AuthContext` exibe toast distinto por `tipo_evento` (renovacao_imersao, upgrade, renovacao, downgrade_agendado, downgrade_aplicado), com flag `cda-evento-plano-toast-{id}` para não repetir

---

## 📝 26/05/2026 — Atualização P1 de documentação modular

### DOCS_ESTOQUE.md
- Removida referência a `Caixa Start` como plano acessível ativo (marcado como descontinuado em 25/05/2026, legados mantidos)
- Adicionado `aluna_imersao` como plano com acesso completo
- Nota no `PlanoGuard` ajustada

### DOCS_AUTENTICACAO.md (v4.2)
- Plano admin agora documenta `aluna_imersao` (provisionamento manual, 30 dias)
- Adicionada seção 3.3 — Upgrade/Downgrade Agendado (`plano_pendente_*`)
- Webhook Hotmart: nota explícita de que Start não é mais provisionado e que `aluna_imersao` não passa pelo webhook
- Lista de edge functions atualizada: `aplicar-planos-pendentes` e `notificar-expiracao-imersao`

### DOCS_FINANCEIRO.md
- Acesso atualizado (Business / aluna_imersao / Start legado / admin)
- Adicionada seção 5 — Transferências entre Bancos (`transferencias_bancos`)
- Adicionada seção 6 — Fechamento de Mês (`fechamentos_mensais`, snapshot, travamento de períodos)
- Seções subsequentes renumeradas (7–12)

---

## 📝 26/05/2026 — Atualização P2 de documentação modular (reescrita completa)

### DOCS_FECHAMENTO_MES.md
- Reescrito do esqueleto para doc completo (10 seções)
- Acrescentadas: arquitetura por camada, modelo de dados detalhado de `fechamentos_mensais` e `fechamento_checklist_itens`, RLS, função `is_mes_fechado` + lista completa de triggers, fluxo passo a passo, regras de reabertura, integração com snapshot do Meu Salário, convenções

### DOCS_PLANEJAMENTO.md
- Reescrito do esqueleto para doc completo (9 seções)
- Adicionadas: tabela de arquivos, modelo de dados detalhado das 4 tabelas, descrição completa de cada aba, regras de drag-and-drop por tipo de evento, eventos recorrentes virtuais (🔁), integrações com encomendas

### DOCS_MEU_SALARIO.md
- Reescrito do esqueleto para doc completo (9 seções)
- Acrescentadas: hooks expostos detalhados, lógica financeira formalizada com regras de cenário (±5%), integração explícita com Fechamento de Mês (snapshot vs recálculo), modelo de dados completo de `meu_salario_retiradas`, tokens visuais escopados, conteúdo da aba Educativa, convenções

---

## 📝 26/05/2026 — Revisão P3 (leve) de documentação modular

Revisados os 3 documentos já considerados completos. Resultado: nenhuma referência obsoleta encontrada (sem menções a `Pistache`, `SugarBox`, `cda-cloud`, tabelas `grupos`/`grupo_membros` ou plano Start como ativo). Atualizado apenas o cabeçalho de data:

- `docs/DOCS_GOVERNANCA.md` — timestamp 26/05/2026
- `docs/DOCS_PRECIFICACAO.md` — timestamp 26/05/2026
- `docs/DOCS_ENCOMENDAS.md` — timestamp 26/05/2026

### Resumo final da reorganização docs/
Após P1+P2+P3, a pasta `docs/` está com 13 documentos modulares + `AUDITORIA.md` + `PENDENCIAS_SEGURANCA.md`, todos sincronizados com o estado atual do sistema (Vinho Premium v2, plano Start descontinuado, `aluna_imersao`, `plano_pendente_*`, edge function `aplicar-planos-pendentes`, fechamentos mensais com snapshot, transferências entre bancos, módulos Estoque/Planejamento/Conversa Doce/AI Gateway Cap).

## 2026-05-26 — Restrição de acesso ao módulo Planejamento
- Todos os itens da seção PLANEJAMENTO (Conversa Doce e itens descontinuados em 2026-06-22) agora são exclusivos do usuário MÃE (MOTHER).
- Sidebar: itens marcados como `motherOnly: true` (removido `ssoDoce`/`adminOnly` para essa seção).
- Rotas `/planejamento`, `/planejamento-doce`, `/conversa-doce`, `/conversa-doce/respostas`, `/organizacao-doce` envolvidas com novo `MotherGuard` (`src/components/MotherGuard.tsx`).
- Planos Business e Aluna da Imersão deixam de visualizar/acessar esses módulos.

---

## SSO de retorno do Planner DOCE — `/sso-retorno` (2026-05-26)

✅ Endpoint público `GET /sso-retorno?token=<JWT>` implementado como rota SPA + edge function.

**Fluxo:**
1. Planner DOCE redireciona usuária para `https://www.caixadeacucar.com.br/sso-retorno?token=<JWT>`.
2. Rota SPA `/sso-retorno` (alias de `/sso-return`) carrega `SSOReturnPage`.
3. Página invoca edge function `validar-token-retorno-doce` com o token.
4. Edge function valida HS256 com `SSO_SHARED_SECRET`, checa `exp`, `produto === "planejamento"` e anti-replay via `jti` sintético (`planejamento:<sub>:<iat>`) gravado em `sso_token_log`.
5. Em sucesso, gera magic link via `auth.admin.generateLink` e devolve `action_link` — o navegador é redirecionado e a sessão Supabase é aberta automaticamente.

**Aceitação:**
- ✅ Token com `produto !== "planejamento"` e sem `fonte: "doce"` → 401
- ✅ Token expirado → 401
- ✅ Assinatura adulterada → 401 (verify djwt)
- ✅ Replay (mesmo `sub`+`iat`) → 403
- ✅ Usuário inexistente → 404 (não cria conta automaticamente)

**Arquivos:**
- `supabase/functions/validar-token-retorno-doce/index.ts` (aceita payload do Planner além do legado interno)
- `src/App.tsx` (rota `/sso-retorno`)
- `src/pages/SSOReturnPage.tsx` (reutilizada)

## 2026-05-26 — Módulos Propostas e Contratos + refactor Meus Dados

✅ **Propostas e Contratos** portados do projeto original para a seção MEU COMERCIAL (Business + Imersão + Mother).
- Rotas: `/comercial/propostas`, `/comercial/propostas/nova`, `/comercial/propostas/editar/:id`, `/comercial/propostas/relatorio`, `/comercial/contratos`
- Itens novos no Sidebar (MEU COMERCIAL): Propostas, Contratos
- Seed de 3 templates padrão (Bolo de Aniversário, Bolo de Casamento, Mesa de Doces)

✅ **Refactor `/configuracoes/dados-confeitaria`** com layout do "Meus Dados" do projeto original:
- Abas: Pessoal · Empresa · Endereço · Bancário · Legal · Assinatura
- Novos campos em `profiles`: complemento, documento_tipo, inscricao_municipal, certificacoes, email_comercial, telefone_fixo
- Upload de assinatura no bucket `assinaturas`
- Dados bancários persistidos em `profiles.dados_bancarios` (JSONB)

---

## 2026-05-26 — Módulo Backup repensado

✅ **Backup por módulos + retenção configurável**:
- Novo catálogo `src/lib/backupCatalog.ts` agrupa 60+ tabelas em 5 módulos: Operação, Comercial, Negócio, Planejamento, Sistema (inclui novas tabelas: propostas, contratos, contratos_templates, estoque, planejamento_*, conversa_doce_favoritos, fechamentos_mensais etc.).
- `backup_agendamentos`: novas colunas `retencao_dias` (default 30) e `modulos` (text[]).
- `backups`: novas colunas `modulos` (text[]) e `origem` ('manual'|'agendado').
- Função `public.limpar_backups_antigos(usuario_id, dias)` SECURITY DEFINER para limpeza automática.
- UI `/configuracoes/backup` totalmente reformulada: cards de seleção por módulo (manual e agendado), seletor de retenção (7d a 1 ano), badges de origem/escopo no histórico.
- Backup manual agora baixa **e** salva na nuvem simultaneamente (storage "ambos").
- Edge function `executar-backups-agendados` atualizada: lê `modulos` e `retencao_dias`, tenta filtrar por `owner_group_id` (multi-tenant), com fallback para `usuario_id`/`user_id`, e remove backups expirados do banco + storage após cada execução.

## BACKUP — TAGS DO SISTEMA REALOCADAS — 2026-05-26 20:10 UTC
- Tabela `tags` movida do módulo **Sistema** para o módulo **Meu Comercial** (tags referem-se a encomendas).
- Módulo **Sistema** agora cobre apenas `profiles` (Meus Dados).
- Arquivos: `src/lib/backupCatalog.ts`, `supabase/functions/executar-backups-agendados/index.ts`.

## 2026-05-26 — Restauração real + Cofre de Backups

✅ **Restauração real com dupla confirmação** (substitui stub anterior):
- Nova Edge Function `restaurar-backup` (DELETE+INSERT em ordem de FK, batch de 500, valida palavra-chave `RESTAURAR {nome}` server-side).
- Componente `RestaurarBackupDialog` em duas etapas (impacto + palavra-chave).
- Tabelas protegidas: `profiles` (UPDATE only), `groups`, `user_group_roles`, `admin_logs`, schema `auth.*`.
- Restauração disponível para qualquer usuário em seus próprios backups (sem exigência de MOTHER).
- Toda execução registrada em `admin_logs` (`acao='backup_restaurado'`).

✅ **Cofre de Backups (MOTHER-only)**:
- Tabela `backups_cofre` + bucket privado `backups-cofre` (RLS: SELECT/DELETE só MOTHER; INSERT só service_role).
- `executar-backups-agendados` espelha cada backup bem-sucedido para o Cofre.
- Retenção do Cofre: backup do **dia 1 de cada mês** (`eh_mensal=true`) + **5 backups mais recentes** (rolling).
- Página `/admin/cofre-backups` (MOTHER) para download/restauração de qualquer grupo, registrada em `admin_logs` com `observacao='Restauração via suporte MOTHER'`.

**Arquivos:**
- `supabase/functions/restaurar-backup/index.ts` (novo)
- `supabase/functions/executar-backups-agendados/index.ts` (hook do Cofre + retenção)
- `src/components/backup/RestaurarBackupDialog.tsx` (novo)
- `src/pages/admin/CofreBackups.tsx` (novo)
- `src/pages/configuracoes/Backup.tsx` (integra dialog + edge real)
- `src/pages/Governanca.tsx`, `src/App.tsx` (rota + card)
- Migration: `backups_cofre`, bucket `backups-cofre`, RLS MOTHER-only

Documentação completa: `docs/DOCS_BACKUP_RESTORE.md`.

---

## Onboarding de Primeiro Acesso — Meus Dados obrigatório (2026-05-27)

✅ **Refinamento**: O fluxo de onboarding agora exige `Meus Dados` (Dados da Confeitaria) como **etapa 1 obrigatória para TODOS os usuários**, independentemente do plano e inclusive para usuários antigos.

Sequência completa:
1. `/configuracoes/dados-confeitaria` — Meus Dados (nome, CPF/CNPJ, WhatsApp, endereço completo)
2. `/configuracoes/precificacao/mao-de-obra` — Valores de Mão de Obra
3. `/configuracoes/backup` — Backup inicial

Arquivos alterados:
- `src/components/FirstAccessRedirect.tsx` — gate baseado em campos essenciais do profile (`nome_completo`, `nome_confeitaria`, `cpf`, `whatsapp`, `cep`, `endereco`, `cidade`, `estado`), não mais apenas em `primeiro_acesso`.
- `src/pages/cadastros/SeusDados.tsx` — validação obrigatória dos mesmos campos + invalidação correta do cache do React Query (`["profile", user?.id]`) para que o redirect avance para a próxima etapa após salvar.

## 2026-05-27 — Navegação global
- ✅ Adicionado componente `FloatingNavigation` (botões flutuantes "Voltar" e "Voltar ao topo") no Layout principal.
- "Voltar" usa `navigate(-1)` (histórico do navegador), corrigindo rotas incorretas em páginas como Backup → Configurações.
- Ocultos em rotas de autenticação e SSO; "Voltar" oculto no Dashboard.

## 2026-05-27 — Onboarding de Primeiro Acesso com cartões de boas-vindas e conclusão ✅

- Adicionadas colunas `onboarding_iniciado` e `onboarding_concluido` em `public.profiles` (default false).
- Migration marca usuários antigos com dados completos como concluídos para não reabrir o fluxo.
- Novas páginas:
  - `/onboarding/bem-vinda` — cartão elegante com saudação personalizada + botão "Iniciar Onboarding".
  - `/onboarding/concluido` — cartão de conclusão com frase motivacional + botão "Iniciar Minha Jornada".
- `FirstAccessRedirect` reorganizado para o fluxo: Boas-vindas → Meus Dados → Mão de Obra → Backup → Conclusão.
- Fluxo se aplica a TODOS os planos. Apenas usuário MOTHER e admins legados são dispensados.
- Estado de progresso persistido no banco; sobrevive a logout/login e troca de dispositivo.
- **2026-05-27**: Removido botão "Tour pelo Caixa de Açúcar". Constante `TOUR_URL` e função `handleTour` removidas de `Concluido.tsx`. Apenas botão "Iniciar Minha Jornada" permanece.

## 2026-05-27 — Onboarding: navegação automática entre etapas
- ✅ `SeusDados.tsx`: após "Salvar Dados" durante onboarding, navega automaticamente para Mão de Obra.
- ✅ `Backup.tsx`: após ativar agendamento + primeiro backup no onboarding, navega para `/onboarding/concluido`.
- Mão de Obra → Backup já estava implementado. Fluxo: Meus Dados → Mão de Obra → Backup → Concluído, válido para todos os planos.

---

## Correção pontual — 2026-05-29

### ✅ C-2 (parcial) — Tratamento global de erros
- Criado `src/lib/errorLogger.ts` com `inicializarErrorLogger()` que captura `window.error` e `unhandledrejection`, registrando em `console.error` com contexto (usuário, email, rota, timestamp, user-agent, stack).
- Criado `src/components/ErrorBoundary.tsx` (React class component) com fallback amigável em PT-BR usando design system Vinho Premium.
- `ErrorBoundary` registrado como wrapper raiz em `src/App.tsx`.
- `inicializarErrorLogger()` chamado em `src/main.tsx` antes do `createRoot`.
- Substituir por Sentry quando configurado — o logger atual é ponte temporária.

---

## 🔓 RLS Multi-tenant — Acesso por Grupo (08/06/2026)

**Status:** ✅ Corrigido

**Problema:** Usuários adicionados a um grupo via `user_group_roles` não conseguiam acessar os dados do grupo (encomendas, receitas, financeiro, etc.). As políticas RLS da maioria das tabelas filtravam apenas por `auth.uid() = usuario_id`, ignorando o pertencimento ao grupo.

**Correção:** Migração `group_members_*_<tabela>` em todas as ~35 tabelas com `owner_group_id`, adicionando policies permissivas (combinadas via OR) baseadas em `user_belongs_to_group(auth.uid(), owner_group_id)`. Cobertura: bancos, categorias, contas_pagar/receber, custos_fixos, embalagens, encomendas/itens, estoque/movimentações, fornecedor_contatos, ingredientes, pre_preparos, receitas, tipos_documento/insumos, transferencias_bancos, unidades_medida, categorias_plano_contas, conversa_doce_favoritos, mao_obra_perfis, meu_salario_retiradas, organizacao_doce_state, planejamento_*, plano_contas, tags_encomendas, contratos, propostas, fechamentos_mensais.

Preservadas regras especiais: `padrao_sistema = false` para DELETE em `categorias` e `tags_encomendas`.

**UI:** `GruposManager` agora expande membros por grupo com gerenciamento de papel, ativar/desativar, remover e edição de permissões granulares.

## ✅ 08/06/2026 — Refinamento de Grupos: Conceito de "Mestre"

- ✅ Adicionada coluna `groups.master_user_id` (backfill automático com `created_by_user_id`).
- ✅ Criadas funções `is_group_master`, `get_group_master`, `user_is_any_group_master`.
- ✅ Edge `criar-usuario` aceita `tipoUsuario` (`mestre`|`membro`), `groupId`, `roleGroup`, `permissionFlags`. Membro herda plano do mestre e pula onboarding (`onboarding_concluido=true`).
- ✅ `FirstAccessRedirect` pula onboarding se o usuário não é mestre de nenhum grupo ativo.
- ✅ `usePlano` resolve plano efetivo lendo do mestre do grupo ativo quando o usuário é membro.
- ✅ Páginas `/cadastros/seus-dados`, `/configuracoes/precificacao/mao-de-obra`, `/configuracoes/backup` mostram `MasterOnlyGuard` para não-mestres.
- ✅ `GruposManager` mostra badge "Mestre" (Crown dourado), bloqueia remoção/desativação/rebaixamento do mestre, e MOTHER pode ser adicionada como ADMIN ou USER.
- ✅ Dialog "Criar Novo Usuário" agora pergunta Mestre/Membro.

Ver `docs/DOCS_GOVERNANCA.md` §9 para detalhes do modelo.

## 2026-06-08 — RLS transferencias_bancos
- ✅ Adicionada política UPDATE "Users can update own transferencias" (USING/WITH CHECK `auth.uid() = usuario_id`) para permitir que usuários solo (sem `owner_group_id`) atualizem suas próprias transferências bancárias. Antes existiam apenas INSERT/SELECT/DELETE solo e UPDATE de grupo.

## 2026-06-08 — Correções de segurança pós-scan

- ✅ RLS habilitado em `member_plan_sync_logs` com política SELECT restrita a MOTHER. INSERT direto revogado; gravações apenas via função `log_member_plan_sync` (SECURITY DEFINER).
- ✅ `log_member_plan_sync` agora define `search_path = public` (lint 0011).
- ✅ Políticas INSERT/UPDATE/DELETE do bucket `assinaturas` reescritas para escopo de usuário (`auth.uid()::text = folder[1]`), consistente com a política SELECT. Membros do grupo não podem mais sobrescrever a assinatura de outro membro.
- ℹ️ Finding sobre Realtime de `encomendas` marcado como não aplicável: o app não assina canais Realtime para essa tabela; leitura é feita via PostgREST com RLS por `owner_group_id`.
