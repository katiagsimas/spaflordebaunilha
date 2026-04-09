# 📘 DOCUMENTAÇÃO MESTRE — CAIXA DE AÇÚCAR

**Sistema de Gestão para Confeitarias — by Umbrella Doce**  
**Atualizada em:** Março 2026  
**Stack:** React 18 + TypeScript + Vite + Tailwind CSS + Lovable Cloud (Supabase)

---

## 1. VISÃO GERAL

### 1.1 O que é
Caixa de Açúcar é um sistema web de gestão completo para confeitarias. Permite controlar encomendas, precificar produtos com fichas técnicas, gerenciar financeiro (contas a pagar/receber, fluxo de caixa, DRE) e administrar clientes, fornecedores e usuários com isolamento multi-tenant por grupos.

### 1.2 Para quem
Confeiteiras, doceiras e pequenas empresas do ramo de confeitaria.

### 1.3 Ecossistema
O Caixa de Açúcar é um produto do ecossistema **Umbrella Doce**. A criação de usuários é feita exclusivamente pela Plataforma Umbrella Doce via Edge Functions. Não existe autocadastro público.

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
| Autenticação | Supabase Auth (Magic Link + email/senha) |
| Storage | Supabase Storage |
| Edge Functions | Deno (Supabase Edge Functions) |
| Gráficos | Recharts |
| Formulários | React Hook Form + Zod |
| PDF | jsPDF + jspdf-autotable |
| Planilhas | xlsx |
| Drag & Drop | @dnd-kit |

---

## 3. ESTRUTURA DE DIRETÓRIOS

```
src/
├── assets/              # Imagens e logos
├── components/
│   ├── ui/              # shadcn/ui
│   ├── admin/           # EditarUsuarioDialog
│   ├── auth/            # AlterarSenhaObrigatoria
│   ├── configuracoes/   # ConfiguracaoJuros, ConfiguracaoTagsEncomendas
│   └── financeiro/      # ContasReceberFormModal, DarBaixaDialog, DarBaixaPagarDialog
├── contexts/            # AuthContext, GroupContext, GlobalLoadingContext
├── hooks/               # Hooks customizados (useGroupFilter, usePlano, etc.)
├── integrations/        # Supabase client e types (auto-gerados, NÃO editar)
├── lib/                 # dateUtils, utils, validacaoSenha
├── pages/
│   ├── admin/           # Governanca, Logs, Usuarios
│   ├── auth/            # Login, ForgotPassword, SSO
│   ├── cadastros/       # Categorias, Clientes, Fornecedores, SeusDados, UnidadesMedida
│   ├── configuracoes/   # Bancos, PlanoContas, TiposDocumentos, etc.
│   ├── financeiro/      # ContasPagar/Receber, DRE, FluxoCaixa, Dashboard
│   └── precificacao/    # Ingredientes, Embalagens, PrePreparos
├── schemas/             # encomendaSchema, pagamentoSchema (Zod)
└── utils/               # gerarReciboPagamento, insightsGenerator

supabase/
├── config.toml          # Auto-gerado (NÃO editar)
├── migrations/          # Migrações SQL (read-only)
└── functions/
    ├── _shared/cors.ts
    ├── criar-usuario/
    └── validar-token-sso/
```

---

## 4. DESIGN SYSTEM

### 4.1 Paleta Umbrella Doce
| Token | Cor | HSL |
|-------|-----|-----|
| `--umbrella-preto` | #1C1C1C | `0 0% 11%` |
| `--umbrella-cloud` | #F5F4F1 | `40 11% 95%` |
| `--umbrella-pistache` | #BFCFB8 | `107 22% 76%` |
| `--umbrella-dourado` | #C6A85A | `42 47% 56%` |
| `--umbrella-coral` | #F28C82 | `5 82% 73%` |
| `--umbrella-pink` | #E7A1AF | `345 52% 77%` |

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

---

## 5. MAPA DE ROTAS

### 5.1 Autenticação (público)
| Rota | Descrição |
|------|-----------|
| `/auth/login` | Login com email/senha |
| `/auth/signup` | **Redireciona para `/auth/login`** (autocadastro desabilitado) |
| `/auth/forgot-password` | Recuperação de senha |
| `/auth/sso` | SSO via Umbrella Doce (Magic Link) |

### 5.2 Módulos Principais (protegidos)
| Rota | Página |
|------|--------|
| `/dashboard` | Painel com calendário, gráficos, aniversariantes |
| `/encomendas` | CRUD de encomendas |
| `/clientes` | Cadastro PF/PJ com familiares |
| `/fornecedores` | Cadastro com contatos |

### 5.3 Financeiro (requer Caixa Business ou Admin)
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
- `profiles` — Dados do usuário (id = auth.users.id)
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
- `pre_preparos` — Pré-preparos
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
- `planos` — Planos do sistema (Base, Negócio, Controle)

### 6.7 Views
| View | Descrição |
|------|-----------|
| `vw_contas_receber_parcelas` | Parcelas com dados do título, cliente, banco |
| `vw_contas_receber_dashboard` | Resumo financeiro |
| `vw_resumo_financeiro` | Resumo de saldos bancários |

### 6.8 Legado
- `user_roles` — Tabela legada de roles (enum `app_role`: admin, moderator, user)
- `admin_logs` — Logs de ações administrativas
- `tags` — Tags genéricas (não usada para encomendas)

---

## 7. CONTEXTS E HOOKS

### Contexts
| Context | Responsabilidade |
|---------|-----------------|
| `AuthContext` | Login, signUp (mantido mas não exposto em UI), logout, resetPassword |
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

| Função | Descrição |
|--------|-----------|
| `criar-usuario` | Provisionamento de usuários via Umbrella Doce (inviteUserByEmail) |
| `validar-token-sso` | Validação de JWT SSO e geração de Magic Link |

> 📄 Detalhes em [DOCS_AUTENTICACAO.md](./DOCS_AUTENTICACAO.md)

---

## 10. SISTEMA DE PLANOS

| Plano | ID | Acesso |
|-------|----|--------|
| Base | `base` | Precificação, Encomendas, Clientes, Fornecedores, configs básicas |
| Negócio | `negocio` | Acesso total (`*`) |
| Controle | `controle` | Em breve |

- Validação via `usePlano()` + `PlanoGuard`
- Admin ignora restrições
- Itens bloqueados na sidebar: 40% opacidade + ícone 🔒

---

## 11. DOCUMENTOS RELACIONADOS

| Documento | Escopo |
|-----------|--------|
| [DOCS_AUTENTICACAO.md](./DOCS_AUTENTICACAO.md) | Login, SSO, Magic Link, primeiro acesso, senhas |
| [DOCS_GOVERNANCA.md](./DOCS_GOVERNANCA.md) | Grupos, roles, RLS, permission_flags |
| [DOCS_FINANCEIRO.md](./DOCS_FINANCEIRO.md) | Contas pagar/receber, DRE, fluxo caixa |
| [DOCS_PRECIFICACAO.md](./DOCS_PRECIFICACAO.md) | Ingredientes, embalagens, receitas, cálculos |
| [DOCS_ENCOMENDAS.md](./DOCS_ENCOMENDAS.md) | Pedidos, itens, tags, vinculação financeira |
