# 🔐 DOCUMENTAÇÃO: Autenticação e SSO — Caixa de Açúcar

**Atualizada em:** Março 2026  
**Versão:** 3.0

---

## 1. VISÃO GERAL

O Caixa de Açúcar integra o ecossistema **Umbrella Doce**. A autenticação segue estes princípios:

1. **Sem autocadastro**: A rota `/auth/signup` redireciona para `/auth/login`
2. **Provisionamento externo**: Novos usuários são criados exclusivamente pela Plataforma Umbrella Doce via Edge Function `criar-usuario`
3. **SSO transparente**: Usuários da Umbrella Doce acessam sem novo login via Magic Link
4. **Login independente**: Acesso direto via email/senha em `/auth/login`

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
Validação Zod (loginSchema)
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

### 2.4 Tratamento de Erros

| Erro | Mensagem |
|------|---------|
| `Invalid login credentials` | "Email ou senha incorretos." |
| `Email not confirmed` | "Confirme seu email antes de fazer login." |
| Conta desabilitada | "Sua conta foi desabilitada." |
| Outros | "Erro ao fazer login. Tente novamente." |

### 2.5 Identidade Visual
- Fundo escuro (`bg-umbrella-preto`)
- Lado esquerdo: imagem de marca (`auth-brand-image.png`)
- Lado direito: formulário com card claro (`bg-umbrella-cloud`)
- Ícone: `caixa-acucar-icon.png` (80×80px)
- Destaque dourado para "by Umbrella Doce"

---

## 3. CRIAÇÃO DE USUÁRIOS (Provisionamento Externo)

### 3.1 Edge Function: `criar-usuario`
**Caminho:** `supabase/functions/criar-usuario/index.ts`  
**Invocação:** Pela Plataforma Umbrella Doce via HTTP POST  
**Autenticação:** Requer token de admin (verifica role `admin` em `user_roles`)

### 3.2 Payload de Entrada

```json
{
  "email": "confeiteira@email.com",
  "nomeCompleto": "Maria da Silva",
  "nomeConfeitaria": "Doces da Maria",
  "planoId": "base",
  "role": "user"
}
```

> ⚠️ **Não há campo `senha`**. O sistema usa `inviteUserByEmail()` que envia Magic Link.

### 3.3 Fluxo de Execução

```
POST criar-usuario (com Authorization header de admin)
  ↓
Verifica se caller é admin (user_roles)
  ↓
Verificação: Usuário existe no Auth? Perfil existe?
  ↓
  ├── CASO 1: Usuário totalmente novo
  │   ├── supabaseAdmin.auth.admin.inviteUserByEmail()
  │   │   (envia email com Magic Link)
  │   ├── Perfil criado automaticamente via trigger
  │   └── Se planoId: atualiza profiles.plano_id (aguarda 1s para trigger)
  │
  ├── CASO 2: Existe no Auth e perfil ATIVO
  │   └── Se planoId: atualiza apenas plano_id (retorna updated: true)
  │
  ├── CASO 3: Existe no Auth mas sem perfil
  │   ├── Cria perfil (INSERT profiles) com primeiro_acesso=true
  │   └── Define plano_id se fornecido
  │
  └── CASO 4: Existe e está INATIVO (reativação)
      ├── Atualiza: ativo=true, primeiro_acesso=true, nomes, plano
      └── Envia Magic Link (inviteUserByEmail)
  ↓
Se role !== 'user': insere em user_roles
  ↓
Retorna { success, user: { id }, reactivated }
```

### 3.4 Respostas

**Sucesso (200):**
```json
{ "success": true, "user": { "id": "uuid" }, "reactivated": false }
```

**Usuário existente atualizado (200):**
```json
{ "success": true, "user": { "id": "uuid" }, "reactivated": false, "updated": true }
```

---

## 4. SSO — Single Sign-On

### 4.1 Fluxo Completo

```
1. Usuário logado na Umbrella Doce
   ↓
2. Clica em "Abrir Caixa de Açúcar"
   ↓
3. Umbrella Doce gera JWT:
   { "email": "...", "produto": "caixa", "nome_completo": "...", "iat": ..., "exp": +5min }
   Assinado com SSO_SECRET (HMAC-SHA256)
   ↓
4. Redireciona para: /auth/sso?token=<JWT>
   ↓
5. SSO.tsx captura token → invoca Edge Function validar-token-sso
   ↓
6. Edge Function:
   a. Valida assinatura HMAC-SHA256
   b. Verifica expiração
   c. Verifica payload.produto === 'caixa'
   d. Gera Magic Link (generateLink type: magiclink)
   e. Retorna { token_hash, nome_completo }
   ↓
7. SSO.tsx usa verifyOtp({ token_hash, type: 'magiclink' })
   → Cria sessão no cliente sem redirecionamento
   ↓
8. Se nome_completo retornado e perfil sem nome → preenche automaticamente
   ↓
9. navigate('/dashboard')
```

### 4.2 Edge Function: `validar-token-sso`
**Caminho:** `supabase/functions/validar-token-sso/index.ts`

**Respostas:**

