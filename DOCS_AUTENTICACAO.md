# 🔐 DOCUMENTAÇÃO: Autenticação — Caixa de Açúcar

**Atualizada em:** Abril 2026  
**Versão:** 4.0

---

## 1. VISÃO GERAL

O Caixa de Açúcar é uma plataforma independente. A autenticação segue estes princípios:

1. **Sem autocadastro**: A rota `/auth/signup` redireciona para `/auth/login`
2. **Provisionamento duplo**: Novos usuários são criados pelo **admin** (painel) ou pelo **Webhook da Hotmart** (compra automática)
3. **Login direto**: Acesso via email/senha em `/auth/login`
4. **Convite por email**: Novos usuários recebem Magic Link para definir senha

---

## 2. FLUXO DE LOGIN

### 2.1 Rota: `/auth/login`
**Componente:** `src/pages/auth/Login.tsx`

### 2.2 Campos

| Campo | Validação (Zod) |
|-------|----------------|
| Email | `string().email().max(255)` |
| Senha | `string().min(6).max(100)` |

### 2.3 Fluxo Técnico

```
Usuário acessa /auth/login
  ↓
Preenche email e senha
  ↓
supabase.auth.signInWithPassword()
  ↓
AuthContext verifica profiles.ativo === false?
  ├── SIM → signOut() + erro "Conta desabilitada"
  └── NÃO → continua
  ↓
Atualiza profiles.last_login
  ↓
Verifica profiles.primeiro_acesso === true?
  ├── SIM → Exibe modal AlterarSenhaObrigatoria
  └── NÃO → navigate('/dashboard')
```

---

## 3. CRIAÇÃO DE USUÁRIOS

### 3.1 Via Painel Admin

**Componente:** `src/components/admin/CriarUsuarioDialog.tsx`  
**Edge Function:** `supabase/functions/criar-usuario/index.ts`  
**Autenticação:** Requer JWT de admin (verifica role `admin` em `user_roles`)

**Campos do formulário:**

| Campo | Obrigatório | Descrição |
|-------|:-----------:|-----------|
| Email | ✅ | Email do novo usuário |
| Nome Completo | ❌ | Nome completo |
| Nome da Confeitaria | ❌ | Nome da confeitaria |
| Plano | ✅ | `base` ou `negocio` |
| Periodicidade | ✅ | `mensal` (30 dias) ou `anual` (365 dias) |

**Fluxo:**
1. Admin preenche formulário e confirma
2. Edge function `criar-usuario` é invocada
3. Sistema envia Magic Link por email ao novo usuário
4. Usuário clica no link, define senha no primeiro acesso

### 3.2 Via Webhook Hotmart (Automático)

**Edge Function:** `supabase/functions/hotmart-webhook/index.ts`  
**Autenticação:** Validação do `hottok` no payload contra `HOTMART_HOTTOK` (secret)

**Eventos tratados:**

| Evento | Ação |
|--------|------|
| `PURCHASE_APPROVED` | Cria/ativa usuário, envia convite |
| `PURCHASE_COMPLETE` | Cria/ativa usuário, envia convite |
| `PURCHASE_CANCELED` | Desativa usuário |
| `PURCHASE_REFUNDED` | Desativa usuário |
| `PURCHASE_CHARGEBACK` | Desativa usuário |
| `SUBSCRIPTION_CANCELLATION` | Desativa usuário |
| `SWITCH_PLAN` | Atualiza plano do usuário |
| `PURCHASE_DELAYED` | Ignorado |
| `PURCHASE_PROTEST` | Ignorado |

**Detecção de plano:** O sistema analisa o nome do plano/oferta da Hotmart:
- Contém "negócio/negocio/business" → Plano Negócio
- Caso contrário → Plano Base
- Contém "anual/annual/yearly" → Anual (365 dias)
- Caso contrário → Mensal (30 dias)

**URL do Webhook:** `https://lypifrxdzjfdgkcacubl.supabase.co/functions/v1/hotmart-webhook`

---

## 4. PRIMEIRO ACESSO

### 4.1 Quando é Acionado
O fluxo é ativado quando `profiles.primeiro_acesso === true`.

### 4.2 Dois Mecanismos Complementares

**A) Modal de Troca de Senha (Login.tsx)**
- Verifica `primeiro_acesso` após login com senha
- Exibe `AlterarSenhaObrigatoria` (dialog modal, não fechável)
- Após trocar senha: `primeiro_acesso = false` → navigate dashboard

**B) FirstAccessRedirect (Layout)**
- Se `primeiro_acesso === true` OU `nome_confeitaria` vazio → redireciona para `/configuracoes/dados-confeitaria`
- Se `ativo === false` → signOut + redirect login

---

## 5. RECUPERAÇÃO DE SENHA

**Rota:** `/auth/forgot-password`  
**Componente:** `src/pages/auth/ForgotPassword.tsx`

```
Clica "Esqueci minha senha" no login
  ↓
Digita email
  ↓
supabase.auth.resetPasswordForEmail()
  ↓
Tela: "Verifique sua caixa de entrada"
```

---

## 6. POLÍTICA DE SENHAS

Implementada em `src/lib/validacaoSenha.ts`:

| Regra | Descrição |
|-------|-----------|
| Comprimento | Mínimo 6 caracteres |
| Maiúscula | Pelo menos 1 (A-Z) |
| Minúscula | Pelo menos 1 (a-z) |
| Número | Pelo menos 1 (0-9) |
| Símbolo | Pelo menos 1 de: `@ # $ % & * _ - + ! ?` |

---

## 7. SECRETS NECESSÁRIOS

| Secret | Uso |
|--------|-----|
| `SUPABASE_URL` | Auto-configurado |
| `SUPABASE_SERVICE_ROLE_KEY` | Auto-configurado |
| `SUPABASE_ANON_KEY` | Auto-configurado |
| `HOTMART_HOTTOK` | Validação do webhook Hotmart |
| `SITE_URL` | URL base para redirects de Magic Link |

---

## 8. ARQUIVOS DE REFERÊNCIA

| Arquivo | Função |
|---------|--------|
| `src/pages/auth/Login.tsx` | Tela de login |
| `src/pages/auth/ForgotPassword.tsx` | Recuperação de senha |
| `src/components/auth/AlterarSenhaObrigatoria.tsx` | Modal troca obrigatória |
| `src/components/FirstAccessRedirect.tsx` | Redirect primeiro acesso |
| `src/components/admin/CriarUsuarioDialog.tsx` | Dialog de criação pelo admin |
| `src/contexts/AuthContext.tsx` | Contexto de autenticação |
| `src/lib/validacaoSenha.ts` | Validação de senha forte |
| `supabase/functions/criar-usuario/index.ts` | Edge Function criação (admin) |
| `supabase/functions/hotmart-webhook/index.ts` | Edge Function webhook Hotmart |
