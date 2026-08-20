# 📘 DOCUMENTAÇÃO MESTRE — Spa Flor de Baunilha

**Sistema de Gestão para Confeitarias — by Spa Flor de Baunilha**  
**Atualizada em:** 22/06/2026  
**Stack:** React 18 + TypeScript + Vite + Tailwind CSS + Lovable Cloud (Supabase)

> 📚 Este documento é o **índice canônico** do sistema. Cada módulo possui um doc dedicado em `docs/` para detalhes profundos. Logs cronológicos vivem em [`AUDITORIA.md`](./AUDITORIA.md) e [`PENDENCIAS_SEGURANCA.md`](./PENDENCIAS_SEGURANCA.md).

---

## 1. VISÃO GERAL

### 1.1 O que é
Spa Flor de Baunilha é um SaaS de gestão completo para confeitarias, doceiras e padarias artesanais. Permite controlar encomendas, precificar produtos com fichas técnicas, gerenciar comercial (propostas, contratos e negociações), financeiro (contas a pagar/receber, fluxo de caixa, DRE, fechamento de mês), controlar estoque com custo médio, gerenciar pró-labore (Meu Salário) — tudo com isolamento multi-tenant por grupos.

### 1.2 Para quem
Confeiteiras, doceiras e pequenas empresas do ramo de confeitaria.

### 1.3 Ecossistema
Sistema principal da **Spa Flor de Baunilha**. Criação de usuários exclusivamente via **painel admin** ou **webhook Hotmart** (compra automática). Sem autocadastro público nem SSO externo.

> 📄 Detalhes em [DOCS_AUTENTICACAO.md](./DOCS_AUTENTICACAO.md)

---

## 2. STACK TÉCNICA

| Camada | Tecnologia |
|--------|-----------|
| Frontend | React 18 + TypeScript + Vite |
| Estilização | Tailwind CSS + shadcn/ui |
| Estado servidor | TanStack React Query v5 |
| Roteamento | React Router DOM v6 |
| Backend | Lovable Cloud (Supabase) |
| Banco de dados | PostgreSQL |
| Autenticação | Supabase Auth (email/senha + Google OAuth; e-mails customizados via Resend) |
| Storage | Supabase Storage |
| Edge Functions | Deno (Supabase Edge Functions) |
| IA | Lovable AI Gateway (Gemini 2.5 Flash via `ai-proxy`) |
| Gráficos | Recharts |
| Formulários | React Hook Form + Zod |
| PDF | jsPDF + jspdf-autotable |
| Planilhas | exceljs (via `src/lib/xlsxShim.ts`) |
| Drag & Drop | @dnd-kit |
| Emails transacionais | Resend (noreply@spaflordebaunilha.com.br) |
| Agendamento | pg_cron (backups, planos pendentes) |
| Pagamentos | Hotmart Webhook (compra, renovação, cancelamento) |
| Monitoramento | Sentry (`@sentry/react` via `VITE_SENTRY_DSN`) |

---

## 3. ESTRUTURA DE DIRETÓRIOS

