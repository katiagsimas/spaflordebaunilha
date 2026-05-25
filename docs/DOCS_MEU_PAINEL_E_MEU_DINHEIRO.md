# 📊💰 DOCUMENTAÇÃO — Módulos "Meu Painel" e "Meu Dinheiro"

**Projeto:** Caixa de Açúcar
**Atualizado em:** 2026-05-25
**Escopo:** Visão consolidada das implementações e do comportamento atual dos módulos **Meu Painel** (`/dashboard`) e **Meu Dinheiro** (`/financeiro`), incluindo integrações, hooks, regras de negócio e dependências cruzadas.

> Nomes no menu lateral (`AppSidebar.tsx` → seção **MEU NEGÓCIO**):
> - **Meu Painel** → rota `/dashboard` → `src/pages/Dashboard.tsx`
> - **Meu Dinheiro** → rota `/financeiro` → `src/pages/financeiro/Financeiro.tsx` (hub) + submódulos

Ambos são acessíveis a usuários com plano ativo (passam por `PlanoGuard`) — Meu Painel está disponível para todos os planos pagos; Meu Dinheiro requer **Caixa Business** (ou role `admin` para bypass). Detalhes de plano em `docs/DOCS_PLANOS.md`.

---

## 1. MEU PAINEL (`/dashboard`)

Painel inicial pós-login. Centraliza a operação do dia/mês da confeitaria em uma única tela.

### 1.1 Estrutura visual (de cima para baixo)

1. **Cabeçalho com saudação personalizada** — usa `useUserProfile()` para exibir `nome_completo` e `avatar_url` (logomarca).
2. **Contadores rápidos do mês selecionado**
   - Encomendas confirmadas
   - Clientes ativos
3. **Bloco de Alertas Financeiros** — destaca:
   - Contas a receber em atraso (quantidade + valor)
   - Contas a pagar em atraso (quantidade + valor)
   - Inadimplência total
4. **Calendário triplo de Encomendas** — mês anterior · mês atual · mês seguinte, com badges por dia indicando quantidade de encomendas. Clique no dia abre o detalhamento lateral (`encomendasDia`).
5. **Aniversariantes do mês** — clientes do grupo com `data_aniversario` no mês corrente.
6. **Visão Econômica** — abas **Mensal** e **Anual**:
   - Mensal: receitas, custos e lucro do mês.
   - Anual: gráfico de barras com 12 meses (Recharts `BarChart`).
7. **Top 5 Produtos** + **Ticket Médio** (mensal/anual) — via `carregarProdutosMaisVendidos()`.
8. **Vendas por Mês** (linha, 6 meses) e **Fluxo de Caixa** (linha, 6 meses).

### 1.2 Carregamento e estado

Função orquestradora `carregarDados()` dispara em paralelo:

```
Promise.all([
  carregarAlertas(),
  carregarCalendario(),
  carregarFinanceiro(),
  carregarVisaoEconomica(),
  carregarContadoresEGraficos(),
  carregarAniversariantes()
])
```

Os calendários do **mês anterior** e **mês seguinte** são carregados por `useEffect`s próprios, vinculados a `mesAnterior` / `mesSeguinte`, evitando recarregar o calendário central quando o usuário só navega lateralmente.

Loading screen: `LoadingStateFullScreen` enquanto `loading === true`.

### 1.3 Realtime e debounce (otimização)

Canal Supabase `dashboard-updates` escuta `postgres_changes` em:

- `contas_receber_parcelas`, `contas_receber_pagamentos`
- `contas_pagar_parcelas`, `contas_pagar_pagamentos`
- `encomendas`

Para evitar cascata de chamadas, há **debounce de 2.500 ms** via `debounceTimerRef` / `debounceCalendarioRef`. Alterações em `encomendas` recarregam **dados + ambos os calendários laterais**; mudanças puramente financeiras recarregam só os dados. Canal é destruído no cleanup (`supabase.removeChannel`).

### 1.4 Datas

Sempre via `src/lib/dateUtils.ts` (`getTodayISO`, `formatDateToISO`, `parseISOToDate`) e helpers `date-fns` para iteração (`eachDayOfInterval`, `startOfMonth`, `endOfMonth`). **Nunca** instanciar `new Date('YYYY-MM-DD')` para datas puras — risco de offset UTC −1.

