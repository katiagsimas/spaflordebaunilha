# 💗 DOCUMENTAÇÃO: Meu Salário (Método Renda Doce) — Caixa de Açúcar

**Atualizada em:** 26/05/2026

---

## 1. VISÃO GERAL

Experiência de consciência financeira para confeiteiras, focada em diferenciar **faturamento, lucro e pró-labore**. O nome metodológico é **Renda Doce**, mas o item visível no menu lateral é **Meu Salário**.

- **Rota:** `/meu-salario`
- **Acesso:** Admin durante validação (`PlanoGuard`)
- **Filosofia:** abordagem acolhedora, sem culpa. Comunicação focada em diagnóstico e ajuste, não em julgamento

---

## 2. ESTRUTURA DE ARQUIVOS

| Arquivo | Função |
|---------|--------|
| `src/pages/meu-salario/MeuSalario.tsx` | Container com tabs (Visão geral, Retiradas, Aprender) |
| `src/pages/meu-salario/VisaoGeral.tsx` | Aba principal — resumo do mês anterior |
| `src/pages/meu-salario/Retiradas.tsx` | Aba de cadastro/histórico de retiradas |
| `src/pages/meu-salario/Educativo.tsx` | Aba "Aprender" — conteúdo sobre o método |
| `src/pages/meu-salario/copy.ts` | Microcopy (cenários, frases, mini-textos) |
| `src/components/meu-salario/*` | `CardResumoMes`, `CenarioResultado`, `RetiradaForm`, `HistoricoMensal`, `FraseRendaDoce` |
| `src/hooks/useMeuSalario.ts` | Hooks de cálculo e CRUD |
| `src/utils/exportarMeuSalarioPDF.ts` | Exportação PDF "Salvar meu resumo" |

### Hooks expostos
- `useResumoMesAnterior()` — números do mês anterior fechado/ativo
- `useHistoricoMeuSalario()` — série histórica para gráficos
- `useRetiradas(mes)` — lista de retiradas do período
- `useCriarRetirada()` / `useExcluirRetirada()`

---

## 3. LÓGICA FINANCEIRA

Sempre baseada no **mês anterior**, considerando apenas valores **efetivamente pagos/recebidos** (não estornados) — reflete entradas/saídas reais de caixa.

```
faturamento         = SUM(contas_receber_pagamentos.valor_pago)
                      WHERE data_pagamento ∈ mês anterior
                      AND NOT estornado

custos              = SUM(contas_pagar_pagamentos.valor_pago)
                      WHERE data_pagamento ∈ mês anterior
                      AND NOT estornado

margem_seguranca    = faturamento * 0.20
pro_labore_saudavel = max(0, faturamento − custos − margem_seguranca)

retiradas           = SUM(meu_salario_retiradas.valor)
                      WHERE data_retirada ∈ mês anterior

saldo               = pro_labore_saudavel − retiradas
```

### Cenários (faixa de ±5%)

| Condição | Cenário | Tom da copy |
|----------|---------|-------------|
| `saldo > +5%` | **abaixo** | Celebração — há margem disponível |
| `\|saldo\| ≤ 5%` | **equilibrio** | Reforço positivo — está no ponto |
| `saldo < −5%` | **acima** | Acolhedor, sem culpa — sugere ajuste |

---

## 4. INTEGRAÇÃO COM FECHAMENTO DE MÊS

Quando o mês solicitado possui registro em `fechamentos_mensais` com `status = 'fechado'`:

- `useMeuSalario` lê os valores do **snapshot** (campo `snapshot` jsonb)
- Garante coerência histórica: mesmo que alguém edite lançamentos antigos após reabrir/refechar, o número exibido permanece consistente com o fechamento

Quando o mês ainda está **aberto** (ou nunca foi fechado), os valores são **recalculados em tempo real** a cada acesso.

---

## 5. MODELO DE DADOS

### Tabela `public.meu_salario_retiradas`

| Coluna | Tipo |
|--------|------|
| id | uuid PK |
| owner_group_id | uuid FK `groups` |
| user_id | uuid |
| data_retirada | date |
| valor | numeric(12,2) — `CHECK > 0` |
| descricao | text |
| created_at / updated_at | timestamptz |

**Índices:** `(owner_group_id, data_retirada)`

**RLS:** SELECT/INSERT/UPDATE/DELETE restritos a membros do `owner_group_id` (via `user_group_roles`).

**Triggers:** `update_updated_at_column` em UPDATE.

---

## 6. IDENTIDADE VISUAL

Tokens locais em `src/index.css` (escopados ao módulo):

| Token | Uso |
|-------|-----|
| `--rd-vinho` | Cor primária |
| `--rd-rose-queimado` | Acento quente |
| `--rd-dourado` | Destaques e valores |
| `--rd-creme` | Background |

Wrapper `.renda-doce-scope` aplica gradiente creme em toda a página.

> ⚠️ Estes tokens vivem em paralelo aos tokens globais `--cda-*` por design — o módulo tem identidade visual distinta dentro do app.

---

## 7. EXPORTAÇÃO PDF

Botão **"Salvar meu resumo"** na aba Visão geral gera PDF A4 com:

- Cabeçalho com identidade vinho/dourado/creme
- Números do mês (faturamento, custos, margem, pró-labore saudável, retiradas, saldo)
- Cenário diagnosticado (abaixo / equilíbrio / acima)
- Frase Renda Doce contextualizada

Implementação: `src/utils/exportarMeuSalarioPDF.ts` (jsPDF).

---

## 8. ABA EDUCATIVA

`Educativo.tsx` traz conteúdo sobre o método Renda Doce:
- Diferença entre faturamento, lucro e pró-labore
- Por que reservar 20% como margem de segurança
- Como interpretar cada cenário
- Boas práticas de retirada mensal

Conteúdo estático, sem dependência de backend.

---

## 9. CONVENÇÕES

- Datas sempre em `YYYY-MM-DD` (`src/lib/dateUtils.ts`)
- Valores: `numeric(12,2)`, sempre > 0 em retiradas
- Multi-tenant via `owner_group_id` + `user_group_roles`
- Tom de voz: acolhedor, sem julgamento — ver `copy.ts`
