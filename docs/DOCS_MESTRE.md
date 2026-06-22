# 📘 DOCUMENTAÇÃO MESTRE — CAIXA DE AÇÚCAR

**Sistema de Gestão para Confeitarias — by Umbrella Doce**  
**Atualizada em:** 26/05/2026  
**Stack:** React 18 + TypeScript + Vite + Tailwind CSS + Lovable Cloud (Supabase)

> 📚 Este documento é o **índice canônico** do sistema. Cada módulo possui um doc dedicado em `docs/` para detalhes profundos. Logs cronológicos vivem em [`AUDITORIA.md`](./AUDITORIA.md) e [`PENDENCIAS_SEGURANCA.md`](./PENDENCIAS_SEGURANCA.md).

---

## 1. VISÃO GERAL

### 1.1 O que é
Caixa de Açúcar é um SaaS de gestão completo para confeitarias, doceiras e padarias artesanais. Permite controlar encomendas, precificar produtos com fichas técnicas, gerenciar financeiro (contas a pagar/receber, fluxo de caixa, DRE, fechamento de mês), controlar estoque com custo médio, fazer planejamento estratégico, gerenciar pró-labore (Meu Salário), conversar com assistente IA (Conversa Doce) e organizar tarefas operacionais — tudo com isolamento multi-tenant por grupos.

### 1.2 Para quem
Confeiteiras, doceiras e pequenas empresas do ramo de confeitaria.

### 1.3 Ecossistema
Sistema principal da **Umbrella Doce**. Criação de usuários exclusivamente via **painel admin** ou **webhook Hotmart** (compra automática). Sem autocadastro público nem SSO externo.

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
| Emails transacionais | Resend (noreply@umbrelladoce.com.br) |
| Agendamento | pg_cron (backups, notificações de imersão, planos pendentes) |
| Pagamentos | Hotmart Webhook (compra, renovação, cancelamento) |

---

## 3. ESTRUTURA DE DIRETÓRIOS

```
src/
├── assets/                # Imagens, logos, mascote
├── components/
│   ├── ui/                # shadcn/ui
│   ├── admin/             # CriarUsuarioDialog, EditarUsuarioDialog
│   ├── auth/              # AlterarSenhaObrigatoria, FirstAccessRedirect
│   ├── configuracoes/     # ConfiguracaoJuros, ConfiguracaoTagsEncomendas
│   ├── financeiro/        # ContasReceberFormModal, DarBaixaDialog, FechamentoMes
│   ├── estoque/           # Componentes do controle de estoque
│   ├── planejamento/      # Calendário, Metas, Tarefas, Bem-Estar
│   ├── conversa-doce/     # Chat IA + favoritos
│   └── alertas/           # AlertaExpiracaoPlano, ModalExpiracaoImersao
├── contexts/              # AuthContext, GroupContext, GlobalLoadingContext
├── hooks/                 # useGroupFilter, usePlano, useUserProfile, etc.
├── integrations/supabase/ # client.ts e types.ts (AUTO-GERADOS — não editar)
├── lib/                   # dateUtils, utils, validacaoSenha, constants
├── pages/
│   ├── admin/             # Governanca, Logs, Usuarios
│   ├── auth/              # Login, ForgotPassword, ResetPassword
│   ├── cadastros/         # Categorias, Clientes, Fornecedores, SeusDados, UnidadesMedida
│   ├── configuracoes/     # Backup, Bancos, PlanoContas, TiposDocumentos, MaoDeObra, etc.
│   ├── conversa-doce/     # Chat e Respostas Favoritas
│   ├── estoque/           # Lista, Entrada, Ajuste, Movimentações
│   ├── financeiro/        # ContasPagar/Receber, DRE, FluxoCaixa, FechamentoMes
│   ├── meu-salario/       # Método Renda Doce
│   ├── organizacao-doce/  # Organizador de tarefas (rota /organizacao-doce)
│   ├── planejamento/      # Calendário, Metas, Tarefas, Bem-Estar
│   └── precificacao/      # Ingredientes, Embalagens, PrePreparos
├── schemas/               # Zod schemas
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
    └── notificar-expiracao-imersao/    # E-mails D-7/D-3/D-1 para alunas Imersão

docs/                      # Toda a documentação do projeto (raiz tem só README.md)
```

