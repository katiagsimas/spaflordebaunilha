# 🔐 DOCUMENTAÇÃO: Autenticação — Caixa de Açúcar

**Atualizada em:** 26/05/2026  
**Versão:** 4.2

---

## 1. VISÃO GERAL

O Caixa de Açúcar é uma plataforma independente. A autenticação segue estes princípios:

1. **Sem autocadastro**: A rota `/auth/signup` redireciona para `/auth/login`
2. **Provisionamento duplo**: Novos usuários são criados pelo **admin** (painel) ou pelo **Webhook da Hotmart** (compra automática)
3. **Login direto**: Acesso via email/senha em `/auth/login`
4. **Convite por email**: Novos usuários recebem link de definição de senha por e-mail customizado via Resend (sem Magic Link nativo do Supabase)

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
| Plano | ✅ | `base` (Lite), `negocio` (Business) ou `aluna_imersao` (30 dias Business — provisionamento manual fora do webhook Hotmart) |
| Periodicidade | ✅ | `mensal` (30 dias) ou `anual` (365 dias). `aluna_imersao` é fixado em 30 dias |

**Fluxo:**
1. Admin preenche formulário e confirma
2. Edge function `criar-usuario` é invocada (com rate limit 10 req/60s por IP)
3. Usuário é criado no Supabase Auth com senha temporária e `primeiro_acesso = true`; e-mails nativos do Supabase ficam suprimidos
4. Edge function gera link de recovery (`admin.generateLink`) e envia e-mail customizado via Resend (`noreply@umbrelladoce.com.br`) apontando direto para `/auth/reset-password?token_hash=...`
5. Usuário clica no link, define a própria senha e é redirecionado ao login

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
- Contém "business/caixa business/negócio/negocio" → Caixa Business (`negocio`)
- Caso contrário → Caixa Lite (`base`)
- Contém "anual/annual/yearly" → Anual (365 dias)
- Caso contrário → Mensal (30 dias)
- ⚠️ **Plano Start descontinuado em 25/05/2026** — o webhook não provisiona mais Start; usuários legados permanecem ativos.
- ℹ️ **Plano `aluna_imersao` NÃO é provisionado pelo webhook** — é criado manualmente via painel admin (ver `MODULO_IMERSAO`).

### 3.3 Upgrade/Downgrade Agendado (`plano_pendente_*`)

Quando a aluna troca de plano antes do vencimento, o webhook **não** altera o plano ativo imediatamente. Em vez disso grava em `profiles`:

| Coluna | Descrição |
|--------|-----------|
| `plano_pendente` | Novo plano que entrará em vigor |
| `plano_pendente_periodicidade` | `mensal` / `anual` |
| `plano_pendente_data_aplicacao` | Data em que o novo plano deve ser aplicado (geralmente `acesso_expira_em` atual) |

A edge function **`aplicar-planos-pendentes`** roda diariamente (cron) e, para todos os perfis com `plano_pendente_data_aplicacao <= now()`:
1. Move `plano_pendente_*` → `plano` / `periodicidade`
2. Recalcula `acesso_expira_em`
3. Registra evento em `historico_planos` (`tipo_evento = 'downgrade_agendado'` ou `'upgrade_agendado'`)
4. Limpa os campos `plano_pendente_*`

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
**Edge Function:** `supabase/functions/enviar-recuperacao-senha/index.ts`

```
Clica "Esqueci minha senha" no login
  ↓
Digita email
  ↓
Edge Function: enviar-recuperacao-senha
  ↓
admin.generateLink({ type: 'recovery' })
  ↓
Extrai token_hash da action_link
  ↓
Constrói URL direta: ${SITE_URL}/auth/reset-password?token_hash=XXX&type=recovery
  ↓
Envia e-mail personalizado via Resend (noreply@umbrelladoce.com.br)
  ↓
Tela: "Verifique sua caixa de entrada"
```

**Página de redefinição:** `/auth/reset-password`  
**Componente:** `src/pages/auth/ResetPassword.tsx`

```
Usuário clica no link do e-mail
  ↓
Abre diretamente no domínio personalizado (caixa.umbrelladoce.com.br)
  ↓
Frontend verifica token via supabase.auth.verifyOtp({ token_hash, type: 'recovery' })
  ↓
Exibe formulário de nova senha
  ↓
Após redefinir: primeiro_acesso = false → signOut → redirect login
```

**Nota:** O fluxo bypassa o redirect do Supabase, enviando o token_hash diretamente via query params. Isso garante que o link do e-mail sempre aponte para o domínio personalizado (SITE_URL), sem depender da configuração de Redirect URLs do Supabase.

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
| `SITE_URL` | URL base para construir os links de recuperação/convite enviados via Resend |
| `RESEND_API_KEY` | Envio de e-mails transacionais (convite, recuperação de senha) |

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
| `supabase/functions/criar-usuario/index.ts` | Edge Function criação (admin) — inclui rate limit por IP |
| `supabase/functions/enviar-recuperacao-senha/index.ts` | Edge Function de recuperação de senha (Resend) |
| `supabase/functions/hotmart-webhook/index.ts` | Edge Function webhook Hotmart |
| `supabase/functions/aplicar-planos-pendentes/index.ts` | Cron diário que efetiva upgrades/downgrades agendados (`plano_pendente_*`) |
| `supabase/functions/notificar-expiracao-imersao/index.ts` | Notificações de fim de acesso para `aluna_imersao` |
