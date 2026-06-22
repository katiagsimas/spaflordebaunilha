# 💳 DOCUMENTAÇÃO: Planos de Acesso, Vinculação de Usuários e Webhook Hotmart

**Versão:** 2.0  
**Atualizada em:** 22/06/2026  
**Escopo:** Catálogo de planos, vínculo com `profiles`, herança mestre→membros, provisionamento via Hotmart, regras de expiração, upgrade/downgrade, plano pendente e continuidade.

> ⚠️ **2026-05-25 — Plano `Caixa Start` DESCONTINUADO.**  
> Registro removido de `public.planos`; usuários migrados para `base` e desativados. Periodicidades `7dias`/`14dias` removidas do `diasMap`. O webhook trata eventuais menções a "start" como fallback para `base` (Lite). Mantemos referências históricas pontuais apenas para auditoria.

---

## 1. CATÁLOGO DE PLANOS

Tabela `public.planos` (registros vigentes):

| ID              | Nome                | Ativo | Em breve | Descrição                                                            |
|-----------------|---------------------|:-----:|:--------:|----------------------------------------------------------------------|
| `base`          | Caixa Lite          |  ✅   |    ❌    | Precificação, encomendas e parceiros — a fundação do negócio.        |
| `negocio`       | Caixa Business      |  ✅   |    ❌    | Gestão completa — produção, comercial, financeiro e estoque.         |
| `aluna_imersao` | Aluna da Imersão    |  ✅   |    ❌    | Acesso Business por **30 dias** — exclusivo de alunas da Imersão.    |
| ~~`start`~~     | ~~Caixa Start~~     | ❌    | —        | DESCONTINUADO (2026-05-25).                                          |
| `controle`      | Plano Controle      |  ❌   |    ✅    | Reservado para evolução futura (não disponível para venda).          |

### 1.1 Módulos liberados por plano

Definido em `src/hooks/usePlano.ts` (`MODULOS_POR_PLANO`):

| Plano             | Acesso                                                                                          |
|-------------------|-------------------------------------------------------------------------------------------------|
| **base** (Lite)   | Dashboard, Cadastros, Cardápio (precificação), Estoque, Parceiros, Vendas (Encomendas), Configurações base e Backup. **Bloqueados:** Financeiro, Negociações (Propostas/Contratos), Meu Salário. |
| **negocio**       | `*` — acesso total a todos os módulos.                                                          |
| **aluna_imersao** | Equivalente a `negocio` durante 30 dias; bloqueado quando `plano_fim < hoje`.                   |
| **controle**      | `[]` — bloqueado (em breve).                                                                    |

A rota raiz `/configuracoes` é sempre acessível. Itens bloqueados pelo plano aparecem na sidebar com **40% de opacidade + 🔒** e abrem o modal de upgrade ao clicar.

> O **plano efetivo do membro = plano do mestre** (`groups.master_user_id`). `usePlano` resolve isso automaticamente: se o usuário ativo é membro de um grupo cujo mestre é outra pessoa, busca `profiles.plano_id` do mestre.

### 1.2 Tipos de periodicidade (`profiles.plano_tipo`)

| Valor      | Duração (dias) | Usado por                                  |
|------------|---------------:|--------------------------------------------|
| `mensal`   | 30             | Caixa Business, Aluna Imersão (30 dias)    |
| `anual`    | 365            | Caixa Lite (sempre), Caixa Business        |

> **Regra fixa:** Caixa Lite (`base`) é sempre anual. Aluna da Imersão é sempre 30 dias.

### 1.3 Visão MOTHER

A MOTHER tem acesso total por padrão. Via `useMotherView` pode **simular** a visão de um plano específico (Lite / Business / Aluna Imersão) para inspecionar a UX do membro — sem perder seus privilégios reais.

---

## 2. VÍNCULO PLANO ↔ USUÁRIO

Colunas em `public.profiles`:

