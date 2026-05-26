# Fechamento de Mês

Funcionalidade que permite consolidar o resultado financeiro de um mês, congelar os valores em snapshot e bloquear alterações retroativas em lançamentos.

## Componentes

- **Página**: `src/pages/financeiro/FechamentoMes.tsx` — rota `/financeiro/fechamento-mes`.
- **Hook**: `src/hooks/useFechamentoMes.ts` — CRUD, prévia, snapshot, checklist.
- **Integração**: card no hub `src/pages/financeiro/Financeiro.tsx` e snapshot consumido por `useMeuSalario`.

## Banco de Dados

### `fechamentos_mensais`
Um registro por `(owner_group_id, mes_referencia)`. Campos:
- `mes_referencia` — sempre dia 1 do mês.
- `status` — `aberto` | `fechado`.
- Snapshot: `faturamento`, `custos`, `margem_seguranca`, `pro_labore_saudavel`, `retiradas`, `saldo_restante`, `snapshot` (jsonb).
- Auditoria: `fechado_em/por`, `reaberto_em/por`, `observacoes`.

### `fechamento_checklist_itens`
Itens de checklist (título, descrição, ordem, concluído, concluído_em/por) com FK para `fechamentos_mensais` (cascade).

## Permissões (RLS)
Qualquer usuário pertencente ao `owner_group_id` (validado via `public.user_in_group`) pode visualizar, criar, fechar e reabrir fechamentos do seu grupo. Itens de checklist herdam o acesso do fechamento pai.

## Trava de Lançamentos
Função `public.is_mes_fechado(grupo, data)` detecta meses fechados. Triggers `BEFORE INSERT/UPDATE/DELETE` em:

- `contas_receber` / `contas_pagar`
- `contas_receber_parcelas` / `contas_pagar_parcelas`
- `contas_receber_pagamentos` / `contas_pagar_pagamentos`

Bloqueiam totalmente operações cuja `data_vencimento`, `data_recebimento` ou `data_pagamento` caia dentro de um mês fechado. Mensagem: `Mês de MM/YYYY está fechado. Reabra o fechamento para alterar este lançamento.`

## Snapshot em Meu Salário
Quando o resumo do mês solicitado em `useMeuSalario` encontra um fechamento com `status='fechado'`, retorna os valores do snapshot ao invés de recalcular — garantindo coerência histórica mesmo se alguém alterar dados anteriores após reabrir/refechar.

## Checklist Padrão
Criado automaticamente ao iniciar um fechamento:
1. Conferir saldos bancários
2. Dar baixa em todas as contas a receber pagas
3. Dar baixa em todas as contas a pagar quitadas
4. Registrar pró-labore/retiradas do mês
5. Revisar lançamentos sem categoria
6. Conferir DRE e Fluxo de Caixa

Todos os itens precisam estar concluídos para liberar o botão "Fechar mês".
