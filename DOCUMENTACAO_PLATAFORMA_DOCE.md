# 🍰 DOCUMENTAÇÃO COMPLETA — PLATAFORMA DOCE

**Caixa de Açúcar — Sistema de Gestão para Confeitarias**  
**Versão:** Março 2026  
**Stack:** React 18 + TypeScript + Vite + Tailwind CSS + Lovable Cloud

---

## 1. VISÃO GERAL DA PLATAFORMA

### 1.1 O que é a Plataforma DOCE

A **Plataforma DOCE** é o ecossistema digital criado pela **Umbrella Doce** para gestão completa de confeitarias. O produto principal deste ecossistema é o **Caixa de Açúcar**, um sistema web SaaS (Software as a Service) que oferece:

- Gestão de encomendas com calendário visual
- Precificação técnica baseada em fichas de ingredientes, embalagens, mão de obra e pré-preparos
- Controle financeiro completo (contas a pagar/receber, fluxo de caixa, DRE)
- Cadastro de clientes e fornecedores com alertas de aniversário
- Arquitetura multi-tenant com governança central (MOTHER)

### 1.2 Relação entre Umbrella Doce e Caixa de Açúcar

| Conceito | Descrição |
|----------|-----------|
| **Umbrella Doce** | Marca-mãe / holding digital. É a plataforma-hub que centraliza todos os produtos e o acesso dos usuários |
| **Caixa de Açúcar** | Produto principal da Umbrella Doce. Sistema de gestão para confeitarias |
| **Plataforma DOCE** | Nome do ecossistema completo que engloba Umbrella Doce + Caixa de Açúcar + futuros produtos |

A hierarquia visual é sempre apresentada como:

```
Caixa de Açúcar
  by Umbrella Doce
```

### 1.3 Público-alvo

Confeiteiras, doceiras e pequenas empresas do ramo de confeitaria que precisam de controle profissional do negócio — desde o cálculo de custo de um brigadeiro até o DRE mensal.

---

## 2. IDENTIDADE VISUAL

### 2.1 Paleta de Cores Umbrella Doce

A identidade visual é definida centralmente em `src/index.css` com variáveis CSS HSL e espelhada no `tailwind.config.ts`:

| Nome | Hex | HSL | Uso principal |
|------|-----|-----|---------------|
| **Preto Umbrella** | `#1C1C1C` | `0 0% 11%` | Textos, fundo da tela de login, foreground principal |
| **Cloud** | `#F5F4F1` | `40 11% 95%` | Background geral do app, cards claros |
| **Pistache** | `#BFCFB8` | `107 22% 76%` | Sidebar, bordas, elementos secundários |
| **Dourado** | `#C6A85A` | `42 47% 56%` | Acentos premium, ícones ativos, badges, links de destaque |
| **Coral** | `#F28C82` | `5 82% 73%` | Alertas, estado destrutivo, página de upgrade |
| **Pink** | `#E7A1AF` | `345 52% 77%` | Badges de aniversário de fornecedores |

### 2.2 Tokens Semânticos (CSS Variables)

As cores nunca são usadas diretamente nos componentes. Todo o design é baseado em **tokens semânticos** definidos em `index.css`:

```css
:root {
  --background: 40 11% 95%;       /* Cloud */
  --foreground: 0 0% 11%;         /* Preto */
  --primary: 0 0% 11%;            /* Preto (botões, ações) */
  --primary-foreground: 40 11% 95%;
  --secondary: 107 22% 76%;       /* Pistache */
  --accent: 42 47% 56%;           /* Dourado */
  --destructive: 0 63% 58%;       /* Vermelho */
  --muted: 107 22% 76% / 0.3;     /* Pistache transparente */
  --success: 142 44% 47%;
  --warning: 45 89% 61%;
  --error: 0 63% 58%;
  --info: 241 58% 50%;
}
```

O tema **dark mode** é suportado com a classe `.dark` invertendo os tokens:

```css
.dark {
  --background: 0 0% 11%;         /* Preto vira fundo */
  --foreground: 40 11% 95%;       /* Cloud vira texto */
  --primary: 107 22% 76%;         /* Pistache vira primário */
  --accent: 42 47% 56%;           /* Dourado mantido */
}
```

