# 🏛️ DOCUMENTAÇÃO: Governança e Grupos — Spa Flor de Baunilha

**Atualizada em:** 22/06/2026

---

## 1. VISÃO GERAL

Arquitetura multi-tenant com isolamento total via `owner_group_id`:

| Papel | Escopo | Descrição |
|-------|--------|-----------|
| **MOTHER** | Global | Administrador único da Spa Flor de Baunilha — governança de grupos |
| **ADMIN** | Grupo | Administrador de um grupo específico (mestre ou secundário) |
| **USER** | Grupo | Usuário com permissões granulares |

### Princípios
- Dados sempre filtrados por `owner_group_id`
- MOTHER **não** tem acesso automático aos dados de um grupo — precisa ser adicionada como membro para operar
- ADMIN vê 100% dos dados do seu grupo
- USER vê/edita conforme `permission_flags`
- Cada grupo tem um **mestre** (`groups.master_user_id`) — dono dos dados-base e do plano contratado (ver Seção 9)

---

## 2. MODELO DE DADOS

### `groups`
| Campo | Tipo | Descrição |
|-------|------|-----------|
| id | UUID | PK |
| name | TEXT | Nome do grupo (geralmente nome da confeitaria) |
| created_by_user_id | UUID | Criador |
| master_user_id | UUID | **Mestre do grupo** — ADMIN principal, dono dos dados-base e plano |
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

> ⚠️ Tabelas e colunas canônicas: `groups`, `user_group_roles`, `role_group`. Nunca usar `grupos`, `grupo_membros` ou `role_grupo`.

### `user_active_session`
| Campo | Tipo | Descrição |
|-------|------|-----------|
| user_id | UUID | PK (UNIQUE) |
| active_group_id | UUID | Grupo ativo |
| mode | TEXT | `'system'` ou `'group'` |

### Coluna `owner_group_id`
Adicionada em **todas** as tabelas funcionais para isolamento multi-tenant:

> profiles, clientes, cliente_familiares, fornecedores, fornecedor_contatos, receitas, receitas_ingredientes, receitas_embalagens, receitas_despesas_venda, receitas_imagens, receitas_mao_obra, ingredientes, embalagens, encomendas, encomenda_itens, encomendas_tags, tags_encomendas, propostas, proposta_itens, contratos, categorias, custos_fixos, bancos, contas_pagar (+ parcelas, pagamentos, comprovantes), contas_receber (+ parcelas, pagamentos, comprovantes), pre_preparos, pre_preparos_ingredientes, pre_preparos_mao_obra, tipos_insumos, unidades_medida, plano_contas, categorias_plano_contas, tipos_documento, mao_obra_perfis, mao_obra_perfis_historico, configuracoes_juros, saldos_iniciais_bancos, transferencias_bancos, estoque, estoque_movimentacoes, meu_salario_retiradas, fechamentos_mensais, fechamento_checklist_itens, fechamento_logs, backup_agendamentos, backups.

---

## 3. PERMISSION FLAGS

```json
{
  "financeiro_view": true,    "financeiro_edit": false,
  "cadastros_view": true,     "cadastros_edit": false,
  "receitas_view": true,      "receitas_edit": false,
  "encomendas_view": true,    "encomendas_edit": false,
  "precificacao_view": true,  "precificacao_edit": false,
  "comercial_view": true,     "comercial_edit": false,
  "estoque_view": true,       "estoque_edit": false,
  "admin_users_manage": false
}
```

- **ADMIN**: todas as permissões automaticamente (ignora flags)
- **USER**: segue `permission_flags`
- **MOTHER** (quando adicionada a um grupo): acesso total independente do papel

---

## 4. FUNÇÕES SQL

| Função | Retorno | Descrição |
|--------|---------|-----------|
| `is_mother(_user_id)` | BOOLEAN | Se o usuário é MOTHER |
| `is_group_admin(_user_id, _group_id)` | BOOLEAN | Se é ADMIN do grupo |
| `user_belongs_to_group(_user_id, _group_id)` | BOOLEAN | Se pertence ao grupo (base das RLS) |
| `get_active_group_id(_user_id)` | UUID | Grupo ativo do usuário |
| `has_permission(_user_id, _group_id, _permission)` | BOOLEAN | Verifica permission flag (ADMIN sempre true) |
| `get_user_group_role(_user_id, _group_id)` | role_group | Papel no grupo |
| `is_group_master(_user_id, _group_id)` | BOOLEAN | Se é o mestre do grupo |
| `get_group_master(_group_id)` | UUID | Retorna `master_user_id` |
| `user_is_any_group_master(_user_id)` | BOOLEAN | Se é mestre de algum grupo ativo (usado por `FirstAccessRedirect`) |
| `user_has_financial_access(_user_id)` | BOOLEAN | Plano permite módulos financeiros |

Todas marcadas como `SECURITY DEFINER` + `STABLE` para evitar recursão em RLS.

---

## 5. POLÍTICAS RLS

### Padrão canônico (atualização 22/06/2026)
Todas as tabelas de **negócio** com `owner_group_id` usam:

```sql
USING  (public.user_belongs_to_group(auth.uid(), owner_group_id))
WITH CHECK (public.user_belongs_to_group(auth.uid(), owner_group_id))
```

> ⚠️ O padrão antigo `auth.uid() = usuario_id` foi **substituído** em 22/06/2026 para que membros do mesmo grupo consigam compartilhar dados corretamente. Nenhuma tabela de negócio deve usar mais o filtro por `usuario_id` puro.

### Tabelas filhas
Validam o pai com `EXISTS (SELECT 1 FROM tabela_pai WHERE id = ... AND user_belongs_to_group(auth.uid(), owner_group_id))`.

### `groups`
- MOTHER: CRUD completo
- Usuários: SELECT onde participam (via `user_group_roles`)

### `user_group_roles`
- Usuários: SELECT dos próprios papéis
- MOTHER: CRUD completo
- ADMIN: SELECT/INSERT/UPDATE de USERs do seu grupo

### `user_active_session`
- Cada usuário gerencia apenas a própria sessão

### Tabelas financeiras (RESTRICTIVE)
Camada adicional: `user_has_financial_access(auth.uid())` deve retornar `true` (plano Business/Imersão/Admin). Bloqueia escrita mesmo para membros do grupo se o plano do mestre não autoriza.

### Camada adicional no frontend
`useGroupFilter` aplica `.eq('owner_group_id', activeGroupId)` em todas as queries como defesa em profundidade.

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
- `isGroupAdmin`: boolean

**Métodos:**
- `setActiveGroup(groupId)` — Trocar grupo (persiste em `user_active_session`)
- `setSessionMode(mode)` — Trocar modo (MOTHER only)
- `refreshGroups()` — Recarregar dados
- `hasPermission(permission)` — Verifica permission flag (ADMIN sempre true)
- `canManageUsers()` — `isGroupAdmin` ou `admin_users_manage`

### useMotherView (`src/hooks/useMotherView.ts`)
Permite à MOTHER **simular** a visão de um grupo (sem perder a identidade global). Quando ativo, `effectiveIsMother`/`effectiveIsAdmin` na sidebar passam a falsos para reproduzir a UX do usuário final.

### useIsGroupMaster (`src/hooks/useIsGroupMaster.ts`)
Retorna `true` se o usuário atual é o mestre (`master_user_id`) do grupo ativo.

### GroupSelector (`src/components/GroupSelector.tsx`)
Dropdown da sidebar para selecionar grupo ativo e alternar modos (MOTHER).

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

Sem permissão, exibe card de "Acesso Restrito" com ícone Lock.

### MasterOnlyGuard (`src/components/MasterOnlyGuard.tsx`)
Card "Gerenciado pelo mestre" para membros que tentam acessar páginas de dados-base (Meus Dados, Mão de Obra, Backup).

### MotherGuard (`src/components/MotherGuard.tsx`)
Restringe páginas exclusivas da MOTHER.

### OnboardingGuard (`src/components/OnboardingGuard.tsx`)
Bloqueia módulos operacionais enquanto o onboarding do mestre não foi concluído. Membros pulam essa etapa.

### useGroupFilter (`src/hooks/useGroupFilter.ts`)

```tsx
const { addGroupFilter, getGroupInsertData, canAccessData, getGroupId } = useGroupFilter();

const query = supabase.from('clientes').select('*');
const filtered = addGroupFilter(query); // adiciona .eq('owner_group_id', activeGroupId)

const data = { nome: 'Cliente', ...getGroupInsertData() };
```

- Em modo sistema: retorna UUID nulo para não retornar dados
- `getGroupInsertData()` lança erro se em modo sistema

---

## 7. PÁGINAS DE ADMINISTRAÇÃO

| Rota | Acesso | Função |
|------|--------|--------|
| `/governanca` | MOTHER (link sidebar) | Hub consolidado: grupos, usuários, papéis, plano |
| `/admin/governanca` | MOTHER (URL direta) | Mesma página, acesso por URL |
| `/admin/usuarios` | MOTHER | Listar/criar/editar usuários, ativar/desativar, exportar Excel |
| `/admin/logs` | MOTHER | Histórico de ações administrativas (`admin_logs`) |
| `/admin/cofre-backups` | MOTHER | Inspeção dos snapshots JSONB de todos os grupos |

A página `/governanca` inclui:
- Criar/editar/desativar grupos (definição do mestre)
- Adicionar usuários a grupos
- Definir papéis (ADMIN/USER)
- Gerenciar `permission_flags`
- Componente `MotherPlanSelector` para ajustar plano do mestre

---

## 8. SIDEBAR E NAVEGAÇÃO

A sidebar (`src/components/AppSidebar.tsx`) é organizada em 5 seções de fluxo operacional (ver `DOCS_MESTRE.md` §5 para detalhes completos):

