# 🛍️ DOCUMENTAÇÃO: Módulo de Encomendas — Caixa de Açúcar

**Atualizada em:** 26/05/2026

---

## 1. VISÃO GERAL

Módulo central de gestão de pedidos. Acessível no **Caixa Lite**.

**Rota:** `/encomendas`  
**Componente:** `src/pages/Encomendas.tsx`

---

## 2. MODELO DE DADOS

### `encomendas`

| Campo | Tipo | Descrição |
|-------|------|-----------|
| id | UUID | PK |
| usuario_id | UUID | Proprietário |
| cliente | TEXT | Nome do cliente |
| valor | NUMERIC | Valor total |
| data_pedido | DATE | Data do pedido |
| data_entrega | DATE | Data de entrega |
| hora_entrega | TEXT | Hora de entrega |
| status | VARCHAR | Status do pedido |
| numero | VARCHAR | Número da encomenda |
| telefone | VARCHAR | Telefone do cliente |
| endereco | TEXT | Endereço de entrega |
| cep | VARCHAR | CEP |
| observacoes | TEXT | Observações gerais |
| observacoes_cliente | TEXT | Observações do cliente |
| observacoes_internas | TEXT | Observações internas |
| desconto_percentual | NUMERIC | Desconto em % |
| desconto_valor | NUMERIC | Desconto em R$ |
| taxa_entrega | NUMERIC | Taxa de entrega |
| outros | NUMERIC | Outros valores |
| saldo_restante | NUMERIC | Saldo a receber |
| pagamentos | JSONB | Registro de pagamentos |
| conta_receber_id | UUID | FK contas_receber (vinculação financeira) |
| topo_aniversariante | TEXT | Nome do aniversariante |
| topo_bolo | NUMERIC | Valor do topo |
| topo_idade | TEXT | Idade |
| topo_tema | TEXT | Tema |
| topo_obs | TEXT | Observações do topo |
| topo_imagens | JSONB | Imagens de referência |
| owner_group_id | UUID | Grupo proprietário |

### `encomenda_itens`

| Campo | Tipo | Descrição |
|-------|------|-----------|
| encomenda_id | UUID | FK encomendas |
| produto | TEXT | Nome do produto |
| receita_id | TEXT | ID da receita vinculada |
| quantidade | NUMERIC | Quantidade |
| unidade_medida | TEXT | Unidade |
| valor_unitario | NUMERIC | Valor unitário |
| subtotal | NUMERIC | Subtotal |

### `encomendas_tags`

| Campo | Tipo | Descrição |
|-------|------|-----------|
| encomenda_id | UUID | FK encomendas |
| tag_id | UUID | FK tags_encomendas |

### `tags_encomendas`

