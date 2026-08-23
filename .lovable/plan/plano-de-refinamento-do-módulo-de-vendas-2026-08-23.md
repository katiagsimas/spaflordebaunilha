# Plano de Refinamento do Módulo de Vendas

Refinamento visual e terminológico do módulo de "Vendas" para "Serviços e Venda de Produtos" no Spa Flor de Baunilha, aplicando a nova identidade visual (Terracota).

## Alterações Propostas

### 1. Refinamento Terminológico (Vendas -> Serviços)
- Alterar o título da página principal (`src/pages/Encomendas.tsx`) de "Encomendas" para "Serviços e Venda de Produtos".
- Atualizar o subtítulo para algo mais alinhado ao novo contexto (ex: "Gerencie os agendamentos de serviços e as vendas de produtos da sua marca").
- Renomear botões de ação:
  - "Nova Encomenda" -> "Novo Serviço".
  - "Ver Encomendas" -> "Ver Serviços e Vendas".
- Atualizar títulos em componentes relacionados:
  - `EncomendasDoDia.tsx`: "Encomendas do dia" -> "Serviços e Vendas do dia".
  - `CalendariosEncomendas.tsx`: "Calendários de Encomendas" -> "Agenda de Serviços e Vendas".
  - `EncomendasLista.tsx`: "Encomendas - [Status]" -> "Serviços e Vendas - [Status]".

### 2. Navegação (Sidebar)
- No menu lateral (`src/components/AppSidebar.tsx`), alterar o título do item "Vendas" para "Vendas". *Nota: O usuário pediu para refinar o módulo "Vendas", mas manter o nome no menu pode ser útil para clareza comercial, porém vou seguir a instrução de refinar o título da página principal.*

### 3. Identidade Visual (Botões Terracota)
- Aplicar a cor `bg-sfb-terracota` e `text-sfb-baunilha` em todos os botões principais do módulo de Vendas.
- Garantir que os estados de hover e active sigam a paleta terracota suave.

## Detalhes Técnicos
- Utilizar os tokens de design existentes: `sfb-terracota` (#C98A75) e `sfb-baunilha` (#FBF6EE).
- Revisar arquivos:
  - `src/pages/Encomendas.tsx`
  - `src/pages/EncomendasLista.tsx`
  - `src/pages/EncomendasCalendarios.tsx`
  - `src/components/EncomendasDoDia.tsx`
  - `src/components/CalendariosEncomendas.tsx`
  - `src/components/encomendas/EncomendaStatusCard.tsx`
