# 📅 DOCUMENTAÇÃO: Meu Planejamento — Caixa de Açúcar

**Atualizada em:** 26/05/2026

---

## 1. VISÃO GERAL

Hub de planejamento estratégico para confeitarias com 4 abas integradas: **Calendário**, **Metas**, **Tarefas** e **Bem-Estar**. Combina organização operacional (calendário de encomendas e datas) com gestão estratégica (metas por área) e cuidado pessoal (descansos, férias).

- **Rota:** `/planejamento`
- **Acesso:** Admin-only durante a fase de validação (`PlanoGuard` bloqueia não-admin)
- **Página principal:** `src/pages/Planejamento.tsx`

---

## 2. ESTRUTURA DE ARQUIVOS

| Arquivo | Função |
|---------|--------|
| `src/pages/Planejamento.tsx` | Container com tabs |
| `src/pages/planejamento/PlanejamentoCalendario.tsx` | Aba Calendário |
| `src/pages/planejamento/PlanejamentoTarefas.tsx` | Aba Tarefas |
| `src/pages/planejamento/PlanejamentoBemEstar.tsx` | Aba Bem-Estar (descansos) |
| `src/hooks/usePlanejamento.ts` | CRUD unificado dos recursos |

> A aba **Metas** vive dentro de `Planejamento.tsx` e reaproveita componentes existentes (`PrevisaoFaturamentoCard`, `ProjecaoVendasCard`).

---

## 3. MODELO DE DADOS

### `planejamento_metas`
Metas por área de negócio.

| Campo | Descrição |
|-------|-----------|
| owner_group_id | Multi-tenant |
| area | enum `planejamento_area` (financeiro, vendas, marketing, pessoal, producao, atendimento) |
| titulo, descricao | Texto |
| valor_meta, valor_atual | numeric — opcional para metas quantitativas |
| prazo | date |
| status | enum `planejamento_status` |
| prioridade | enum `planejamento_prioridade` |

### `planejamento_tarefas`
Tarefas operacionais.

| Campo | Descrição |
|-------|-----------|
| owner_group_id | Multi-tenant |
| titulo, descricao | Texto |
| area | enum `planejamento_area` |
| prioridade | enum `planejamento_prioridade` (baixa, media, alta) |
| status | enum `planejamento_status` (pendente, em_andamento, concluida, cancelada) |
| prazo | date |

### `planejamento_datas_comemorativas`
Datas do calendário (feriados, datas-chave).

| Campo | Descrição |
|-------|-----------|
| owner_group_id | nullable (NULL para datas do sistema) |
| nome, descricao | Texto |
| data | date |
| tipo | enum `planejamento_data_tipo` |
| recorrente | boolean (default `true`) — recorrência anual MM-dd |
| is_system | boolean — `true` para os 11 feriados brasileiros pré-carregados |

### `planejamento_descanso`
Períodos de descanso, férias e folgas.

| Campo | Descrição |
|-------|-----------|
| owner_group_id | Multi-tenant |
| titulo | Texto |
| data_inicio, data_fim | date |
| tipo | enum `planejamento_descanso_tipo` (ferias, folga, descanso_pessoal) |
| recorrente | boolean |
| recorrencia_tipo | semanal \| mensal \| anual |

---

## 4. ENUMS

- `planejamento_area`
- `planejamento_prioridade`
- `planejamento_status`
- `planejamento_data_tipo`
- `planejamento_descanso_tipo`

---

## 5. RLS

Todas as tabelas isoladas por `owner_group_id` validado contra `user_group_roles`. Exceção:

- Datas comemorativas com `is_system = true` são **visíveis para todos** (SELECT público a usuários autenticados) e **somente leitura** (UPDATE/DELETE bloqueados).

---

## 6. ABAS

### 6.1 Calendário
- Grade mensal com:
  - Encomendas do mês (origem: `encomendas.data_entrega`)
  - Datas comemorativas (sistema + customizadas)
  - Períodos de descanso (incluindo projeções recorrentes)
- Drag-and-drop:
  - **Encomendas** → mover para outro dia atualiza `data_entrega`
  - **Descansos** → mover translada `data_inicio` e `data_fim` mantendo duração
  - **Datas comemorativas** → não arrastáveis
  - **Projeções recorrentes (🔁)** → não arrastáveis

### 6.2 Metas
- CRUD de metas por área
- Reaproveita `PrevisaoFaturamentoCard` e `ProjecaoVendasCard` para metas financeiras automáticas
- Barra de progresso quando `valor_meta` + `valor_atual` preenchidos

### 6.3 Tarefas
- Lista filtrada por área/prioridade/status
- Atualização rápida de status
- Indicador visual de prazo (atraso destacado)

### 6.4 Bem-Estar
- Cadastro de férias, folgas e descansos pessoais
- Configuração de recorrência (semanal/mensal/anual)
- Visualização reflete no calendário automaticamente

---

## 7. EVENTOS RECORRENTES

- **Datas comemorativas**: recorrência anual inerente (formato MM-dd)
- **Descansos** com `recorrente = true`: projetados no calendário conforme `recorrencia_tipo`
- **Projeções são virtuais** (não persistidas no DB), renderizadas com prefixo 🔁 e bloqueadas para edição direta no calendário (devem ser editadas no registro original)

---

## 8. INTEGRAÇÕES

| Origem | Destino | Comportamento |
|--------|---------|---------------|
| `encomendas` | Calendário | Exibe pedidos pela `data_entrega` |
| `encomendas` (drag) | DB | Atualiza `data_entrega` |
| `planejamento_descanso` | Calendário | Bloco visual + projeções |
| `planejamento_datas_comemorativas` | Calendário | Marcadores fixos |

---

## 9. CONVENÇÕES

- Datas sempre em `YYYY-MM-DD` (`src/lib/dateUtils.ts`)
- Multi-tenant via `owner_group_id` + `user_group_roles`
- Acesso admin-only enforced pelo `PlanoGuard` + rota
