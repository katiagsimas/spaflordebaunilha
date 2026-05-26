# 📦 DOCUMENTAÇÃO: Módulo de Estoque — Caixa de Açúcar

**Criado em:** Maio 2026

---

## 1. VISÃO GERAL

Módulo de controle de estoque de ingredientes e embalagens para confeitarias. Permite registrar entradas (compras), saídas manuais (perdas, doações, correções) e baixa automática ao finalizar encomendas.

### Acesso
- **Caixa Lite**: ❌ Não tem acesso
- **Caixa Business / Caixa Start**: ✅ Acesso completo
- **Admin**: ✅ Acesso total independente do plano

---

## 2. MODELO DE DADOS

### Tabela `estoque`
Saldo atual por insumo (ingrediente ou embalagem).

| Campo | Tipo | Descrição |
|-------|------|-----------|
| id | uuid PK | |
| usuario_id | uuid | FK auth.users |
| owner_group_id | uuid | Multi-tenant |
| tipo | text | 'ingrediente' ou 'embalagem' |
| ingrediente_id | uuid | FK ingredientes (nullable) |
| embalagem_id | uuid | FK embalagens (nullable) |
| quantidade_atual | numeric | Saldo atual |
| custo_medio | numeric | Custo médio ponderado |
| estoque_minimo | numeric | Alerta abaixo deste valor |
| created_at / updated_at | timestamptz | |

**Índices únicos:** `(usuario_id, ingrediente_id)` e `(usuario_id, embalagem_id)` para evitar duplicatas.

### Tabela `estoque_movimentacoes`
Histórico de todas as movimentações.

| Campo | Tipo | Descrição |
|-------|------|-----------|
| id | uuid PK | |
| estoque_id | uuid | FK estoque |
| usuario_id | uuid | FK auth.users |
| owner_group_id | uuid | Multi-tenant |
| tipo_movimentacao | text | 'entrada', 'saida_producao', 'saida_manual', 'ajuste' |
| quantidade | numeric | Quantidade movimentada |
| custo_unitario | numeric | Para entradas |
| custo_total | numeric | Para entradas |
| referencia_tipo | text | 'encomenda', 'receita', 'ajuste' |
| referencia_id | uuid | ID da referência |
| observacao | text | Motivo/nota |
| created_at | timestamptz | |

---

## 3. RLS

- Ambas as tabelas: `auth.uid() = usuario_id`
- RESTRICTIVE policy com `user_has_financial_access(auth.uid())` — mesma função usada pelo financeiro
- Movimentações: INSERT, SELECT e DELETE apenas (sem UPDATE)

---

## 4. CUSTO MÉDIO PONDERADO

Na entrada:
```
novo_custo_medio = (qtd_atual * custo_medio_atual + qtd_entrada * custo_unitario) / (qtd_atual + qtd_entrada)
```

Na saída: custo médio não muda, apenas quantidade diminui.

---

## 5. ROTAS

| Rota | Página |
|------|--------|
| `/estoque` | Dashboard — cards de resumo + tabela de itens |
| `/estoque/entrada` | Formulário de entrada (compra) |
| `/estoque/ajuste` | Formulário de ajuste manual (perda/doação/correção) |
| `/estoque/movimentacoes` | Histórico de movimentações |

Todas protegidas por `PlanoGuard` (requer Business/Start).

---

## 6. HOOKS

### `useEstoque`
- `itens`: lista enriquecida com nome e unidade do tipo_insumo
- `movimentacoes`: histórico
- `valorTotal`: soma de `quantidade_atual * custo_medio`
- `itensAbaixoMinimo`: itens com estoque abaixo do mínimo
- `registrarEntrada()`: cria/atualiza item + movimentação
- `registrarSaidaManual()`: reduz saldo + movimentação
- `atualizarEstoqueMinimo()`: define alerta

---

## 7. SIDEBAR

"Meus Insumos" foi movido da seção "Em Breve" para o menu principal, apontando para `/estoque`. Bloqueado com 🔒 para plano Lite.

---

## 8. BAIXA AUTOMÁTICA POR ENCOMENDA

Quando uma encomenda tem seu status alterado para **"entregue"**, o sistema deduz automaticamente do estoque todos os ingredientes e embalagens utilizados nas receitas dos itens da encomenda.

### Fluxo
1. Usuário muda status da encomenda para "entregue" no módulo Vendas
2. Sistema busca `encomenda_itens` → para cada item, busca `receitas_ingredientes` e `receitas_embalagens`
3. Multiplica `quantidade_utilizada` da receita × `quantidade` do item pedido
4. Para cada insumo com registro em `estoque`, reduz `quantidade_atual` e cria movimentação `saida_producao`
5. Marca `encomendas.estoque_baixa_realizada = true` para evitar baixa duplicada

### Controle de duplicidade
- Coluna `estoque_baixa_realizada` (boolean, default false) na tabela `encomendas`
- Baixa só é executada se: status muda para "entregue" **E** `estoque_baixa_realizada` é false

### Rastreabilidade
- `tipo_movimentacao`: `saida_producao`
- `referencia_tipo`: `encomenda`
- `referencia_id`: UUID da encomenda
- `observacao`: "Baixa automática — encomenda entregue"

### Avisos
- Insumos sem registro no estoque são ignorados (aviso via toast)
- Se a quantidade em estoque é insuficiente, o saldo é zerado (não fica negativo) e um aviso é exibido

### Arquivo
- `src/hooks/useBaixaEstoqueEncomenda.ts` — função `executarBaixaEstoqueEncomenda()`