| Coluna                    | Tipo    | Descrição                                                              |
|---------------------------|---------|------------------------------------------------------------------------|
| `plano_id`                | text    | FK lógica para `planos.id` (`base`, `negocio`, `aluna_imersao`).       |
| `plano_tipo`              | text    | `mensal`, `anual`.                                                     |
| `plano_inicio`            | date    | Ativação do ciclo vigente (YYYY-MM-DD).                                |
| `plano_fim`               | date    | Expiração do ciclo vigente (YYYY-MM-DD).                               |
| `plano_pendente_id`       | text    | Plano agendado para virar ativo após `plano_fim` (downgrade agendado). |
| `plano_pendente_tipo`     | text    | Periodicidade do plano pendente.                                       |
| `plano_pendente_inicio`   | date    | Data prevista de início do plano pendente.                             |
| `plano_pendente_fim`      | date    | Data prevista de fim do plano pendente.                                |
| `ativo`                   | boolean | Habilita/desabilita acesso. Sincronizado com `plano_fim`.              |
| `origem_criacao`          | text    | `webhook` (Hotmart), `admin` (painel), `imersao` (provisionamento manual de aluna), `manual`. |
| `primeiro_acesso`         | boolean | Força o fluxo de definição de senha + onboarding.                      |
| `last_login`              | timestamptz | Último login bem-sucedido.                                         |

### 2.1 Triggers de proteção (em `profiles`)

| Trigger                            | Função                       | O que faz                                                                                                                          |
|------------------------------------|------------------------------|------------------------------------------------------------------------------------------------------------------------------------|
| `protect_profiles_plan_fields`     | `protect_plan_fields()`      | Bloqueia alterações em `plano_*` por usuários comuns. Apenas service role (`auth.uid() IS NULL`), MOTHER e admins legados passam. |
| `trg_enforce_plan_expiration`      | `enforce_plan_expiration()`  | Se `plano_fim < CURRENT_DATE`, força `ativo := false` em qualquer UPDATE/INSERT.                                                  |
| `on_profile_created_add_user_role` | —                            | Garante `user_roles.role = 'user'` em todo perfil criado.                                                                          |

### 2.2 Histórico (`historico_planos`)

Cada criação, alteração, renovação ou cancelamento gera um registro com:
- `tipo_evento`: `criacao` | `renovacao` | `upgrade` | `downgrade_agendado` | `reativacao` | `renovacao_imersao` | `cancelamento`
- `origem`: `webhook` | `admin` | `imersao` | `cron`
- `plano_anterior` / `plano_novo`, `plano_tipo_anterior` / `plano_tipo_novo`
- `plano_inicio`, `plano_fim`, `observacao`, `admin_id`

RLS: somente MOTHER/admin fazem `SELECT`/`INSERT`.

---

## 3. WEBHOOK HOTMART

**Edge Function:** `supabase/functions/hotmart-webhook/index.ts`  
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
| `anual`, `annual`, `yearly` (apenas para `negocio`)                  | `anual`                            |
| ausência das anteriores (apenas para `negocio`)                      | `mensal`                           |
| nenhuma das acima                                                    | `base` + `anual` (Lite, fallback)  |

> O plano **Aluna da Imersão** **não vem pelo webhook Hotmart** — é provisionado manualmente por uma rotina separada, com `origem_criacao = 'imersao'`, `plano_id = 'aluna_imersao'` e 30 dias de validade.

`calcularPlanoFim` soma os dias correspondentes ao `plano_tipo` ao `plano_inicio` (hoje, em UTC date).

### 3.3 Eventos tratados

| Evento Hotmart                                                                   | Ação                                                                                                  |
|----------------------------------------------------------------------------------|-------------------------------------------------------------------------------------------------------|
| `PURCHASE_APPROVED`, `PURCHASE_COMPLETE`                                         | Cria, reativa ou renova usuário. Classifica como `criacao`, `renovacao`, `upgrade` ou `reativacao`.   |
| `SWITCH_PLAN` (Lite→Business)                                                    | `upgrade` imediato — atualiza plano e estende `plano_fim`.                                            |
| `SWITCH_PLAN` (Business→Lite)                                                    | `downgrade_agendado` — mantém plano atual até `plano_fim`; novo plano vai para `plano_pendente_*` e é promovido pelo cron `aplicar-planos-pendentes`. |
| `PURCHASE_CANCELED`, `PURCHASE_REFUNDED`, `PURCHASE_CHARGEBACK`                  | `profiles.ativo = false` + `cancelamento` em `historico_planos`.                                      |
| `SUBSCRIPTION_CANCELLATION`                                                      | Idem desativação.                                                                                     |
| `PURCHASE_DELAYED`, `PURCHASE_PROTEST`                                           | Ignorado.                                                                                             |
| Demais                                                                            | Retorna `200 { action: 'unhandled' }`.                                                                |

