# Refinamento dos Grupos — Mestre, USER vinculado e MOTHER membro

## Conceito

- **ADMIN do grupo = "Mestre"**: dono dos dados base (Meus Dados, Mão de Obra, Backup). Passa pelo onboarding.
- **USER**: membro vinculado a um grupo. **Não** passa pelo onboarding — herda os dados base do mestre. Plano herdado do mestre.
- **MOTHER**: pode ser adicionada a qualquer grupo como ADMIN ou USER (escolha no momento), com acesso total e sem onboarding.
- Um grupo pode ter mais de um ADMIN, mas só o criador (mestre original) precisa concluir o onboarding. ADMINs adicionais (incluindo MOTHER promovida a ADMIN) pulam onboarding.

## Mudanças

### 1. Banco — migration

- Adicionar coluna `groups.master_user_id UUID` (FK auth.users) → marca o mestre original do grupo.
- Backfill: para cada grupo existente, `master_user_id = created_by_user_id` (ou o primeiro ADMIN ativo).
- Função `is_group_master(_user_id, _group_id) RETURNS boolean` — retorna true se for o `master_user_id`.
- Função `get_group_master(_group_id) RETURNS uuid`.

### 2. Onboarding (FirstAccessRedirect)

- Skip onboarding quando o usuário **não é o mestre de nenhum grupo ativo** (ou seja: só é USER/ADMIN secundário em grupos onde outro é o mestre).
- Mestre continua com o fluxo atual (BemVinda → Meus Dados → Mão de Obra → Backup → Concluído).
- MOTHER e admin legado continuam pulando, como hoje.

### 3. Criação de usuário (`admin/usuarios` + edge function `criar-usuario`)

Adicionar no dialog **Criar Novo Usuário** os campos:

- **Tipo de usuário**: `Mestre (novo grupo)` | `Membro de grupo existente`
- Se "Mestre": (fluxo atual) — campos de plano + cria grupo automaticamente com esse usuário como `master_user_id` e ADMIN.
- Se "Membro": seleciona **Grupo** (dropdown) + **Papel no grupo** (ADMIN secundário / USER) + **permission_flags** (se USER). Sem campos de plano (herda do mestre). `primeiro_acesso = true` para forçar troca de senha, mas onboarding é pulado.

Edge function:
- Aceita `tipo_usuario: 'mestre' | 'membro'`, `group_id?`, `role_group?`, `permission_flags?`.
- Para 'mestre': cria grupo, insere `user_group_roles (ADMIN)`, marca `groups.master_user_id`.
- Para 'membro': não cria grupo, não preenche plano. Insere `user_group_roles` com papel solicitado. Define `active_group_id` na primeira sessão.

### 4. GruposManager — adicionar MOTHER

- No dialog "Adicionar membro", buscar usuários incluindo MOTHER.
- Permitir escolher papel `ADMIN` ou `USER` (já existe). MOTHER recebe acesso total automaticamente se ADMIN.
- Badge visual "Mestre" no membro que é `master_user_id` do grupo (não pode ser removido nem rebaixado — só transferindo a mestria).
- Botão "Transferir mestria" (opcional, futuro) — fora deste escopo.

### 5. Herança do plano (USER)

`usePlano` / `useBusinessProfile` / lógica de acesso:
- Para USER, ler `plano_*` do mestre do `active_group_id` em vez do próprio perfil.
- Cria hook `useEffectivePlan()` que retorna o plano do mestre quando o usuário ativo é USER, ou o próprio plano se for ADMIN/mestre/MOTHER.
- Adaptar `PlanoGuard`, `useConversaDoceAccess`, badges no sidebar para usarem `useEffectivePlan`.

### 6. UI — esconder páginas de configuração base para USER

- Em `/configuracoes/dados-confeitaria`, `/configuracoes/precificacao/mao-de-obra`, `/configuracoes/backup`: mostrar mensagem "Estes dados são gerenciados pelo mestre do grupo (email do mestre)" e ocultar formulários para quem não é ADMIN/mestre.

### 7. Documentação

Atualizar `docs/DOCS_GOVERNANCA.md` e `docs/AUDITORIA.md` com:
- Conceito de mestre
- Skip de onboarding para membros
- Herança de plano
- Fluxo novo de criar usuário

## Ordem de execução

1. Migration (coluna `master_user_id` + funções + backfill).
2. Edge function `criar-usuario` (novos campos).
3. `CriarUsuarioDialog` (UI com seletor mestre/membro).
4. `FirstAccessRedirect` (skip onboarding p/ não-mestres).
5. `useEffectivePlan` + adaptações de plano.
6. Telas de configuração base (read-only p/ membros).
7. `GruposManager` (adicionar MOTHER, badge "Mestre").
8. Docs.
