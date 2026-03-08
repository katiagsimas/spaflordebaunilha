# 📦 Caixa de Açúcar — Documentação Completa

> **Sistema de gestão para confeitarias** — parte do ecossistema **Umbrella Doce by Ká Simas**
>
> Última atualização: 08/03/2026

---

## Sumário

1. [Visão Geral](#1-visão-geral)
2. [Ecossistema Umbrella Doce](#2-ecossistema-umbrella-doce)
3. [Identidade Visual & Design System](#3-identidade-visual--design-system)
4. [Stack Tecnológica](#4-stack-tecnológica)
5. [Autenticação & Acesso](#5-autenticação--acesso)
6. [SSO — Single Sign-On](#6-sso--single-sign-on)
7. [Criação & Gestão de Usuários](#7-criação--gestão-de-usuários)
8. [Governança Multi-Tenancy](#8-governança-multi-tenancy)
9. [Sistema de Planos](#9-sistema-de-planos)
10. [Módulos do Sistema](#10-módulos-do-sistema)
11. [Estrutura de Rotas](#11-estrutura-de-rotas)
12. [Segurança](#12-segurança)
13. [Banco de Dados](#13-banco-de-dados)
14. [Edge Functions](#14-edge-functions)
15. [Fluxo de Cancelamento e Expiração de Plano](#15-fluxo-de-cancelamento-e-expiração-de-plano) ← NOVA
16. [Sincronização de Planos entre Umbrella Doce e Caixa de Açúcar](#16-sincronização-de-planos-entre-umbrella-doce-e-caixa-de-açúcar) ← NOVA
17. [Glossário](#17-glossário) ← NOVA
18. [Status Técnico e Pendências](#18-status-técnico-e-pendências) ← NOVA

---

## 1. Visão Geral

O **Caixa de Açúcar** é um sistema SaaS de gestão completa para confeitarias, desenvolvido como um dos produtos da plataforma **Umbrella Doce**. Ele oferece funcionalidades de precificação, encomendas, financeiro, cadastros e planejamento, tudo integrado em uma experiência visual premium.

**URL de Produção:** `https://caixa.umbrelladoce.com.br`

### Principais Funcionalidades

| Módulo | Descrição |
|---|---|
| **Dashboard** | Calendário de encomendas, métricas de faturamento, alertas de aniversariantes |
| **Encomendas** | Gestão completa de pedidos, status, itens, tags, topos de bolo |
| **Precificação** | Fichas técnicas (receitas), ingredientes, embalagens, pré-preparos, mão de obra |
| **Financeiro** | Contas a receber/pagar, fluxo de caixa (diário/mensal), DRE, bancos |
| **Clientes** | Cadastro, familiares, aniversariantes, segmentação automática |
| **Fornecedores** | Cadastro, contatos, aniversariantes |
| **Configurações** | Tipos de insumos, unidades de medida, plano de contas, juros, tags |
| **Admin** | Gestão de usuários, logs de auditoria, governança de grupos |

---

## 2. Ecossistema Umbrella Doce

O Caixa de Açúcar não opera isoladamente. Ele faz parte do ecossistema **Umbrella Doce**, uma plataforma central que gerencia múltiplos produtos para o segmento de confeitaria.

### Relação com a Plataforma

```
┌──────────────────────────────────────────────────────────┐
│              Umbrella Doce (Hub Central)                  │
│             umbrelladoce.lovable.app                      │
│                                                          │
│  ┌──────────────┐  ┌───────────────┐  ┌───────────────┐  │
│  │ Caixa        │  │ Planejamento  │  │ Sprints       │  │
│  │ de Açúcar    │  │ DOCE          │  │ Sazonais      │  │
│  │              │  │               │  │               │  │
│  │ caixa.       │  │ doce.         │  │ (em breve)    │  │
│  │ umbrella     │  │ umbrella      │  │               │  │
│  │ doce.com.br  │  │ doce.com.br   │  │               │  │
│  └──────┬───────┘  └───────────────┘  └───────────────┘  │
└─────────┼────────────────────────────────────────────────┘
          │
          │ SSO (JWT Token)
          ▼
    caixa.umbrelladoce.com.br
```

> *"O Calendário Estratégico está previsto como quarto produto do ecossistema, sem URL definida. Construção iniciada apenas quando MRR > R$ 1.500/mês constante."*

- **Umbrella Doce** é o ponto de entrada e gerencia o provisionamento de contas
- **Caixa de Açúcar** recebe usuários via SSO (login automático) ou login direto com email/senha
- A criação de novos usuários é feita **exclusivamente** pela plataforma Umbrella Doce
- O Caixa de Açúcar **não possui tela de cadastro** — a rota `/auth/signup` redireciona para `/auth/login`

---

## 3. Identidade Visual & Design System

### Paleta de Cores — Umbrella Doce

| Token | Cor | Hex | HSL | Uso Principal |
|---|---|---|---|---|
| `--umbrella-preto` | Preto Elegante | `#1C1C1C` | `0 0% 11%` | Textos, backgrounds escuros, primary |
| `--umbrella-cloud` | Cloud Dancer | `#F5F4F1` | `40 11% 95%` | Background principal da aplicação |
| `--umbrella-pistache` | Pistache Premium | `#BFCFB8` | `107 22% 76%` | Sidebar, secondary, borders, badges, botões |
| `--umbrella-dourado` | Dourado | `#C6A85A` | `42 47% 56%` | Accent, destaques, links, sidebar active |
| `--umbrella-coral` | Coral Doce | `#F28C82` | `5 82% 73%` | Alertas, mês anterior no calendário |
| `--umbrella-pink` | Pink Rosé | `#E7A1AF` | `345 52% 77%` | Próximo mês no calendário |

### Mapeamento Semântico (CSS Tokens)

```css
:root {
  --background: 40 11% 95%;       /* Cloud Dancer */
  --foreground: 0 0% 11%;         /* Preto Elegante */
  --primary: 0 0% 11%;            /* Preto Elegante */
  --secondary: 107 22% 76%;       /* Pistache Premium */
  --accent: 42 47% 56%;           /* Dourado */
  --border: 107 22% 76%;          /* Pistache */
  --sidebar-background: 107 22% 76%; /* Pistache */
  --sidebar-primary: 42 47% 56%;  /* Dourado */
}
```

### Tipografia

| Fonte | Uso | Classe Tailwind |
|---|---|---|
| **Playfair Display** | Títulos, headings, branding | `font-display` |
| **Inter** | Corpo, labels, botões, textos funcionais | `font-body` |
| **Great Vibes** | Logo cursivo (quando aplicável) | `font-logo` |

### Regras Visuais Específicas

- **Sidebar**: Background Pistache Premium com ícone lateral `caixa-acucar-sidebar-icon.png`
- **Botões e Badges**: Usam Pistache como cor principal (substituindo Coral na maior parte da UI)
- **Calendário do Dashboard**: Segue lógica de cores por período:
  - Mês Anterior → Coral (`#F28C82`)
  - Mês Vigente → Pistache (`#BFCFB8`)
  - Próximo Mês → Pink Rosé (`#E7A1AF`)
- **Tela de Login**: Layout split-screen — imagem de marca à esquerda, formulário à direita sobre fundo Preto Elegante com gradiente radial sutil
- **Mascote**: Usado em telas de loading (`LoadingMascote`) com animação de spin suave

### Dark Mode

O sistema possui suporte completo a dark mode, invertendo os tokens semânticos:

```css
.dark {
  --background: 0 0% 11%;         /* Preto Elegante */
  --foreground: 40 11% 95%;       /* Cloud Dancer */
  --primary: 107 22% 76%;         /* Pistache */
  --secondary: 42 47% 56%;        /* Dourado */
}
```

---

## 4. Stack Tecnológica

| Camada | Tecnologia |
|---|---|
| **Frontend** | React 18 + TypeScript + Vite |
| **Estilização** | Tailwind CSS + shadcn/ui + CSS Tokens HSL |
| **Roteamento** | React Router DOM v6 |
| **Estado Servidor** | TanStack React Query v5 |
| **Backend** | Lovable Cloud (Supabase) |
| **Autenticação** | Supabase Auth (email/senha + magic link SSO) |
| **Banco de Dados** | PostgreSQL (via Supabase) |
| **Edge Functions** | Deno (Supabase Edge Functions) |
| **Validação** | Zod v4 + React Hook Form |
| **Gráficos** | Recharts |
| **PDFs** | jsPDF + jspdf-autotable |
| **Planilhas** | xlsx |
| **Animações** | CSS animations (pulse, spin, accordion) |

---

## 5. Autenticação & Acesso

### Fluxo de Login Direto (Email/Senha)

```
Usuário → /auth/login → Insere email + senha
                       → signInWithPassword()
                       → Verifica se perfil está ativo
                       → Verifica primeiro_acesso
                       → Se primeiro acesso: Modal obrigatório de criação de senha
                       → Caso contrário: Redireciona para /dashboard
```

### Componentes Envolvidos

| Componente | Responsabilidade |
|---|---|
| `AuthContext` | Provider global de autenticação (signIn, signUp, signOut, resetPassword) |
| `Login.tsx` | Tela de login com validação Zod |
| `AlterarSenhaObrigatoria` | Modal que força criação de senha forte no primeiro acesso |
| `FirstAccessRedirect` | Componente invisível que redireciona para dados da confeitaria se perfil incompleto |
| `ProtectedRoute` | Wrapper que redireciona para `/auth/login` se não autenticado |
| `ForgotPassword` | Tela de recuperação de senha via email |

### Política de Senhas

Validada pelo módulo `src/lib/validacaoSenha.ts`:

1. Mínimo de 6 caracteres
2. Pelo menos 1 letra maiúscula (A–Z)
3. Pelo menos 1 letra minúscula (a–z)
4. Pelo menos 1 número (0–9)
5. Pelo menos 1 símbolo especial: `@ # $ % & * _ - + ! ?`
6. **Proibido** conter partes do nome, email ou os termos: `caixa`, `acucar`, `kasimas`
7. Sem prazo de expiração

### Primeiro Acesso

O fluxo de primeiro acesso foi reformulado para eliminar senhas temporárias. O processo correto é:

1. **Umbrella Doce** cria a usuária via painel admin ou webhook Hotmart
2. Sistema chama `inviteUserByEmail()` → **Magic Link** enviado por e-mail
3. Confeiteira clica no link → autenticação automática (sem senha temporária)
4. Sistema detecta `profile.primeiro_acesso === true`
5. Modal obrigatório (`AlterarSenhaObrigatoria`) exige criação de senha forte
6. Após definir senha: `primeiro_acesso = false`
7. Redirecionamento para `/configuracoes/dados-confeitaria` para completar perfil
8. `FirstAccessRedirect` garante esse redirecionamento em todas as páginas até conclusão

---

## 6. SSO — Single Sign-On

### Visão Geral

O SSO permite que usuários da **Umbrella Doce** acessem o Caixa de Açúcar sem precisar informar credenciais novamente. O fluxo é baseado em **JWT + Magic Link (OTP)**.

### Fluxo Técnico Completo

```
1. Umbrella Doce gera JWT com payload:
   { email, nome_completo, produto: "caixa", iat, exp: iat + 300 }
   → Assinado com HMAC-SHA256 usando SSO_SECRET compartilhado

2. Usuário é redirecionado para:
   https://caixa.umbrelladoce.com.br/auth/sso?token=<JWT>

3. SSO.tsx extrai o token da URL e chama Edge Function:
   → supabase.functions.invoke('validar-token-sso', { body: { token } })

4. Edge Function 'validar-token-sso':
   a. Valida assinatura JWT com SSO_SECRET
   b. Verifica que payload.produto === 'caixa'
   c. Gera magic link via supabaseAdmin.auth.admin.generateLink()
   d. Retorna o hashed_token (token_hash)

5. SSO.tsx recebe o token_hash e autentica no cliente:
   → supabase.auth.verifyOtp({ token_hash, type: 'magiclink' })

6. Sessão criada com sucesso → navigate('/dashboard')
```

### Payload do JWT

```json
{
  "email": "string",
  "nome_completo": "string",
  "produto": "caixa",
  "iat": "timestamp",
  "exp": "iat + 300 (5 minutos)"
}
```

> *"O campo `nome_completo` pode ser utilizado pelo Caixa de Açúcar para pré-preencher o perfil da confeiteira no primeiro acesso via SSO."*

### Diagrama

```
┌──────────────┐     JWT Token     ┌──────────────────┐
│  Umbrella    │ ─────────────────▶│  /auth/sso       │
│  Doce        │                   │  (SSO.tsx)       │
└──────────────┘                   └────────┬─────────┘
                                            │
                                   invoke('validar-token-sso')
                                            │
                                   ┌────────▼─────────┐
                                   │  Edge Function   │
                                   │  validar-token-  │
                                   │  sso             │
                                   │                  │
                                   │  1. Valida JWT   │
                                   │  2. Gera magic   │
                                   │     link hash    │
                                   └────────┬─────────┘
                                            │
                                   token_hash retornado
                                            │
                                   ┌────────▼─────────┐
                                   │  SSO.tsx          │
                                   │  verifyOtp()      │
                                   │  → Sessão criada  │
                                   │  → /dashboard     │
                                   └──────────────────┘
```

### Segurança do SSO

- Token JWT expira em **5 minutos**
- Assinatura HMAC-SHA256 com segredo compartilhado (`SSO_SECRET`)
- Validação de campo `produto === 'caixa'` impede uso cruzado entre produtos
- Magic link é single-use (token_hash consumido pelo `verifyOtp`)
- Nenhuma credencial trafega pela URL — apenas o token JWT

### Tela de Erro SSO

Se o token for inválido, expirado ou ausente, o usuário vê uma tela de erro com link para retornar à Umbrella Doce.

---

## 7. Criação & Gestão de Usuários

### Princípio Fundamental

> **A criação de novos usuários é feita exclusivamente pela plataforma Umbrella Doce.**

O Caixa de Açúcar **não possui tela de autocadastro**. A rota `/auth/signup` redireciona automaticamente para `/auth/login`.

### Fluxo de Provisionamento

```
Umbrella Doce → Edge Function 'criar-usuario' → Supabase Auth + profiles
```

### Edge Function `criar-usuario`

Localizada em `supabase/functions/criar-usuario/index.ts`, esta função:

1. **Verifica autorização**: Valida que o chamador possui role `admin` na tabela `user_roles`
2. **Verifica existência**: Checa se o email já existe no Auth e/ou na tabela `profiles`
3. **Cenários**:
   - **Usuário novo**: Cria no Auth + profile é criado automaticamente via trigger
   - **Inativo existente**: Reativa o perfil, atualiza senha e dados
   - **Auth sem profile**: Cria o profile para o usuário existente
   - **Ativo existente**: Retorna erro
4. **Roles**: Atribui role se diferente de `user` (ex: `admin`, `moderator`)

### Gestão no Painel Admin

O painel administrativo (`/admin/usuarios`) permite:

- Visualizar todos os usuários
- Editar perfis (nome, confeitaria, plano)
- Ativar/desativar contas
- Visualizar logs de auditoria (`/admin/logs`)
- Gerenciar governança de grupos (`/admin/governanca`)

### Tabela `profiles`

Campos principais:
- `id` (UUID, referência ao auth.users)
- `email`
- `nome_completo`
- `nome_confeitaria`
- `plano_id` (referência ao plano ativo)
- `ativo` (boolean)
- `primeiro_acesso` (boolean)
- `last_login` (timestamp)

---

## 8. Governança Multi-Tenancy

### Arquitetura

O sistema implementa isolamento total de dados por grupo via `owner_group_id` em todas as tabelas de dados operacionais.

### Hierarquia de Papéis

```
┌─────────────────────────────────────────┐
│              MOTHER                      │
│  Administração global do sistema        │
│  Pode alternar entre modo sistema/grupo │
└─────────────────┬───────────────────────┘
                  │
      ┌───────────┴───────────┐
      ▼                       ▼
┌──────────┐            ┌──────────┐
│  ADMIN   │            │  USER    │
│ (Grupo)  │            │ (Grupo)  │
│          │            │          │
│ Acesso   │            │ Acesso   │
│ total ao │            │ por      │
│ grupo    │            │ permissão│
└──────────┘            └──────────┘
```

### Papéis

| Papel | Escopo | Capacidades |
|---|---|---|
| **MOTHER** | Global | Administra todo o sistema, alterna entre modo sistema e grupo, gerencia grupos |
| **ADMIN** (Grupo) | Grupo específico | Acesso total dentro do grupo, gerencia membros |
| **USER** (Grupo) | Grupo específico | Acesso controlado por `permission_flags` |

### Permission Flags

O JSON `permission_flags` na tabela `user_group_roles` controla permissões granulares:

```typescript
interface PermissionFlags {
  financeiro_view: boolean;
  financeiro_edit: boolean;
  metas_view: boolean;
  metas_edit: boolean;
  tarefas_view: boolean;
  tarefas_edit: boolean;
  cadastros_view: boolean;
  cadastros_edit: boolean;
  receitas_view: boolean;
  receitas_edit: boolean;
  encomendas_view: boolean;
  encomendas_edit: boolean;
  precificacao_view: boolean;
  precificacao_edit: boolean;
  admin_users_manage: boolean;
}
```

### Tabelas de Governança

| Tabela | Função |
|---|---|
| `groups` | Grupos (tenants) |
| `user_group_roles` | Vínculo usuário ↔ grupo + role + permissões |
| `user_global_roles` | Papel global (MOTHER) |
| `user_active_session` | Grupo/modo ativo do usuário |
| `user_roles` | Roles legadas (admin/moderator/user) para compatibilidade |

### Sessão de Grupo

O `GroupContext` gerencia:
- Qual grupo está ativo (`activeGroupId`)
- Modo de sessão (`system` ou `group`)
- O `GroupSelector` na sidebar permite trocar entre grupos
- O `useGroupFilter` hook adiciona filtro `owner_group_id` em todas as queries

### Componente `PermissionGuard`

Protege conteúdo baseado em:
- `permission` — verifica flag específica
- `requireAdmin` — exige role ADMIN no grupo
- `requireMother` — exige role MOTHER global

---

## 9. Sistema de Planos

### Planos Disponíveis

| Plano | ID | Acesso |
|---|---|---|
| **Base** | `base` | Precificação, Encomendas, Clientes, Fornecedores, Configurações básicas |
| **Negócio** | `negocio` | Acesso total (`*`) — inclui Financeiro completo |
| **Controle** | `controle` | Em breve (sem módulos definidos) |

### Precificação Oficial

| Plano | Mensal | Anual | Equiv. mensal (anual) |
|---|---|---|---|
| **Base** | R$ 57/mês | R$ 477/ano | R$ 39,75/mês |
| **Negócio** | R$ 97/mês | R$ 797/ano | R$ 66,40/mês |
| **Controle** | A definir | A definir | — |

> *"Anual equivale a 10 meses (desconto de ~17%). O Plano Negócio Anual inclui Planejamento DOCE (Plano Start) como bônus. O Plano Base Anual inclui Trial de 30 dias do Planejamento DOCE."*

### Implementação

- **`usePlano`** hook: Busca o plano do usuário em `profiles.plano_id` → `planos`
- **`PlanoGuard`** componente: Wrapper de rota que redireciona para `/upgrade` se sem acesso
- **Sidebar**: Itens bloqueados ficam com 40% de opacidade + ícone de cadeado 🔒
- **Admins** (role `admin` em `user_roles`): Ignoram todas as restrições de plano

### Módulos por Plano

**Plano Base** permite:
- `/precificacao` (e sub-rotas)
- `/encomendas`
- `/clientes`
- `/fornecedores`
- `/configuracoes/cadastros-base`
- `/configuracoes/categorias-receitas`
- `/configuracoes/unidades-medida`
- `/configuracoes/tipos-insumos`
- `/configuracoes/precificacao`
- `/configuracoes/precificacao/mao-de-obra`
- `/configuracoes/dados-confeitaria`
- `/configuracoes/tags-encomendas`

**Plano Negócio** permite:
- Tudo acima + Financeiro completo (dashboard, contas a receber/pagar, fluxo de caixa, DRE, bancos, plano de contas, etc.)

### Tela de Upgrade (`/upgrade`)

Exibe mensagem de módulo bloqueado com CTA para WhatsApp da consultora (Ká Simas).

---

## 10. Módulos do Sistema

### 10.1 Dashboard

- Calendário mensal de encomendas com navegação entre meses
- Cards de métricas: faturamento, previsão, quantidade de vendas
- Alertas de aniversariantes (clientes, familiares, contatos de fornecedores)
- Gráfico de evolução de faturamento

### 10.2 Encomendas

- CRUD completo de encomendas
- Itens vinculados a receitas (fichas técnicas)
- Status: pendente, confirmado, em produção, entregue, pago, cancelado
- Tags customizáveis por encomenda
- Topo de bolo (aniversariante, tema, imagens)
- Pagamentos parciais com JSON
- Desconto (percentual ou valor)
- Taxa de entrega e outros custos
- Integração com Contas a Receber

### 10.3 Precificação

**Ingredientes**: Cadastro com preço, marca, tipo de insumo, categoria
**Embalagens**: Cadastro com preço, marca, tipo de insumo
**Pré-Preparos**: Receitas intermediárias com ingredientes, rendimento, custo calculado automaticamente
**Fichas Técnicas (Receitas)**: Ingredientes + embalagens + mão de obra + custos fixos → preço de venda
**Mão de Obra**: Perfis com valor/hora, histórico de alterações

### 10.4 Financeiro (Plano Negócio)

- **Dashboard Financeiro**: Resumo com totais, gráficos
- **Contas a Receber**: Parcelas, pagamentos, comprovantes, estorno
- **Contas a Pagar**: Parcelas, pagamentos, comprovantes
- **Fluxo de Caixa**: Diário e mensal
- **DRE**: Demonstrativo de resultado baseado no plano de contas
- **Bancos**: Oficiais (pré-cadastrados) + customizados
- **Plano de Contas**: Categorias e contas estruturadas (código hierárquico)
- **Tipos de Documento**: Para classificação de pagamentos
- **Configuração de Juros**: Taxa diária, multa por atraso

### 10.5 Cadastros

- **Clientes**: Dados pessoais, endereço (via CEP), familiares, segmentação automática (novo, eventual, VIP, inativo)
- **Fornecedores**: Dados, contatos com aniversário
- **Categorias de Receitas**: Padrão do sistema + customizáveis
- **Unidades de Medida**: Padrão + customizáveis
- **Tipos de Insumos**: Ingredientes, embalagens, outros

### 10.6 Configurações

- Dados da Confeitaria (perfil)
- Cadastros Base (categorias, unidades, tipos)
- Precificação (mão de obra, insumos)
- Financeiro (bancos, plano de contas, juros, tipos de documento)
- Tags de Encomendas

### 10.7 Admin

- **Usuários** (`/admin/usuarios`): Gestão de perfis, ativação, planos
- **Logs** (`/admin/logs`): Auditoria de ações administrativas
- **Governança** (`/admin/governanca`): Grupos, membros, permissões

---

## 11. Estrutura de Rotas

### Rotas Públicas (sem autenticação)

| Rota | Componente | Descrição |
|---|---|---|
| `/auth/login` | `Login` | Tela de login |
| `/auth/sso` | `SSOPage` | Autenticação via SSO da Umbrella Doce |
| `/auth/forgot-password` | `ForgotPassword` | Recuperação de senha |
| `/auth/signup` | Redirect → `/auth/login` | Desabilitado — redireciona |

### Rotas Protegidas (autenticação obrigatória)

| Rota | Módulo | Plano Guard |
|---|---|---|
| `/dashboard` | Dashboard | ✅ |
| `/encomendas` | Encomendas | ❌ |
| `/clientes` | Clientes | ❌ |
| `/fornecedores` | Fornecedores | ❌ |
| `/precificacao` | Precificação | ❌ |
| `/precificacao/ficha-tecnica` | Receitas | ❌ |
| `/precificacao/ingredientes` | Ingredientes | ❌ |
| `/precificacao/embalagens` | Embalagens | ❌ |
| `/precificacao/pre-preparos` | Pré-Preparos | ❌ |
| `/financeiro` | Financeiro Hub | ✅ |
| `/financeiro/dashboard` | Dashboard Financeiro | ✅ |
| `/financeiro/contas-receber` | Contas a Receber | ✅ |
| `/financeiro/contas-pagar` | Contas a Pagar | ✅ |
| `/financeiro/fluxo-caixa` | Fluxo de Caixa | ✅ |
| `/financeiro/dre` | DRE | ✅ |
| `/configuracoes` | Hub de Configurações | ❌ (sempre acessível) |
| `/configuracoes/financeiro` | Config. Financeiro | ✅ |
| `/admin/usuarios` | Gestão de Usuários | ❌ (verificação interna de admin) |
| `/admin/logs` | Logs de Auditoria | ❌ |
| `/admin/governanca` | Governança | ❌ |
| `/upgrade` | Tela de Upgrade | ❌ |

> *"❌ na coluna Plano Guard indica que o componente PlanoGuard não é aplicado nessa rota porque o módulo é acessível a qualquer usuário autenticado com plano ativo (Base ou superior). A proteção de autenticação via ProtectedRoute continua ativa em todas as rotas protegidas."*

---

## 12. Segurança

### Camadas de Proteção

| Camada | Implementação |
|---|---|
| **Autenticação** | Supabase Auth com sessão JWT |
| **RLS (Row Level Security)** | Ativo em todas as tabelas — usuários só acessam dados do seu grupo |
| **Roles** | Tabela separada `user_roles` (nunca no profile) |
| **Admin Verification** | Edge Functions verificam role admin server-side |
| **Password Policy** | Validação forte no cliente (maiúscula, minúscula, número, símbolo, blocklist) |
| **Primeiro Acesso** | Força criação de senha forte via Magic Link (sem senha temporária) |
| **Usuário Inativo** | Verificado no login e no `FirstAccessRedirect` — faz logout automático |
| **CORS** | Headers configurados nas Edge Functions |
| **Security Definer** | Funções de banco com `SECURITY DEFINER` + `SET search_path = 'public'` |
| **Security Invoker Views** | Views com `WITH (security_invoker = true)` respeitam RLS |
| **SSO** | JWT com HMAC-SHA256, expiração de 5min, validação de produto |

### Funções de Segurança no Banco

| Função | Descrição |
|---|---|
| `has_role(user_id, role)` | Verifica se usuário tem role (SECURITY DEFINER) |
| `is_admin(user_id)` | Verifica se é admin |
| `is_mother(user_id)` | Verifica se é MOTHER |
| `is_group_admin(user_id, group_id)` | Verifica se é admin do grupo |
| `has_permission(user_id, group_id, permission)` | Verifica permission_flag |
| `user_belongs_to_group(user_id, group_id)` | Verifica vínculo com grupo |
| `validate_admin_token(token)` | Valida tokens de acesso admin |

---

## 13. Banco de Dados

### Tabelas Principais

| Categoria | Tabelas |
|---|---|
| **Auth & Perfis** | `profiles`, `user_roles`, `user_global_roles`, `user_group_roles`, `user_active_session`, `groups` |
| **Encomendas** | `encomendas`, `encomenda_itens`, `encomendas_tags`, `tags_encomendas` |
| **Precificação** | `ingredientes`, `embalagens`, `pre_preparos`, `pre_preparos_ingredientes`, `receitas`, `receitas_ingredientes`, `receitas_embalagens`, `tipos_insumos`, `unidades_medida`, `categorias` |
| **Financeiro** | `contas_receber`, `contas_receber_parcelas`, `contas_receber_pagamentos`, `contas_receber_comprovantes`, `contas_pagar`, `contas_pagar_parcelas`, `contas_pagar_pagamentos`, `contas_pagar_comprovantes`, `bancos`, `plano_contas`, `categorias_plano_contas`, `tipos_documento`, `configuracoes_juros` |
| **Cadastros** | `clientes`, `cliente_familiares`, `fornecedores`, `fornecedor_contatos` |
| **Sistema** | `planos`, `custos_fixos`, `mao_obra_perfis`, `mao_obra_perfis_historico`, `admin_logs` |

> *"Tabela `admin_audit_log` descontinuada. Substituída por `admin_logs` a partir de Março 2026."*

### Triggers Automáticos

| Trigger | Ação |
|---|---|
| `handle_new_user_role` | Adiciona role `user` para todo novo usuário |
| `trigger_criar_categorias_padrao` | Cria categorias de receitas padrão |
| `trigger_criar_bancos_oficiais` | Cria bancos brasileiros oficiais |
| `trigger_criar_banco_caixa_novo_usuario` | Cria banco "Caixa Empresa" |
| `trigger_recalcular_custo` | Recalcula custo do pré-preparo |
| `trigger_atualizar_status_parcela` | Atualiza status de parcelas (pago, atrasado, adiantado) |
| `atualizar_segmento_cliente` | Atualiza segmentação do cliente (VIP, inativo, etc.) |

---

## 14. Edge Functions

### `validar-token-sso`

- **Propósito**: Validar JWT do SSO e retornar token_hash para autenticação
- **Entrada**: `{ token: string }`
- **Saída**: `{ token_hash: string }`
- **Segredos**: `SSO_SECRET`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `SITE_URL`

### `criar-usuario`

- **Propósito**: Criar ou reativar usuários (chamada pela Umbrella Doce)
- **Entrada**: `{ email, senha, nomeCompleto, nomeConfeitaria, role }`
- **Saída**: `{ success: boolean, user: { id }, reactivated: boolean }`
- **Segurança**: Verifica role `admin` do chamador server-side
- **Segredos**: `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`

> *"Funções de migração utilitárias (ex: migrate-logos-to-storage) estão documentadas separadamente no log de migrações do projeto."*

---

## 15. Fluxo de Cancelamento e Expiração de Plano

### Origem do cancelamento

O cancelamento de acesso ao Caixa de Açúcar é sempre originado pela Umbrella Doce, via dois caminhos:

1. **Cancelamento manual pelo admin** — Admin desativa a conta ou remove o plano via painel da Umbrella Doce
2. **Cancelamento automático via Hotmart** — Evento `PURCHASE_CANCELLED` ou `SUBSCRIPTION_CANCELLATION` recebido pelo webhook `hotmart-webhook` da Umbrella Doce

### O que acontece na Umbrella Doce

- Campo `profile.plano_caixa` é setado para `null`
- Ação registrada em `admin_logs` com ação `hotmart_cancelou_plano` ou `desativou_usuario`

### O que acontece no Caixa de Açúcar

- `usePlano` hook detecta `profiles.plano_id = null` ou plano sem módulos permitidos
- `PlanoGuard` redireciona para `/upgrade` em qualquer rota bloqueada pelo plano
- Sidebar exibe itens bloqueados com opacidade 40% e ícone de cadeado 🔒
- Dados da confeiteira são preservados — nenhuma informação é deletada no cancelamento

### Tela `/upgrade`

Exibe mensagem de módulo bloqueado com CTA direto para o WhatsApp de suporte (Ká Simas). Permite que a confeiteira continue navegando nas rotas do seu plano anterior que ainda sejam compatíveis com o Plano Base (se rebaixada) ou acesse apenas login/perfil (se conta totalmente revogada).

### Período de graça

[⚠️ A DEFINIR — documentar aqui se há ou não período de graça após cancelamento, e qual o comportamento esperado nesse intervalo.]

---

## 16. Sincronização de Planos entre Umbrella Doce e Caixa de Açúcar

### Arquitetura de dados separados

A Umbrella Doce e o Caixa de Açúcar possuem bancos Supabase independentes. Cada sistema mantém seu próprio registro de plano do usuário:

| Sistema | Tabela | Campo |
|---|---|---|
| Umbrella Doce | `profiles` | `plano_caixa` (ex: `"base"`, `"negocio"`, `null`) |
| Caixa de Açúcar | `profiles` | `plano_id` (FK → tabela `planos`) |

### Como a sincronização ocorre

A sincronização é feita pela edge function `criar-usuario` do Caixa de Açúcar, chamada pela Umbrella Doce nos seguintes momentos:

| Evento | Ação na Umbrella Doce | Ação no Caixa de Açúcar |
|---|---|---|
| Nova compra (usuário novo) | Cria perfil + define `plano_caixa` | `criar-usuario` cria conta + atribui plano |
| Nova compra (usuário existente) | Atualiza `plano_caixa` | `criar-usuario` atualiza `plano_id` |
| Cancelamento | Seta `plano_caixa = null` | [⚠️ A DEFINIR — edge function de revogação?] |
| Upgrade de plano | Atualiza `plano_caixa` | [⚠️ A DEFINIR — mesmo fluxo de criar-usuario?] |

### Estado atual e pendências

- ✅ Provisionamento inicial (criação de conta) está implementado
- ⚠️ Fluxo de cancelamento/revogação no Caixa precisa ser validado e documentado
- ⚠️ Fluxo de upgrade de plano (Base → Negócio) precisa ser validado e documentado

---

## 17. Glossário

| Termo | Definição |
|---|---|
| **CMV** | Custo da Mercadoria Vendida — soma dos custos diretos de produção de um produto |
| **Ficha Técnica** | Receita com todos os ingredientes, embalagens, mão de obra e custos calculados que gera o preço de venda |
| **Pré-preparo** | Receita intermediária (ex: ganache, massa) que entra como ingrediente em fichas técnicas |
| **Encomenda** | Pedido de um cliente — equivalente a "ordem de serviço" no contexto do Caixa |
| **Topo de Bolo** | Personalização visual de um produto encomendado (aniversariante, tema, imagem) |
| **Plano Guard** | Componente React que bloqueia acesso a rotas não incluídas no plano ativo do usuário |
| **MOTHER** | Role global de administração total do sistema — acima de ADMIN e USER |
| **Multi-tenancy** | Arquitetura onde múltiplos usuários (grupos) compartilham a mesma aplicação com dados isolados |
| **owner_group_id** | Chave de isolamento — todas as tabelas de dados operacionais filtram registros por este campo |
| **SSO** | Single Sign-On — autenticação automática no Caixa via token JWT gerado pela Umbrella Doce |
| **Magic Link** | Link de autenticação enviado por e-mail que autentica o usuário sem precisar de senha |
| **DRE** | Demonstrativo do Resultado do Exercício — relatório financeiro de receitas, custos e lucro |
| **Fluxo de Caixa** | Registro cronológico de todas as entradas e saídas financeiras |
| **Plano Base** | Plano de entrada — inclui Precificação, Encomendas, Clientes e Fornecedores |
| **Plano Negócio** | Plano completo — inclui tudo do Base + módulo Financeiro (DRE, Fluxo de Caixa, Contas) |
| **Trial** | Período de teste gratuito (30 dias) do Planejamento DOCE, incluído como bônus no Plano Base |
| **Hotmart** | Plataforma de pagamento usada para processar assinaturas do ecossistema Umbrella Doce |
| **Webhook** | Notificação automática enviada pela Hotmart para a Umbrella Doce quando ocorre uma compra ou cancelamento |

---

## 18. Status Técnico e Pendências

> Esta seção documenta o estado real do sistema em Março de 2026.
> Uma documentação confiável distingue o que está em produção estável
> do que ainda está em construção ou pendente de decisão.

### ✅ Em produção estável

- Autenticação via Magic Link (primeiro acesso via convite)
- SSO entre Umbrella Doce e Caixa de Açúcar (JWT HMAC-SHA256)
- Módulos: Precificação, Encomendas, Clientes, Fornecedores, Configurações
- Módulo Financeiro completo (Plano Negócio)
- Governança multi-tenant (MOTHER / ADMIN / USER)
- Sistema de planos com PlanoGuard por rota
- Integração com Hotmart (criação de usuário via webhook)
- Logs de auditoria (admin_logs)

### ⚠️ Em construção ou pendente de validação

- **Plano Controle** — módulo de estoque não implementado; plano sem módulos definidos
- **Fluxo de cancelamento no Caixa** — comportamento quando Umbrella Doce revoga plano não validado end-to-end
- **Fluxo de upgrade de plano** — Base → Negócio precisa ser validado e documentado
- **Período de graça pós-cancelamento** — decisão de produto pendente

### 🔴 Decisões de produto abertas

- Definir se há período de graça após cancelamento de plano e qual o comportamento
- Definir fluxo de downgrade (Negócio → Base): dados do módulo financeiro ficam visíveis? São bloqueados? São exportados?
- Definir edge function de revogação de acesso no Caixa (espelho do `criar-usuario` para cancelamento)

---

> **Caixa de Açúcar** — Sistema de gestão para confeitarias
> Parte do ecossistema **Umbrella Doce by Ká Simas**
> Desenvolvido com ❤️ usando Lovable Cloud
