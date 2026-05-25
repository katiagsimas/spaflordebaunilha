# 💳 DOCUMENTAÇÃO: Planos de Acesso, Vinculação de Usuários e Webhook Hotmart

**Versão:** 1.2
**Atualizada em:** 25/05/2026
**Escopo:** Catálogo de planos, vínculo com `profiles`, provisionamento via Hotmart, regras de expiração, upgrade e continuidade.

> ⚠️ **2026-05-25 — Plano `Caixa Start` DESCONTINUADO.**
> Registro removido de `public.planos`; usuários migrados para `base` e desativados. O webhook Hotmart **não rejeita mais** por palavra-chave `start` — eventos são resolvidos como `base` (Lite) ou `negocio` (Business) conforme demais palavras-chave. Periodicidades `7dias`/`14dias` removidas de `diasMap`. As menções ao Start abaixo permanecem **apenas como referência histórica** e não refletem o comportamento atual.


---

## 1. CATÁLOGO DE PLANOS

Tabela `public.planos` (registros vigentes):

| ID         | Nome             | Ativo | Em breve | Descrição                                                                  |
|------------|------------------|:-----:|:--------:|----------------------------------------------------------------------------|
| `base`     | Caixa Lite       |  ✅   |    ❌    | Precificação e controle de pedidos — a fundação do negócio.                |
| `negocio`  | Caixa Business   |  ✅   |    ❌    | Gestão financeira completa — do pedido ao caixa.                           |
| ~~`start`~~ | ~~Caixa Start~~ | ❌ DESCONT. | — | Histórico: acesso completo em janela de 7/14 dias. Removido em 2026-05-25. |
| `controle` | Plano Controle   |  ❌   |    ✅    | Controle de estoque e produção (não disponível para venda).                |

### 1.1 Módulos liberados por plano

Definido em `src/hooks/usePlano.ts` (`MODULOS_POR_PLANO`):

| Plano       | Acesso                                                                                       |
|-------------|----------------------------------------------------------------------------------------------|
| **base**    | Dashboard, Precificação, Encomendas, Clientes, Fornecedores e Configurações listadas. **Sem** Financeiro, Estoque, Meu Salário, Planejamento. |
| **negocio** | `*` — acesso total.                                                                          |
| **controle**| `[]` — bloqueado (em breve).                                                                 |
| ~~**start**~~ | ~~Histórico: acesso total `*` em janela de 7/14 dias.~~ Descontinuado em 2026-05-25.       |

A rota `/configuracoes` (raiz) é sempre acessível. Os módulos `/estoque`, `/planejamento` e `/meu-salario` ficam bloqueados para não-admin via `PlanoGuard` (ainda em desenvolvimento para usuários comuns).

### 1.2 Tipos de periodicidade (`profiles.plano_tipo`)

| Valor      | Duração (dias) | Usado por                  |
|------------|---------------:|----------------------------|
| `mensal`   | 30             | Caixa Business             |
| `anual`    | 365            | Caixa Lite (sempre), Caixa Business |
| ~~`7dias`~~ | ~~7~~         | ~~Caixa Start~~ (descontinuado)    |
| ~~`14dias`~~ | ~~14~~       | ~~Caixa Start~~ (descontinuado)    |

> **Regra fixa:** Caixa Lite (`base`) é sempre anual. Periodicidades `7dias`/`14dias` foram removidas do `diasMap` (webhook e dialogs admin) em 2026-05-25.

---

## 2. VÍNCULO PLANO ↔ USUÁRIO

Colunas em `public.profiles`:

| Coluna           | Tipo    | Descrição                                                          |
|------------------|---------|--------------------------------------------------------------------|
| `plano_id`       | text    | FK lógica para `planos.id` (`base`, `negocio`, `controle`). Histórico pode conter `start`. |
| `plano_tipo`     | text    | `mensal`, `anual`. Histórico pode conter `7dias`/`14dias`.         |
| `plano_inicio`   | date    | Data de ativação do ciclo vigente (YYYY-MM-DD).                    |
| `plano_fim`      | date    | Data de expiração (YYYY-MM-DD).                                    |
| `ativo`          | boolean | Habilita/desabilita acesso. Sincronizado com `plano_fim`.          |
| `origem_criacao` | text    | `webhook` (Hotmart), `admin` (painel), `manual`.                   |

