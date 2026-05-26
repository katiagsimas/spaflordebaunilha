# 📘 DOCUMENTAÇÃO MESTRE — CAIXA DE AÇÚCAR

**Sistema de Gestão para Confeitarias — by Umbrella Doce**  
**Atualizada em:** Maio 2026  
**Stack:** React 18 + TypeScript + Vite + Tailwind CSS + Lovable Cloud (Supabase)

---

## 1. VISÃO GERAL

### 1.1 O que é
Caixa de Açúcar é um sistema web de gestão completo para confeitarias. Permite controlar encomendas, precificar produtos com fichas técnicas, gerenciar financeiro (contas a pagar/receber, fluxo de caixa, DRE) e administrar clientes, fornecedores e usuários com isolamento multi-tenant por grupos.

### 1.2 Para quem
Confeiteiras, doceiras e pequenas empresas do ramo de confeitaria.

### 1.3 Ecossistema
O Caixa de Açúcar é o sistema principal da **Umbrella Doce**, concentrando todos os projetos da empresa. A criação de usuários é feita exclusivamente pelo **painel admin** ou pelo **webhook da Hotmart** (compra automática). Não existe autocadastro público nem SSO externo (removido em abril/2026).

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
| Autenticação | Supabase Auth (email/senha + Magic Link para convites) |
| Storage | Supabase Storage |
| Edge Functions | Deno (Supabase Edge Functions) |
| Gráficos | Recharts |
| Formulários | React Hook Form + Zod |
| PDF | jsPDF + jspdf-autotable |
| Planilhas | exceljs (via shim em `src/lib/xlsxShim.ts`) |
| Drag & Drop | @dnd-kit |
| Emails transacionais | Resend (noreply@umbrelladoce.com.br) |
| Agendamento | pg_cron (backups agendados) |

---

## 3. ESTRUTURA DE DIRETÓRIOS

```
src/
├── assets/              # Imagens e logos
├── components/
│   ├── ui/              # shadcn/ui
│   ├── admin/           # CriarUsuarioDialog, EditarUsuarioDialog
│   ├── auth/            # AlterarSenhaObrigatoria
│   ├── configuracoes/   # ConfiguracaoJuros, ConfiguracaoTagsEncomendas
│   └── financeiro/      # ContasReceberFormModal, DarBaixaDialog, DarBaixaPagarDialog
├── contexts/            # AuthContext, GroupContext, GlobalLoadingContext
├── hooks/               # Hooks customizados (useGroupFilter, usePlano, etc.)
├── integrations/        # Supabase client e types (auto-gerados, NÃO editar)
├── lib/                 # dateUtils, utils, validacaoSenha
├── pages/
│   ├── admin/           # Governanca, Logs, Usuarios
│   ├── auth/            # Login, ForgotPassword, ResetPassword
│   ├── cadastros/       # Categorias, Clientes, Fornecedores, SeusDados, UnidadesMedida
│   ├── configuracoes/   # Bancos, PlanoContas, TiposDocumentos, Backup, etc.
│   ├── financeiro/      # ContasPagar/Receber, DRE, FluxoCaixa, Dashboard
│   └── precificacao/    # Ingredientes, Embalagens, PrePreparos
├── schemas/             # encomendaSchema, pagamentoSchema (Zod)
└── utils/               # gerarReciboPagamento, exportarReceitaPDF, exportarPrePreparoPDF, insightsGenerator

supabase/
├── config.toml          # Auto-gerado (NÃO editar project-level settings)
├── migrations/          # Migrações SQL
└── functions/
    ├── _shared/cors.ts
    ├── criar-usuario/           # Provisionamento manual (admin)
    ├── enviar-recuperacao-senha/ # Recuperação de senha via Resend
    ├── executar-backups-agendados/ # Backup automático via pg_cron
    └── hotmart-webhook/         # Provisionamento automático (compra Hotmart)

docs/
├── AUDITORIA.md              # Registro de auditorias e otimizações
└── PENDENCIAS_SEGURANCA.md   # Pendências de segurança
```

---

## 4. DESIGN SYSTEM

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

