# Documentação: Cadastro de Usuários no Sistema Caixa de Açúcar

> **Última atualização:** Março de 2026  
> **Versão:** 1.0

---

## Índice

1. [Visão Geral](#1-visão-geral)
2. [Formas de Cadastro](#2-formas-de-cadastro)
3. [Autocadastro (Sign Up Público)](#3-autocadastro-sign-up-público)
4. [Cadastro pelo Administrador (Painel Admin)](#4-cadastro-pelo-administrador-painel-admin)
5. [Fluxo de Primeiro Acesso e Troca de Senha](#5-fluxo-de-primeiro-acesso-e-troca-de-senha)
6. [Arquitetura Técnica](#6-arquitetura-técnica)
7. [Validações e Segurança](#7-validações-e-segurança)
8. [Tabelas e Estruturas Envolvidas](#8-tabelas-e-estruturas-envolvidas)
9. [Permissões e Papéis (Roles)](#9-permissões-e-papéis-roles)
10. [Reativação de Usuários Inativos](#10-reativação-de-usuários-inativos)
11. [Diagrama de Fluxo](#11-diagrama-de-fluxo)
12. [Referência de Arquivos](#12-referência-de-arquivos)

---

## 1. Visão Geral

O sistema **Caixa de Açúcar** oferece **duas formas distintas** de cadastrar novos usuários:

| Método | Quem executa | Onde ocorre | Senha inicial |
|--------|-------------|-------------|---------------|
| **Autocadastro** | O próprio usuário | Tela pública `/auth/signup` | Definida pelo usuário |
| **Cadastro Admin** | Administrador do sistema | Painel `/admin/usuarios` | Senha padrão `123456` |

Ambos os métodos resultam na criação de um registro na autenticação (Auth) e de um perfil na tabela `profiles`.

---

## 2. Formas de Cadastro

### 2.1 Autocadastro (público)
Qualquer pessoa pode criar uma conta acessando a página de cadastro. O usuário preenche seus dados e define sua própria senha, que deve atender aos critérios de segurança do sistema.

### 2.2 Cadastro pelo Administrador
Usuários com role `admin` podem criar novos usuários pelo painel administrativo. Neste caso, o administrador define os dados básicos e o sistema atribui a senha padrão `123456`, obrigando o novo usuário a alterá-la no primeiro login.

---

## 3. Autocadastro (Sign Up Público)

### 3.1 Localização
- **Rota:** `/auth/signup`
- **Componente:** `src/pages/auth/SignUp.tsx`
- **Contexto de Auth:** `src/contexts/AuthContext.tsx` (função `signUp`)

### 3.2 Campos obrigatórios

| Campo | Tipo | Validação |
|-------|------|-----------|
| Nome Completo | Texto | Mínimo 1 caractere, máximo 100 |
| Nome da Confeitaria | Texto | Mínimo 1 caractere, máximo 100 |
| Email | Email | Formato válido, máximo 255 caracteres |
| Senha | Senha | Mínimo 6 caracteres + critérios de força |
| Confirmar Senha | Senha | Deve coincidir com a senha |

### 3.3 Validação de Senha Forte
A senha é validada pela função `validarSenhaForte()` em `src/lib/validacaoSenha.ts`, que exige:
- Mínimo de **6 caracteres**
- Pelo menos **1 letra maiúscula**
- Pelo menos **1 letra minúscula**
- Pelo menos **1 número**
- Pelo menos **1 símbolo** (@ # $ % & * _ - + ! ?)
- **Não pode** conter partes do nome, email ou termos proibidos (`caixa`, `acucar`, `kasimas`)

### 3.4 Fluxo Técnico

```
Usuário preenche formulário
  ↓
Validação Zod (schema signUpSchema)
  ↓
Validação de senha forte (validarSenhaForte)
  ↓
supabase.auth.signUp() — cria usuário no Auth
  ↓
Metadados salvos: nome_completo, nome_confeitaria
  ↓
Trigger automático: handle_new_user_role()
  → Insere role 'user' na tabela user_roles
  ↓
Trigger automático: trigger_criar_categorias_padrao()
  → Cria categorias padrão para o novo usuário
  ↓
Trigger automático: trigger_criar_banco_caixa_novo_usuario()
  → Cria banco "Caixa Empresa" padrão
  ↓
Trigger automático: trigger_criar_bancos_oficiais()
  → Cria lista completa de bancos oficiais
  ↓
Redirect para Dashboard (/)
```

### 3.5 Dados armazenados automaticamente
Ao criar a conta via autocadastro, o sistema automaticamente:
- Cria o registro de autenticação (`auth.users`)
- Cria o perfil do usuário (`public.profiles`)
- Atribui a role `user` (`public.user_roles`)
- Cria categorias de receitas padrão (`public.categorias`)
- Cria o banco "Caixa Empresa" (`public.bancos`)
- Cria a lista de bancos oficiais brasileiros (`public.bancos`)

---

## 4. Cadastro pelo Administrador (Painel Admin)

### 4.1 Localização
- **Rota:** `/admin/usuarios`
- **Componente principal:** `src/pages/admin/Usuarios.tsx`
- **Dialog de criação:** `src/components/admin/AdicionarUsuarioDialog.tsx`
- **Edge Function:** `supabase/functions/criar-usuario/index.ts`

### 4.2 Pré-requisitos
- O usuário logado deve possuir a role `admin` na tabela `user_roles`
- A verificação é feita pelo hook `useIsAdmin()` em `src/hooks/useIsAdmin.ts`
- Usuários sem role admin são automaticamente redirecionados para o Dashboard

### 4.3 Campos do formulário

| Campo | Tipo | Validação | Observação |
|-------|------|-----------|------------|
| Email | Email | Formato válido | Obrigatório |
| Nome Completo | Texto | Mínimo 2 caracteres | Obrigatório |
| Nome da Confeitaria | Texto | Mínimo 2 caracteres | Obrigatório |
| Permissão (Role) | Select | `user` ou `admin` | Padrão: `user` |

### 4.4 Senha padrão
- A senha é **fixa** como `123456` e **não é editável** pelo administrador
- O usuário é **obrigado a alterá-la** no primeiro login (ver seção 5)
- Uma mensagem informativa é exibida no formulário:
  > *"Senha padrão: 123456 — O usuário será obrigado a alterar a senha no primeiro acesso."*

### 4.5 Fluxo Técnico

```
Admin clica em "Adicionar Usuário"
  ↓
Preenche formulário no AdicionarUsuarioDialog
  ↓
Validação Zod (formSchema)
  ↓
Invoca Edge Function: criar-usuario
  ↓
Edge Function executa com SUPABASE_SERVICE_ROLE_KEY:
  │
  ├── Verifica se email já existe no Auth (listUsers)
  ├── Verifica se perfil existe na tabela profiles
  │
  ├── CASO 1: Usuário novo
  │   ├── supabaseAdmin.auth.admin.createUser()
  │   │   (email_confirm: true → sem necessidade de verificação)
  │   └── Cria perfil com primeiro_acesso = true
  │
  ├── CASO 2: Usuário existe no Auth mas sem perfil
  │   ├── Cria perfil vinculado ao auth.user existente
  │   └── Atualiza senha para '123456'
  │
  └── CASO 3: Usuário inativo (reativação)
      ├── Atualiza perfil: ativo = true, primeiro_acesso = true
      └── Atualiza senha para '123456'
  ↓
Se role !== 'user': insere na tabela user_roles
  ↓
Retorna resultado (success/reactivated)
  ↓
Toast de sucesso + refresh da lista de usuários
```

### 4.6 Tratamento de erros
O sistema trata os seguintes cenários de erro:
- **Email já cadastrado ativo:** exibe "Este email já está cadastrado no sistema"
- **Email inválido:** exibe "Email inválido"
- **Erro de senha:** exibe "A senha deve ter pelo menos 6 caracteres"
- **Variáveis de ambiente faltando:** erro interno 500
- **Erros genéricos:** mensagem original do erro

### 4.7 Funcionalidades adicionais do Painel Admin

Além de cadastrar, o administrador pode:

| Ação | Descrição |
|------|-----------|
| **Editar** | Alterar nome, confeitaria e permissão |
| **Desabilitar** | Marcar `ativo = false` no perfil |
| **Reabilitar** | Marcar `ativo = true` no perfil |
| **Excluir** | Bloqueia permanentemente (marca como inativo) |
| **Exportar** | Exporta lista de usuários em formato Excel (.xlsx) |

Todas as ações administrativas são registradas na tabela `admin_logs`.

---

## 5. Fluxo de Primeiro Acesso e Troca de Senha

### 5.1 Localização
- **Componente:** `src/components/auth/AlterarSenhaObrigatoria.tsx`
- **Verificação:** `src/components/FirstAccessRedirect.tsx`

### 5.2 Quando é acionado
O modal de troca obrigatória de senha aparece quando:
1. O campo `primeiro_acesso` na tabela `profiles` é `true`
2. O usuário foi criado pelo administrador (com senha padrão `123456`)

### 5.3 Fluxo

```
Usuário faz login com senha padrão '123456'
  ↓
FirstAccessRedirect verifica perfil:
  primeiro_acesso === true?
  ↓ SIM
Exibe Dialog modal (não pode fechar sem alterar)
  ↓
Usuário digita nova senha + confirmação
  ↓
Validações:
  ├── Zod: mínimo 6 caracteres, senhas coincidem
  ├── Não pode ser '123456'
  └── validarSenhaForte(): critérios de complexidade
  ↓
supabase.auth.updateUser({ password: novaSenha })
  ↓
Atualiza perfil: primeiro_acesso = false
  ↓
Redirect para Dashboard
```

### 5.4 Segurança
- O dialog é **modal e não pode ser fechado** sem alterar a senha (`onInteractOutside` bloqueado)
- A senha `123456` é **explicitamente rejeitada** como nova senha
- Os mesmos critérios de senha forte do autocadastro são aplicados

---

## 6. Arquitetura Técnica

### 6.1 Camada de Autenticação
- **Provedor:** Supabase Auth (via Lovable Cloud)
- **Método:** Email + Senha
- **Contexto React:** `AuthContext` (`src/contexts/AuthContext.tsx`)
- **Funções expostas:** `signIn`, `signUp`, `signOut`, `resetPassword`

### 6.2 Edge Function: `criar-usuario`
- **Caminho:** `supabase/functions/criar-usuario/index.ts`
- **Runtime:** Deno (Supabase Edge Functions)
- **Autenticação:** Usa `SUPABASE_SERVICE_ROLE_KEY` (acesso admin)
- **CORS:** Habilitado via `_shared/cors.ts`
- **Deployment:** Automático via Lovable Cloud

### 6.3 Triggers automáticos no banco

| Trigger | Tabela | Ação |
|---------|--------|------|
| `handle_new_user_role` | `auth.users` | Insere role `user` em `user_roles` |
| `trigger_criar_categorias_padrao` | `auth.users` | Cria categorias de receitas padrão |
| `trigger_criar_banco_caixa_novo_usuario` | `auth.users` | Cria banco "Caixa Empresa" |
| `trigger_criar_bancos_oficiais` | `auth.users` | Cria lista de bancos oficiais |

---

## 7. Validações e Segurança

### 7.1 Validação de dados (Zod)

**Autocadastro (`signUpSchema`):**
```typescript
{
  email: string().email().max(255),
  password: string().min(6).max(100),
  confirmPassword: string(),  // deve coincidir com password
  nomeCompleto: string().min(1).max(100),
  nomeConfeitaria: string().min(1).max(100)
}
```

**Cadastro Admin (`formSchema`):**
```typescript
{
  email: string().email(),
  nomeCompleto: string().min(2),
  nomeConfeitaria: string().min(2),
  role: string()  // 'user' ou 'admin'
}
```

### 7.2 Política de senhas
- Mínimo 6 caracteres
- Obrigatório: maiúscula + minúscula + número + símbolo
- Proibido: partes do nome, email ou termos bloqueados
- Senha padrão `123456` é rejeitada na troca obrigatória

### 7.3 Proteções implementadas
- **RLS (Row Level Security):** Ativa em todas as tabelas
- **Verificação de admin:** Via `useIsAdmin()` hook + `is_admin()` função SQL
- **Service Role Key:** Usada apenas na Edge Function (servidor)
- **Logs de auditoria:** Toda ação admin é registrada em `admin_logs`
- **Primeiro acesso obrigatório:** Usuários criados pelo admin devem trocar senha

---

## 8. Tabelas e Estruturas Envolvidas

### 8.1 `auth.users` (gerenciada pelo Supabase)
Armazena credenciais de autenticação. **Não acessível diretamente** pelo frontend.

### 8.2 `public.profiles`

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| `id` | UUID | FK para `auth.users.id` |
| `email` | text | Email do usuário |
| `nome_completo` | text | Nome completo |
| `nome_confeitaria` | text | Nome da confeitaria |
| `ativo` | boolean | Se o usuário está ativo |
| `primeiro_acesso` | boolean | Se precisa trocar senha |
| `created_at` | timestamp | Data de criação |
| `updated_at` | timestamp | Última atualização |

### 8.3 `public.user_roles`

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| `id` | UUID | PK |
| `user_id` | UUID | FK para `auth.users.id` |
| `role` | app_role (enum) | `admin`, `moderator` ou `user` |

**Constraint:** `UNIQUE(user_id, role)` — impede roles duplicadas.

### 8.4 `public.admin_logs`

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| `id` | UUID | PK |
| `admin_id` | UUID | ID do admin que executou a ação |
| `admin_email` | text | Email do admin |
| `acao` | text | Tipo da ação (`criou_usuario`, `desabilitou_usuario`, etc.) |
| `usuario_afetado_id` | UUID | ID do usuário afetado |
| `usuario_afetado_email` | text | Email do usuário afetado |
| `detalhes` | JSONB | Detalhes adicionais da ação |
| `created_at` | timestamp | Data/hora da ação |

---

## 9. Permissões e Papéis (Roles)

### 9.1 Tipos de Role (enum `app_role`)

| Role | Descrição | Pode cadastrar usuários? |
|------|-----------|--------------------------|
| `user` | Usuário operacional padrão | ❌ Não |
| `moderator` | Moderador (reservado) | ❌ Não |
| `admin` | Administrador do sistema | ✅ Sim |

### 9.2 Atribuição automática
- Todo novo usuário recebe automaticamente a role `user` via trigger `handle_new_user_role()`
- A role `admin` é atribuída **manualmente** pelo administrador durante o cadastro ou edição

### 9.3 Verificação de permissão
```sql
-- Função SQL para verificar se é admin
CREATE FUNCTION is_admin(check_user_id uuid) RETURNS boolean
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = check_user_id AND role = 'admin'
  );
```

```typescript
// Hook React para verificar se é admin
const { isAdmin } = useIsAdmin();
```

---

## 10. Reativação de Usuários Inativos

Quando um administrador tenta cadastrar um email que já existe no sistema mas está **inativo**, o sistema executa uma **reativação** em vez de criar um novo registro:

1. Atualiza `ativo = true` no perfil
2. Atualiza `primeiro_acesso = true` (obriga nova troca de senha)
3. Atualiza o `nome_completo` e `nome_confeitaria` com os novos dados
4. Reseta a senha para `123456`
5. Retorna `reactivated: true` na resposta

O sistema exibe um toast específico: *"Usuário reativado com sucesso"*.

---

## 11. Diagrama de Fluxo

```
┌─────────────────────────────────────────────────────────┐
│                 CADASTRO DE USUÁRIOS                     │
├─────────────────────┬───────────────────────────────────┤
│   AUTOCADASTRO      │    CADASTRO ADMIN                 │
│   /auth/signup      │    /admin/usuarios                │
│                     │                                   │
│   ┌─────────────┐   │   ┌─────────────┐                │
│   │ Formulário  │   │   │ Dialog      │                │
│   │ público     │   │   │ Admin Only  │                │
│   └──────┬──────┘   │   └──────┬──────┘                │
│          │          │          │                        │
│   ┌──────▼──────┐   │   ┌──────▼──────┐                │
│   │ Validação   │   │   │ Validação   │                │
│   │ Zod + Senha │   │   │ Zod         │                │
│   └──────┬──────┘   │   └──────┬──────┘                │
│          │          │          │                        │
│   ┌──────▼──────┐   │   ┌──────▼──────────┐            │
│   │ Supabase    │   │   │ Edge Function   │            │
│   │ Auth.signUp │   │   │ criar-usuario   │            │
│   └──────┬──────┘   │   │ (Service Role)  │            │
│          │          │   └──────┬──────────┘            │
│          │          │          │                        │
│          ▼          │          ▼                        │
│   ┌─────────────────────────────────────┐              │
│   │         auth.users (criado)         │              │
│   └──────────────┬──────────────────────┘              │
│                  │                                      │
│   ┌──────────────▼──────────────────────┐              │
│   │     Triggers automáticos:           │              │
│   │  • user_roles (role = 'user')       │              │
│   │  • categorias padrão               │              │
│   │  • bancos padrão                   │              │
│   └──────────────┬──────────────────────┘              │
│                  │                                      │
│          ┌───────┴───────┐                              │
│          │               │                              │
│   ┌──────▼──────┐ ┌──────▼──────────┐                  │
│   │  Dashboard  │ │ Troca Senha     │                  │
│   │  (direto)   │ │ Obrigatória     │                  │
│   │             │ │ (primeiro_acesso)│                  │
│   └─────────────┘ └─────────────────┘                  │
└─────────────────────────────────────────────────────────┘
```

---

## 12. Referência de Arquivos

| Arquivo | Descrição |
|---------|-----------|
| `src/pages/auth/SignUp.tsx` | Página de autocadastro público |
| `src/pages/auth/Login.tsx` | Página de login |
| `src/pages/auth/ForgotPassword.tsx` | Recuperação de senha |
| `src/contexts/AuthContext.tsx` | Contexto de autenticação (signUp, signIn, signOut) |
| `src/pages/admin/Usuarios.tsx` | Painel administrativo de usuários |
| `src/components/admin/AdicionarUsuarioDialog.tsx` | Dialog de criação de usuário (admin) |
| `src/components/admin/EditarUsuarioDialog.tsx` | Dialog de edição de usuário (admin) |
| `src/components/auth/AlterarSenhaObrigatoria.tsx` | Modal de troca obrigatória de senha |
| `src/components/FirstAccessRedirect.tsx` | Verificação de primeiro acesso |
| `src/hooks/useIsAdmin.ts` | Hook para verificar se é administrador |
| `src/lib/validacaoSenha.ts` | Função de validação de senha forte |
| `supabase/functions/criar-usuario/index.ts` | Edge Function de criação de usuário |
| `supabase/functions/_shared/cors.ts` | Configuração CORS compartilhada |

---

> **Nota:** Este documento reflete a arquitetura atual do sistema. O cadastro de usuários é uma funcionalidade crítica e qualquer alteração deve ser acompanhada de atualização desta documentação.
