# 💰 DOCUMENTAÇÃO: Módulo Financeiro — Caixa de Açúcar

**Atualizada em:** Março 2026

---

## 1. VISÃO GERAL

Módulo completo de gestão financeira. **Requer Plano Negócio** (ou role admin para bypass).

### Submódulos
- Dashboard Financeiro
- Contas a Receber (títulos, parcelas, pagamentos, comprovantes)
- Contas a Pagar (mesma estrutura)
- Fluxo de Caixa (diário e mensal)
- DRE (Demonstrativo de Resultados)

---

## 2. CONTAS A RECEBER

### 2.1 Tabelas

**`contas_receber`** — Título principal
- `descricao`, `valor`, `data_vencimento`, `banco_id`
- `tipo_lancamento`: `'unico'`, `'parcelado'`, `'recorrente'`
- `numero_parcelas` (default: 1)
- `cliente_id`, `cliente_nome`, `cliente_documento`
- `plano_conta_id`, `tipo_documento_id`, `categoria_id`
- `status`: `'pendente'`, `'pago'`, `'parcial'`, `'cancelado'`
- `owner_group_id`

**`contas_receber_parcelas`** — Parcelas do título
- `numero_parcela`, `data_vencimento`, `valor_parcela`, `valor_total`
- `status`: `'aberto'`, `'pago'`, `'parcial'`, `'atrasado'`
- `valor_pago`, `juros`, `desconto`
- `observacao`, `observacao_interna`, `tags[]`

**`contas_receber_pagamentos`** — Pagamentos de parcelas
- `parcela_id`, `data_pagamento`, `valor_pago`
- `banco_id`, `tipo_documento_id`
- `juros`, `desconto`
- `estornado`, `data_estorno`, `motivo_estorno`

**`contas_receber_comprovantes`** — Arquivos de comprovante
- `pagamento_id`, `nome_arquivo`, `url_storage`
- `tipo_arquivo`, `tamanho_bytes`

### 2.2 Rotas

| Rota | Componente |
|------|-----------|
| `/financeiro/contas-receber` | `ContasReceber.tsx` — Listagem |
| `/financeiro/contas-receber/nova` | `ContasReceberForm.tsx` — Criação |
| `/financeiro/contas-receber/editar/:id` | `ContasReceberForm.tsx` — Edição |
| `/financeiro/contas-receber/detalhes/:id` | `ContasReceberDetalhes.tsx` — Detalhes |

### 2.3 Fluxo de Dar Baixa
```
Selecionar parcela → DarBaixaDialog
  ↓
Informar: banco, tipo doc, valor, juros, desconto, data
  ↓
Upload de comprovante (opcional)
  ↓
Insere em contas_receber_pagamentos
  ↓
Atualiza parcela: valor_pago, status
  ↓
Se total pago >= valor_total → status 'pago'
Se parcial → status 'parcial'
```

### 2.4 Estorno
- Marca pagamento como `estornado = true`
- Registra `data_estorno` e `motivo_estorno`
- Recalcula `valor_pago` da parcela

---

## 3. CONTAS A PAGAR

Mesma estrutura de Contas a Receber, com diferenças:
- `fornecedor_id` em vez de `cliente_id`
- Tabelas: `contas_pagar`, `contas_pagar_parcelas`, `contas_pagar_pagamentos`, `contas_pagar_comprovantes`
- Dialog de baixa: `DarBaixaPagarDialog`

---

## 4. FLUXO DE CAIXA

### 4.1 Hub (`/financeiro/fluxo-caixa`)
Links para visualização diária e mensal.

### 4.2 Diário (`/financeiro/fluxo-caixa/diario`)
- Movimentações dia a dia
- Filtro por período e banco
- Saldo acumulado

### 4.3 Mensal (`/financeiro/fluxo-caixa/mensal`)
- Consolidação por mês
- Saldo inicial configurável por período
- Projeção de saldo

### 4.4 Saldos Iniciais
Tabela `saldos_iniciais_bancos`:
- `banco_id`, `mes_referencia`, `ano_referencia`
- `saldo_inicial`, `data_referencia`

---

## 5. DRE

**Rota:** `/financeiro/dre`

Demonstrativo de Resultados do Exercício:
- Selecionar período
- Agrupamento por categorias do plano de contas (`faixa_dre`)
- Receitas − Deduções − Custos − Despesas = Resultado

---

## 6. DASHBOARD FINANCEIRO

**Rota:** `/financeiro/dashboard`

Utiliza view `vw_contas_receber_dashboard`:
- `total_a_receber`, `total_recebido`, `total_atrasado`
- `vencendo_hoje`
- `parcelas_abertas`, `parcelas_atrasadas`, `parcelas_pagas`

---

## 7. CONFIGURAÇÕES FINANCEIRAS

| Configuração | Rota | Tabela |
|-------------|------|--------|
| Bancos | `/configuracoes/bancos` | `bancos` |
| Tipos de Documentos | `/configuracoes/tipos-documentos` | `tipos_documento` |
| Categorias Plano Contas | `/configuracoes/categorias-plano-contas` | `categorias_plano_contas` |
| Plano de Contas | `/configuracoes/plano-contas` | `plano_contas` |
| Juros e Multas | `/configuracoes/juros` | `configuracoes_juros` |

### Juros e Multas (`configuracoes_juros`)
- `cobrar_juros`, `percentual_juros`, `tipo_juros` ('mensal'/'diario')
- `multa_atraso`, `percentual_multa`

---

## 8. RLS

### Tabelas principais
`contas_receber`, `contas_pagar`: `auth.uid() = usuario_id`

### Tabelas filhas (parcelas, pagamentos, comprovantes)
Verificação encadeada via EXISTS:
```sql
EXISTS (
  SELECT 1 FROM contas_receber_parcelas p
  JOIN contas_receber c ON c.id = p.conta_receber_id
  WHERE p.id = parcela_id AND c.usuario_id = auth.uid()
)
```

---

## 9. INTEGRAÇÃO COM ENCOMENDAS

Encomendas podem gerar contas a receber automaticamente:
- `encomendas.conta_receber_id` → FK para `contas_receber.id`
- Vinculação mantém rastreabilidade pedido ↔ financeiro

---

## 10. VIEWS

| View | Descrição |
|------|-----------|
| `vw_contas_receber_parcelas` | Parcelas com dados do título, cliente, banco, plano de contas |
| `vw_contas_receber_dashboard` | Resumo: totais a receber, recebido, atrasado |
| `vw_resumo_financeiro` | Saldos bancários consolidados |
