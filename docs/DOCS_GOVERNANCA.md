# 🏛️ DOCUMENTAÇÃO: Governança e Grupos — Caixa de Açúcar

**Atualizada em:** 26/05/2026

---

## 1. VISÃO GERAL

Arquitetura multi-tenant com isolamento total via `owner_group_id`:

| Papel | Escopo | Descrição |
|-------|--------|-----------|
| **MOTHER** | Global | Administrador único — governança de grupos |
| **ADMIN** | Grupo | Administrador de um grupo específico |
| **USER** | Grupo | Usuário com permissões granulares |

### Princípios
- Dados sempre filtrados por `owner_group_id`
- MOTHER **não** tem acesso automático a dados de grupos
- MOTHER deve ser adicionada como membro para operar num grupo
- ADMIN vê 100% dos dados do seu grupo
- USER vê/edita conforme `permission_flags`

---

## 2. MODELO DE DADOS

### `groups`
| Campo | Tipo | Descrição |
|-------|------|-----------|
| id | UUID | PK |
| name | TEXT | Nome do grupo |
| created_by_user_id | UUID | Criador |
| is_active | BOOLEAN | Ativo (default: true) |

### `user_global_roles`
| Campo | Tipo | Descrição |
|-------|------|-----------|
| user_id | UUID | FK auth.users |
| role_global | ENUM | `'MOTHER'` |
| is_active | BOOLEAN | Ativo |

### `user_group_roles`
| Campo | Tipo | Descrição |
|-------|------|-----------|
| user_id | UUID | FK auth.users |
| group_id | UUID | FK groups |
| role_group | ENUM | `'ADMIN'` ou `'USER'` |
| permission_flags | JSONB | Permissões granulares |
| is_active | BOOLEAN | Ativo |

### `user_active_session`
| Campo | Tipo | Descrição |
|-------|------|-----------|
| user_id | UUID | PK (UNIQUE) |
| active_group_id | UUID | Grupo ativo |
| mode | TEXT | `'system'` ou `'group'` |

### Coluna `owner_group_id`
Adicionada em **todas** as tabelas funcionais:
> profiles, clientes, fornecedores, receitas, ingredientes, embalagens, encomendas, categorias, custos_fixos, bancos, contas_pagar, contas_receber, pre_preparos, tipos_insumos, unidades_medida, plano_contas, categorias_plano_contas, tipos_documento, mao_obra_perfis, configuracoes_juros, tags_encomendas, encomenda_itens

---

## 3. PERMISSION FLAGS

```json
{
  "financeiro_view": true,    "financeiro_edit": false,
  "metas_view": true,         "metas_edit": false,
  "tarefas_view": true,       "tarefas_edit": false,
  "cadastros_view": true,     "cadastros_edit": false,
  "receitas_view": true,      "receitas_edit": false,
  "encomendas_view": true,    "encomendas_edit": false,
  "precificacao_view": true,  "precificacao_edit": false,
  "admin_users_manage": false
}
```

- **ADMIN**: todas as permissões automaticamente (ignora flags)
- **USER**: segue permission_flags

---

## 4. FUNÇÕES SQL

| Função | Retorno | Descrição |
|--------|---------|-----------|
| `is_mother(user_id)` | BOOLEAN | Se é MOTHER |
| `is_group_admin(user_id, group_id)` | BOOLEAN | Se é ADMIN do grupo |
| `user_belongs_to_group(user_id, group_id)` | BOOLEAN | Se pertence ao grupo |
| `get_active_group_id(user_id)` | UUID | Grupo ativo |
| `has_permission(user_id, group_id, permission)` | BOOLEAN | Tem permissão |
| `get_user_group_role(user_id, group_id)` | role_group | Papel no grupo |

---

## 5. POLÍTICAS RLS

### groups
- MOTHER: CRUD completo
- Usuários: SELECT onde participam (via user_group_roles)

### user_group_roles
- Usuários: SELECT próprios papéis
- MOTHER: CRUD completo
- ADMIN: SELECT/INSERT/UPDATE de USERs do seu grupo

### user_active_session
- Cada usuário gerencia apenas sua sessão

### Tabelas funcionais
- `SELECT/INSERT/UPDATE/DELETE`: `auth.uid() = usuario_id`

### Tabelas filhas
- Verificação via `EXISTS (SELECT 1 FROM tabela_pai ...)`

---

## 6. COMPONENTES REACT

### GroupContext (`src/contexts/GroupContext.tsx`)

**Estado:**
- `groups`: Lista de grupos do usuário
- `activeGroupId`: ID do grupo ativo
- `activeGroup`: Objeto do grupo ativo
- `activeRole`: `'ADMIN'` ou `'USER'`
- `sessionMode`: `'system'` ou `'group'`
- `isMother`: boolean

