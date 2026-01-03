# DOCUMENTAÇÃO: Sistema de Governança e Grupos

## 1. VISÃO GERAL

O sistema implementa uma arquitetura multi-tenant com:
- **MOTHER**: Administrador global único do sistema (governança)
- **ADMIN**: Administrador de um grupo específico
- **USER**: Usuário comum de um grupo com permissões granulares

### Princípios de Isolamento
- Dados são sempre filtrados por `owner_group_id`
- MOTHER não tem acesso automático a dados de grupos
- Cada usuário pode participar de múltiplos grupos

---

## 2. MODELO DE DADOS

### Tabela: `groups`
Representa um grupo/empresa no sistema.

| Campo | Tipo | Descrição |
|-------|------|-----------|
| id | UUID | Identificador único |
| name | TEXT | Nome do grupo |
| created_by_user_id | UUID | Usuário que criou |
| is_active | BOOLEAN | Se está ativo |
| created_at | TIMESTAMP | Data de criação |
| updated_at | TIMESTAMP | Última atualização |

### Tabela: `user_global_roles`
Define papéis globais (apenas MOTHER por enquanto).

| Campo | Tipo | Descrição |
|-------|------|-----------|
| id | UUID | Identificador único |
| user_id | UUID | ID do usuário |
| role_global | ENUM | 'MOTHER' |
| is_active | BOOLEAN | Se está ativo |

### Tabela: `user_group_roles`
Define participação e papel do usuário em grupos.

| Campo | Tipo | Descrição |
|-------|------|-----------|
| id | UUID | Identificador único |
| user_id | UUID | ID do usuário |
| group_id | UUID | ID do grupo |
| role_group | ENUM | 'ADMIN' ou 'USER' |
| permission_flags | JSONB | Permissões granulares |
| is_active | BOOLEAN | Se está ativo |

### Tabela: `user_active_session`
Controla qual grupo está ativo para o usuário.

| Campo | Tipo | Descrição |
|-------|------|-----------|
| user_id | UUID | ID do usuário (UNIQUE) |
| active_group_id | UUID | Grupo ativo |
| mode | TEXT | 'system' ou 'group' |

### Coluna em Tabelas Funcionais: `owner_group_id`
Adicionada em todas as tabelas de dados para isolamento:
- profiles, clientes, fornecedores, receitas
- ingredientes, embalagens, encomendas
- categorias, custos_fixos, bancos
- contas_pagar, contas_receber, pre_preparos
- tipos_insumos, unidades_medida, plano_contas
- categorias_plano_contas, tipos_documento
- mao_obra_perfis, configuracoes_juros, tags_encomendas

---

## 3. PERMISSÕES GRANULARES (permission_flags)

```json
{
  "financeiro_view": true,
  "financeiro_edit": false,
  "metas_view": true,
  "metas_edit": false,
  "tarefas_view": true,
  "tarefas_edit": false,
  "cadastros_view": true,
  "cadastros_edit": false,
  "receitas_view": true,
  "receitas_edit": false,
  "encomendas_view": true,
  "encomendas_edit": false,
  "precificacao_view": true,
  "precificacao_edit": false,
  "admin_users_manage": false
}
```

**Regras:**
- ADMIN tem todas as permissões automaticamente
- USER segue o que está definido em permission_flags

---

## 4. FUNÇÕES SQL DE VERIFICAÇÃO

| Função | Retorno | Descrição |
|--------|---------|-----------|
| `is_mother(user_id)` | BOOLEAN | Se é MOTHER |
| `get_user_group_role(user_id, group_id)` | role_group | Papel no grupo |
| `is_group_admin(user_id, group_id)` | BOOLEAN | Se é ADMIN |
| `user_belongs_to_group(user_id, group_id)` | BOOLEAN | Se pertence |
| `get_active_group_id(user_id)` | UUID | Grupo ativo |
| `has_permission(user_id, group_id, permission)` | BOOLEAN | Tem permissão |

---

## 5. POLÍTICAS RLS

### Grupos
- MOTHER pode ver/criar/editar/deletar todos
- Usuários veem apenas grupos onde participam

### Papéis de Grupo
- Usuários veem seus próprios papéis
- MOTHER vê todos
- ADMIN vê papéis do seu grupo
- ADMIN pode criar/editar USER no seu grupo
- MOTHER pode criar qualquer papel

### Sessão Ativa
- Cada usuário gerencia apenas sua própria sessão

---

## 6. COMPONENTES REACT

### GroupContext (`src/contexts/GroupContext.tsx`)
Provê estado global de grupos e permissões.

**Estado:**
- `groups`: Lista de grupos do usuário
- `activeGroupId`: ID do grupo ativo
- `activeRole`: Papel no grupo ativo (ADMIN/USER)
- `sessionMode`: 'system' ou 'group'
- `isMother`: Se é MOTHER

**Métodos:**
- `setActiveGroup(groupId)`: Trocar grupo ativo
- `setSessionMode(mode)`: Trocar modo (MOTHER only)
- `hasPermission(permission)`: Verificar permissão
- `isGroupAdmin()`: Se é ADMIN do grupo ativo

### GroupSelector (`src/components/GroupSelector.tsx`)
Dropdown para selecionar grupo ativo e alternar modos.

### PermissionGuard (`src/components/PermissionGuard.tsx`)
Componente para proteger conteúdo baseado em permissões.

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

### useGroupFilter (`src/hooks/useGroupFilter.ts`)
Hook para filtrar queries pelo grupo ativo.

```tsx
const { getGroupId, canAccessData, addGroupFilter, getGroupInsertData } = useGroupFilter();

// Filtrar query
const query = supabase.from('clientes').select('*');
const filteredQuery = addGroupFilter(query);

// Inserir com grupo
const insertData = {
  nome: 'Cliente',
  ...getGroupInsertData()
};
```

---

## 7. PÁGINAS DE ADMINISTRAÇÃO

### Governança (`/admin/governanca`)
- Apenas para MOTHER
- Criar/editar/desativar grupos
- Adicionar usuários a grupos
- Definir papéis (ADMIN/USER)
- Definir MOTHER

### Usuários do Grupo (`/admin/usuarios-grupo`)
- Para ADMIN do grupo
- Ver membros do grupo
- Editar permissões de USERs
- Ativar/desativar usuários

---

## 8. MIGRAÇÃO DE DADOS

A migração automática:
1. Cria um grupo para cada usuário existente (nome da confeitaria)
2. Define o usuário como ADMIN do seu grupo
3. Atualiza `owner_group_id` em todas as tabelas funcionais
4. Cria sessão ativa para o usuário

---

## 9. FLUXO DE USO

### Primeiro Acesso
1. Usuário faz login
2. Sistema cria grupo automaticamente
3. Usuário é definido como ADMIN do grupo
4. Sessão ativa é criada

### Operação Normal
1. Usuário seleciona grupo no dropdown (se tiver múltiplos)
2. Todas as queries são filtradas por `owner_group_id`
3. Permissões são verificadas via `hasPermission()`

### MOTHER
1. Pode alternar entre "Modo Sistema" e "Modo Grupo"
2. No Modo Sistema, acessa governança
3. No Modo Grupo, opera como ADMIN/USER normal

---

## 10. PRÓXIMOS PASSOS (Opcional)

1. **Atualizar hooks existentes** para usar `useGroupFilter`
2. **Adicionar PermissionGuard** em componentes sensíveis
3. **Criar primeiro MOTHER** via SQL ou edge function
4. **Testes de isolamento** entre grupos