### 3.4 Fluxo de ativação (PURCHASE_APPROVED/COMPLETE)

1. Lê e-mail do comprador (`buyer.email` → `subscriber.email` → `subscription.user.email`).
2. Procura usuário em `auth.users` (via `admin.listUsers`) **e** em `profiles`.
3. Casos:
   - **Usuário + perfil ativo** com mesmo plano → `renovacao` (estende `plano_fim`).
   - **Usuário + perfil ativo** com plano diferente → `upgrade` (se for para Business) ou `downgrade_agendado` (se for para Lite).
   - **Usuário inativo** → `reativacao` (`ativo=true`, novo ciclo).
   - **Usuário existe sem perfil** → `INSERT profiles` com `primeiro_acesso=true`.
   - **Usuário não existe** → `auth.admin.createUser` com senha aleatória e `email_confirm=true`, aguarda 2s para o trigger criar o perfil, atualiza com `planoFields`.
4. Faz `upsert` em `user_roles` (`role='user'`).
5. Registra entrada no `historico_planos` com o `tipo_evento` correspondente.
6. Dispara e-mails Resend (aluna + admin) descrevendo a mudança.

### 3.5 E-mails (Resend)

- Remetente: `Caixa de Açúcar <noreply@umbrelladoce.com.br>`
- Secret: `RESEND_API_KEY` (ausente = webhook **não falha**, apenas loga aviso).
- E-mails enviados:
  - Boas-vindas / primeiro acesso → orienta usar "Esqueci minha senha"
  - Renovação / upgrade / downgrade agendado / reativação → confirma o evento
  - Notificação ao admin (`EMAIL_ADMIN_IMERSAO` quando aplicável)

---

## 4. PROVISIONAMENTO MANUAL

### 4.1 Painel admin (`criar-usuario`)

**Edge Function:** `supabase/functions/criar-usuario/index.ts`  
**Auth:** JWT obrigatório + verificação MOTHER/admin.

Campos: `email`, `nomeCompleto`, `nomeConfeitaria`, `planoId`, `planoTipo`, `planoInicio`, `planoFim`/`planoExpiraEm`, `tipoUsuario` (Mestre/Membro), `grupoId` (se Membro), `role`.

Cálculo do `plano_fim` (se não informado): `planoInicio + 365` se `anual`, senão `+30`.

Origem registrada: `origem_criacao = 'admin'`.

- **Mestre** → cria grupo automaticamente (`groups.master_user_id = userId`), aplica plano próprio, passa pelo onboarding.
- **Membro** → associa a um grupo existente; **sem campos de plano** (herda do mestre); `primeiro_acesso = true`, `onboarding_concluido = true` (pula etapas de dados-base).

### 4.2 Aluna da Imersão

Provisionamento **fora do webhook Hotmart** (gravações ficam na Hotmart Club, não em produto pago via checkout). Fluxo:
- MOTHER/admin cria o usuário com `plano_id = 'aluna_imersao'`, `plano_tipo = 'mensal'`, `plano_fim = hoje + 30`.
- `origem_criacao = 'imersao'`.
- Após `plano_fim`, o cron `aplicar-planos-pendentes` desativa e oferece migração para plano pago (evento `renovacao_imersao` quando concluída).

---

## 5. CONTINUIDADE, EXPIRAÇÃO E UPGRADE

### 5.1 Verificação no login (`AuthContext.signIn`)