**Métodos:**
- `setActiveGroup(groupId)`: Trocar grupo (persiste em user_active_session)
- `setSessionMode(mode)`: Trocar modo (MOTHER only)
- `refreshGroups()`: Recarregar dados
- `hasPermission(permission)`: Verifica permissão (ADMIN sempre true)
- `isGroupAdmin()`: Se é ADMIN do grupo ativo
- `canManageUsers()`: isGroupAdmin ou admin_users_manage

### GroupSelector (`src/components/GroupSelector.tsx`)
Dropdown para selecionar grupo ativo e alternar modos (MOTHER).

### PermissionGuard (`src/components/PermissionGuard.tsx`)

```tsx
<PermissionGuard permission="financeiro_edit">
  <BotaoEditar />
</PermissionGuard>

<PermissionGuard requireAdmin>
  <PainelAdmin />
</PermissionGuard>

<PermissionGuard requireMother>
  <GovernancaGlobal />
</PermissionGuard>
```

Quando sem permissão, exibe card de "Acesso Restrito" (com ícone Lock).

### useGroupFilter (`src/hooks/useGroupFilter.ts`)

```tsx
const { addGroupFilter, getGroupInsertData, canAccessData, getGroupId } = useGroupFilter();

// Filtrar query
const query = supabase.from('clientes').select('*');
const filtered = addGroupFilter(query); // adiciona .eq('owner_group_id', activeGroupId)

// Inserir com grupo
const data = { nome: 'Cliente', ...getGroupInsertData() };
```

- Em modo sistema: retorna UUID nulo para não retornar dados
- `getGroupInsertData()` lança erro se em modo sistema

---

## 7. PÁGINAS DE ADMINISTRAÇÃO

### Governança (`/admin/governanca`) — MOTHER only
- Criar/editar/desativar grupos
- Adicionar usuários a grupos
- Definir papéis (ADMIN/USER)
- Gerenciar permissões

### Usuários (`/admin/usuarios`) — Admin legado
- Listar usuários com filtros
- Editar dados e plano
- Ativar/desativar
- Exportar Excel

### Logs (`/admin/logs`) — Admin legado
- Histórico de ações administrativas

---

## 8. SIDEBAR E NAVEGAÇÃO

### Menu Principal (todos)
Dashboard, Encomendas, Clientes, Fornecedores, Financeiro, Precificação, Configurações

### Governança (MOTHER only)
Exibido com ícone Crown dourado: "Grupos e Usuários"

### Sistema (Admin legado)
Exibido para usuários com role `admin` em `user_roles`: Usuários, Logs de Ações

### Footer
Mostra: nome da confeitaria, email, badges de role (Admin/Usuário/MOTHER)

---

## 9. CONCEITO DE "MESTRE" DO GRUPO — atualização 08/06/2026

Cada grupo tem um **mestre** (`groups.master_user_id`) — o usuário responsável pelos dados base:
- Meus Dados (perfil/confeitaria, endereço, contatos)
- Mão de Obra (perfis de produção)
- Backup do grupo
- Plano contratado (membros herdam)

### Regras

| Aspecto | Mestre (ADMIN principal) | Membro (USER ou ADMIN secundário) | MOTHER |
|--------|-------------------------|-----------------------------------|--------|
| Onboarding obrigatório | Sim | **Não** (pula direto p/ Dashboard) | Não |
| Edita Meus Dados / Mão de Obra / Backup | Sim | Não (vê aviso "gerenciado por…") | Sim |
| Plano | Próprio | Herda do mestre via `usePlano` | Acesso total |
| Pode ser removido do grupo | Não (proteção UI) | Sim | Sim, se não for mestre |
| Pode ser rebaixado para USER | Não | Sim | Sim, se não for mestre |

### Fluxo "Criar Novo Usuário"

O dialog admin (`/admin/usuarios`) agora pergunta **Mestre** ou **Membro**:
- **Mestre**: cria um novo grupo automaticamente (nome = nome da confeitaria), com plano próprio. Passa pelo onboarding.
- **Membro**: seleciona um grupo existente + papel (USER/ADMIN secundário). Sem campos de plano. `onboarding_concluido = true` automaticamente.

### MOTHER em grupos

MOTHER pode ser adicionada a qualquer grupo (no GruposManager) como ADMIN ou USER. Recebe acesso total ao grupo independentemente do papel.

### Funções SQL adicionadas

- `is_group_master(_user_id, _group_id)` — true se o usuário é o mestre.
- `get_group_master(_group_id)` — retorna o `master_user_id`.
- `user_is_any_group_master(_user_id)` — true se for mestre de algum grupo ativo (usado pelo `FirstAccessRedirect`).

### Componentes adicionados

- `src/hooks/useIsGroupMaster.ts` — hook para saber se o usuário atual é mestre do grupo ativo.
- `src/components/MasterOnlyGuard.tsx` — card "Gerenciado pelo mestre" para membros que tentam acessar páginas de configuração base.