---

## 4. DESIGN SYSTEM — Vinho Premium v2

### 4.1 Paleta Caixa de Açúcar
| Token | Cor | HSL |
|-------|-----|-----|
| `--cda-vinho` | #5B1A2B | `345 55% 23%` |
| `--cda-vinho-escuro` | #3D0F1C | `345 55% 15%` |
| `--cda-dourado` | #C9A14A | `42 48% 54%` |
| `--cda-creme` | #FDF6EE | `38 67% 96%` |
| `--cda-preto` | #121212 | `0 0% 7%` |
| `--cda-branco` | #FFF9F5 | `30 60% 99%` |
| `--cda-coral` | #F28C82 | `5 82% 73%` |
| `--cda-pink` | #E7A1AF | `345 52% 77%` |

> ⚠️ Tokens antigos `cda-pistache` e `cda-cloud` foram **removidos** — não reintroduzir.

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
Fundo Vinho com destaques Dourados. Ícone animado de bolo para aniversariantes.

### 4.5 Alertas do Sistema
Background dourado, texto preto, CTA em coral.

---

## 5. MAPA DE ROTAS

### 5.1 Autenticação (público)
| Rota | Descrição |
|------|-----------|
| `/auth/login` | Login email/senha + Google OAuth |
| `/auth/signup` | Redireciona para `/auth/login` (autocadastro desabilitado) |
| `/auth/forgot-password` | Recuperação via Resend |
| `/auth/reset-password` | Redefinição via token |

### 5.2 Módulos Principais (protegidos — sidebar "MEU NEGÓCIO")
| Rota | Página | Restrição |
|------|--------|-----------|
| `/dashboard` | Meu Painel | — |
| `/financeiro` | Meu Dinheiro (hub) | Business / aluna_imersao / Admin |
| `/meu-salario` | Meu Salário (Método Renda Doce) | Admin do grupo |
| `/encomendas` | Minhas Encomendas | — |
| `/precificacao` | Meu Cardápio (hub) | — |
| `/estoque` | Meus Insumos | Business / aluna_imersao / Admin |
| `/clientes-fornecedores` | Clientes e Fornecedores | — |

| `/conversa-doce` | Assistente IA WhatsApp | — |
| `/organizacao-doce` | Organizador de tarefas | — |
| `/upgrade` | Tela de upgrade | — |

### 5.3 Financeiro (`/financeiro/*`)
| Rota | Página |
|------|--------|
| `/financeiro/dashboard` | Dashboard financeiro |
| `/financeiro/contas-receber` (+ `/nova`, `/editar/:id`, `/detalhes/:id`) | Contas a Receber |
| `/financeiro/contas-pagar` (+ `/nova`, `/editar/:id`, `/detalhes/:id`) | Contas a Pagar |
| `/financeiro/fluxo-caixa` (+ `/diario`, `/mensal`) | Fluxo de Caixa |
| `/financeiro/dre` | DRE |
| `/financeiro/fechamento-mes` | Fechamento Mensal |
| `/financeiro/cadastros/*` | Hub de cadastros financeiros (bancos, plano-contas, juros, tipos-documentos) |

### 5.4 Precificação (`/precificacao/*`)
| Rota | Página |
|------|--------|
| `/precificacao/ficha-tecnica` (+ `/nova`, `/editar/:id`) | Fichas técnicas |
| `/precificacao/ingredientes` | Ingredientes |
| `/precificacao/embalagens` | Embalagens |
| `/precificacao/pre-preparos` (+ `/novo`, `/:id`) | Pré-preparos |

### 5.5 Estoque (`/estoque/*`)
`/estoque` (lista), `/estoque/entrada`, `/estoque/ajuste`, `/estoque/movimentacoes`

### 5.6 Conversa Doce (`/conversa-doce/*`)
`/conversa-doce` (chat), `/conversa-doce/respostas` (favoritos do grupo)