A cada login:
1. Aguarda `getSession()` antes de instalar o `onAuthStateChange` (evita race condition).
2. Carrega `profiles.ativo` e `profiles.plano_fim`.
3. Se `plano_fim < hoje` → `ativo=false` (redundante ao trigger) + `signOut` com mensagem **"Seu plano expirou. Entre em contato para renovar."**
4. Se `ativo=false` → bloqueio com mensagem **"Sua conta foi desabilitada."**
5. Se houve evento de plano recente (criação/renovação/upgrade) → toast informativo pós-login.

### 5.2 Vigia em runtime (`PlanExpirationWatcher`)

Componente headless montado no layout principal. A cada mudança de rota revalida `plano_fim`:
- Se expirado → `UPDATE profiles SET ativo=false` + `signOut()` + toast.
- Garante que sessões longas caiam imediatamente ao virar o dia da expiração.

### 5.3 Cron de planos pendentes (`aplicar-planos-pendentes`)

Edge function executada diariamente às **03:15 UTC** via pg_cron:
- Quando `plano_fim < hoje` **e** `plano_pendente_id IS NOT NULL`:
  - Promove `plano_pendente_*` → `plano_*` (ativo).
  - Limpa os campos `plano_pendente_*`.
  - Registra `renovacao` ou `downgrade_agendado` concluído em `historico_planos`.
- Quando `plano_fim < hoje` e **sem** plano pendente: `ativo = false`.

### 5.4 Alerta visual (`AlertaExpiracaoPlano`)

Banner global exibido para não-admin quando `0 ≤ diasRestantes ≤ 7`:
- Mensagens diferenciadas para "hoje", "amanhã" e "em N dias".
- Estilo padrão de alerta: fundo dourado, texto preto, CTA coral.
- Dismissable na sessão.

### 5.5 Bloqueio de módulo (`PlanoGuard` + `/upgrade`)

`src/components/PlanoGuard.tsx` consulta `usePlano().temAcesso(pathname)`. Se a rota não estiver nos módulos do plano, redireciona para `/upgrade`. Admin/MOTHER ignoram esta verificação.

A página `src/pages/Upgrade.tsx` exibe:
- Plano atual em badge.
- CTA principal **"Quero fazer o upgrade"** apontando para `caixa.umbrelladoce.com.br`.
- Botão "Voltar".

> Não existe fluxo de upgrade automático/self-service dentro do app. Todo upgrade real acontece via nova compra Hotmart (que dispara `SWITCH_PLAN`/`PURCHASE_APPROVED` automaticamente) ou ajuste manual pelo painel admin.

### 5.6 Renovação

| Cenário                                            | Mecanismo                                                                                                  |
|----------------------------------------------------|------------------------------------------------------------------------------------------------------------|
| Renovação automática Hotmart (assinatura recorrente) | Nova `PURCHASE_APPROVED` → `renovacao`, reativa `ativo=true`, recalcula `plano_fim`.                       |
| Upgrade (Lite → Business)                          | `SWITCH_PLAN` → `upgrade` imediato.                                                                        |
| Downgrade (Business → Lite)                        | `SWITCH_PLAN` → `downgrade_agendado` (vai para `plano_pendente_*`, promovido pelo cron na virada).         |
| Renovação manual administrativa                    | MOTHER/admin abre `EditarUsuarioDialog` e ajusta `plano_inicio`/`plano_fim`/`plano_tipo`.                  |
| Migração Aluna Imersão → plano pago                | `PURCHASE_APPROVED` Hotmart → `renovacao_imersao`.                                                         |
| Cancelamento                                       | Eventos de cancel/refund/chargeback → `ativo=false` (histórico registrado).                                |

---

## 6. ENFORCEMENT NO BACKEND

Camada adicional de proteção via RLS RESTRICTIVE:

- Função `user_has_financial_access(_user_id)` retorna `true` se o usuário (ou seu mestre) está em plano `negocio`, `aluna_imersao` ou é MOTHER/admin.
- Aplicada em todas as tabelas financeiras: `contas_pagar`, `contas_receber`, `contas_*_parcelas/pagamentos/comprovantes`, `bancos`, `transferencias_bancos`, `fechamentos_mensais`, `meu_salario_retiradas` etc.
- Bloqueia escrita no banco mesmo que o frontend seja burlado.