```
src/
├── assets/                # Imagens, logos, mascote
├── components/
│   ├── ui/                # shadcn/ui
│   ├── admin/             # CriarUsuarioDialog, EditarUsuarioDialog, GruposManager
│   ├── auth/              # AlterarSenhaObrigatoria, FirstAccessRedirect
│   ├── configuracoes/     # ConfiguracaoJuros, ConfiguracaoTagsEncomendas
│   ├── financeiro/        # ContasReceberFormModal, DarBaixaDialog, FechamentoMes
│   ├── encomendas/        # Status, tags, baixa de estoque
│   ├── meu-salario/       # CardResumoMes, CenarioResultado, HistoricoMensal
│   └── backup/            # RestaurarBackupDialog
├── contexts/              # AuthContext, GroupContext, GlobalLoadingContext
├── hooks/                 # useGroupFilter, usePlano, useUserProfile, etc.
├── integrations/supabase/ # client.ts e types.ts (AUTO-GERADOS — não editar)
├── lib/                   # dateUtils, utils, validacaoSenha, sentry, constants
├── pages/
│   ├── admin/             # Governanca, Logs, Usuarios, CofreBackups
│   ├── auth/              # Login, ForgotPassword, ResetPassword
│   ├── cadastros/         # Categorias, Clientes, Fornecedores, SeusDados, UnidadesMedida
│   ├── configuracoes/     # Backup, Bancos, PlanoContas, TiposDocumentos, MaoDeObra, etc.
│   ├── comercial/         # Negociacoes, Propostas, Contratos, NovaProposta, RelatorioPropostas
│   ├── estoque/           # Dashboard, Entrada, Ajuste, Movimentações
│   ├── financeiro/        # ContasPagar/Receber, DRE, FluxoCaixa, FechamentoMes
│   ├── meu-salario/       # Método Renda Doce
│   └── precificacao/      # Ingredientes, Embalagens, PrePreparos
├── schemas/               # Zod schemas
├── services/              # contratoService, propostaService
└── utils/                 # Geradores de PDF, insightsGenerator

supabase/
├── config.toml            # Auto-gerado — NÃO editar project-level settings
├── migrations/            # Migrações SQL
└── functions/
    ├── _shared/cors.ts
    ├── ai-proxy/                       # Proxy unificado para Lovable AI (quota, allowlist)
    ├── aplicar-planos-pendentes/       # Cron: promove plano_pendente_* → ativo
    ├── criar-usuario/                  # Provisionamento manual (admin)
    ├── enviar-recuperacao-senha/       # Recovery via Resend
    ├── executar-backups-agendados/     # Backup automático via pg_cron
    ├── hotmart-webhook/                # Provisionamento via Hotmart
    └── restaurar-backup/               # Restauração de snapshot JSONB

docs/                      # Toda a documentação do projeto (raiz tem só README.md)
```

---

## 4. DESIGN SYSTEM — Vinho Premium v2

### 4.1 Paleta Spa Flor de Baunilha
| Token | Cor | HSL |
|-------|-----|-----|
| `--sfb-vinho` | #5B1A2B | `345 55% 23%` |
| `--sfb-vinho-escuro` | #3D0F1C | `345 55% 15%` |
| `--sfb-dourado` | #C9A14A | `42 48% 54%` |
| `--sfb-creme` | #FDF6EE | `38 67% 96%` |
| `--sfb-preto` | #121212 | `0 0% 7%` |
| `--sfb-branco` | #FFF9F5 | `30 60% 99%` |
| `--sfb-coral` | #F28C82 | `5 82% 73%` |
| `--sfb-pink` | #E7A1AF | `345 52% 77%` |

> ⚠️ Tokens antigos `sfb-pistache` e `sfb-cloud` foram **removidos** — não reintroduzir.

### 4.2 Tokens Semânticos
- `--primary`: Vinho
- `--secondary` / `--accent`: Dourado
- `--background`: Creme
- `--foreground`: Preto
- `--destructive`: Coral

### 4.3 Tipografia
- **Display:** Playfair Display (títulos)
- **Body:** Inter (textos)
- **Logo:** Great Vibes (decorativo)

### 4.4 Sidebar
Fundo Vinho com destaques Dourados. Separadores em gradiente dourado entre seções. Ícone animado de bolo para aniversariantes. Badge dourado pulsante para "X HOJE" no módulo Vendas.

### 4.5 Alertas do Sistema
Background dourado, texto preto, CTA em coral.

---

## 5. NAVEGAÇÃO — AGRUPAMENTO DO SIDEBAR

A barra lateral organiza os módulos por **fluxo operacional da confeitaria** (função no negócio), não por tipo técnico de dado. A ordem das seções espelha a jornada mental da empreendedora:

```
PAINEL (vejo)  →  PRODUÇÃO (faço)  →  COMERCIAL (vendo)  →  NEGÓCIO (lucro)  →  SISTEMA (administro)
```

Dentro de cada seção, os itens seguem do **mais básico/cadastral** para o **mais operacional/transacional** (ex.: "Cadastros" antes de "Cardápio"; "Parceiros" antes de "Vendas").

### 5.1 Seções da Sidebar (`src/components/AppSidebar.tsx`)

| Seção | Itens | Rota | Restrição | Lógica |
|-------|-------|------|-----------|--------|
| **MEU PAINEL** | Meu Painel | `/dashboard` | — | Visão geral, KPIs e alertas — ponto de entrada |
| **MINHA PRODUÇÃO** | Cadastros | `/cadastros` | — | Bases da produção: mão de obra, unidades, categorias |
| | Cardápio | `/precificacao` | — | Fichas técnicas, receitas, pré-preparos, precificação |
| | Estoque | `/estoque` | Business / Imersão / Admin | Ingredientes, embalagens, movimentações |
| **MEU COMERCIAL** | Parceiros | `/clientes-fornecedores` | — | Clientes e fornecedores (relacionamento) |
| | Negociações | `/comercial/negociacoes` | — | Propostas e contratos (pré-venda formal) |
| | Vendas | `/encomendas` | — | Encomendas confirmadas (venda fechada) |
| **MEU NEGÓCIO** | Meu Dinheiro | `/financeiro` | Business / Imersão / Admin | Financeiro completo da empresa |
| | Meu Salário | `/meu-salario` | Admin do grupo | Pró-labore (Método Renda Doce) — separado do caixa da empresa |
| **SISTEMA** | Configurações | `/configuracoes/dados-confeitaria` | — | Dados da confeitaria, juros, tags, plano de contas |
| | Backup | `/configuracoes/backup` | Master | Exportar/restaurar dados |
| | Governança | `/governanca` | MOTHER | Multi-tenancy, usuários, grupos |

### 5.2 Indicadores Visuais na Sidebar
- **🍰 Bolo dourado animado** em "Parceiros" quando há clientes aniversariantes no mês
- **Badge dourado "X HOJE"** pulsante em "Vendas" quando há encomendas para o dia
- **🔒 Cadeado** em itens bloqueados por plano (40% opacidade) — clique abre modal de upgrade
- **Borda dourada esquerda** + gradiente para item ativo

---

## 6. MAPA DE ROTAS

### 6.1 Autenticação (público)
| Rota | Descrição |
|------|-----------|
| `/auth/login` | Login email/senha + Google OAuth |
| `/auth/signup` | Redireciona para `/auth/login` (autocadastro desabilitado) |
| `/auth/forgot-password` | Recuperação via Resend |
| `/auth/reset-password` | Redefinição via token |

### 6.2 Comercial (`/comercial/*`)
| Rota | Página |
|------|--------|
| `/comercial/negociacoes` | Hub de negociações (propostas + contratos) |
| `/comercial/propostas` (+ `/nova`, `/:id`) | Propostas comerciais |
| `/comercial/contratos` | Contratos |
| `/comercial/relatorio-propostas` | Relatórios |

### 6.3 Financeiro (`/financeiro/*`)
| Rota | Página |
|------|--------|
| `/financeiro/dashboard` | Dashboard financeiro |
| `/financeiro/contas-receber` (+ `/nova`, `/editar/:id`, `/detalhes/:id`) | Contas a Receber |
| `/financeiro/contas-pagar` (+ `/nova`, `/editar/:id`, `/detalhes/:id`) | Contas a Pagar |
| `/financeiro/fluxo-caixa` (+ `/diario`, `/mensal`) | Fluxo de Caixa |
| `/financeiro/dre` | DRE |
| `/financeiro/fechamento-mes` | Fechamento Mensal |
| `/financeiro/cadastros/*` | Hub de cadastros financeiros (bancos, plano-contas, juros, tipos-documentos) |