### 1.5 Dependências de dados

- `clientes` (filtrado por `usuario_id`) — aniversariantes e contagem de clientes.
- `encomendas` — calendários, top 5 produtos, ticket médio, vendas por mês.
- `contas_receber*` / `contas_pagar*` — alertas, fluxo de caixa, visão econômica.

Toda leitura é escopada por contexto de grupo via RLS (membro de `owner_group_id`).

---

## 2. MEU DINHEIRO (`/financeiro`)

Hub financeiro completo. A rota raiz `/financeiro` (componente `Financeiro.tsx`) é a porta de entrada e ponte de navegação para os submódulos. A documentação detalhada de tabelas, regras e RLS está em **`DOCS_FINANCEIRO.md`**; aqui descrevemos a topologia atual e o que foi consolidado nas últimas implementações.

### 2.1 Submódulos e rotas

| Rota | Página | Função |
|---|---|---|
| `/financeiro` | `Financeiro.tsx` | Hub com KPIs, navegação por mês/ano, atalhos e tabela de inadimplência |
| `/financeiro/dashboard` | `DashboardFinanceiro.tsx` | Painel analítico financeiro |
| `/financeiro/contas-receber` | `ContasReceber.tsx` | Lista de títulos a receber |
| `/financeiro/contas-receber/nova` · `/editar/:id` | `ContasReceberForm.tsx` | Cadastro/edição |
| `/financeiro/contas-receber/:id` | `ContasReceberDetalhes.tsx` | Parcelas, pagamentos, comprovantes |
| `/financeiro/contas-pagar` (+ `nova`, `editar`, `detalhes`) | `ContasPagar*.tsx` | Mesma estrutura espelhada |
| `/financeiro/fluxo-caixa` | `FluxoCaixaHub.tsx` | Hub com escolha diário/mensal |
| `/financeiro/fluxo-caixa/diario` | `FluxoCaixaDiario.tsx` | Lançamentos dia a dia |
| `/financeiro/fluxo-caixa/mensal` | `FluxoCaixaMensal.tsx` | Visão consolidada por mês |
| `/financeiro/dre` | `DRE.tsx` | Demonstrativo de resultados |
| `/financeiro/fechamento-mes` | `FechamentoMes.tsx` | Fechamento mensal consolidado |
| `/financeiro/cadastros` (+ subrotas) | Bancos, Tipos de Documentos, Categorias, Plano de Contas, Juros | Cadastros base do módulo |

Rotas legadas em `/configuracoes/financeiro`, `/configuracoes/bancos`, `/configuracoes/plano-contas` etc. **redirecionam** para `/financeiro/cadastros/...` via `<Navigate replace>`. Manter os redirects evita quebrar links antigos.

### 2.2 Hub `Financeiro.tsx`

- Navegação temporal por **mês/ano** (`mesSelecionado`, `anoSelecionado`).
- KPIs do mês via `useResumoDashboard()` (`src/hooks/useResumoDashboard.ts`) — fonte única de verdade para totais a receber/pagar, saldo previsto, inadimplência.
- Tabela de inadimplência (`TabelaInadimplencia`) com clientes em atraso (drill-down para o título).
- Gráficos consolidados (Recharts `BarChart`) de receitas × despesas.
- Atalhos rápidos para novo recebível/pagável, fluxo de caixa, DRE e fechamento.

### 2.3 Estrutura de dados (resumo)

Tabelas principais e responsabilidades:

- **`contas_receber` / `contas_pagar`** — título principal: descrição, valor total, vencimento, banco, categoria, plano de contas, status (`pendente`, `parcial`, `pago`, `cancelado`), tipo de lançamento (`unico`, `parcelado`, `recorrente`).
- **`contas_receber_parcelas` / `contas_pagar_parcelas`** — parcelas individuais com vencimento e valor.
- **`contas_receber_pagamentos` / `contas_pagar_pagamentos`** — eventos de pagamento (`valor_pago`, `data_pagamento`, `estornado`, comprovante em Storage).
- **`fechamentos_mensais`** — snapshot consolidado por `mes_referencia` (status `aberto` / `fechado`), congelando faturamento, custos e bases para o módulo Meu Salário.
- **Cadastros base:** `bancos`, `tipos_documento`, `categorias_financeiras`, `plano_contas`, `configuracoes_juros`.