### 2.3 Tipografia

Três famílias tipográficas são carregadas via Google Fonts:

| Família | Variável CSS | Classe Tailwind | Uso |
|---------|-------------|-----------------|-----|
| **Playfair Display** | `--font-display` | `font-display` | Títulos (h1, h2, h3), nome do produto |
| **Inter** | `--font-body` | `font-body` | Corpo de texto, labels, botões, tabelas |
| **Great Vibes** | — | `font-logo` | Assinatura cursiva (uso eventual em brand) |

**Regras tipográficas automáticas** (via `@layer base`):
- `h1`, `h2`, `h3` → `font-display` + `font-semibold` + `tracking-tight`
- `h4`, `h5`, `h6` → `font-body` + `font-semibold` + `tracking-tight`
- `body` → `font-body`

### 2.4 Sombras

Dois níveis de sombra customizadas:

| Token | Valor | Uso |
|-------|-------|-----|
| `--shadow-soft` | `0 1px 4px rgba(28,28,28,0.08)` | Cards, inputs |
| `--shadow-elevated` | `0 4px 12px rgba(28,28,28,0.12)` | Cards de login, popovers |

### 2.5 Animações

Definidas em `index.css` (`@layer components`) e `tailwind.config.ts`:

| Classe | Efeito | Duração |
|--------|--------|---------|
| `animate-fade-in` | Opacidade 0→1 | 0.3s |
| `animate-fade-in-up` | Opacidade + translate Y | 0.4s |
| `animate-slide-in-left` | Opacidade + translate X | 0.4s |
| `animate-spin-slow` | Rotação contínua (loading) | 1.8s cubic-bezier |
| `animate-pulse-slow` | Pulso suave | 3s |
| `stagger-1` a `stagger-4` | Delays escalonados | 0.1s–0.4s |

### 2.6 Raio de Borda (Border Radius)

```css
--radius: 0.375rem;  /* ~6px */
```

- `rounded-lg` → `var(--radius)` (6px)
- `rounded-md` → `calc(var(--radius) - 2px)` (4px)
- `rounded-sm` → `calc(var(--radius) - 4px)` (2px)
- Cards de login usam `rounded-2xl` para sensação premium

### 2.7 Assets da Marca

Todos os assets visuais ficam em `src/assets/`:

| Arquivo | Uso |
|---------|-----|
| `umbrella-logo-dourado.png` | **Ícone de loading** (mascote rotativo), loading inicial do HTML |
| `caixa-acucar-icon.png` | Ícone na tela de login |
| `caixa-acucar-sidebar-icon.png` | Ícone no header da sidebar |
| `caixa-acucar-logo.png` | Logo completo (uso em documentos) |
| `auth-brand-image.png` | Imagem de marca no lado esquerdo da tela de login |
| `auth-background.png` | Background da tela de forgot password |
| `donnas-box-logo.png` / `donnas-logo.png` | Logos parceiros |

---

## 3. IDENTIDADE VISUAL APLICADA

### 3.1 Tela de Login (`/auth/login`)

A tela de login é a **porta de entrada visual** da plataforma:

**Layout:** Split-screen (desktop)
- **Lado esquerdo (50%):** Imagem de marca (`auth-brand-image.png`) em tela cheia
- **Lado direito (50%):** Formulário de login sobre fundo `umbrella-preto` (#1C1C1C)

**Elementos visuais:**
- Logo `caixa-acucar-icon.png` + título "Caixa de Açúcar" em `font-display`
- Subtítulo "by Umbrella Doce" em dourado (`text-umbrella-dourado`) com `italic`
- Card de login em `bg-umbrella-cloud` com `rounded-2xl` e `shadow-elevated`
- Título "Bem-vinda de volta" em `font-display`
- Padrão sutil de pontos em overlay (`radial-gradient`)
- Rodapé: "Sistema de gestão para confeitarias" em `text-umbrella-cloud/40`

**Funcionalidade:**
- Campos: Email + Senha (com toggle de visibilidade)
- Link: "Esqueci minha senha" em dourado
- Botão: "Entrar" (primary)
- Sem opção de cadastro público (registro controlado pelo admin)
- Validação com Zod

### 3.2 Sidebar (`AppSidebar`)

A sidebar é o **elemento de navegação principal** do sistema:

**Header:**
```
[ícone] CAIXA DE AÇÚCAR    (font-body, uppercase, tracking-wide)
         by Umbrella Doce   (font-body, 11px, text-umbrella-cloud)
```

**Visual:**
- Background: `sidebar-background` (Pistache `107 22% 76%`)
- Borda direita: `sidebar-border` (Dourado com opacidade)
- Ícones ativos: `text-umbrella-dourado`
- Items ativos: `bg-sidebar-accent`
- Separador dourado: `bg-umbrella-dourado/30`
- Labels de seção: `10px uppercase tracking-widest`

**Seções do menu:**
1. **Menu Principal:** Dashboard, Encomendas, Clientes, Fornecedores, Financeiro, Precificação, Configurações
2. **Governança** (apenas MOTHER): Grupos e Usuários — com badge coroa dourada
3. **Sistema** (apenas Admin): Usuários, Logs de Ações

**Footer:**
- Nome da confeitaria ou nome completo
- Email do usuário
- Badges: role (Admin/Usuário) + MOTHER (coroa dourada)
- Botão "Sair": `bg-umbrella-cloud` com borda dourada
- Seletor de Grupo (quando multi-tenant)

**Indicadores de aniversário:**
- 🎂 Clientes: Bolinha `bg-umbrella-pistache` com ícone de bolo + `animate-bounce`
- 🎂 Fornecedores: Bolinha `bg-umbrella-pink` com ícone de bolo + `animate-bounce`

**Bloqueio por plano:**
- Itens bloqueados: `opacity-40` + ícone `Lock` + redirecionamento para `/upgrade`
- Badge "Em breve": `bg-umbrella-dourado/25`

### 3.3 Loading Padronizado (`LoadingMascote`)

O componente `LoadingMascote` é usado **em toda a plataforma** como indicador de carregamento:

**Visual:** Logo dourado da Umbrella (`umbrella-logo-dourado.png`) girando com `animate-spin-slow`

**Locais de uso:**
| Contexto | Label |
|----------|-------|
| Loading inicial (HTML pré-React) | "Carregando Caixa de Açúcar..." |
| Autenticando (ProtectedRoute) | "Autenticando..." |
| SSO vindo da Umbrella Doce | "Preparando seu acesso..." |
| Loading global overlay | "Carregando..." (ou label custom) |
| Listas de contatos/familiares | "Carregando contatos..." / "Carregando familiares..." |
| Formulários financeiros | "Carregando dados..." |
| Fluxo de caixa diário | "Carregando fluxo de caixa..." |
| Dados da confeitaria | "Carregando seus dados..." |
| Seletor de grupo | Logo giratório sem label |

### 3.4 Dashboard

- Cards com `shadow-soft` e `rounded-lg`
- Cores semânticas para indicadores: `success` (positivo), `destructive` (negativo), `warning` (alerta)
- Gráficos via Recharts usando cores da paleta
- Calendário de encomendas com marcação visual por dia

### 3.5 Página de Upgrade (`/upgrade`)

- Ícone grande: `Lock` em `text-umbrella-coral` sobre fundo `bg-umbrella-coral/15`
- Título em `font-display`
- Badge com plano atual
- Botão WhatsApp: `bg-umbrella-coral`
- Animação de entrada: `animate-fade-in-up`

---

## 4. ARQUITETURA DA PLATAFORMA

### 4.1 Stack Tecnológico

| Camada | Tecnologia |
|--------|-----------|
| Frontend | React 18 + TypeScript + Vite |
| Estilização | Tailwind CSS + shadcn/ui |
| Estado servidor | TanStack React Query v5 |
| Roteamento | React Router DOM v6 |
| Backend | Lovable Cloud (PostgreSQL + Auth + Storage + Edge Functions) |
| Gráficos | Recharts |
| Formulários | React Hook Form + Zod |
| PDF | jsPDF + jspdf-autotable |
| Planilhas | xlsx |
| Drag & Drop | @dnd-kit |

### 4.2 Estrutura de Rotas

#### Rotas Públicas (Autenticação)
| Rota | Componente | Descrição |
|------|-----------|-----------|
| `/auth/login` | `Login` | Tela de login com email/senha |
| `/auth/signup` | `Navigate → /auth/login` | Redirecionamento (cadastro desabilitado) |
| `/auth/sso` | `SSOPage` | Entrada via Single Sign-On da Umbrella Doce |
| `/auth/forgot-password` | `ForgotPassword` | Recuperação de senha |

#### Rotas Protegidas (Requerem autenticação)
| Módulo | Rota | Componente |
|--------|------|-----------|
| Dashboard | `/dashboard` | `Dashboard` (com PlanoGuard) |
| Encomendas | `/encomendas` | `Encomendas` |
| Clientes | `/clientes` | `Clientes` |
| Fornecedores | `/fornecedores` | `Fornecedores` |
| Financeiro | `/financeiro/*` | 10 sub-rotas (com PlanoGuard) |
| Precificação | `/precificacao/*` | 7 sub-rotas |
| Configurações | `/configuracoes/*` | 12 sub-rotas |
| Admin | `/admin/*` | Usuários, Logs, Governança |
| Upgrade | `/upgrade` | Página de bloqueio por plano |

### 4.3 Hierarquia de Proteção

Toda rota protegida passa por três camadas:

```
ProtectedRoute → Layout → PlanoGuard → Componente
```

1. **ProtectedRoute**: Verifica se há sessão autenticada
2. **Layout**: Renderiza sidebar + header + FirstAccessRedirect
3. **PlanoGuard**: Verifica se o plano do usuário permite acessar a rota
4. **FirstAccessRedirect**: Redireciona para dados da confeitaria se primeiro acesso

---

## 5. INTEGRAÇÃO COM UMBRELLA DOCE (SSO)

### 5.1 Fluxo de Acesso via SSO

A Umbrella Doce é a plataforma-hub que gerencia o acesso dos usuários. Quando um usuário clica em "Acessar Caixa de Açúcar" na Umbrella Doce, o seguinte fluxo ocorre:

```
Umbrella Doce → Gera JWT → Redireciona para /auth/sso?token=xxx
                                    ↓
                           SSOPage (React)
                                    ↓
                    Edge Function: validar-token-sso
                                    ↓
                         Valida JWT (HMAC-SHA256)
                                    ↓
                     Gera Magic Link (Supabase Auth)
                                    ↓
                  Redireciona → Magic Link → /dashboard
```

### 5.2 Token JWT

**Formato do token:**
```json
{
  "email": "confeiteira@email.com",
  "produto": "caixa",
  "iat": 1709912345,
  "exp": 1709912645
}
```

**Regras:**
- Algoritmo: **HMAC-SHA256**
- Secret: Variável `SSO_SECRET` (compartilhada entre Umbrella Doce e Caixa de Açúcar)
- Expiração: **5 minutos**
- Campo `produto` deve ser `"caixa"` — rejeita tokens de outros produtos

### 5.3 Edge Function `validar-token-sso`

Localização: `supabase/functions/validar-token-sso/index.ts`

**Fluxo interno:**
1. Recebe `{ token }` no body
2. Importa secret `SSO_SECRET` e cria chave HMAC
3. Valida e decodifica o JWT usando `djwt`
4. Verifica `payload.produto === 'caixa'`
5. Usa `supabaseAdmin.auth.admin.generateLink({ type: 'magiclink', email })` para gerar link de autenticação
6. Retorna `{ redirect_url }` com o magic link

**Respostas:**
| Status | Situação |
|--------|----------|
| 200 | Token válido, retorna `redirect_url` |
| 400 | Token ausente |
| 401 | Token inválido ou expirado |
| 403 | Token não autorizado para este produto |
| 500 | Erro ao gerar magic link ou erro interno |

### 5.4 Componente SSO (`/auth/sso`)

Localização: `src/pages/auth/SSO.tsx`

**Comportamento:**
1. Lê `?token=xxx` da URL
2. Mostra `LoadingMascote` com "Preparando seu acesso..."
3. Invoca `validar-token-sso` via `supabase.functions.invoke`
4. Se sucesso: `window.location.href = data.redirect_url` (Magic Link autentica automaticamente)
5. Se erro: Exibe tela com ⚠️ "Link expirado ou inválido" + link para voltar à Umbrella Doce

---

## 6. CRIAÇÃO E GESTÃO DE USUÁRIOS

### 6.1 Modelo de Registro

O Caixa de Açúcar **NÃO possui cadastro público**. A rota `/auth/signup` redireciona para `/auth/login`. Usuários são criados exclusivamente por:

1. **Administradores** via painel `/admin/usuarios`
2. **Provisionamento externo** via Edge Function `criar-usuario`

### 6.2 Edge Function `criar-usuario`

Localização: `supabase/functions/criar-usuario/index.ts`

**Payload de entrada:**
```json
{
  "email": "novo@email.com",
  "senha": "123456",
  "nomeCompleto": "Maria Silva",
  "nomeConfeitaria": "Doces da Maria",
  "role": "user"
}
```

**Lógica de decisão:**

| Cenário | Ação |
|---------|------|
| Usuário não existe | Cria no Auth + Perfil com `primeiro_acesso: true` |
| Existe no Auth + Perfil ativo | Rejeita: "email já em uso" |
| Existe no Auth + Perfil inativo | **Reativa**: atualiza perfil, reseta senha, marca `primeiro_acesso: true` |
| Existe no Auth sem Perfil | Cria perfil e atualiza senha |

**Após criação:**
- Se `role !== 'user'`, insere na tabela `user_roles`
- Retorna `{ success: true, user: { id }, reactivated: boolean }`

### 6.3 Primeiro Acesso

Quando um usuário faz login pela primeira vez (ou com senha `123456`):

1. **Login** → Detecta `primeiro_acesso: true` ou senha `123456`
2. **AlterarSenhaObrigatoria** → Dialog modal que força troca de senha
3. **FirstAccessRedirect** → Após troca, redireciona para `/configuracoes/dados-confeitaria`
4. Usuário preenche nome da confeitaria e dados básicos
5. A partir daí, acessa o dashboard normalmente

### 6.4 Controle de Acesso

**Verificação de usuário ativo:**
- No login: consulta `profiles.ativo` — se `false`, faz logout imediato
- No app: `FirstAccessRedirect` verifica `ativo === false` e faz signOut

**Roles:**
- Tabela separada `user_roles` (nunca no profiles)
- Tipos: `admin`, `moderator`, `user`
- Verificação via `useIsAdmin()` hook

**Planos:**
- Tabela `planos` com IDs: `base`, `negocio`, `controle`
- Hook `usePlano()` → `temAcesso(rota)` / `rotaBloqueada(rota)`
- `PlanoGuard` protege rotas no nível de componente
- Admin tem acesso total independente do plano

### 6.5 Governança Multi-Tenant

**Conceitos:**
- **Groups**: Entidades organizacionais (confeitarias/empresas)
- **MOTHER**: Papel especial com visão de governança global
- **Group Admin**: Administrador de um grupo específico

**Componentes:**
- `GroupContext`: Gerencia grupo ativo, role, modo de sessão
- `GroupSelector`: Dropdown na sidebar para trocar entre grupos
- `PermissionGuard`: Protege ações por permissão dentro do grupo

---

## 7. MÓDULOS DO SISTEMA

### 7.1 Dashboard (`/dashboard`)

Painel estratégico com:
- **Calendário tríplice** (mês anterior, atual, seguinte) com encomendas por dia
- **Alertas financeiros**: Contas atrasadas a receber/pagar
- **Visão econômica**: Receitas, custos, lucro (mensal e anual com gráfico de linhas)
- **Top 5 produtos** mais vendidos
- **Ticket médio** mensal e anual
- **Resumo financeiro**: Saldo atual, contas a receber/pagar em aberto
- **Realtime updates** via Supabase channels

### 7.2 Encomendas (`/encomendas`)

- Criação/edição de pedidos com cliente, produtos, valores
- Status: pendente, confirmada, em produção, pronta, entregue, cancelada
- Tags customizáveis por grupo
- Vinculação automática com contas a receber
- Campos de topo de bolo (aniversariante, tema, idade, imagens)
- Descontos (% e R$), taxa de entrega, outros custos

### 7.3 Precificação (`/precificacao`)

- **Ingredientes**: Cadastro com preço, marca, unidade
- **Embalagens**: Cadastro com preço por unidade
- **Pré-Preparos**: Fichas técnicas intermediárias (ex: ganache)
- **Fichas Técnicas**: Receitas completas com cálculo automático de custo
- **Mão de obra**: Perfis com valor/hora e histórico de alterações

### 7.4 Financeiro (`/financeiro`)

- **Dashboard Financeiro**: Visão geral de saldos e movimentações
- **Contas a Receber**: Parcelas, baixas, comprovantes, estornos
- **Contas a Pagar**: Parcelas, baixas, comprovantes, estornos
- **Fluxo de Caixa**: Diário e mensal
- **DRE**: Demonstrativo de Resultado por período
- **Bancos**: Cadastro de contas bancárias com saldo inicial

### 7.5 Cadastros

- **Clientes**: PF/PJ, endereço (com busca CEP via ViaCEP), familiares, aniversários
- **Fornecedores**: Contatos, aniversários, observações
- **Dados da Confeitaria**: Nome, logo (upload via Storage)

### 7.6 Configurações

- Cadastros base (categorias, unidades de medida)
- Precificação (tipos de insumos, mão de obra)
- Financeiro (plano de contas, tipos de documentos, bancos, juros)
- Tags de encomendas

### 7.7 Admin

- **Usuários**: Criação, edição, ativação/desativação, troca de plano
- **Logs de Ações**: Auditoria de ações administrativas
- **Governança**: Gestão de grupos e membros (acesso MOTHER)

---

## 8. INFRAESTRUTURA

### 8.1 Variáveis de Ambiente (Frontend)

| Variável | Descrição |
|----------|-----------|
| `VITE_SUPABASE_URL` | URL do projeto Lovable Cloud |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Chave anônima (publishable) |
| `VITE_SUPABASE_PROJECT_ID` | ID do projeto |

### 8.2 Secrets (Edge Functions)

| Secret | Uso |
|--------|-----|
| `SUPABASE_URL` | URL interna (auto-configurado) |
| `SUPABASE_SERVICE_ROLE_KEY` | Chave admin (auto-configurado) |
| `SSO_SECRET` | Secret compartilhado para validação de tokens JWT SSO |
| `SITE_URL` | URL do site para redirect do magic link |

### 8.3 Tabelas Principais do Banco

| Tabela | Descrição |
|--------|-----------|
| `profiles` | Dados do usuário (nome, confeitaria, plano, ativo, primeiro_acesso) |
| `user_roles` | Roles separadas (admin, moderator, user) |
| `planos` | Definição de planos (base, negocio, controle) |
| `groups` | Grupos/organizações |
| `encomendas` | Pedidos de encomendas |
| `encomenda_itens` | Itens de cada encomenda |
| `clientes` | Cadastro de clientes |
| `fornecedores` | Cadastro de fornecedores |
| `ingredientes` | Ingredientes para precificação |
| `embalagens` | Embalagens para precificação |
| `pre_preparos` | Pré-preparos (fichas intermediárias) |
| `contas_receber` / `contas_pagar` | Lançamentos financeiros |
| `contas_receber_parcelas` / `contas_pagar_parcelas` | Parcelas |
| `contas_receber_pagamentos` / `contas_pagar_pagamentos` | Baixas |
| `bancos` | Contas bancárias |
| `plano_contas` | Plano de contas contábil |
| `categorias_plano_contas` | Categorias do plano de contas |
| `tipos_documento` | Tipos de documentos financeiros |
| `configuracoes_juros` | Configuração de juros e multas |
| `tags_encomendas` | Tags customizáveis para encomendas |
| `admin_logs` | Log de ações administrativas |

### 8.4 Edge Functions

| Função | Descrição |
|--------|-----------|
| `validar-token-sso` | Valida JWT SSO e gera magic link |
| `criar-usuario` | Cria/reativa usuários via admin |
| `migrate-logos-to-storage` | Migração de logos para Storage (utilitário) |

### 8.5 URLs da Plataforma

| Ambiente | URL |
|----------|-----|
| Preview | `https://id-preview--4ab8e7e7-c223-46f5-926a-ab78109a36aa.lovable.app` |
| Produção | `https://caixadeacucar.lovable.app` |
| Umbrella Doce (Hub) | `https://umbrelladoce.lovable.app` |

---

## 9. FLUXO COMPLETO DO USUÁRIO

### 9.1 Primeiro Acesso (via Admin)

```
Admin cria usuário (email + senha 123456)
    ↓
Usuário recebe credenciais
    ↓
Login em /auth/login
    ↓
Detecta primeiro_acesso=true ou senha=123456
    ↓
Modal: AlterarSenhaObrigatoria
    ↓
Troca senha → profiles.primeiro_acesso=false
    ↓
FirstAccessRedirect → /configuracoes/dados-confeitaria
    ↓
Preenche nome da confeitaria
    ↓
Acessa /dashboard normalmente
```

### 9.2 Acesso via Umbrella Doce (SSO)

```
Usuário na Umbrella Doce → clica "Acessar Caixa de Açúcar"
    ↓
Umbrella gera JWT (email + produto=caixa + exp=5min)
    ↓
Redireciona: caixadeacucar.lovable.app/auth/sso?token=xxx
    ↓
SSOPage → LoadingMascote "Preparando seu acesso..."
    ↓
Edge Function validar-token-sso
    ↓
Gera Magic Link → redirect automático
    ↓
Sessão criada → /dashboard
```

### 9.3 Acesso Direto (Login)

```
Usuário acessa /auth/login
    ↓
Insere email + senha
    ↓
Valida credenciais (Supabase Auth)
    ↓
Verifica profiles.ativo (se false → signOut)
    ↓
Verifica primeiro_acesso (se true → AlterarSenha)
    ↓
Atualiza last_login
    ↓
Navega para /dashboard
```

---

## 10. CONSIDERAÇÕES DE SEGURANÇA

| Medida | Implementação |
|--------|---------------|
| Cadastro público desabilitado | `/auth/signup` redireciona para login |
| Roles separadas | Tabela `user_roles` (nunca no profiles) |
| RLS (Row Level Security) | Policies por `usuario_id` e `owner_group_id` |
| Primeiro acesso forçado | Troca de senha obrigatória para senha `123456` |
| Usuários inativos | Verificação dupla: no login + no app (FirstAccessRedirect) |
| SSO seguro | JWT com HMAC-SHA256, expiração 5min, validação de produto |
| Service Role Key | Apenas em Edge Functions (server-side) |
| Validação de entrada | Zod schemas no frontend + validação no backend |
| Auditoria | Tabela `admin_logs` com ações administrativas |

---

## 11. GLOSSÁRIO

| Termo | Significado |
|-------|------------|
| **Umbrella Doce** | Marca-mãe / plataforma-hub |
| **Caixa de Açúcar** | Sistema de gestão (produto principal) |
| **Plataforma DOCE** | Ecossistema completo |
| **MOTHER** | Papel de governança máxima no sistema multi-tenant |
| **SSO** | Single Sign-On — login único entre plataformas |
| **Magic Link** | Link de autenticação automática gerado pelo backend |
| **PlanoGuard** | Componente que bloqueia rotas por plano do usuário |
| **FirstAccessRedirect** | Componente que redireciona no primeiro acesso |
| **LoadingMascote** | Componente padronizado de loading (logo dourado girando) |
| **Group** | Entidade organizacional (confeitaria/empresa) no multi-tenant |
| **Edge Function** | Função serverless executada no backend |

---

**Documentação gerada em:** Março 2026  
**Autor:** Sistema Caixa de Açúcar — Plataforma DOCE  
**Versão:** 1.0