### 6.4 Precificação (`/precificacao/*`)
| Rota | Página |
|------|--------|
| `/precificacao/ficha-tecnica` (+ `/nova`, `/editar/:id`) | Fichas técnicas |
| `/precificacao/ingredientes` | Ingredientes |
| `/precificacao/embalagens` | Embalagens |
| `/precificacao/pre-preparos` (+ `/novo`, `/:id`) | Pré-preparos |

### 6.5 Estoque (`/estoque/*`)
`/estoque` (dashboard), `/estoque/entrada`, `/estoque/ajuste`, `/estoque/movimentacoes`

### 6.6 Meu Salário (`/meu-salario/*`)
`/meu-salario` (visão geral), `/meu-salario/retiradas`, `/meu-salario/educativo`

### 6.7 Configurações
Hub `/configuracoes` + páginas: `cadastros-base`, `precificacao`, `precificacao/mao-de-obra`, `financeiro`, `dados-confeitaria`, `categorias-receitas`, `unidades-medida`, `tipos-insumos`, `categorias-plano-contas`, `plano-contas`, `bancos`, `tipos-documentos`, `juros`, `tags-encomendas`, `backup`.

### 6.8 Administração
| Rota | Acesso |
|------|--------|
| `/governanca` | MOTHER (link da sidebar) |
| `/admin/governanca` | MOTHER (URL direta) |
| `/admin/usuarios` | MOTHER |
| `/admin/logs` | MOTHER |
| `/admin/cofre-backups` | MOTHER |

---

## 7. MODELO DE DADOS

> Todas as tabelas funcionais possuem `owner_group_id (uuid, FK → groups)` para isolamento multi-tenant. As políticas RLS de tabelas de negócio usam `user_belongs_to_group(owner_group_id)` (correção aplicada em 22/06/2026).

### 7.1 Governança & Identidade
- `groups` (com `master_user_id`), `user_global_roles` (MOTHER), `user_group_roles` (ADMIN/USER + `permission_flags`, coluna `role_group`), `user_active_session`
- `profiles` — perfil do usuário. Campos de plano: `plano_id`, `plano_tipo`, `plano_inicio`, `plano_fim`, `plano_pendente_id`, `plano_pendente_tipo`, `plano_pendente_inicio`, `plano_pendente_fim`. Operacionais: `origem_criacao`, `primeiro_acesso`, `ativo`, `last_login`.

### 7.2 Cadastros
- `clientes`, `cliente_familiares`
- `fornecedores`, `fornecedor_contatos`

### 7.3 Encomendas
- `encomendas`, `encomenda_itens`, `encomendas_tags`, `tags_encomendas`

### 7.4 Comercial
- `propostas`, `proposta_itens`, `contratos`

### 7.5 Precificação
- `receitas`, `receitas_ingredientes`, `receitas_embalagens`, `receitas_despesas_venda`, `receitas_imagens`, `receitas_mao_obra`
- `ingredientes`, `embalagens`, `tipos_insumos`
- `pre_preparos`, `pre_preparos_ingredientes`, `pre_preparos_mao_obra`
- `mao_obra_perfis`, `mao_obra_perfis_historico`

### 7.6 Financeiro
- `contas_receber` (+ `_parcelas`, `_pagamentos`, `_comprovantes`)
- `contas_pagar` (+ `_parcelas`, `_pagamentos`, `_comprovantes`)
- `saldos_iniciais_bancos`, `transferencias_bancos`
- `fechamentos_mensais`, `fechamento_checklist_itens`, `fechamento_logs`

### 7.7 Estoque
- `estoque` (saldos por insumo), `estoque_movimentacoes` (entradas, saídas, ajustes — base do custo médio)

### 7.8 Meu Salário
- `meu_salario_retiradas` — retiradas mensais segundo o Método Renda Doce