Todas com RLS por `owner_group_id` e bloqueio de SELECT/INSERT/UPDATE/DELETE fora do grupo do usuário autenticado. Comprovantes ficam em bucket de Storage privado, acessado via signed URL.

### 2.4 Regras de negócio relevantes

- **Caixa de fato:** somatórios financeiros (faturamento, custos, fluxo) consideram apenas pagamentos **`estornado = false`** dentro do intervalo de data — espelhando entradas/saídas reais.
- **Status do título** é derivado dos pagamentos: ao registrar/estornar pagamento, triggers atualizam `status` da parcela e do título-pai.
- **Juros e multa** aplicáveis a parcelas vencidas seguem o cadastro em `configuracoes_juros`.
- **Fechamento mensal congela** as bases (faturamento, custos, margem) usadas por `useResumoMesAnterior` (Meu Salário). Quando há `fechamento` com `status='fechado'` para o mês, o snapshot prevalece sobre o recálculo on-the-fly.

### 2.5 Integrações cruzadas

- **Meu Painel** lê `contas_*_pagamentos` para alertas, fluxo de caixa e visão econômica.
- **Meu Salário** (`/meu-salario`) lê o mesmo conjunto via `useMeuSalario.ts` para calcular pró-labore saudável do mês anterior.
- **DRE** e **Fechamento de Mês** consomem as mesmas tabelas com agregações específicas (DRE por plano de contas; fechamento por mês de referência).

---

## 3. Padrões compartilhados

### 3.1 Datas
- Sempre `src/lib/dateUtils.ts` para conversões ISO ↔ Date. Nunca `new Date('YYYY-MM-DD')` direto.
- Intervalos de mês para queries: `getFirstDayOfMonth(refIso)` / `getLastDayOfMonth(refIso)`.

### 3.2 Loading global e UX
- Telas obedecem ao padrão de **early-return** quando `useGlobalLoading()` está ativo, evitando flashes.
- Skeletons/loaders locais com `LoadingState` / `LoadingStateFullScreen`.

### 3.3 Realtime
- Canais Supabase específicos por tela, sempre com debounce ≥ 2 s para colapsar bursts (ex.: dar baixa em 5 parcelas).
- Cleanup obrigatório em `useEffect` (`removeChannel` + `clearTimeout`).

### 3.4 Multi-tenancy e RLS
- Toda leitura e escrita escopada por `owner_group_id` via políticas. Não confiar em filtros do cliente.
- Hooks dependentes de grupo usam `activeGroupId` do `GroupContext` e só executam quando definido (`enabled: !!activeGroupId`).

### 3.5 React Query
- Queries-chave do módulo financeiro são invalidadas em conjunto após mutações (pagamentos, estornos, novas parcelas) para manter Meu Painel, Meu Dinheiro e Meu Salário coerentes.
- Padrão de queryKey escopada por grupo (e por usuário quando individual), ex.: `['profile', user?.id, activeGroup?.id]`.

---

## 4. Itens recentes consolidados

- **2026-05-25** — `SeusDados.tsx`: persistência imediata de `avatar_url`, storage path corrigido (`${user.id}/logo.ext`), queryKey escopada por `activeGroup?.id`, inclusão de `email` no update do perfil. Detalhes: `docs/AUDITORIA.md` → seção *CORREÇÕES SEUSDADOS.TSX*.
- **Fechamento de mês ↔ Meu Salário:** integração via `fechamentos_mensais` para snapshot consistente.
- **Hub `/financeiro`:** migração de configurações antigas para subrotas `/financeiro/cadastros/*` com redirects preservados.
- **Debounce 2.5 s** no realtime do Dashboard para reduzir recarregamentos em cascata.

---

## 5. Referências cruzadas

- `DOCS_FINANCEIRO.md` — Detalhe completo de tabelas, parcelas, pagamentos e juros.
- `DOCS_FECHAMENTO_MES.md` — Lógica de consolidação mensal.
- `DOCS_MEU_SALARIO.md` — Como o módulo consome dados de pagamentos/recebimentos.
- `docs/AUDITORIA.md` — Histórico de correções e status de itens.
- `docs/PENDENCIAS_SEGURANCA.md` — Pendências que exigem ação externa.
- `docs/DOCS_PLANOS.md` — Matriz de acesso por plano.