### 5.7 Configurações
Hub `/configuracoes` + páginas: `cadastros-base`, `precificacao`, `precificacao/mao-de-obra`, `financeiro`, `dados-confeitaria`, `categorias-receitas`, `unidades-medida`, `tipos-insumos`, `categorias-plano-contas`, `plano-contas`, `bancos`, `tipos-documentos`, `juros`, `tags-encomendas`, `backup`.

### 5.8 Administração
| Rota | Acesso |
|------|--------|
| `/admin/governanca` | MOTHER |
| `/admin/usuarios` | MOTHER |
| `/admin/logs` | MOTHER |

---

## 6. MODELO DE DADOS

> Todas as tabelas funcionais possuem `owner_group_id (uuid, FK → groups)` para isolamento multi-tenant.

### 6.1 Governança & Identidade
- `groups`, `user_global_roles` (MOTHER), `user_group_roles` (ADMIN/USER + `permission_flags`), `user_active_session`
- `profiles` — perfil do usuário. Campos de plano: `plano_id`, `plano_tipo`, `plano_inicio`, `plano_fim`, `plano_pendente_id`, `plano_pendente_tipo`, `plano_pendente_inicio`, `plano_pendente_fim`. Operacionais: `origem_criacao`, `primeiro_acesso`, `ativo`, `last_login`.

### 6.2 Cadastros
- `clientes`, `cliente_familiares`
- `fornecedores`, `fornecedor_contatos`

### 6.3 Encomendas
- `encomendas`, `encomenda_itens`, `encomendas_tags`, `tags_encomendas`

### 6.4 Precificação
- `receitas`, `receitas_ingredientes`, `receitas_embalagens`, `receitas_despesas_venda`, `receitas_imagens`, `receitas_mao_obra`
- `ingredientes`, `embalagens`, `tipos_insumos`
- `pre_preparos`, `pre_preparos_ingredientes`, `pre_preparos_mao_obra`
- `mao_obra_perfis`, `mao_obra_perfis_historico`

### 6.5 Financeiro
- `contas_receber` (+ `_parcelas`, `_pagamentos`, `_comprovantes`)
- `contas_pagar` (+ `_parcelas`, `_pagamentos`, `_comprovantes`)
- `saldos_iniciais_bancos`, `transferencias_bancos`
- `fechamentos_mensais`, `fechamento_checklist_itens`, `fechamento_logs`

### 6.6 Estoque
- `estoque` (saldos por insumo), `estoque_movimentacoes` (entradas, saídas, ajustes — base do custo médio)

### 6.7 Planejamento
- `planejamento_metas`, `planejamento_tarefas`, `planejamento_datas_comemorativas`, `planejamento_descanso`

### 6.8 Meu Salário
- `meu_salario_retiradas` — retiradas mensais segundo o Método Renda Doce

### 6.9 Conversa Doce & Organização
- `conversa_doce_favoritos` — respostas favoritadas por grupo
- `organizacao_doce_state` — estado persistido do organizador

### 6.10 Configuração
- `categorias`, `unidades_medida`, `bancos`, `tipos_documento`
- `categorias_plano_contas`, `plano_contas`, `custos_fixos`, `configuracoes_juros`
- `planos`, `hotmart_produtos`

### 6.11 Sistema & Auditoria
- `historico_planos` — histórico de mudanças de plano (`tipo_evento`: `criacao`, `renovacao`, `upgrade`, `downgrade_agendado`, `reativacao`, `renovacao_imersao`)
- `imersao_notificacoes_log` — idempotência dos disparos D-7/D-3/D-1
- `ai_usage_quotas` — quota mensal de IA por usuário/plano
- `backup_agendamentos`, `backups`
- `admin_logs`

### 6.12 Legado (manter por compatibilidade)
- `user_roles` (enum `app_role`), `tags`

---

## 7. CONTEXTS E HOOKS

### Contexts
| Context | Responsabilidade |
|---------|-----------------|
| `AuthContext` | Login, logout, resetPassword. **Awaita `getSession()` antes do listener** (anti race condition). Toast pós-login para eventos de plano. |
| `GroupContext` | Grupos, papéis, permissões, sessão ativa, `isMother` |
| `GlobalLoadingContext` | Loading global com mascote. UI usa `return null` enquanto ativo |