### 7.9 Configuração
- `categorias`, `unidades_medida`, `bancos`, `tipos_documento`
- `categorias_plano_contas`, `plano_contas`, `custos_fixos`, `configuracoes_juros`
- `planos`, `hotmart_produtos`

### 7.10 Sistema & Auditoria
- `historico_planos` — histórico de mudanças de plano
- `ai_usage_quotas` — quota mensal de IA por usuário/plano
- `backup_agendamentos`, `backups`
- `admin_logs`

### 7.11 Legado (manter por compatibilidade)
- `user_roles` (enum `app_role`), `tags`

---

## 8. CONTEXTS E HOOKS

### Contexts
| Context | Responsabilidade |
|---------|-----------------|
| `AuthContext` | Login, logout, resetPassword. **Awaita `getSession()` antes do listener** (anti race condition). Toast pós-login para eventos de plano. |
| `GroupContext` | Grupos, papéis, permissões, sessão ativa, `isMother`, `isGroupAdmin`, simulação MOTHER (`useMotherView`) |
| `GlobalLoadingContext` | Loading global com mascote. UI usa `return null` enquanto ativo |

### Hooks Principais
`useGroupFilter`, `usePlano`, `useIsAdmin`, `useIsGroupMaster`, `useUserId`, `useUserProfile`, `useClientes`, `useFornecedores`, `useReceitas`, `useEncomendas`, `useCalculosReceita`, `useMaoObraPerfis`, `useMaoObraHistorico`, `useEncomendasHoje`, `useEstoque`, `useMeuSalario`, `usePropostas`, `useContratos`, `useOnboardingStatus`, `useMotherView`.

---

## 9. COMPONENTES DE SEGURANÇA

- **PermissionGuard** — `<PermissionGuard permission="..." | requireAdmin | requireMother>`
- **PlanoGuard** — redireciona para `/upgrade` quando rota não é permitida pelo plano (admin ignora)
- **ProtectedRoute** — exige autenticação
- **MasterOnlyGuard** — restringe páginas de dados-base ao mestre do grupo (`groups.master_user_id`)
- **MotherGuard** — restringe a usuários MOTHER
- **OnboardingGuard** — bloqueia módulos operacionais enquanto onboarding pendente
- **FirstAccessRedirect** — `ativo=false` → signOut + login; `primeiro_acesso=true` ou `nome_confeitaria` vazio → `/configuracoes/dados-confeitaria`

---

## 10. EDGE FUNCTIONS

| Função | Descrição | Auth |
|--------|-----------|------|
| `ai-proxy` | **Proxy ÚNICO** para Lovable AI. Aplica auth, quota mensal por plano, rate limit e allowlist de modelos. Toda chamada de IA reusa este endpoint. | JWT obrigatório |
| `aplicar-planos-pendentes` | Cron diário 03:15 UTC. Promove `plano_pendente_*` → ativo quando `plano_fim < hoje`. | pg_cron |
| `criar-usuario` | Provisionamento manual de usuários pelo admin (convite via Resend) | JWT de admin |
| `enviar-recuperacao-senha` | Gera recovery link e envia via Resend | Pública (email no body) |
| `executar-backups-agendados` | Backup automático JSONB | pg_cron (`*/30`) |
| `hotmart-webhook` | Provisionamento via compra Hotmart. Classifica evento (`criacao` / `renovacao` / `upgrade` / `downgrade_agendado` / `reativacao` / `renovacao_imersao`), aplica regras e dispara e-mails via Resend. | Validação `hottok` |
| `restaurar-backup` | Restauração de snapshot JSONB (mestre/admin) | JWT |

> 📄 Detalhes em [DOCS_AUTENTICACAO.md](./DOCS_AUTENTICACAO.md), [DOCS_PLANOS.md](./DOCS_PLANOS.md), [AI_GATEWAY_CAP.md](./AI_GATEWAY_CAP.md), [DOCS_BACKUP_RESTORE.md](./DOCS_BACKUP_RESTORE.md)

