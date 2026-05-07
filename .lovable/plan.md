
# Módulo "Meu Planejamento"

Um hub de planejamento estratégico para confeitarias, com 4 abas principais e integração total com Encomendas, Receitas, Estoque e Financeiro.

---

## Estrutura de Abas

### 1. Calendário & Sazonalidade
- **Calendário visual mensal/semanal** com eventos marcados por cor
- **Datas comemorativas pré-carregadas** (Dia das Mães, Páscoa, Natal, Dia dos Namorados, Dia das Crianças, etc.) — ícones temáticos, editáveis pelo usuário
- **Datas pessoais**: férias, folgas, descanso programado (bloqueiam agenda de produção)
- **Integração com Encomendas**: exibe entregas confirmadas no calendário automaticamente
- **Planejamento de produção**: com base nas encomendas da semana, mostra o que precisa ser produzido e quando começar o preparo (lead time das receitas)

### 2. Metas & Indicadores (KPIs)
- **Metas por período** (mensal/trimestral/anual) em 4 áreas:
  - **Financeiro**: faturamento, lucro, ticket médio (puxa dados do módulo Meu Dinheiro)
  - **Vendas**: quantidade de encomendas, novos clientes (puxa de Encomendas e Clientes)
  - **Marketing**: metas de seguidores, posts, campanhas (entrada manual)
  - **Pessoal**: dias de descanso, horas de capacitação
- **Barra de progresso visual** para cada meta
- **Histórico de metas anteriores** para comparação

### 3. Plano de Ação (Tarefas)
- **Tarefas organizadas por área**: Financeiro, Marketing, Vendas, Atendimento, Produção, Pessoal
- **Cada tarefa tem**: título, descrição, área, prazo, prioridade (alta/média/baixa), status (pendente/em andamento/concluída)
- **Sugestões automáticas** baseadas em sazonalidade: ex. "Páscoa em 30 dias — crie sua campanha de ovos"
- **Checklist de preparação sazonal**: templates prontos para cada data comemorativa (ex: "Checklist Dia das Mães": definir cardápio, postar divulgação, comprar insumos, etc.)

### 4. Meu Bem-Estar
- **Agenda de descanso**: marcar férias e folgas que bloqueiam produção
- **Indicador visual**: dias trabalhados vs dias de descanso no mês
- **Alertas gentis**: "Você não tirou folga há 3 semanas" ou "Lembre-se de descansar antes da temporada de Natal"

---

## Banco de Dados (novas tabelas)

- **`planejamento_metas`**: id, owner_group_id, area (enum: financeiro/vendas/marketing/pessoal), titulo, valor_alvo, valor_atual, periodo_inicio, periodo_fim, status
- **`planejamento_tarefas`**: id, owner_group_id, user_id, area, titulo, descricao, prioridade, status, prazo, data_conclusao
- **`planejamento_datas_comemorativas`**: id, owner_group_id, nome, data_referencia (MM-DD), tipo (comemorativa/pessoal/descanso), cor, icone, ativo
- **`planejamento_descanso`**: id, owner_group_id, user_id, data_inicio, data_fim, tipo (ferias/folga/pessoal), observacao
- **Seed de datas comemorativas brasileiras** via trigger no primeiro acesso

RLS: todas as tabelas isoladas por `owner_group_id`, conforme arquitetura multi-tenancy existente.

---

## Integrações com Módulos Existentes

| Módulo | Integração |
|--------|-----------|
| Encomendas | Entregas aparecem no calendário; contagem alimenta meta de vendas |
| Meu Dinheiro | Faturamento real alimenta progresso das metas financeiras |
| Receitas | Lead time das receitas calcula quando iniciar produção |
| Meus Insumos | (futuro) Alerta de insumos insuficientes para produção planejada |
| Clientes | Novos clientes contam para meta de vendas |

---

## UI & Navegação

- **Rota**: `/planejamento` com sub-rotas (`/calendario`, `/metas`, `/tarefas`, `/bem-estar`)
- **Sidebar**: já existe em "Em Breve" — será ativado quando implementado
- **Design**: seguir tokens `cda-*`, cards com bordas `cda-pistache`, destaques `cda-dourado`
- **Responsivo**: calendário adaptável para mobile

---

## Fases de Implementação Sugeridas

**Fase 1 — Fundação**
- Tabelas no banco + RLS
- Tela do Calendário com datas comemorativas pré-carregadas
- CRUD de tarefas por área

**Fase 2 — Metas & Integrações**
- Metas com barras de progresso
- Integração com Encomendas (entregas no calendário)
- Integração com Financeiro (faturamento real vs meta)

**Fase 3 — Bem-Estar & Inteligência**
- Aba Meu Bem-Estar com alertas
- Sugestões automáticas sazonais
- Checklists pré-prontos por data comemorativa
- Bloqueio de produção em dias de descanso

---

## Restrição de Plano

A definir em fase posterior, conforme sua preferência. O módulo pode começar disponível para admin durante validação (mesmo padrão do "Meus Insumos").

---

## Documentação

- Atualizar `docs/AUDITORIA.md` com cada fase
- Criar `DOCS_PLANEJAMENTO.md` com arquitetura do módulo