---

## 7. SECRETS NECESSÁRIAS

| Secret                       | Uso                                                              |
|------------------------------|------------------------------------------------------------------|
| `HOTMART_HOTTOK`             | Validação do webhook Hotmart.                                    |
| `RESEND_API_KEY`             | E-mails transacionais (boas-vindas, upgrade, renovação).         |
| `EMAIL_ADMIN_IMERSAO`        | Destino das notificações administrativas de Imersão.             |
| `SITE_URL`                   | Base usada em recuperação de senha e links de e-mail.            |
| `CRON_SECRET`                | Validação dos jobs agendados (`aplicar-planos-pendentes` etc.).  |

> `SUPABASE_SERVICE_ROLE_KEY` é injetada automaticamente nas edge functions pela infraestrutura do Lovable Cloud — não está acessível no painel.

---

## 8. ARQUIVOS DE REFERÊNCIA

| Arquivo                                                | Função                                                  |
|--------------------------------------------------------|---------------------------------------------------------|
| `supabase/functions/hotmart-webhook/index.ts`          | Webhook Hotmart (criação/renovação/upgrade/cancelamento). |
| `supabase/functions/aplicar-planos-pendentes/index.ts` | Cron diário — promove `plano_pendente_*`.               |
| `supabase/functions/criar-usuario/index.ts`            | Criação manual de usuário (mestre ou membro).           |
| `supabase/functions/enviar-recuperacao-senha/index.ts` | Recovery de senha via Resend.                           |
| `src/hooks/usePlano.ts`                                | Catálogo de módulos, herança mestre→membro, `temAcesso`. |
| `src/hooks/useMotherView.ts`                           | Simulação de plano pela MOTHER.                         |
| `src/hooks/useIsGroupMaster.ts`                        | Identifica o mestre do grupo ativo.                     |
| `src/components/PlanoGuard.tsx`                        | Guard de rotas baseado em plano.                        |
| `src/components/AlertaExpiracaoPlano.tsx`              | Banner de aviso (≤7 dias).                              |
| `src/components/PlanExpirationWatcher.tsx`             | Bloqueio imediato em expiração durante a sessão.        |
| `src/components/MotherPlanSelector.tsx`                | UI para MOTHER ajustar plano de um mestre.              |
| `src/contexts/AuthContext.tsx`                         | Validação de plano/ativo no login (aguarda `getSession()`). |
| `src/pages/Upgrade.tsx`                                | Página de bloqueio com CTA de upgrade.                  |
| `src/pages/admin/Usuarios.tsx`                         | Painel admin (visão geral, filtros e métricas).         |
| `src/pages/admin/Governanca.tsx`                       | Hub MOTHER (grupos, papéis, planos).                    |
| `src/components/admin/EditarUsuarioDialog.tsx`         | Edição de plano e histórico por usuário.                |
| `src/components/admin/CriarUsuarioDialog.tsx`          | Criação de mestre ou membro.                            |
| Trigger `protect_plan_fields()`                        | Bloqueia auto-promoção/auto-renovação.                  |
| Trigger `enforce_plan_expiration()`                    | Força `ativo=false` quando `plano_fim` passa.           |
| Função `user_has_financial_access()`                   | Enforcement RLS de módulos financeiros.                 |
| Tabela `historico_planos`                              | Auditoria completa do ciclo de vida do plano.           |

---

## 9. DOCUMENTOS RELACIONADOS

| Documento | Escopo |
|-----------|--------|
| [DOCS_MESTRE.md](./DOCS_MESTRE.md) | Índice canônico do sistema |
| [DOCS_GOVERNANCA.md](./DOCS_GOVERNANCA.md) | Mestre do grupo, RLS, roles, permission_flags |
| [DOCS_AUTENTICACAO.md](./DOCS_AUTENTICACAO.md) | Login, convites, primeiro acesso, recovery |
| [AUDITORIA.md](./AUDITORIA.md) | Log cronológico de correções relacionadas a planos |