---

## 11. SISTEMA DE PLANOS

| Plano | ID | Acesso | Periodicidade | Origem |
|-------|----|--------|---------------|--------|
| Flor de Baunilha Lite | `base` | Precificação, Encomendas, Clientes, Fornecedores, configs básicas | Anual (365d) | Hotmart (keyword `lite`/base) |
| Flor de Baunilha Business | `negocio` | Acesso total (`*`) | Mensal (30d) ou Anual (365d) | Hotmart (keyword `negocio`) |
| Aluna da Imersão | `aluna_imersao` | Acesso Business por 30 dias | 30 dias | **Manual** (fora do webhook) — gravações na Hotmart Club |

> ⚠️ **Plano `Flor de Baunilha Start` foi DESCONTINUADO em 2026-05-25.**

### Eventos de plano (`historico_planos.tipo_evento`)
`criacao`, `renovacao`, `upgrade`, `downgrade_agendado`, `reativacao`, `renovacao_imersao`

### Herança de plano (mestre → membros)
Membros (USER/ADMIN secundário) **pulam onboarding** e **herdam o plano do mestre** via `usePlano`. O mestre é `groups.master_user_id` — ADMIN principal que fez o onboarding.

Enforcement: `usePlano()` + `PlanoGuard` no frontend; `user_has_financial_access()` + RLS RESTRICTIVE nas tabelas financeiras no backend. Admin ignora restrições. Itens bloqueados na sidebar: 40% opacidade + 🔒.

> 📄 Detalhes em [DOCS_PLANOS.md](./DOCS_PLANOS.md), [DOCS_MESTRE.md](./DOCS_MESTRE.md)

---

## 12. SISTEMA DE BACKUP

- Página: `/configuracoes/backup` (mestre)
- Tabelas: `backup_agendamentos` (config), `backups` (dados JSONB)
- Cron: `executar-backups-agendados` a cada 30 min
- Restauração via edge function `restaurar-backup`
- Frequências: Diário ou Semanal (dia/horário configuráveis)

> 📄 Detalhes em [DOCS_BACKUP_RESTORE.md](./DOCS_BACKUP_RESTORE.md)

---

## 13. AI GATEWAY CAP

- Edge function única: `ai-proxy`
- Tabela: `ai_usage_quotas` (quota mensal por usuário, reset automático)
- Limites por plano (Lite/Business/Imersão/Admin), allowlist de modelos, rate limit
- Toda feature de IA (insights, sugestões) **deve** reusar `ai-proxy` — proibido criar edge functions de IA por feature

> 📄 Detalhes em [AI_GATEWAY_CAP.md](./AI_GATEWAY_CAP.md)

---

## 14. MONITORAMENTO E OBSERVABILIDADE

- **Sentry** (`@sentry/react`) — inicializado em `src/lib/sentry.ts` via `VITE_SENTRY_DSN`
- Filtros de privacidade: `sendDefaultPii: false`, scrub de senhas/tokens/cartões, `maskAllText`/`maskAllInputs` em Session Replay
- `tracesSampleRate: 1.0` em produção, `0.1` em dev
- Integração com `errorLogger.ts` — todo erro capturado é encaminhado ao Sentry (no-op se DSN ausente)

---

## 15. OTIMIZAÇÕES DE PERFORMANCE

### Abril/2026
- Cron de backup: `*/5` → `*/30` (~83% menos invocações)
- Dashboard realtime: debounce 2,5s em 5 subscriptions `postgres_changes`
- Índices: `idx_tipos_documento_usuario_id`, `idx_contas_receber_usuario_status`, `idx_encomendas_usuario_data_entrega`

### Maio/2026
- Lazy load de páginas de relatórios (DRE, Fluxo de Caixa)
- `AuthContext` reordenado (`getSession` awaitado antes do listener) — eliminou redirecionamentos intermitentes

