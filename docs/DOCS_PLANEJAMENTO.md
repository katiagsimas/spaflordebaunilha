# Módulo: Meu Planejamento

## Visão Geral
Hub de planejamento estratégico para confeitarias com 4 abas: Calendário, Metas, Tarefas e Bem-Estar.

## Tabelas
- `planejamento_metas` — metas por área (financeiro/vendas/marketing/pessoal/producao/atendimento)
- `planejamento_tarefas` — tarefas com área, prioridade, status, prazo
- `planejamento_datas_comemorativas` — datas do calendário (11 feriados brasileiros pré-carregados como `is_system=true`). Campo `recorrente` (default true)
- `planejamento_descanso` — férias, folgas, descanso pessoal. Campos `recorrente` (boolean) e `recorrencia_tipo` (semanal/mensal/anual)

## RLS
Todas isoladas por `owner_group_id` via subquery em `user_group_roles`. Datas comemorativas do sistema (`is_system=true`) visíveis para todos.

## Acesso
Admin-only durante validação (mesmo padrão de Meus Insumos). PlanoGuard bloqueia `/planejamento` para não-admin.

## Enums
- `planejamento_area`, `planejamento_prioridade`, `planejamento_status`, `planejamento_data_tipo`, `planejamento_descanso_tipo`

## Integrações
- Calendário exibe encomendas do mês automaticamente
- Calendário exibe períodos de descanso (incluindo projeções recorrentes)
- Aba Metas reutiliza componentes existentes (PrevisaoFaturamentoCard, ProjecaoVendasCard)

## Drag-and-Drop
- Encomendas podem ser arrastadas para outro dia (atualiza `data_entrega`)
- Descansos podem ser arrastados (move `data_inicio` e `data_fim` mantendo duração)
- Datas comemorativas não são arrastáveis
- Projeções recorrentes (🔁) não são arrastáveis

## Eventos Recorrentes
- Datas comemorativas são inerentemente recorrentes (formato MM-dd)
- Descansos com `recorrente=true` são projetados no calendário (semanal/mensal/anual)
- Projeções são virtuais (não gravadas no DB), exibidas com prefixo 🔁

## Arquivos
- `src/pages/Planejamento.tsx` — página principal com tabs
- `src/pages/planejamento/PlanejamentoCalendario.tsx`
- `src/pages/planejamento/PlanejamentoTarefas.tsx`
- `src/pages/planejamento/PlanejamentoBemEstar.tsx`