### 2.1 Triggers de proteção (em `profiles`)

| Trigger                          | Função                       | O que faz                                                                                                 |
|----------------------------------|------------------------------|-----------------------------------------------------------------------------------------------------------|
| `protect_profiles_plan_fields`   | `protect_plan_fields()`      | Bloqueia alterações em `plano_id`, `plano_tipo`, `plano_inicio`, `plano_fim` e `ativo` por não-admin. Service role (`auth.uid() IS NULL`) e `admin` passam. |
| `trg_enforce_plan_expiration`    | `enforce_plan_expiration()`  | Se `plano_fim < CURRENT_DATE`, força `ativo := false` em qualquer UPDATE/INSERT.                          |
| `on_profile_created_add_user_role` | —                          | Garante `user_roles.role = 'user'` em todo perfil criado.                                                 |

### 2.2 Histórico (`historico_planos`)

Cada criação, alteração ou cancelamento gera um registro com:
- `tipo_evento`: `criacao` | `alteracao` | `cancelamento`
- `origem`: `webhook` | `admin`
- `plano_anterior` / `plano_novo`, `plano_tipo_anterior` / `plano_tipo_novo`
- `plano_inicio`, `plano_fim`, `observacao`, `admin_id`

RLS: somente admins fazem `SELECT`/`INSERT`.

---

## 3. WEBHOOK HOTMART

**Edge Function:** `supabase/functions/hotmart-webhook/index.ts`  
**URL pública:** `https://lypifrxdzjfdgkcacubl.supabase.co/functions/v1/hotmart-webhook`  
**Auth:** `verify_jwt = false` (validação via `hottok`).  
**Secret obrigatória:** `HOTMART_HOTTOK`.

### 3.1 Validação do `hottok`

Aceita o token em três origens (na ordem):
1. Query string `?hottok=...`
2. Header `x-hotmart-hottok`
3. Campo `hottok` no corpo do payload

Comparação estrita contra `Deno.env.get('HOTMART_HOTTOK')`. Falha → `401`.

### 3.2 Detecção de plano (`resolverPlano`)

Concatena os possíveis nomes recebidos da Hotmart para maximizar matches:

```
plan.name | offer.key | offer.name | offer.code | product.name
```

Regras (case-insensitive):

| Palavra-chave detectada                                              | Resultado                          |
|----------------------------------------------------------------------|------------------------------------|
| `business`, `negocio`, `negócio`, `caixa business`                   | `negocio` (+ ver periodicidade)    |
| nenhuma das acima (inclusive `start`/`caixa start`)                  | `base` + `anual` (Lite)            |
| `anual`, `annual`, `yearly` (apenas para `negocio`)                  | `anual`                            |
| ausência das anteriores (apenas para `negocio`)                      | `mensal`                           |

> Após 2026-05-25 a palavra-chave `start` **não é mais tratada** — eventos Hotmart com plano Start caem no fallback `base`/`anual`.

`calcularPlanoFim` soma os dias correspondentes ao `plano_tipo` ao `plano_inicio` (hoje, em UTC date).

### 3.3 Eventos tratados