### Junho/2026
- RLS de tabelas de negócio padronizada com `user_belongs_to_group(owner_group_id)` (substitui o padrão antigo `auth.uid() = user_id`)
- `sitemap.xml` e `robots.txt` configurados para lançamento
- Integração Sentry para erros em produção

---

## 16. CONVENÇÕES OBRIGATÓRIAS

- **Datas:** sempre `src/lib/dateUtils.ts` (YYYY-MM-DD ISO, sem time) para evitar offset UTC -1
- **Loading:** `return null` enquanto `useGlobalLoading()` ativo (evita flash)
- **Auth init:** `await supabase.auth.getSession()` **antes** de `onAuthStateChange`
- **IA:** sempre `ai-proxy` (nunca edge function dedicada)
- **Emails:** Supabase nativos suprimidos — usar Resend via Edge Function
- **Cores:** usar tokens `--sfb-*` (HSL). Nunca cor literal em componente. Nunca `sfb-pistache`/`sfb-cloud`
- **Multi-tenancy:** tabelas `groups` e `user_group_roles` (coluna `role_group`). Nunca `grupos`/`grupo_membros`/`role_grupo`
- **RLS:** tabelas de grupo usam `user_belongs_to_group(owner_group_id)`, nunca apenas `auth.uid() = user_id`
- **Docs:** toda mudança de RLS / SQL / Edge Function / Auth → registrar em `AUDITORIA.md`, `PENDENCIAS_SEGURANCA.md` ou `DOCS_AUTENTICACAO.md`

---

## 17. DOCUMENTOS RELACIONADOS

> Todos os documentos vivem em `docs/`. A raiz mantém apenas o `README.md`.

| Documento | Escopo |
|-----------|--------|
| [DOCS_AUTENTICACAO.md](./DOCS_AUTENTICACAO.md) | Login, convites Resend, primeiro acesso, senhas, Hotmart webhook |
| [DOCS_GOVERNANCA.md](./DOCS_GOVERNANCA.md) | Grupos, roles, RLS, permission_flags |
| [DOCS_PLANOS.md](./DOCS_PLANOS.md) | Catálogo de planos, Hotmart, expiração, upgrade/downgrade, plano_pendente |
| [DOCS_FINANCEIRO.md](./DOCS_FINANCEIRO.md) | Contas pagar/receber, DRE, fluxo caixa, bancos |
| [DOCS_FECHAMENTO_MES.md](./DOCS_FECHAMENTO_MES.md) | Snapshot mensal e bloqueio retroativo |
| [DOCS_PRECIFICACAO.md](./DOCS_PRECIFICACAO.md) | Ingredientes, embalagens, receitas, cálculos, mão de obra |
| [DOCS_ENCOMENDAS.md](./DOCS_ENCOMENDAS.md) | Pedidos, itens, tags, vinculação financeira |
| [DOCS_ESTOQUE.md](./DOCS_ESTOQUE.md) | Controle de estoque, custo médio, movimentações |
| [DOCS_MEU_SALARIO.md](./DOCS_MEU_SALARIO.md) | Método Renda Doce, pró-labore saudável |
| [DOCS_MEU_PAINEL_E_MEU_DINHEIRO.md](./DOCS_MEU_PAINEL_E_MEU_DINHEIRO.md) | Dashboard e visão financeira consolidada |
| [DOCS_BACKUP_RESTORE.md](./DOCS_BACKUP_RESTORE.md) | Backup automático, restauração, snapshot JSONB |
| [AI_GATEWAY_CAP.md](./AI_GATEWAY_CAP.md) | Controle de consumo de IA |
| [AUDITORIA.md](./AUDITORIA.md) | Log cronológico de correções de auditoria |
| [PENDENCIAS_SEGURANCA.md](./PENDENCIAS_SEGURANCA.md) | Pendências de segurança que dependem de ação externa |