### 4.2 Tokens Semânticos
- `--primary`: Preto (#1C1C1C)
- `--secondary`: Pistache
- `--accent`: Dourado
- `--destructive`: Coral/Erro
- `--muted`: Pistache 30%

### 4.3 Tipografia
- **Display:** Playfair Display (títulos)
- **Body:** Inter (textos)
- **Logo:** Great Vibes (decorativo)

### 4.4 Sidebar
Fundo pistache com destaques dourados. Ícone animado de bolo para aniversariantes.

### 4.5 Alertas do Sistema
Background dourado, texto preto, CTA em coral.

---

## 5. MAPA DE ROTAS

### 5.1 Autenticação (público)
| Rota | Descrição |
|------|-----------|
| `/auth/login` | Login com email/senha |
| `/auth/signup` | **Redireciona para `/auth/login`** (autocadastro desabilitado) |
| `/auth/forgot-password` | Recuperação de senha (via Resend) |
| `/auth/reset-password` | Redefinição de senha (token via query params) |

### 5.2 Módulos Principais (protegidos)
| Rota | Página |
|------|--------|
| `/dashboard` | Painel com calendário, gráficos, aniversariantes |
| `/encomendas` | CRUD de encomendas |
| `/clientes` | Cadastro PF/PJ com familiares |
| `/fornecedores` | Cadastro com contatos |

### 5.3 Financeiro (requer Caixa Business/Start ou Admin)
| Rota | Página |
|------|--------|
| `/financeiro` | Hub |
| `/financeiro/dashboard` | Dashboard financeiro |
| `/financeiro/contas-receber` | Listagem |
| `/financeiro/contas-receber/nova` | Criar |
| `/financeiro/contas-receber/editar/:id` | Editar |
| `/financeiro/contas-receber/detalhes/:id` | Detalhes |
| `/financeiro/contas-pagar` | Listagem |
| `/financeiro/contas-pagar/nova` | Criar |
| `/financeiro/contas-pagar/editar/:id` | Editar |
| `/financeiro/contas-pagar/detalhes/:id` | Detalhes |
| `/financeiro/fluxo-caixa` | Hub fluxo de caixa |
| `/financeiro/fluxo-caixa/diario` | Diário |
| `/financeiro/fluxo-caixa/mensal` | Mensal |
| `/financeiro/dre` | DRE |

### 5.4 Precificação
| Rota | Página |
|------|--------|
| `/precificacao` | Hub |
| `/precificacao/ficha-tecnica` | Fichas técnicas (receitas) |
| `/precificacao/ficha-tecnica/nova` | Criar receita |
| `/precificacao/ficha-tecnica/editar/:id` | Editar receita |
| `/precificacao/ingredientes` | Ingredientes |
| `/precificacao/embalagens` | Embalagens |
| `/precificacao/pre-preparos` | Pré-preparos |
| `/precificacao/pre-preparos/novo` | Criar pré-preparo |
| `/precificacao/pre-preparos/:id` | Editar pré-preparo |

### 5.5 Configurações
| Rota | Página |
|------|--------|
| `/configuracoes` | Hub |
| `/configuracoes/cadastros-base` | Hub cadastros base |
| `/configuracoes/precificacao` | Config. precificação |
| `/configuracoes/financeiro` | Config. financeiro (requer plano) |
| `/configuracoes/dados-confeitaria` | Perfil/dados |
| `/configuracoes/categorias-receitas` | Categorias |
| `/configuracoes/unidades-medida` | Unidades |
| `/configuracoes/tipos-insumos` | Tipos de insumos |
| `/configuracoes/categorias-plano-contas` | Categorias plano contas (requer plano) |
| `/configuracoes/plano-contas` | Plano de contas (requer plano) |
| `/configuracoes/bancos` | Bancos (requer plano) |
| `/configuracoes/tipos-documentos` | Tipos de documentos (requer plano) |
| `/configuracoes/juros` | Juros e multas (requer plano) |
| `/configuracoes/tags-encomendas` | Tags |
| `/configuracoes/precificacao/mao-de-obra` | Mão de obra |
| `/configuracoes/backup` | Backup e restauração |

### 5.6 Administração
| Rota | Acesso | Descrição |
|------|--------|-----------|
| `/admin/governanca` | MOTHER | Governança de grupos e usuários |
| `/admin/usuarios` | Admin (legado) | Gestão de usuários |
| `/admin/logs` | Admin (legado) | Logs de ações admin |

### 5.7 Outros
| Rota | Descrição |
|------|-----------|
| `/upgrade` | Tela de upgrade de plano |
| `*` | NotFound (404) |

---

## 6. MODELO DE DADOS (Resumo)

> Todas as tabelas funcionais possuem `owner_group_id (uuid, FK → groups)` para isolamento multi-tenant.

### 6.1 Governança
- `groups` — Grupos/empresas
- `user_global_roles` — Papel global (MOTHER)
- `user_group_roles` — Participação em grupos (ADMIN/USER) + permission_flags
- `user_active_session` — Sessão ativa do usuário

### 6.2 Cadastros
- `profiles` — Dados do usuário (id = auth.users.id), inclui `plano_id`, `plano_tipo`, `plano_inicio`, `plano_fim`, `origem_criacao`, `primeiro_acesso`, `ativo`, `last_login`
- `clientes` — PF/PJ com endereço e aniversário
- `cliente_familiares` — Familiares de clientes
- `fornecedores` — Fornecedores
- `fornecedor_contatos` — Contatos de fornecedores

### 6.3 Encomendas
- `encomendas` — Pedidos
- `encomenda_itens` — Itens dos pedidos
- `encomendas_tags` — Tags vinculadas
- `tags_encomendas` — Definição de tags

### 6.4 Precificação
- `receitas` — Fichas técnicas
- `receitas_ingredientes` — Ingredientes da receita
- `receitas_embalagens` — Embalagens da receita
- `receitas_despesas_venda` — Despesas de venda
- `receitas_imagens` — Imagens da receita
- `receitas_mao_obra` — Mão de obra da receita
- `ingredientes` — Ingredientes cadastrados
- `embalagens` — Embalagens cadastradas
- `tipos_insumos` — Tipos de ingredientes/embalagens
- `pre_preparos` — Pré-preparos (`tempo_preparo` em minutos, `tempo_preparo_unidade` = 'minutos' ou 'horas')
- `pre_preparos_ingredientes` — Ingredientes dos pré-preparos
- `pre_preparos_mao_obra` — Mão de obra dos pré-preparos
- `mao_obra_perfis` — Perfis de mão de obra
- `mao_obra_perfis_historico` — Histórico de alterações

### 6.5 Financeiro
- `contas_receber` — Títulos a receber
- `contas_receber_parcelas` — Parcelas
- `contas_receber_pagamentos` — Pagamentos
- `contas_receber_comprovantes` — Comprovantes
- `contas_pagar` — Títulos a pagar
- `contas_pagar_parcelas` — Parcelas
- `contas_pagar_pagamentos` — Pagamentos
- `contas_pagar_comprovantes` — Comprovantes
- `saldos_iniciais_bancos` — Saldos iniciais por período

### 6.6 Configuração
- `categorias` — Categorias de receitas
- `unidades_medida` — Unidades de medida
- `bancos` — Contas bancárias
- `tipos_documento` — Tipos de documentos
- `categorias_plano_contas` — Categorias do plano de contas
- `plano_contas` — Plano de contas
- `custos_fixos` — Custos fixos
- `configuracoes_juros` — Juros e multas
- `planos` — Planos do sistema (Caixa Lite, Caixa Business, Caixa Start)

### 6.7 Sistema
- `historico_planos` — Histórico de alterações de plano por usuário
- `backup_agendamentos` — Agendamentos de backup (diário/semanal)
- `backups` — Dados de backup exportados (JSONB)

### 6.8 Views
| View | Descrição |
|------|-----------|
| `vw_contas_receber_parcelas` | Parcelas com dados do título, cliente, banco |
| `vw_contas_receber_dashboard` | Resumo financeiro |
| `vw_resumo_financeiro` | Resumo de saldos bancários |

### 6.9 Legado
- `user_roles` — Tabela legada de roles (enum `app_role`: admin, moderator, user)
- `admin_logs` — Logs de ações administrativas
- `tags` — Tags genéricas (não usada para encomendas)

---

## 7. CONTEXTS E HOOKS

### Contexts
| Context | Responsabilidade |
|---------|-----------------|
| `AuthContext` | Login, logout, resetPassword (signUp removido da UI) |
| `GroupContext` | Grupos, papéis, permissões, sessão ativa, isMother |
| `GlobalLoadingContext` | Loading global com mascote |

### Hooks Principais
| Hook | Descrição |
|------|-----------|
| `useGroupFilter` | Filtro por grupo ativo (`addGroupFilter`, `getGroupInsertData`) |
| `usePlano` | Verificação de acesso por plano (`temAcesso`, `rotaBloqueada`) |
| `useIsAdmin` | Verifica role admin (legado) |
| `useUserId` | ID do usuário |
| `useUserProfile` | Perfil do usuário |
| `useClientes` | CRUD clientes |
| `useFornecedores` | CRUD fornecedores |
| `useReceitas` | Fichas técnicas |
| `useEncomendas` | CRUD encomendas |
| `useCalculosReceita` | Cálculos de precificação |
| `useMaoObraPerfis` | Perfis de mão de obra |
| `useMaoObraHistorico` | Histórico de alterações de mão de obra |
| `usePlanejamento` | Planejamento de produção |
| `useEncomendasHoje` | Encomendas do dia (Dashboard) |

---

## 8. COMPONENTES DE SEGURANÇA

### PermissionGuard
```tsx
<PermissionGuard permission="financeiro_edit">...</PermissionGuard>
<PermissionGuard requireAdmin>...</PermissionGuard>
<PermissionGuard requireMother>...</PermissionGuard>
```

### PlanoGuard
Redireciona para `/upgrade` se a rota não é permitida pelo plano do usuário. Admin ignora restrições.

### ProtectedRoute
Verifica autenticação. Redireciona para `/auth/login` se não autenticado.

### FirstAccessRedirect
- Se `ativo === false` → signOut + redirect login
- Se `primeiro_acesso === true` OU `nome_confeitaria` vazio → redirect para `/configuracoes/dados-confeitaria`

---

## 9. EDGE FUNCTIONS

| Função | Descrição | Autenticação |
|--------|-----------|--------------|
| `criar-usuario` | Provisionamento manual de usuários pelo admin | JWT de admin |
| `enviar-recuperacao-senha` | Gera link de recovery e envia via Resend | Pública (email no body) |
| `executar-backups-agendados` | Executa backups agendados dos usuários | pg_cron (anon key) |
| `hotmart-webhook` | Provisionamento automático via compra Hotmart | Validação `hottok` |

> 📄 Detalhes de auth em [DOCS_AUTENTICACAO.md](./DOCS_AUTENTICACAO.md)

---

## 10. SISTEMA DE PLANOS

| Plano | ID | Acesso | Periodicidade |
|-------|----|--------|---------------|
| Caixa Lite | `base` | Precificação, Encomendas, Clientes, Fornecedores, configs básicas | Anual (365 dias) |
| Caixa Business | `negocio` | Acesso total (`*`) | Mensal (30 dias) ou Anual (365 dias) |
| Caixa Start | `start` | Acesso total (`*`) — período curto de experimentação | 14 dias |

- Validação via `usePlano()` + `PlanoGuard`
- Enforcement server-side via `user_has_financial_access()` + 12 RLS RESTRICTIVE nas tabelas financeiras
- Admin ignora restrições
- Itens bloqueados na sidebar: 40% opacidade + ícone 🔒

---

## 11. SISTEMA DE BACKUP

- **Página:** `/configuracoes/backup`
- **Tabelas:** `backup_agendamentos` (configuração), `backups` (dados exportados em JSONB)
- **Cron:** `executar-backups-agendados` roda a cada 30 min via pg_cron
- **Frequências:** Diário ou Semanal (com dia e horário configuráveis)
- **Armazenamento:** Dados exportados como JSONB na tabela `backups` (planejado migrar para Storage bucket)

---

## 12. OTIMIZAÇÕES DE PERFORMANCE

### Semana 1 (Abril/2026)
- **Cron de backup:** Frequência reduzida de `*/5` para `*/30` (~83% menos invocações)
- **Dashboard realtime:** Debounce de 2,5s em 5 subscriptions `postgres_changes` para evitar cascata de reloads
- **Índices:** `idx_tipos_documento_usuario_id`, `idx_contas_receber_usuario_status`, `idx_encomendas_usuario_data_entrega`

---

## 13. DOCUMENTOS RELACIONADOS

| Documento | Escopo |
|-----------|--------|
| [DOCS_AUTENTICACAO.md](./DOCS_AUTENTICACAO.md) | Login, Magic Link, primeiro acesso, senhas, Hotmart webhook |
| [DOCS_GOVERNANCA.md](./DOCS_GOVERNANCA.md) | Grupos, roles, RLS, permission_flags |
| [DOCS_FINANCEIRO.md](./DOCS_FINANCEIRO.md) | Contas pagar/receber, DRE, fluxo caixa |
| [DOCS_PRECIFICACAO.md](./DOCS_PRECIFICACAO.md) | Ingredientes, embalagens, receitas, cálculos, mão de obra |
| [DOCS_ENCOMENDAS.md](./DOCS_ENCOMENDAS.md) | Pedidos, itens, tags, vinculação financeira |
| [docs/AUDITORIA.md](./docs/AUDITORIA.md) | Registro de auditorias e otimizações |
| [docs/PENDENCIAS_SEGURANCA.md](./docs/PENDENCIAS_SEGURANCA.md) | Pendências de segurança |