| Status | Situação | Body |
|--------|----------|------|
| 200 | Sucesso | `{ "token_hash": "...", "nome_completo": "..." }` |
| 400 | Token ausente | `{ "error": "Token ausente." }` |
| 401 | Inválido/expirado | `{ "error": "Token inválido ou expirado." }` |
| 403 | Produto errado | `{ "error": "Token não autorizado para este produto." }` |
| 500 | Erro interno | `{ "error": "Não foi possível gerar acesso." }` |

### 4.3 Página SSO (`/auth/sso`)
**Componente:** `src/pages/auth/SSO.tsx`

- **Loading:** Mascote com "Preparando seu acesso..."
- **Error:** ⚠️ "Link expirado ou inválido" + link para Umbrella Doce

---

## 5. PRIMEIRO ACESSO

### 5.1 Quando é Acionado
O fluxo é ativado quando `profiles.primeiro_acesso === true`.

### 5.2 Dois Mecanismos Complementares

**A) Modal de Troca de Senha (Login.tsx)**
- Verifica `primeiro_acesso` após login com senha
- Exibe `AlterarSenhaObrigatoria` (dialog modal, não fechável)
- Após trocar senha: `primeiro_acesso = false` → navigate dashboard

**B) FirstAccessRedirect (Layout)**
- Renderizado em todas as páginas protegidas
- Se `primeiro_acesso === true` OU `nome_confeitaria` vazio → redireciona para `/configuracoes/dados-confeitaria`
- Se `ativo === false` → signOut + redirect login

### 5.3 Componente: AlterarSenhaObrigatoria
**Caminho:** `src/components/auth/AlterarSenhaObrigatoria.tsx`

- Dialog modal (`onInteractOutside` bloqueado)
- Validação Zod: min 6 chars, senhas iguais
- Validação forte: `validarSenhaForte()` (maiúscula, minúscula, número, símbolo)
- Após sucesso: `supabase.auth.updateUser()` → `profiles.update({ primeiro_acesso: false })`

---

## 6. RECUPERAÇÃO DE SENHA

**Rota:** `/auth/forgot-password`  
**Componente:** `src/pages/auth/ForgotPassword.tsx`

```
Clica "Esqueci minha senha" no login
  ↓
Digita email
  ↓
supabase.auth.resetPasswordForEmail(email, {
  redirectTo: `${origin}/auth/reset-password`
})
  ↓
Tela: "Verifique sua caixa de entrada"
```

---

## 7. POLÍTICA DE SENHAS

Implementada em `src/lib/validacaoSenha.ts`:

| Regra | Descrição |
|-------|-----------|
| Comprimento | Mínimo 6 caracteres |
| Maiúscula | Pelo menos 1 (A-Z) |
| Minúscula | Pelo menos 1 (a-z) |
| Número | Pelo menos 1 (0-9) |
| Símbolo | Pelo menos 1 de: `@ # $ % & * _ - + ! ?` |
| Proibidos | Não pode conter: nome, parte do email, "caixa", "acucar", "kasimas" |
| Expiração | Sem prazo |

**Regex:**
```regex
^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@#$%&*_\-+!?])[A-Za-z\d@#$%&*_\-+!?]{6,}$
```

---

## 8. AuthContext

**Caminho:** `src/contexts/AuthContext.tsx`

```typescript
interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signIn: (email, password) => Promise<void>;
  signUp: (email, password, nome, confeitaria) => Promise<void>; // mantido no código, não exposto em UI
  signOut: () => Promise<void>;
  resetPassword: (email) => Promise<void>;
}
```

- `signIn`: Verifica `profiles.ativo` após login, faz signOut se inativo
- `signUp`: Mantido no código mas sem interface pública (rota /auth/signup redireciona para login)
- `signOut`: Limpa sessão
- `resetPassword`: Envia email de redefinição

---

## 9. SECRETS NECESSÁRIOS

| Secret | Uso |
|--------|-----|
| `SUPABASE_URL` | Auto-configurado |
| `SUPABASE_SERVICE_ROLE_KEY` | Auto-configurado |
| `SUPABASE_ANON_KEY` | Auto-configurado |
| `SSO_SECRET` | Segredo compartilhado para validação JWT SSO |
| `SITE_URL` | URL base para redirects de Magic Link |

---

## 10. ARQUIVOS DE REFERÊNCIA

| Arquivo | Função |
|---------|--------|
| `src/pages/auth/Login.tsx` | Tela de login |
| `src/pages/auth/SSO.tsx` | Página SSO |
| `src/pages/auth/ForgotPassword.tsx` | Recuperação de senha |
| `src/components/auth/AlterarSenhaObrigatoria.tsx` | Modal troca obrigatória |
| `src/components/FirstAccessRedirect.tsx` | Redirect primeiro acesso |
| `src/contexts/AuthContext.tsx` | Contexto de autenticação |
| `src/lib/validacaoSenha.ts` | Validação de senha forte |
| `supabase/functions/criar-usuario/index.ts` | Edge Function criação |
| `supabase/functions/validar-token-sso/index.ts` | Edge Function SSO |