| Evento Hotmart                                                                   | Ação                                                                                          |
|----------------------------------------------------------------------------------|-----------------------------------------------------------------------------------------------|
| `PURCHASE_APPROVED`, `PURCHASE_COMPLETE`                                         | Cria ou reativa usuário, aplica plano/periodicidade, envia e-mail de boas-vindas via Resend.  |
| `PURCHASE_CANCELED`, `PURCHASE_REFUNDED`, `PURCHASE_CHARGEBACK`                  | `profiles.ativo = false` + registro `cancelamento` em `historico_planos`.                     |
| `SUBSCRIPTION_CANCELLATION`                                                      | Idem desativação.                                                                             |
| `SWITCH_PLAN`                                                                    | Atualiza `plano_id`, `plano_tipo`, `plano_inicio`, `plano_fim`; registra `alteracao`.         |
| `PURCHASE_DELAYED`, `PURCHASE_PROTEST`                                           | Ignorado (sem alterações de estado).                                                          |
| Demais                                                                            | Retorna `200 { action: 'unhandled' }`.                                                        |

### 3.4 Fluxo de ativação (PURCHASE_APPROVED/COMPLETE)

1. Lê e-mail do comprador (`buyer.email` → `subscriber.email` → `subscription.user.email`).
2. Procura usuário existente no `auth.users` (via `admin.listUsers`) **e** em `profiles`.
3. Casos:
   - **Usuário + perfil existem** → `UPDATE profiles SET ativo=true, ...planoFields`. Se o perfil estava inativo, marca `primeiro_acesso = true` e envia e-mail de boas-vindas.
   - **Usuário existe sem perfil** → `INSERT profiles` com `primeiro_acesso=true` + e-mail.
   - **Usuário não existe** → `auth.admin.createUser` com senha aleatória (`crypto.randomUUID()`) e `email_confirm=true`, aguarda 2s para o trigger criar o perfil, atualiza com `planoFields`, envia e-mail orientando "Esqueci minha senha".
4. Faz `upsert` em `user_roles` (`role='user'`).
5. Registra entrada `criacao` em `historico_planos` com `origem='webhook'`.

### 3.5 E-mail de boas-vindas (Resend)

- Remetente: `Caixa de Açúcar <noreply@umbrelladoce.com.br>`
- Secret: `RESEND_API_KEY` (se ausente, o webhook **não falha** — apenas loga aviso).
- Texto orienta o usuário a usar "Esqueci minha senha" em `caixa.umbrelladoce.com.br` para definir a senha.
- Plano exibido: `Caixa Business` (`negocio`) ou `Caixa Lite` (demais).

---

## 4. PROVISIONAMENTO MANUAL (PAINEL ADMIN)

**Edge Function:** `supabase/functions/criar-usuario/index.ts`  
**Auth:** JWT obrigatório + verificação de `user_roles.role = 'admin'`.

Campos recebidos: `email`, `nomeCompleto`, `nomeConfeitaria`, `planoId`, `planoTipo`, `planoInicio`, `planoFim`/`planoExpiraEm`, `role`.

Cálculo do `plano_fim` (se não informado): `planoInicio + 365 dias` se `anual`, senão `+30 dias`.

Origem registrada: `origem_criacao = 'admin'`.

---

## 5. CONTINUIDADE, EXPIRAÇÃO E UPGRADE

### 5.1 Verificação no login (`AuthContext.signIn`)

A cada login:
1. Carrega `profiles.ativo` e `profiles.plano_fim`.
2. Se `plano_fim < hoje` → atualiza `ativo=false` (redundante ao trigger) e dispara `signOut` com mensagem **"Seu plano expirou. Entre em contato com o administrador para renovar."**
3. Se `ativo=false` → bloqueio com mensagem **"Sua conta foi desabilitada."**

### 5.2 Vigia em runtime (`PlanExpirationWatcher`)

Componente headless montado no layout principal. Em cada mudança de rota, revalida o `plano_fim` do usuário logado:
- Se expirado → `UPDATE profiles SET ativo=false` + `signOut()` + toast.
- Garante que sessões longas (token ainda válido) caiam imediatamente ao virar o dia da expiração.

### 5.3 Alerta visual (`AlertaExpiracaoPlano`)

Banner global exibido para não-admin quando `0 ≤ diasRestantes ≤ 7`:
- Mensagens diferenciadas para "hoje", "amanhã" e "em N dias".
- Para plano `start`, mostra CTA **"Fazer Upgrade"** apontando para `https://caixadeacucar.lovable.app/` (página comercial).
- Dismissable na sessão.

