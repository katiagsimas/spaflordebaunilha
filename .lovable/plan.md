
# Módulo de Estoque — Caixa de Açúcar

## Resumo

Módulo integrado de controle de estoque que permite:
- Visualizar saldo atual de cada ingrediente/embalagem
- Registrar entradas manuais (compras)
- Baixa automática ao finalizar encomendas (baseada na ficha técnica)
- Ajustes manuais (perdas, doações, correções)
- Custo médio ponderado e valorização do estoque
- Alertas de estoque mínimo
- Acesso restrito a Business e Start

---

## 1. Modelo de Dados

### Tabela `estoque` (saldo atual por insumo)

| Campo | Tipo | Descrição |
|-------|------|-----------|
| id | uuid PK | |
| usuario_id | uuid | FK auth.users |
| owner_group_id | uuid | Multi-tenant |
| tipo | text | 'ingrediente' ou 'embalagem' |
| ingrediente_id | uuid (nullable) | FK ingredientes |
| embalagem_id | uuid (nullable) | FK embalagens |
| quantidade_atual | numeric | Saldo em estoque (na unidade do tipo_insumo) |
| custo_medio | numeric | Custo médio ponderado unitário |
| estoque_minimo | numeric (nullable) | Alerta quando abaixo deste valor |
| updated_at | timestamptz | |

### Tabela `estoque_movimentacoes` (histórico)

| Campo | Tipo | Descrição |
|-------|------|-----------|
| id | uuid PK | |
| estoque_id | uuid | FK estoque |
| usuario_id | uuid | FK auth.users |
| owner_group_id | uuid | Multi-tenant |
| tipo_movimentacao | text | 'entrada', 'saida_producao', 'saida_manual', 'ajuste' |
| quantidade | numeric | Positivo para entrada, positivo (será subtraído) para saída |
| custo_unitario | numeric (nullable) | Custo na entrada (para calcular custo médio) |
| custo_total | numeric (nullable) | quantidade * custo_unitario |
| referencia_tipo | text (nullable) | 'encomenda', 'receita', 'ajuste' |
| referencia_id | uuid (nullable) | ID da encomenda/receita |
| observacao | text (nullable) | Motivo do ajuste |
| created_at | timestamptz | Data da movimentação |

### RLS
- Todas com `auth.uid() = usuario_id`
- RESTRICTIVE policy com `user_has_financial_access(auth.uid())` (mesmo padrão do financeiro, restringindo a Business/Start)

---

## 2. Lógica de Custo Médio Ponderado

Na entrada:
```
novo_custo_medio = (quantidade_atual * custo_medio + quantidade_entrada * custo_unitario_entrada) / (quantidade_atual + quantidade_entrada)
```

Na saída: o custo médio não muda, apenas a quantidade diminui.

---

## 3. Baixa Automática por Encomenda

Ao mudar o status de uma encomenda para "finalizada" (ou "em produção", a definir):
1. Para cada item da encomenda, buscar a receita vinculada
2. Para cada ingrediente/embalagem da receita, calcular consumo proporcional à quantidade produzida
3. Criar movimentação de saída tipo `saida_producao` com referência à encomenda
4. Atualizar saldo na tabela `estoque`

Isso será implementado como uma função no frontend (hook `useEstoqueBaixa`) que é chamada na mudança de status.

---

## 4. Integração com `usePlano`

- Adicionar `'estoque'` à lista de módulos controlados
- No sidebar, o item "Meus Insumos" (que já existe como "EM BREVE") vira o ponto de entrada do estoque
- PlanoGuard bloqueia rotas `/estoque/*` para Lite

---

## 5. Rotas e Páginas

| Rota | Página |
|------|--------|
| `/estoque` | Dashboard do estoque — cards de resumo + lista de itens com saldo |
| `/estoque/movimentacoes` | Histórico de movimentações com filtros |
| `/estoque/entrada` | Formulário de entrada manual (compra) |
| `/estoque/ajuste` | Formulário de ajuste (perda, correção) |

---

## 6. UI — Dashboard de Estoque

- Card "Valor total em estoque" (soma de quantidade * custo_medio)
- Card "Itens abaixo do mínimo" (com badge de alerta)
- Card "Última movimentação"
- Tabela com: Nome do insumo | Tipo | Quantidade atual | Unidade | Custo médio | Status (OK / Baixo)
- Filtros: tipo (ingrediente/embalagem), status (todos/abaixo do mínimo)
- Botões: "Nova Entrada" e "Ajuste Manual"

---

## 7. UI — Entrada Manual

Formulário com:
- Autocomplete do ingrediente ou embalagem (reutilizar componentes existentes)
- Quantidade comprada
- Preço total da compra (calcula custo unitário automaticamente)
- Data da compra
- Observação (opcional)

---

## 8. UI — Ajuste Manual

- Selecionar item do estoque
- Tipo: Perda / Doação / Correção de inventário
- Quantidade (positiva ou negativa)
- Motivo (obrigatório)

---

## 9. Etapas de Implementação

1. **Migração SQL** — Criar tabelas `estoque` e `estoque_movimentacoes` com RLS
2. **Atualizar controle de plano** — Adicionar módulo 'estoque' ao usePlano
3. **Hook `useEstoque`** — CRUD do saldo + movimentações
4. **Hook `useEstoqueBaixa`** — Lógica de baixa automática por encomenda
5. **Páginas** — Dashboard, Entrada, Ajuste, Movimentações
6. **Sidebar** — Ativar "Meus Insumos" como link para `/estoque`
7. **Integração com Encomendas** — Chamar baixa ao finalizar encomenda
8. **Documentação** — Criar DOCS_ESTOQUE.md e atualizar DOCS_MESTRE.md

---

## Observações Técnicas

- Segue o padrão multi-tenant existente (`owner_group_id`)
- Segue o padrão de datas do projeto (`dateUtils.ts`)
- Usa os mesmos componentes de UI (Card, PageHeader, BackButton, Tabs)
- O backup existente deve incluir as novas tabelas
- Estoque mínimo gera alerta visual no sidebar (badge) similar ao padrão de aniversariantes
