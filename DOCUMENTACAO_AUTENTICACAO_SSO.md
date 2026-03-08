# 📘 DOCUMENTAÇÃO: Autenticação, Criação de Usuários e Integração com Plataforma DOCE

> **Última atualização:** Março de 2026  
> **Versão:** 2.0  
> **Sistema:** Caixa de Açúcar — by Umbrella Doce

---

## Índice

1. [Visão Geral do Ecossistema](#1-visão-geral-do-ecossistema)
2. [Modelo de Autenticação](#2-modelo-de-autenticação)
3. [Fluxo de Login](#3-fluxo-de-login)
4. [Criação de Usuários (Provisionamento Externo)](#4-criação-de-usuários-provisionamento-externo)
5. [SSO — Single Sign-On com Plataforma DOCE](#5-sso--single-sign-on-com-plataforma-doce)
6. [Primeiro Acesso e Troca Obrigatória de Senha](#6-primeiro-acesso-e-troca-obrigatória-de-senha)
7. [Recuperação de Senha](#7-recuperação-de-senha)
8. [Política de Senhas](#8-política-de-senhas)
9. [Controle de Acesso e Permissões (Roles)](#9-controle-de-acesso-e-permissões-roles)
10. [Sistema de Planos](#10-sistema-de-planos)
11. [Gerenciamento de Usuários (Painel Admin)](#11-gerenciamento-de-usuários-painel-admin)
12. [Reativação de Usuários Inativos](#12-reativação-de-usuários-inativos)
13. [Desativação e Bloqueio de Usuários](#13-desativação-e-bloqueio-de-usuários)
14. [Migração de Usuários entre Plataformas](#14-migração-de-usuários-entre-plataformas)
15. [Triggers e Automações no Banco](#15-triggers-e-automações-no-banco)
16. [Tabelas Envolvidas](#16-tabelas-envolvidas)
17. [Edge Functions](#17-edge-functions)
18. [Variáveis de Ambiente (Secrets)](#18-variáveis-de-ambiente-secrets)
19. [Rotas de Autenticação](#19-rotas-de-autenticação)
20. [Arquivos de Referência](#20-arquivos-de-referência)
21. [Diagrama Completo de Fluxos](#21-diagrama-completo-de-fluxos)
22. [Segurança](#22-segurança)
23. [FAQ Técnico](#23-faq-técnico)

---

## 1. Visão Geral do Ecossistema

O **Caixa de Açúcar** é um dos produtos do ecossistema **Umbrella Doce**, uma plataforma de gestão para confeitarias. A arquitetura de autenticação reflete essa integração:

```
┌─────────────────────────────────────────────────────────────┐
│                     UMBRELLA DOCE                           │
│                (Plataforma Mãe / Hub)                       │
│              app.umbrelladoce.com.br                        │
│                                                             │
│  ┌──────────────────┐  ┌──────────────────┐                │
│  │  Gestão de       │  │  Gestão de       │                │
│  │  Assinaturas     │  │  Usuários        │                │
│  └────────┬─────────┘  └────────┬─────────┘                │
│           │                     │                           │
│           │    Token JWT SSO    │    Edge Function           │
│           │    (5 min TTL)      │    criar-usuario           │
│           └──────────┬──────────┘                           │
│                      │                                      │
└──────────────────────┼──────────────────────────────────────┘
                       │
                       ▼
┌──────────────────────────────────────────────────────────────┐
│                    CAIXA DE AÇÚCAR                            │
│                 (Produto / Aplicação)                         │
│               caixadeacucar.lovable.app                      │
│                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ /auth/login  │  │ /auth/sso    │  │ /dashboard   │      │
│  │ Login manual │  │ SSO auto     │  │ App principal │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│                                                              │
│  Backend: Lovable Cloud (Supabase)                           │
└──────────────────────────────────────────────────────────────┘
```

### Princípios Fundamentais

1. **Sem autocadastro**: Não existe tela de registro público. A rota `/auth/signup` redireciona para `/auth/login`.
2. **Provisionamento externo**: Novos usuários são criados exclusivamente pela Plataforma Umbrella Doce via Edge Functions.
3. **SSO transparente**: Usuários autenticados na Umbrella Doce acessam o Caixa de Açúcar sem novo login.
4. **Login independente**: Usuários também podem acessar diretamente via email/senha em `/auth/login`.

---

## 2. Modelo de Autenticação

### 2.1 Provedor

- **Tecnologia:** Lovable Cloud (Supabase Auth)
- **Método primário:** Email + Senha
- **Método SSO:** Magic Link via token JWT
- **Persistência:** LocalStorage com auto-refresh de tokens

### 2.2 Contexto de Autenticação

O estado de autenticação é gerenciado pelo `AuthContext` (`src/contexts/AuthContext.tsx`):

```typescript
interface AuthContextType {
  user: User | null;       // Usuário autenticado
  session: Session | null; // Sessão ativa
  loading: boolean;        // Estado de carregamento
  signIn: (email, password) => Promise<void>;
  signUp: (email, password, nome, confeitaria) => Promise<void>; // Mantido mas não exposto em UI
  signOut: () => Promise<void>;
  resetPassword: (email) => Promise<void>;
}
```

### 2.3 Proteção de Rotas

Todas as rotas do sistema (exceto `/auth/*`) são envolvidas por `ProtectedRoute`, que:
1. Verifica se existe um `user` autenticado
2. Se `loading`, exibe tela com mascote animado
3. Se não autenticado, redireciona para `/auth/login`

---

## 3. Fluxo de Login

### 3.1 Rota: `/auth/login`
**Componente:** `src/pages/auth/Login.tsx`

### 3.2 Campos do Formulário

| Campo | Validação |
|-------|-----------|
| Email | Formato email válido, máx. 255 caracteres |
| Senha | Mínimo 6, máximo 100 caracteres |

### 3.3 Fluxo Técnico

```
Usuário acessa /auth/login
  ↓
Preenche email e senha
  ↓
Validação Zod (loginSchema)
  ↓
supabase.auth.signInWithPassword()
  ↓
Verifica profiles.ativo === false?
  ├── SIM → signOut() + erro "Conta desabilitada"
  └── NÃO → continua
  ↓
Atualiza profiles.last_login
  ↓
Verifica profiles.primeiro_acesso === true OU senha === '123456'?
  ├── SIM → Exibe modal AlterarSenhaObrigatoria
  └── NÃO → navigate('/dashboard')
```

### 3.4 Tratamento de Erros

| Erro | Mensagem exibida |
|------|-----------------|
| `Invalid login credentials` | "Email ou senha incorretos." |
| `Email not confirmed` | "Por favor, confirme seu email antes de fazer login." |
| Conta desabilitada | "Sua conta foi desabilitada. Entre em contato com o administrador." |
| Outros | "Erro ao fazer login. Tente novamente." |

### 3.5 Identidade Visual

A tela de login utiliza o design system Umbrella Doce:
- Fundo escuro (`bg-umbrella-preto`)
- Lado esquerdo: imagem de marca (`auth-brand-image.png`)
- Lado direito: formulário com card claro (`bg-umbrella-cloud`)
- Tipografia: `font-display` (títulos) e `font-body` (textos)
- Destaque dourado (`text-umbrella-dourado`) para "by Umbrella Doce"

---

## 4. Criação de Usuários (Provisionamento Externo)

### 4.1 Modelo Atual

A criação de novos usuários é realizada **exclusivamente de forma externa** pela Plataforma Umbrella Doce. Não existe formulário de autocadastro nem botão de criação manual no painel administrativo do Caixa de Açúcar.

### 4.2 Edge Function: `criar-usuario`

**Caminho:** `supabase/functions/criar-usuario/index.ts`  
**Invocação:** Pela Plataforma Umbrella Doce via HTTP POST  
**Autenticação:** Usa `SUPABASE_SERVICE_ROLE_KEY` (acesso admin completo)

### 4.3 Payload de Entrada

```json
{
  "email": "confeiteira@email.com",
  "senha": "123456",
  "nomeCompleto": "Maria da Silva",
  "nomeConfeitaria": "Doces da Maria",
  "role": "user"
}
```

### 4.4 Fluxo de Execução

```
Umbrella Doce envia POST para criar-usuario
  ↓
Verificação: Usuário existe no Auth? (listUsers)
Verificação: Perfil existe em profiles?
  ↓
  ├── CASO 1: Usuário totalmente novo
  │   ├── supabaseAdmin.auth.admin.createUser()
  │   │   (email_confirm: true → sem verificação de email)
  │   └── Perfil criado automaticamente via trigger
  │
  ├── CASO 2: Existe no Auth mas sem perfil
  │   ├── Cria perfil manualmente (INSERT profiles)
  │   └── Atualiza senha para a enviada
  │
  └── CASO 3: Existe e está inativo (reativação)
      ├── Atualiza: ativo=true, primeiro_acesso=true
      ├── Atualiza nome e confeitaria
      └── Reseta senha para a enviada
  ↓
Se role !== 'user': insere em user_roles
  ↓
Retorna { success: true, user: { id }, reactivated: bool }
```

### 4.5 Resposta

**Sucesso (200):**
```json
{
  "success": true,
  "user": { "id": "uuid-do-usuario" },
  "reactivated": false
}
```

**Erro (400/500):**
```json
{
  "success": false,
  "error": "Mensagem de erro"
}
```

---

## 5. SSO — Single Sign-On com Plataforma DOCE

### 5.1 Visão Geral

O SSO permite que um usuário autenticado na Plataforma Umbrella Doce acesse o Caixa de Açúcar automaticamente, sem precisar inserir credenciais novamente.

### 5.2 Fluxo Completo

```
1. Usuário está logado na Umbrella Doce (app.umbrelladoce.com.br)
   ↓
2. Clica em "Abrir Caixa de Açúcar"
   ↓
3. Umbrella Doce gera JWT com:
   {
     "email": "user@email.com",
     "produto": "caixa",
     "iat": timestamp,
     "exp": timestamp + 5min
   }
   Assinado com SSO_SECRET (HMAC-SHA256)
   ↓
4. Redireciona para:
   https://caixadeacucar.lovable.app/auth/sso?token=<JWT>
   ↓
5. Página SSO.tsx captura o token da URL
   ↓
6. Invoca Edge Function: validar-token-sso
   ↓
7. Edge Function:
   a. Valida assinatura JWT (HMAC-SHA256 com SSO_SECRET)
   b. Verifica expiração
   c. Verifica payload.produto === 'caixa'
   d. Gera Magic Link via supabaseAdmin.auth.admin.generateLink()
   e. Retorna { redirect_url: action_link }
   ↓
8. Página SSO.tsx redireciona para o Magic Link
   ↓
9. Supabase Auth processa o Magic Link → cria sessão
   ↓
10. Usuário é redirecionado para /dashboard (autenticado)
```

### 5.3 Edge Function: `validar-token-sso`

**Caminho:** `supabase/functions/validar-token-sso/index.ts`  
**Dependências:**
- `@supabase/supabase-js@2`
- `djwt@v2.9` (Deno JWT library)
- `_shared/cors.ts` (headers CORS compartilhados)

**Payload de Entrada:**
```json
{ "token": "<JWT_STRING>" }
```

**Validações realizadas:**
1. Token presente no body
2. Assinatura HMAC-SHA256 válida (usando `SSO_SECRET`)
3. Token não expirado (TTL de 5 minutos)
4. Campo `produto === 'caixa'`

**Respostas:**

| Status | Situação | Body |
|--------|----------|------|
| 200 | Sucesso | `{ "redirect_url": "https://..." }` |
| 400 | Token ausente | `{ "error": "Token ausente." }` |
| 401 | Token inválido/expirado | `{ "error": "Token inválido ou expirado." }` |
| 403 | Produto errado | `{ "error": "Token não autorizado para este produto." }` |
| 500 | Erro ao gerar link | `{ "error": "Não foi possível gerar acesso." }` |

### 5.4 Página SSO (`/auth/sso`)

**Componente:** `src/pages/auth/SSO.tsx`  
**Tipo:** Rota pública (não requer autenticação prévia)

**Estados:**
- `loading`: Exibe mascote 📦 com "Carregando Caixa de Açúcar..." / "Preparando seu acesso"
- `error`: Exibe ⚠️ com "Link expirado ou inválido" + link de retorno para Umbrella Doce

### 5.5 Segurança do SSO

- **Segredo compartilhado:** O `SSO_SECRET` deve ser idêntico em ambos os sistemas
- **TTL curto:** Tokens expiram em 5 minutos, impedindo reuso
- **Verificação de produto:** O campo `produto: 'caixa'` garante que tokens para outros produtos não sejam aceitos
- **Magic Link único:** Cada token SSO gera um Magic Link de uso único
- **Sem exposição de credenciais:** Nenhuma senha trafega no fluxo SSO

---

## 6. Primeiro Acesso e Troca Obrigatória de Senha

### 6.1 Quando é Acionado

O fluxo de troca obrigatória é ativado quando:
1. `profiles.primeiro_acesso === true` (definido na criação via Edge Function)
2. Senha utilizada no login é `123456` (senha padrão)

### 6.2 Componentes Envolvidos

- **Modal:** `src/components/auth/AlterarSenhaObrigatoria.tsx`
- **Verificação no login:** `src/pages/auth/Login.tsx` (linhas 30-45, 61-77)
- **Redirect de dados:** `src/components/FirstAccessRedirect.tsx`

### 6.3 Fluxo

```
Login com senha padrão
  ↓
Modal não-fechável exibido (onInteractOutside bloqueado)
  ↓
Usuário digita nova senha + confirmação
  ↓
Validações:
  ├── Zod: min 6 chars, senhas iguais
  ├── Rejeita '123456' explicitamente
  └── validarSenhaForte(): complexidade total
  ↓
supabase.auth.updateUser({ password: novaSenha })
  ↓
profiles.update({ primeiro_acesso: false })
  ↓
navigate('/dashboard')
```

### 6.4 FirstAccessRedirect

O componente `FirstAccessRedirect` é renderizado dentro do `Layout` principal e executa verificações adicionais:

1. Se `profiles.ativo === false` → signOut + redirect para login
2. Se `profiles.primeiro_acesso === true` OU `nome_confeitaria` vazio → redirect para `/configuracoes/dados-confeitaria`

---

## 7. Recuperação de Senha

### 7.1 Rota: `/auth/forgot-password`
**Componente:** `src/pages/auth/ForgotPassword.tsx`

### 7.2 Fluxo

```
Usuário clica "Esqueci minha senha" no login
  ↓
Acessa /auth/forgot-password
  ↓
Digita email
  ↓
supabase.auth.resetPasswordForEmail(email, {
  redirectTo: `${origin}/auth/reset-password`
})
  ↓
Email enviado com link de redefinição
  ↓
Tela de confirmação: "Verifique sua caixa de entrada"
```

---

## 8. Política de Senhas

### 8.1 Regras de Validação

Implementadas em `src/lib/validacaoSenha.ts`:

| Regra | Descrição |
|-------|-----------|
| Comprimento mínimo | 6 caracteres |
| Letra maiúscula | Pelo menos 1 (A-Z) |
| Letra minúscula | Pelo menos 1 (a-z) |
| Número | Pelo menos 1 (0-9) |
| Símbolo especial | Pelo menos 1 de: `@ # $ % & * _ - + ! ?` |
| Termos proibidos | Não pode conter: nome do usuário, parte do email, "caixa", "acucar", "kasimas" |
| Senha padrão | `123456` é explicitamente rejeitada na troca obrigatória |
| Expiração | Sem prazo de expiração |

### 8.2 Regex Utilizado

```regex
^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@#$%&*_\-+!?])[A-Za-z\d@#$%&*_\-+!?]{6,}$
```

---

## 9. Controle de Acesso e Permissões (Roles)

### 9.1 Tipos de Role

O sistema utiliza o enum `app_role` com os seguintes valores:

| Role | Descrição | Acesso Admin | Ignora Plano |
|------|-----------|-------------|--------------|
| `user` | Operacional padrão | ❌ | ❌ |
| `moderator` | Reservado para uso futuro | ❌ | ❌ |
| `admin` | Administrador do sistema | ✅ | ✅ |

### 9.2 Verificação de Admin

**Banco (SQL):**
```sql
CREATE FUNCTION has_role(_user_id uuid, _role app_role) RETURNS boolean
-- Ou:
CREATE FUNCTION is_admin(check_user_id uuid) RETURNS boolean
```

**Frontend (React):**
```typescript
const { isAdmin, isLoading } = useIsAdmin();
```

### 9.3 Atribuição Automática

Todo novo usuário recebe automaticamente a role `user` via trigger `handle_new_user_role()` que dispara ao criar registro em `auth.users`.

---

## 10. Sistema de Planos

### 10.1 Planos Disponíveis

| Plano | ID | Acesso | Status |
|-------|----|--------|--------|
| Base | `base` | Módulos fundamentais | Ativo (padrão) |
| Negócio | `negocio` | Acesso total (`*`) | Ativo |
| Controle | `controle` | Em breve | Reservado |

### 10.2 Módulos do Plano Base

- `/precificacao`
- `/encomendas`
- `/clientes`, `/fornecedores`
- Configurações básicas (cadastros, categorias, unidades, tipos insumos, mão de obra, dados confeitaria, tags)

### 10.3 Verificação de Acesso

**Hook:** `usePlano()` (`src/hooks/usePlano.ts`)  
**Guard:** `PlanoGuard` (`src/components/PlanoGuard.tsx`)

- Admin ignora todas as restrições de plano
- Rotas bloqueadas redirecionam para `/upgrade`
- Na sidebar, itens bloqueados aparecem com 40% opacidade e ícone 🔒

---

## 11. Gerenciamento de Usuários (Painel Admin)

### 11.1 Rota: `/admin/usuarios`
**Componente:** `src/pages/admin/Usuarios.tsx`  
**Acesso:** Somente usuários com role `admin`

### 11.2 Funcionalidades Disponíveis

| Ação | Descrição | Disponível? |
|------|-----------|------------|
| Listar | Visualizar todos os usuários com filtros | ✅ |
| Editar | Alterar nome, confeitaria, plano, role | ✅ |
| Desabilitar | Marcar como inativo (ativo=false) | ✅ |
| Reabilitar | Reativar usuário inativo | ✅ |
| Exportar | Exportar lista em Excel (.xlsx) | ✅ |
| **Criar** | **Removido** — provisionamento é externo | ❌ |

### 11.3 Auditoria

Todas as ações administrativas são registradas em `admin_logs` e `admin_audit_log`, incluindo:
- ID e email do admin que executou
- ID e email do usuário afetado
- Tipo de ação
- Detalhes em JSON
- Timestamp

---

## 12. Reativação de Usuários Inativos

Quando a Umbrella Doce tenta criar um usuário cujo email já existe mas está **inativo**:

1. Atualiza `ativo = true` no perfil
2. Define `primeiro_acesso = true` (obriga troca de senha)
3. Atualiza `nome_completo` e `nome_confeitaria`
4. Reseta senha para o valor enviado (geralmente `123456`)
5. Retorna `reactivated: true`

---

## 13. Desativação e Bloqueio de Usuários

### 13.1 Via Painel Admin

O admin pode desabilitar um usuário marcando `profiles.ativo = false`.

### 13.2 Efeito da Desativação

1. **No login:** `AuthContext.signIn()` verifica `profiles.ativo` após autenticar. Se `false`, executa `signOut()` imediatamente e exibe erro.
2. **Sessão ativa:** `FirstAccessRedirect` verifica `profiles.ativo`. Se `false`, executa `signOut()` e redireciona para login.
3. **Dados preservados:** Nenhum dado é deletado na desativação.

---

## 14. Migração de Usuários entre Plataformas

### 14.1 Cenário

Quando um usuário é provisionado pela Umbrella Doce no Caixa de Açúcar:

1. A Umbrella Doce invoca `criar-usuario` com os dados do novo assinante
2. O Caixa de Açúcar cria a conta (ou reativa se já existia)
3. Triggers automáticos criam toda a estrutura de dados padrão:
   - Role `user`
   - Categorias de receitas
   - Banco "Caixa Empresa"
   - Lista de bancos oficiais brasileiros
4. O usuário pode acessar via SSO ou login direto

### 14.2 Dados Inicializados Automaticamente

| Recurso | Trigger | Descrição |
|---------|---------|-----------|
| Role `user` | `handle_new_user_role` | Permissão básica |
| Categorias receitas | `trigger_criar_categorias_padrao` | 16 categorias padrão |
| Banco "Caixa Empresa" | `trigger_criar_banco_caixa_novo_usuario` | Banco principal |
| Bancos oficiais | `trigger_criar_bancos_oficiais` | 28 bancos brasileiros |

### 14.3 Iframe e Integração Visual

O Caixa de Açúcar pode ser carregado dentro de um iframe pela Plataforma Umbrella Doce (`https://app.umbrelladoce.com.br`). Não existem headers `X-Frame-Options` ou `Content-Security-Policy: frame-ancestors` que bloqueiem essa integração.

---

## 15. Triggers e Automações no Banco

| Trigger | Tabela | Evento | Ação |
|---------|--------|--------|------|
| `handle_new_user_role` | `auth.users` | INSERT | Insere role `user` em `user_roles` |
| `trigger_criar_categorias_padrao` | `auth.users` | INSERT | Cria 16 categorias de receitas |
| `trigger_criar_banco_caixa_novo_usuario` | `auth.users` | INSERT | Cria banco "Caixa Empresa" |
| `trigger_criar_bancos_oficiais` | `auth.users` | INSERT | Cria 28 bancos oficiais |

---

## 16. Tabelas Envolvidas

### 16.1 `profiles`

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| `id` | UUID (PK, FK → auth.users) | Identificador do usuário |
| `email` | text | Email do usuário |
| `nome_completo` | text | Nome completo |
| `nome_confeitaria` | text | Nome da confeitaria |
| `ativo` | boolean | Se está ativo no sistema |
| `primeiro_acesso` | boolean | Se precisa trocar senha |
| `plano_id` | text (FK → planos) | Plano vinculado |
| `last_login` | timestamp | Último login |
| `created_at` | timestamp | Data de criação |
| `updated_at` | timestamp | Última atualização |

### 16.2 `user_roles`

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| `id` | UUID (PK) | Identificador |
| `user_id` | UUID (FK → auth.users) | Usuário |
| `role` | app_role (enum) | `admin`, `moderator`, `user` |

**Constraint:** `UNIQUE(user_id, role)`

### 16.3 `planos`

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| `id` | text (PK) | `base`, `negocio`, `controle` |
| `nome` | text | Nome do plano |
| `descricao` | text | Descrição |
| `ativo` | boolean | Se está disponível |
| `em_breve` | boolean | Se está em desenvolvimento |

### 16.4 `admin_logs`

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| `id` | UUID (PK) | Identificador |
| `admin_id` | UUID | Admin executor |
| `admin_email` | text | Email do admin |
| `acao` | text | Tipo de ação |
| `usuario_afetado_id` | UUID | Usuário alvo |
| `usuario_afetado_email` | text | Email do alvo |
| `detalhes` | JSONB | Detalhes extras |
| `created_at` | timestamp | Data/hora |

---

## 17. Edge Functions

### 17.1 `criar-usuario`

| Propriedade | Valor |
|-------------|-------|
| **Caminho** | `supabase/functions/criar-usuario/index.ts` |
| **Método** | POST |
| **Runtime** | Deno (Supabase Edge Functions) |
| **Auth** | `SUPABASE_SERVICE_ROLE_KEY` |
| **CORS** | `_shared/cors.ts` |
| **Deploy** | Automático via Lovable Cloud |

### 17.2 `validar-token-sso`

| Propriedade | Valor |
|-------------|-------|
| **Caminho** | `supabase/functions/validar-token-sso/index.ts` |
| **Método** | POST |
| **Runtime** | Deno |
| **Dependências** | `djwt@v2.9`, `@supabase/supabase-js@2` |
| **Auth** | Validação JWT própria (SSO_SECRET) |
| **CORS** | `_shared/cors.ts` |

---

## 18. Variáveis de Ambiente (Secrets)

### 18.1 Secrets Necessários

| Secret | Usado por | Descrição |
|--------|-----------|-----------|
| `SUPABASE_URL` | Ambas Edge Functions | URL do projeto Lovable Cloud |
| `SUPABASE_SERVICE_ROLE_KEY` | Ambas Edge Functions | Chave admin do backend |
| `SSO_SECRET` | `validar-token-sso` | Segredo compartilhado com Umbrella Doce (HMAC-SHA256) |
| `SITE_URL` | `validar-token-sso` | URL do Caixa de Açúcar (para redirect do Magic Link) |

### 18.2 Variáveis do Frontend (.env)

| Variável | Descrição |
|----------|-----------|
| `VITE_SUPABASE_URL` | URL do backend |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Chave anônima (pública) |
| `VITE_SUPABASE_PROJECT_ID` | ID do projeto |

> ⚠️ O arquivo `.env` é gerado automaticamente e **não deve ser editado manualmente**.

---

## 19. Rotas de Autenticação

| Rota | Tipo | Componente | Descrição |
|------|------|------------|-----------|
| `/auth/login` | Pública | `Login.tsx` | Tela de login (email/senha) |
| `/auth/signup` | Redirect | → `/auth/login` | Autocadastro desabilitado |
| `/auth/sso` | Pública | `SSO.tsx` | Entrada SSO via token JWT |
| `/auth/forgot-password` | Pública | `ForgotPassword.tsx` | Recuperação de senha |
| `/auth/reset-password` | Pública | (via Supabase) | Redefinição de senha (link do email) |

---

## 20. Arquivos de Referência

### Frontend

| Arquivo | Descrição |
|---------|-----------|
| `src/contexts/AuthContext.tsx` | Contexto de autenticação (signIn, signOut, etc.) |
| `src/pages/auth/Login.tsx` | Página de login |
| `src/pages/auth/SSO.tsx` | Página de entrada SSO |
| `src/pages/auth/ForgotPassword.tsx` | Recuperação de senha |
| `src/components/auth/AlterarSenhaObrigatoria.tsx` | Modal de troca obrigatória de senha |
| `src/components/FirstAccessRedirect.tsx` | Redirect para dados/troca senha no primeiro acesso |
| `src/components/PlanoGuard.tsx` | Guard de verificação de plano |
| `src/components/PermissionGuard.tsx` | Guard de verificação de permissões |
| `src/hooks/useIsAdmin.ts` | Hook para verificar role admin |
| `src/hooks/usePlano.ts` | Hook para verificar plano do usuário |
| `src/hooks/useUserId.ts` | Hook para obter ID do usuário autenticado |
| `src/hooks/useUserProfile.ts` | Hook para carregar/atualizar perfil |
| `src/lib/validacaoSenha.ts` | Validação de força de senha |
| `src/pages/admin/Usuarios.tsx` | Painel admin de gestão de usuários |

### Backend (Edge Functions)

| Arquivo | Descrição |
|---------|-----------|
| `supabase/functions/criar-usuario/index.ts` | Criação/reativação de usuários |
| `supabase/functions/validar-token-sso/index.ts` | Validação de token SSO |
| `supabase/functions/_shared/cors.ts` | Headers CORS compartilhados |

---

## 21. Diagrama Completo de Fluxos

```
┌─────────────────────────────────────────────────────────────────┐
│                    FLUXOS DE AUTENTICAÇÃO                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌─ FLUXO 1: LOGIN DIRETO ──────────────────────────────────┐  │
│  │                                                            │  │
│  │  /auth/login → signIn() → verifica ativo → verifica       │  │
│  │  primeiro_acesso → [AlterarSenha] ou /dashboard           │  │
│  │                                                            │  │
│  └────────────────────────────────────────────────────────────┘  │
│                                                                  │
│  ┌─ FLUXO 2: SSO (UMBRELLA DOCE) ───────────────────────────┐  │
│  │                                                            │  │
│  │  Umbrella gera JWT → /auth/sso?token=X → validar-token    │  │
│  │  → Magic Link → sessão criada → /dashboard                │  │
│  │                                                            │  │
│  └────────────────────────────────────────────────────────────┘  │
│                                                                  │
│  ┌─ FLUXO 3: PROVISIONAMENTO ───────────────────────────────┐  │
│  │                                                            │  │
│  │  Umbrella POST criar-usuario → cria Auth + Profile         │  │
│  │  → triggers (roles, categorias, bancos) → pronto           │  │
│  │                                                            │  │
│  └────────────────────────────────────────────────────────────┘  │
│                                                                  │
│  ┌─ FLUXO 4: RECUPERAÇÃO DE SENHA ──────────────────────────┐  │
│  │                                                            │  │
│  │  /auth/forgot-password → email enviado → link clicado      │  │
│  │  → /auth/reset-password → nova senha → login               │  │
│  │                                                            │  │
│  └────────────────────────────────────────────────────────────┘  │
│                                                                  │
│  ┌─ FLUXO 5: PRIMEIRO ACESSO ───────────────────────────────┐  │
│  │                                                            │  │
│  │  Login com 123456 → Modal obrigatório → nova senha         │  │
│  │  → primeiro_acesso=false → /dados-confeitaria → /dashboard │  │
│  │                                                            │  │
│  └────────────────────────────────────────────────────────────┘  │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 22. Segurança

### 22.1 Medidas Implementadas

| Medida | Descrição |
|--------|-----------|
| **RLS** | Row Level Security ativa em todas as tabelas |
| **Service Role Key** | Usada apenas em Edge Functions (server-side) |
| **JWT SSO com TTL** | Tokens expiram em 5 minutos |
| **Magic Links únicos** | Cada SSO gera um link de uso único |
| **Senha forte obrigatória** | Complexidade mínima exigida |
| **Verificação de conta ativa** | Login bloqueado para contas inativas |
| **Auditoria completa** | Todas as ações admin são logadas |
| **Sem autocadastro** | Elimina criação de contas indesejadas |
| **Roles separadas** | `user_roles` em tabela própria (sem privilege escalation) |
| **CORS configurado** | Headers CORS em todas as Edge Functions |

### 22.2 O Que NÃO Está Implementado

| Item | Status |
|------|--------|
| MFA / 2FA | ❌ Não implementado |
| OAuth / Social Login | ❌ Não implementado |
| Rate Limiting no login | ❌ Depende do Supabase Auth (built-in) |
| Expiração de senha | ❌ Sem prazo de expiração |

---

## 23. FAQ Técnico

### P: Como a Umbrella Doce cria um usuário no Caixa de Açúcar?
**R:** Via HTTP POST para a Edge Function `criar-usuario`, enviando email, senha, nome e role.

### P: O que acontece se o usuário já existe?
**R:** Se está ativo, retorna erro. Se está inativo, é reativado com novos dados e senha resetada.

### P: O usuário precisa confirmar email?
**R:** Não. Usuários criados via Edge Function têm `email_confirm: true` (confirmação automática).

### P: Como funciona o SSO?
**R:** A Umbrella Doce gera um JWT assinado com segredo compartilhado. O Caixa de Açúcar valida o JWT e gera um Magic Link que cria a sessão automaticamente.

### P: O que acontece se o token SSO expirar?
**R:** A página `/auth/sso` exibe mensagem de erro com link para voltar à Umbrella Doce.

### P: Usuários podem se cadastrar sozinhos?
**R:** Não. A rota `/auth/signup` redireciona para `/auth/login`. Não existe formulário de cadastro público.

### P: Admin pode criar usuários pelo painel?
**R:** Não. O botão de criação foi removido. O provisionamento é exclusivo da Plataforma Umbrella Doce.

### P: Como altero o plano de um usuário?
**R:** Via painel admin (`/admin/usuarios`), editando o campo `plano_id` no perfil do usuário.

### P: O Caixa de Açúcar pode ser carregado em iframe?
**R:** Sim. Não existem headers que bloqueiem iframe. A integração com `app.umbrelladoce.com.br` funciona normalmente.

---

**Documentação gerada em:** Março de 2026  
**Sistema:** Caixa de Açúcar v2.0  
**Ecossistema:** Umbrella Doce
