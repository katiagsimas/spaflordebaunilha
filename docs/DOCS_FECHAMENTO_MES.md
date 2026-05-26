# 🔒 DOCUMENTAÇÃO: Fechamento de Mês — Caixa de Açúcar

**Atualizada em:** 26/05/2026

---

## 1. VISÃO GERAL

Permite consolidar o resultado financeiro de um mês, congelar valores em **snapshot imutável** e bloquear alterações retroativas nos lançamentos daquele período. Garante coerência histórica para DRE, Fluxo de Caixa e Meu Salário.

- **Rota:** `/financeiro/fechamento-mes`
- **Acesso:** Caixa Business / `aluna_imersao` / Start legado / Admin
- **Granularidade:** um registro por `(owner_group_id, mes_referencia)`

---

## 2. ARQUITETURA

| Camada | Arquivo |
|--------|---------|
| Página | `src/pages/financeiro/FechamentoMes.tsx` |
| Hook | `src/hooks/useFechamentoMes.ts` |
| Hub | Card no `src/pages/financeiro/Financeiro.tsx` |
| Consumo externo | `src/hooks/useMeuSalario.ts` lê snapshot |

---

## 3. MODELO DE DADOS

### Tabela `fechamentos_mensais`

| Campo | Tipo | Descrição |
|-------|------|-----------|
| id | uuid PK | |
| owner_group_id | uuid | Multi-tenant (FK `groups`) |
| mes_referencia | date | **Sempre dia 1 do mês** |
| status | text | `aberto` \| `fechado` |
| faturamento | numeric(12,2) | Entradas efetivas |
| custos | numeric(12,2) | Saídas efetivas |
| margem_seguranca | numeric(12,2) | 20% do faturamento |
| pro_labore_saudavel | numeric(12,2) | `max(0, fat − custos − margem)` |
| retiradas | numeric(12,2) | Soma `meu_salario_retiradas` do mês |
| saldo_restante | numeric(12,2) | `pro_labore_saudavel − retiradas` |
| snapshot | jsonb | Dump completo (bancos, categorias, totais) |
| observacoes | text | Notas opcionais |
| fechado_em / fechado_por | timestamptz / uuid | Auditoria do fechamento |
| reaberto_em / reaberto_por | timestamptz / uuid | Auditoria de reabertura |
| created_at / updated_at | timestamptz | |

Único por `(owner_group_id, mes_referencia)`.

### Tabela `fechamento_checklist_itens`

| Campo | Descrição |
|-------|-----------|
| fechamento_id | FK `fechamentos_mensais` (ON DELETE CASCADE) |
| titulo / descricao | Texto exibido |
| ordem | int para ordenação |
| concluido | boolean |
| concluido_em / concluido_por | Auditoria |

---

## 4. RLS

Todas as operações (SELECT/INSERT/UPDATE/DELETE) validam pertencimento ao `owner_group_id` via função `public.user_in_group(grupo)`. Itens de checklist herdam o acesso pela FK ao fechamento pai.

---

## 5. TRAVA DE LANÇAMENTOS

Função `public.is_mes_fechado(grupo uuid, data date) → boolean` detecta se a data cai num mês fechado do grupo.

Triggers `BEFORE INSERT/UPDATE/DELETE` aplicados em:

- `contas_receber` / `contas_pagar`
- `contas_receber_parcelas` / `contas_pagar_parcelas`
- `contas_receber_pagamentos` / `contas_pagar_pagamentos`

Bloqueiam operações cuja `data_vencimento`, `data_recebimento` ou `data_pagamento` caia dentro de um mês fechado.

**Mensagem padrão:** `Mês de MM/YYYY está fechado. Reabra o fechamento para alterar este lançamento.`

> ℹ️ Transferências entre bancos (`transferencias_bancos`) seguem o mesmo princípio: a edge UI bloqueia datas dentro de meses fechados.

---

## 6. CHECKLIST PADRÃO

Criado automaticamente ao iniciar um fechamento:

1. Conferir saldos bancários
2. Dar baixa em todas as contas a receber pagas
3. Dar baixa em todas as contas a pagar quitadas
4. Registrar pró-labore/retiradas do mês
5. Revisar lançamentos sem categoria
6. Conferir DRE e Fluxo de Caixa

Todos os itens precisam estar concluídos para o botão **Fechar mês** ser liberado.

---

## 7. FLUXO COMPLETO

```
Usuário acessa /financeiro/fechamento-mes
  ↓
Seleciona mes_referencia
  ↓
Não existe registro → cria com status='aberto' + checklist padrão
  ↓
Calcula prévia (faturamento, custos, margem, pro-labore)
  ↓
Usuário conclui itens do checklist
  ↓
Checklist 100% concluído → habilita "Fechar mês"
  ↓
Confirma fechamento
  ↓
Persiste snapshot (jsonb), status='fechado', fechado_em/por
  ↓
Triggers passam a bloquear edição retroativa
```

### Reabertura

- Disponível para qualquer membro do grupo (controle de papel ocorre em camada futura)
- Grava `reaberto_em` / `reaberto_por`
- Triggers de bloqueio liberam o período enquanto status='aberto'
- Ao refechar, snapshot é regravado com valores atuais

---

## 8. SNAPSHOT EM MEU SALÁRIO

`useMeuSalario` consulta `fechamentos_mensais` para o mês solicitado:

- Status `fechado` → retorna valores do snapshot (histórico congelado)
- Não fechado → recalcula em tempo real a partir de `contas_receber_pagamentos` / `contas_pagar_pagamentos`

Isso garante que dados históricos exibidos em Meu Salário não mudem após edições futuras (a não ser que o mês seja reaberto e refechado).

---

## 9. CONVENÇÕES

- Datas sempre em `YYYY-MM-DD` (usar `src/lib/dateUtils.ts`)
- `mes_referencia` normalizado para dia 1
- Valores numéricos sempre 2 casas decimais
- Snapshot é fonte da verdade para meses fechados

---

## 10. ARQUIVOS DE REFERÊNCIA

| Arquivo | Função |
|---------|--------|
| `src/pages/financeiro/FechamentoMes.tsx` | Página principal |
| `src/hooks/useFechamentoMes.ts` | CRUD, prévia, checklist, fechar/reabrir |
| `src/pages/financeiro/Financeiro.tsx` | Hub com card de acesso |
| `src/hooks/useMeuSalario.ts` | Consome snapshot para meses fechados |