### Hooks Principais
`useGroupFilter`, `usePlano`, `useIsAdmin`, `useUserId`, `useUserProfile`, `useClientes`, `useFornecedores`, `useReceitas`, `useEncomendas`, `useCalculosReceita`, `useMaoObraPerfis`, `useMaoObraHistorico`, `usePlanejamento`, `useEncomendasHoje`, `useEstoque`, `useMeuSalario`, `useConversaDoce`.

---

## 8. COMPONENTES DE SEGURANÇA

- **PermissionGuard** — `<PermissionGuard permission="..." | requireAdmin | requireMother>`
- **PlanoGuard** — redireciona para `/upgrade` quando rota não é permitida pelo plano (admin ignora)
- **ProtectedRoute** — exige autenticação
- **FirstAccessRedirect** — `ativo=false` → signOut + login; `primeiro_acesso=true` ou `nome_confeitaria` vazio → `/configuracoes/dados-confeitaria`

---

## 9. EDGE FUNCTIONS

| Função | Descrição | Auth |
|--------|-----------|------|
| `ai-proxy` | **Proxy ÚNICO** para Lovable AI. Aplica auth, quota mensal por plano, rate limit e allowlist de modelos. Toda chamada de IA reusa este endpoint. | JWT obrigatório |
| `aplicar-planos-pendentes` | Cron diário 03:15 UTC. Promove `plano_pendente_*` → ativo quando `plano_fim < hoje`. | pg_cron |
| `criar-usuario` | Provisionamento manual de usuários pelo admin (convite via Resend) | JWT de admin |
| `enviar-recuperacao-senha` | Gera recovery link e envia via Resend | Pública (email no body) |
| `executar-backups-agendados` | Backup automático JSONB | pg_cron (`*/30`) |
| `hotmart-webhook` | Provisionamento via compra Hotmart. Classifica evento (`criacao` / `renovacao` / `upgrade` / `downgrade_agendado` / `reativacao` / `renovacao_imersao`), aplica regras e dispara e-mails de mudança de plano via Resend (aluna + admin). | Validação `hottok` |
| `notificar-expiracao-imersao` | Cron diário 12:00 UTC. Envia D-7/D-3/D-1 para alunas Imersão (aluna + admin) com idempotência por `imersao_notificacoes_log`. | pg_cron |

> 📄 Detalhes em [DOCS_AUTENTICACAO.md](./DOCS_AUTENTICACAO.md), [DOCS_PLANOS.md](./DOCS_PLANOS.md), [AI_GATEWAY_CAP.md](./AI_GATEWAY_CAP.md)

---

## 10. SISTEMA DE PLANOS

| Plano | ID | Acesso | Periodicidade | Origem |
|-------|----|--------|---------------|--------|
| Caixa Lite | `base` | Precificação, Encomendas, Clientes, Fornecedores, configs básicas | Anual (365d) | Hotmart (keyword `lite`/base) |
| Caixa Business | `negocio` | Acesso total (`*`) | Mensal (30d) ou Anual (365d) | Hotmart (keyword `negocio`) |
| Aluna da Imersão | `aluna_imersao` | Acesso Business por 30 dias | 30 dias | **Manual** (fora do webhook) — gravações na Hotmart Club |

> ⚠️ **Plano `Caixa Start` foi DESCONTINUADO em 2026-05-25.** Removido de `public.planos`; usuários migrados para `base` e desativados.

### Eventos de plano (registrados em `historico_planos.tipo_evento`)
- `criacao` — novo usuário
- `renovacao` — mesmo plano, estende `plano_fim`
- `upgrade` — Lite → Business (imediato)
- `downgrade_agendado` — Business → Lite (mantém atual até `plano_fim`, novo plano vai para `plano_pendente_*` e é promovido pelo cron)
- `reativacao` — usuário inativo reativando
- `renovacao_imersao` — aluna Imersão migrando para plano pago