| Seção | Itens visíveis para todos | Itens restritos |
|-------|---------------------------|-----------------|
| **MEU PAINEL** | Meu Painel | — |
| **MINHA PRODUÇÃO** | Cadastros, Cardápio | Estoque (Business/Imersão/Admin) |
| **MEU COMERCIAL** | Parceiros, Negociações, Vendas | — |
| **MEU NEGÓCIO** | Meu Dinheiro (gated) | Meu Salário (ADMIN do grupo) |
| **SISTEMA** | Configurações | Backup (mestre), **Governança (MOTHER)** |

### Comportamento por papel

| Papel | O que vê |
|-------|----------|
| **USER** | Itens filtrados por `permission_flags`; sem Mão de Obra, Backup, Governança |
| **ADMIN secundário** | Tudo do grupo, sem dados-base (Meus Dados, Mão de Obra, Backup) — guardados por `MasterOnlyGuard` |
| **ADMIN mestre** | Tudo do grupo, incluindo dados-base e Backup |
| **MOTHER** | Tudo + item "Governança" com simulação (`useMotherView`) para enxergar a UX de membros |

### Indicadores visuais
- 🍰 ícone de bolo dourado animado em "Parceiros" quando há aniversariantes
- Badge dourado "X HOJE" pulsante em "Vendas" quando há encomendas do dia
- 🔒 cadeado em itens bloqueados por plano (40% opacidade) → modal de upgrade
- `GroupSelector` exibido no topo da sidebar quando expandida

### Footer
Mostra nome da confeitaria, e-mail e badges de papel (Admin/Usuário/MOTHER), além do plano e data de expiração.

---

## 9. CONCEITO DE "MESTRE" DO GRUPO

Cada grupo tem um **mestre** (`groups.master_user_id`) — usuário responsável pelos dados-base:
- **Meus Dados** (perfil/confeitaria, endereço, contatos)
- **Mão de Obra** (perfis de produção)
- **Backup** do grupo
- **Plano contratado** (membros herdam via `usePlano`)

### Regras

| Aspecto | Mestre (ADMIN principal) | Membro (USER ou ADMIN secundário) | MOTHER |
|---------|--------------------------|-----------------------------------|--------|
| Onboarding obrigatório | Sim | **Não** (pula direto para Dashboard) | Não |
| Edita Meus Dados / Mão de Obra / Backup | Sim | Não (vê aviso "gerenciado por…") | Sim |
| Plano | Próprio | Herda do mestre via `usePlano` | Acesso total |
| Pode ser removido do grupo | Não (proteção UI + SQL) | Sim | Sim, se não for mestre |
| Pode ser rebaixado para USER | Não | Sim | Sim, se não for mestre |

### Fluxo "Criar Novo Usuário" (`CriarUsuarioDialog`)

O dialog em `/admin/usuarios` pergunta **Mestre** ou **Membro**:
- **Mestre** — cria um novo grupo automaticamente (nome = nome da confeitaria), define `master_user_id`, atribui plano próprio. Passa pelo onboarding.
- **Membro** — seleciona um grupo existente + papel (USER/ADMIN secundário). Sem campos de plano. `onboarding_concluido = true` automaticamente.

### MOTHER em grupos
MOTHER pode ser adicionada a qualquer grupo (no `GruposManager`) como ADMIN ou USER. Recebe acesso total ao grupo independentemente do papel atribuído.

> 📄 Detalhes operacionais em [DOCS_MESTRE.md](./DOCS_MESTRE.md) (raiz do projeto está só com `README.md`; todos os docs vivem em `docs/`).

---

## 10. CHECKLIST DE SEGURANÇA

Ao criar uma nova tabela de negócio:

1. ✅ Adicionar coluna `owner_group_id UUID NOT NULL REFERENCES groups(id)`
2. ✅ `GRANT SELECT, INSERT, UPDATE, DELETE ON public.<table> TO authenticated;`
3. ✅ `GRANT ALL ON public.<table> TO service_role;`
4. ✅ `ALTER TABLE ... ENABLE ROW LEVEL SECURITY;`
5. ✅ 4 políticas (SELECT/INSERT/UPDATE/DELETE) usando `user_belongs_to_group(auth.uid(), owner_group_id)`
6. ✅ Se for financeira: adicionar política RESTRICTIVE com `user_has_financial_access(auth.uid())`
7. ✅ No frontend: sempre passar pelo `useGroupFilter` (nunca query direta sem filtro)
8. ✅ Registrar a mudança em `AUDITORIA.md`

---

## 11. DOCUMENTOS RELACIONADOS

| Documento | Escopo |
|-----------|--------|
| [DOCS_MESTRE.md](./DOCS_MESTRE.md) | Índice canônico do sistema |
| [DOCS_AUTENTICACAO.md](./DOCS_AUTENTICACAO.md) | Login, convites, primeiro acesso |
| [DOCS_PLANOS.md](./DOCS_PLANOS.md) | Catálogo de planos e herança mestre→membros |
| [DOCS_BACKUP_RESTORE.md](./DOCS_BACKUP_RESTORE.md) | Backup do grupo (mestre) |
| [AUDITORIA.md](./AUDITORIA.md) | Log cronológico das correções de governança/RLS |