### 5.4 Bloqueio de módulo (`PlanoGuard` + `/upgrade`)

`src/components/PlanoGuard.tsx` consulta `usePlano().temAcesso(pathname)`. Se a rota não estiver nos módulos do plano, redireciona para `/upgrade`.

A página `src/pages/Upgrade.tsx` exibe:
- Plano atual em badge.
- CTA principal **"Falar no WhatsApp"** com mensagem pré-formatada para a Ká.
- Botão "Voltar".

> Não existe fluxo de upgrade automático/self-service dentro do app. Todo upgrade é **manual**: o cliente fala com a equipe (WhatsApp) ou compra outro produto na Hotmart — neste caso o evento `SWITCH_PLAN` (ou um novo `PURCHASE_APPROVED`) atualiza o registro automaticamente.

### 5.5 Renovação

Caminhos possíveis:

| Cenário                                            | Mecanismo                                                                                                  |
|----------------------------------------------------|------------------------------------------------------------------------------------------------------------|
| Renovação automática Hotmart (assinatura recorrente) | Nova `PURCHASE_APPROVED` → reativa `ativo=true`, recalcula `plano_fim`.                                    |
| Troca de plano (cliente migra de Lite → Business)  | `SWITCH_PLAN` → atualiza `plano_id`/`plano_tipo` e estende `plano_fim`.                                    |
| Renovação manual administrativa                    | Admin abre `EditarUsuarioDialog` e ajusta `plano_inicio`/`plano_fim`/`plano_tipo` (registra `alteracao`).  |
| Cancelamento                                       | Eventos de cancel/refund/chargeback → `ativo=false` (histórico registrado).                                |

---

## 6. SECRETS NECESSÁRIAS

| Secret                       | Uso                                                              |
|------------------------------|------------------------------------------------------------------|
| `HOTMART_HOTTOK`             | Validação do webhook Hotmart.                                    |
| `RESEND_API_KEY`             | E-mails transacionais (boas-vindas, recuperação de senha).       |
| `SUPABASE_SERVICE_ROLE_KEY`  | Operações privilegiadas no webhook e em `criar-usuario`.         |
| `SITE_URL`                   | Base usada em recuperação de senha.                              |

---

## 7. ARQUIVOS DE REFERÊNCIA

| Arquivo                                                | Função                                                  |
|--------------------------------------------------------|---------------------------------------------------------|
| `supabase/functions/hotmart-webhook/index.ts`          | Webhook Hotmart (criação/atualização/cancelamento).     |
| `supabase/functions/criar-usuario/index.ts`            | Criação manual de usuário pelo admin.                   |
| `src/hooks/usePlano.ts`                                | Catálogo de módulos e helper `temAcesso`.               |
| `src/components/PlanoGuard.tsx`                        | Guard de rotas baseado em plano.                        |
| `src/components/AlertaExpiracaoPlano.tsx`              | Banner de aviso (≤7 dias).                              |
| `src/components/PlanExpirationWatcher.tsx`             | Bloqueio imediato em expiração durante a sessão.        |
| `src/contexts/AuthContext.tsx`                         | Validação de plano/ativo no login.                      |
| `src/pages/Upgrade.tsx`                                | Página de bloqueio com CTA de upgrade.                  |
| `src/pages/admin/Usuarios.tsx`                         | Painel admin (visão geral, filtros e métricas).         |
| `src/components/admin/EditarUsuarioDialog.tsx`         | Edição de plano e histórico por usuário.                |
| Trigger `protect_plan_fields()`                        | Bloqueia auto-promoção/auto-renovação.                  |
| Trigger `enforce_plan_expiration()`                    | Força `ativo=false` quando `plano_fim` passa.           |
| Tabela `historico_planos`                              | Auditoria de criações/alterações/cancelamentos.         |