Enforcement: `usePlano()` + `PlanoGuard` no frontend; `user_has_financial_access()` + 12 RLS RESTRICTIVE nas tabelas financeiras no backend. Admin ignora restrições. Itens bloqueados na sidebar: 40% opacidade + 🔒.

> 📄 Detalhes em [DOCS_PLANOS.md](./DOCS_PLANOS.md)

---

## 11. SISTEMA DE BACKUP

- Página: `/configuracoes/backup`
- Tabelas: `backup_agendamentos` (config), `backups` (dados JSONB)
- Cron: `executar-backups-agendados` a cada 30 min
- Frequências: Diário ou Semanal (dia/horário configuráveis)

---

## 12. AI GATEWAY CAP

- Edge function única: `ai-proxy`
- Tabela: `ai_usage_quotas` (quota mensal por usuário, reset automático)
- Limites por plano (Lite/Business/Imersão/Admin), allowlist de modelos, rate limit
- Toda feature de IA (Conversa Doce, insights, sugestões) **deve** reusar `ai-proxy` — proibido criar edge functions de IA por feature

> 📄 Detalhes em [AI_GATEWAY_CAP.md](./AI_GATEWAY_CAP.md)

---

## 13. OTIMIZAÇÕES DE PERFORMANCE

### Abril/2026
- Cron de backup: `*/5` → `*/30` (~83% menos invocações)
- Dashboard realtime: debounce 2,5s em 5 subscriptions `postgres_changes`
- Índices: `idx_tipos_documento_usuario_id`, `idx_contas_receber_usuario_status`, `idx_encomendas_usuario_data_entrega`

### Maio/2026
- Lazy load de páginas de relatórios (DRE, Fluxo de Caixa)
- Conversa Doce com cache de favoritos por grupo
- `AuthContext` reordenado (`getSession` awaitado antes do listener) — eliminou redirecionamentos intermitentes

---

## 14. CONVENÇÕES OBRIGATÓRIAS

- **Datas:** sempre `src/lib/dateUtils.ts` (YYYY-MM-DD ISO, sem time) para evitar offset UTC -1
- **Loading:** `return null` enquanto `useGlobalLoading()` ativo (evita flash)
- **Auth init:** `await supabase.auth.getSession()` **antes** de `onAuthStateChange`
- **IA:** sempre `ai-proxy` (nunca edge function dedicada)
- **Emails:** Supabase nativos suprimidos — usar Resend via Edge Function
- **Cores:** usar tokens `--cda-*` (HSL). Nunca cor literal em componente. Nunca `cda-pistache`/`cda-cloud`
- **Multi-tenancy:** tabelas `groups` e `user_group_roles` (coluna `role_group`). Nunca `grupos`/`grupo_membros`/`role_grupo`
- **Docs:** toda mudança de RLS / SQL / Edge Function / Auth → registrar em `AUDITORIA.md`, `PENDENCIAS_SEGURANCA.md` ou `DOCS_AUTENTICACAO.md`

---

## 15. DOCUMENTOS RELACIONADOS

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
| [DOCS_PLANEJAMENTO.md](./DOCS_PLANEJAMENTO.md) | Calendário, metas, tarefas, bem-estar |
| [DOCS_MEU_SALARIO.md](./DOCS_MEU_SALARIO.md) | Método Renda Doce, pró-labore saudável |
| [DOCS_MEU_PAINEL_E_MEU_DINHEIRO.md](./DOCS_MEU_PAINEL_E_MEU_DINHEIRO.md) | Dashboard e visão financeira consolidada |
| [MODULO_CONVERSA_DOCE.md](./MODULO_CONVERSA_DOCE.md) | Assistente IA WhatsApp |
| [AI_GATEWAY_CAP.md](./AI_GATEWAY_CAP.md) | Controle de consumo de IA |
| [AUDITORIA.md](./AUDITORIA.md) | Registro de auditorias, correções e otimizações |
| [PENDENCIAS_SEGURANCA.md](./PENDENCIAS_SEGURANCA.md) | Pendências de segurança que dependem de ação externa |
