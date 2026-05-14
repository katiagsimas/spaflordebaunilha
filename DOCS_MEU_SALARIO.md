# Módulo Meu Salário • Método Renda Doce

## Visão geral

Experiência de consciência financeira para confeiteiras, focada em diferenciar **faturamento, lucro e pró-labore**. O nome metodológico é **Renda Doce**, mas o item visível no menu é **Meu Salário**.

Acesso: rota `/meu-salario`, restrita a **admin** durante validação (via `PlanoGuard`).

## Estrutura

- `src/pages/meu-salario/MeuSalario.tsx` — container com tabs (Visão geral, Retiradas, Aprender)
- `src/pages/meu-salario/VisaoGeral.tsx`
- `src/pages/meu-salario/Retiradas.tsx`
- `src/pages/meu-salario/Educativo.tsx`
- `src/pages/meu-salario/copy.ts` — microcopy (cenários, frases, mini-textos)
- `src/components/meu-salario/*` — `CardResumoMes`, `CenarioResultado`, `RetiradaForm`, `HistoricoMensal`, `FraseRendaDoce`
- `src/hooks/useMeuSalario.ts` — `useResumoMesAnterior`, `useHistoricoMeuSalario`, `useRetiradas`, `useCriarRetirada`, `useExcluirRetirada`
- `src/utils/exportarMeuSalarioPDF.ts` — exportação "Salvar meu resumo"

## Lógica financeira

Sempre baseada no **mês anterior fechado**.

```
faturamento = SUM(contas_receber.valor) WHERE data_recebimento ∈ mês anterior
custos      = SUM(contas_pagar.valor)   WHERE data_pagamento  ∈ mês anterior
margem      = faturamento * 0.20
pro_labore_saudavel = max(0, faturamento - custos - margem)
retiradas   = SUM(meu_salario_retiradas.valor) WHERE data_retirada ∈ mês anterior
saldo       = pro_labore_saudavel - retiradas
```

Cenários:
- `saldo > +5%` → **abaixo** (margem disponível)
- `|saldo| ≤ 5%` → **equilibrio**
- `saldo < -5%` → **acima** (acolhedor, sem culpa)

## Banco de dados

Tabela `public.meu_salario_retiradas`:

| coluna | tipo |
|---|---|
| id | uuid PK |
| owner_group_id | uuid FK groups |
| user_id | uuid |
| data_retirada | date |
| valor | numeric(12,2) > 0 |
| descricao | text |
| created_at / updated_at | timestamptz |

Índice: `(owner_group_id, data_retirada)`.
RLS: SELECT/INSERT/UPDATE/DELETE restritos a membros do `owner_group_id` (`user_group_roles`).
Trigger `update_updated_at_column` em UPDATE.

## Identidade visual

Tokens locais em `src/index.css`:
- `--rd-vinho`, `--rd-rose-queimado`, `--rd-dourado`, `--rd-creme`
- Wrapper `.renda-doce-scope` aplica gradiente creme.

## Exportação PDF

Botão "Salvar meu resumo" em **Visão geral** gera PDF A4 com identidade vinho/dourado/creme contendo: cabeçalho, números do mês, cenário e frase Renda Doce.
