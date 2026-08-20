# 💰 DOCUMENTAÇÃO: Módulo Financeiro — Spa Flor de Baunilha

**Atualizada em:** 26/05/2026

---

## 1. VISÃO GERAL

Módulo completo de gestão financeira. **Requer Caixa Business**, `aluna_imersao` ou usuários legados de `Caixa Start` (descontinuado em 25/05/2026). Admin sempre bypass.

### Submódulos
- Dashboard Financeiro
- Contas a Receber (títulos, parcelas, pagamentos, comprovantes)
- Contas a Pagar (mesma estrutura)
- Fluxo de Caixa (diário e mensal)
- Transferências entre Bancos
- Fechamento de Mês (consolidação mensal travada)
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

## 5. TRANSFERÊNCIAS ENTRE BANCOS

**Rota:** `/financeiro/transferencias`  
**Tabela:** `transferencias_bancos`

Permite mover saldo entre contas bancárias cadastradas sem impactar receitas/despesas — apenas reflete no Fluxo de Caixa.

| Campo | Descrição |
|-------|-----------|
| `banco_origem_id` | Banco de saída (débito) |
| `banco_destino_id` | Banco de entrada (crédito) |
| `valor` | Valor transferido |
| `data_transferencia` | Data efetiva |
| `descricao` | Observação livre |
| `owner_group_id` | Multi-tenant |

**Regras:**
- Bancos origem e destino devem ser diferentes
- Valor > 0
- Aparece como saída no banco origem e entrada no banco destino dentro do Fluxo de Caixa
- Não entra no DRE (movimentação patrimonial, não receita/despesa)

---

## 6. FECHAMENTO DE MÊS

**Rota:** `/financeiro/fechamento-mes`  
**Tabela:** `fechamentos_mensais`  
**Doc detalhado:** `docs/DOCS_FECHAMENTO_MES.md`

Consolida o mês e **trava** lançamentos retroativos. Após fechar:
- Bloqueia INSERT/UPDATE/DELETE em `contas_receber_pagamentos` e `contas_pagar_pagamentos` com `data_pagamento` dentro do mês fechado
- Bloqueia ajustes em `transferencias_bancos` dentro do período
- Snapshot de saldos por banco é gravado e usado como `saldo_inicial` do mês seguinte

| Campo | Descrição |
|-------|-----------|
| `mes_referencia`, `ano_referencia` | Período fechado |
| `status` | `aberto` / `fechado` |
| `data_fechamento`, `fechado_por` | Auditoria |
| `snapshot_saldos` | JSONB com saldo final por banco |
| `owner_group_id` | Multi-tenant |

Reabertura disponível apenas para admin / role MOTHER do grupo.

---

## 7. DRE

**Rota:** `/financeiro/dre`

Demonstrativo de Resultados do Exercício:
- Selecionar período
- Agrupamento por categorias do plano de contas (`faixa_dre`)
- Receitas − Deduções − Custos − Despesas = Resultado

---

## 8. DASHBOARD FINANCEIRO

**Rota:** `/financeiro/dashboard`

Utiliza view `vw_contas_receber_dashboard`:
- `total_a_receber`, `total_recebido`, `total_atrasado`
- `vencendo_hoje`
- `parcelas_abertas`, `parcelas_atrasadas`, `parcelas_pagas`

---

## 9. CONFIGURAÇÕES FINANCEIRAS

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

## 10. RLS

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

## 11. INTEGRAÇÃO COM ENCOMENDAS

Encomendas podem gerar contas a receber automaticamente:
- `encomendas.conta_receber_id` → FK para `contas_receber.id`
- Vinculação mantém rastreabilidade pedido ↔ financeiro

---

## 12. VIEWS

| View | Descrição |
|------|-----------|
| `vw_contas_receber_parcelas` | Parcelas com dados do título, cliente, banco, plano de contas |
| `vw_contas_receber_dashboard` | Resumo: totais a receber, recebido, atrasado |
| `vw_resumo_financeiro` | Saldos bancários consolidados |
