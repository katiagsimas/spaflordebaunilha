# Módulo: Meu Planejamento

## Visão Geral
Hub de planejamento estratégico para confeitarias com 4 abas: Calendário, Metas, Tarefas e Bem-Estar.

## Tabelas
- `planejamento_metas` — metas por área (financeiro/vendas/marketing/pessoal/producao/atendimento)
- `planejamento_tarefas` — tarefas com área, prioridade, status, prazo
- `planejamento_datas_comemorativas` — datas do calendário (11 feriados brasileiros pré-carregados como `is_system=true`)
- `planejamento_descanso` — férias, folgas, descanso pessoal

## RLS
Todas isoladas por `owner_group_id` via subquery em `user_group_roles`. Datas comemorativas do sistema (`is_system=true`) visíveis para todos.

## Acesso
Admin-only durante validação (mesmo padrão de Meus Insumos). PlanoGuard bloqueia `/planejamento` para não-admin.

## Enums
- `planejamento_area`, `planejamento_prioridade`, `planejamento_status`, `planejamento_data_tipo`, `planejamento_descanso_tipo`

## Integrações
- Calendário exibe encomendas do mês automaticamente
- Calendário exibe períodos de descanso
- Aba Metas reutiliza componentes existentes (PrevisaoFaturamentoCard, ProjecaoVendasCard)

## Arquivos
- `src/pages/Planejamento.tsx` — página principal com tabs
- `src/pages/planejamento/PlanejamentoCalendario.tsx`
- `src/pages/planejamento/PlanejamentoTarefas.tsx`
- `src/pages/planejamento/PlanejamentoBemEstar.tsx`