| Campo | Tipo | Descrição |
|-------|------|-----------|
| nome | VARCHAR | Nome da tag |
| cor | VARCHAR | Cor (hex, default #3B82F6) |
| descricao | TEXT | Descrição |
| padrao_sistema | BOOLEAN | Se é tag padrão |
| user_id | UUID | Criador |

---

## 3. STATUS DO PEDIDO

| Status | Descrição |
|--------|-----------|
| Pendente | Pedido registrado |
| Confirmado | Cliente confirmou |
| Em Produção | Em preparo |
| Pronto | Finalizado |
| Entregue | Entregue ao cliente |
| Cancelado | Cancelado |

---

## 4. FUNCIONALIDADES

### 4.1 Listagem
- Filtros por status, data, cliente
- Visualização com tags coloridas
- Busca textual

### 4.2 Criação/Edição
- Seleção de cliente (autocomplete via `ClienteAutocomplete`)
- Data de pedido/entrega/hora
- Itens: produto + receita + quantidade + valor
- Descontos (% ou R$), taxa entrega, outros
- Tags personalizadas (`EncomendaTagsSection`)
- Observações (gerais, cliente, internas)
- Topo de bolo (aniversariante, idade, tema, imagens)

### 4.3 Pagamentos
Registro inline via JSONB no campo `pagamentos`

### 4.4 Vinculação Financeira
- Campo `conta_receber_id` vincula a uma conta a receber
- Permite gerar automaticamente título financeiro a partir da encomenda

---

## 5. TAGS DE ENCOMENDAS

**Configuração:** `/configuracoes/tags-encomendas`  
**Componente:** `ConfiguracaoTagsEncomendas`

### RLS das Tags
- SELECT: Tags do sistema (`padrao_sistema = true`) + tags do próprio usuário  
- INSERT/UPDATE/DELETE: ✅ **Implementadas** - usuários podem gerenciar suas próprias tags personalizadas

> ✅ Usuários podem criar, editar e excluir suas próprias tags via interface do `ConfiguracaoTagsEncomendas`. Tags do sistema permanecem protegidas.

---

## 6. RELAÇÕES COM OUTROS MÓDULOS

| Módulo | Relação |
|--------|---------|
| Clientes | Vincula cliente à encomenda |
| Receitas | Itens referenciam receitas para produto/valor |
| Financeiro | Gera contas a receber (`conta_receber_id`) |
| Tags | Categorização via `encomendas_tags` |
| Dashboard | Métricas de pedidos e faturamento |

---

## 7. HOOKS

| Hook | Descrição |
|------|-----------|
| `useEncomendas` | CRUD de encomendas |
| `useEncomendaItens` | Itens de encomendas |

---

## 8. RLS

### encomendas e encomenda_itens
`auth.uid() = usuario_id` para SELECT, INSERT, UPDATE, DELETE

### encomendas_tags
Sem RLS explícita (herda da encomenda via JOIN)

---

## 9. SCHEMA ZOD

Definido em `src/schemas/encomendaSchema.ts` para validação do formulário de encomendas.

---

## 10. TAGS DE ENCOMENDAS (atualização 2026-05-27)

As tags de encomendas foram convertidas em **tags padrão do sistema**, compartilhadas por todos os usuários.

### Estrutura
- Tabela `tags_encomendas` com `user_id = NULL` e `padrao_sistema = true` representa as tags do sistema, visíveis para todos via RLS.
- Tags com `user_id` preenchido continuam sendo personalizadas por usuário.
- Função `criar_tags_padrao_encomendas(uuid)` foi neutralizada (no-op): novos usuários já enxergam as tags do sistema automaticamente.

### Tags padrão (10)
Aniversário, Bodas, Casamento, Corporativo, Delivery, Infantil, Mesversário, Personalizado, Retirada, Urgente.

### Rota
`/encomendas/tags` (antiga `/configuracoes/tags-encomendas` mantém redirect).

---

## 📌 Atualização 2026-05-27 — Entrega 3 (Lista de Encomendas)

- **Tags padrão do sistema (Origem & Evento)**: nova migração insere tags `padrao_sistema=true, user_id=NULL` cobrindo todos os filtros:
  - Origem: Instagram, WhatsApp, Indicação, Google Maps, Fidelização Interna, Parceria Local.
  - Evento: Aniversário Infantil, Aniversário Adulto, Mesversário, Batizado, Casamento, Noivado, Chá de Bebê, Chá de Fraldas, Empresarial.
  - Bloqueio de edição/exclusão garantido pelas RLS já existentes (`tags_encomendas` — tags com `user_id IS NULL` não pertencem ao usuário).
- **Filtros rápidos** no `EncomendaStatusCard`: chips "Todas / Em aberto / Hoje / Entregues" + seletor de ordenação (criação, entrega asc/desc, maior valor).
- **Timeline visual** por encomenda: 5 etapas (Pedido → Confirmado → Produção → Pronto → Entregue), com destaque do passo atual e estado vermelho quando cancelada.
- **Persistência** dos filtros + ordenação em `localStorage` (chave `cda:enclista:{status}`), reaplicados após reload.
- **Sincronia do card "Encomendas do dia"** com o filtro de período (`mês/ano`) da página principal de Encomendas — os 3 mini-calendários e a seleção do dia acompanham o mês escolhido.
