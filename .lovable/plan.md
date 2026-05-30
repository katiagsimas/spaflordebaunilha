# Plano: Responsividade Mobile sem Cortes

## Objetivo
Garantir que em viewport mobile (≤640px, foco em 360–414px) **nenhum elemento fique cortado, escondido sob outro ou exigindo scroll horizontal indesejado**, em todas as páginas do sistema.

## Diagnóstico (a partir do screenshot e varredura do código)

Padrões problemáticos recorrentes:

1. **`CardHeader` com `flex flex-row items-center justify-between`** — força título + filtros + botão na mesma linha. Em 390px, o botão "Nova Unidade" sai da tela (visível no print: aparece `+ N` cortado).
2. **Tabelas largas** (`<Table>`) sem wrapper de scroll consistente — colunas extras (Status, Ações) ficam fora da viewport.
3. **Headers de página** com título longo + botões de ação na mesma linha.
4. **Filtros mês/ano + período** com `gap-x-8` fixo que estoura a largura.
5. **Modais (`DialogContent`)** sem `max-w` responsivo ou `max-h` + overflow para telas pequenas.
6. **Sidebar mobile** ocupando espaço quando deveria colapsar.

## Escopo das páginas a revisar

Páginas/components identificados como críticos:

- **Cadastros**: `UnidadesMedida`, `Clientes`, `Fornecedores`, `Categorias`, `SeusDados`
- **Configurações**: `Backup`, `Bancos`, `PlanoContas`, `CategoriasPlanoContas`, `TagsEncomendas`, `TiposDocumentos`, `TiposInsumos`, `ConfiguracaoJuros`, `FinanceiroPage`, `PrecificacaoPage`, `CadastrosBase`
- **Financeiro**: `ContasPagar`, `ContasReceber`, `ContasPagarDetalhes`, `ContasReceberDetalhes`, `DRE`, `FluxoCaixaMensal`, `FluxoCaixaDiario`, `FluxoCaixaHub`, `DashboardFinanceiro`, `FechamentoMes`, `Financeiro`
- **Encomendas**: `Encomendas`, `EncomendasLista`, `EncomendasCalendarios` + `EncomendaStatusCard`, `CalendariosEncomendas`
- **Precificação**: `Precificacao`, `Ingredientes`, `Embalagens`, `PrePreparos`, `PrePreparoForm`, `MaoDeObra`
- **Receitas**: `Receitas`, `ReceitaForm`
- **Estoque**: `EstoqueDashboard`, `EstoqueEntrada`, `EstoqueAjuste`, `EstoqueMovimentacoes`
- **Admin**: `Usuarios`, `Governanca`, `Logs`, `CofreBackups`
- **Comercial**: `Propostas`, `NovaProposta`, `Contratos`, `Negociacoes`, `RelatorioPropostas`
- **Planejamento**: `Planejamento`, `PlanejamentoCalendario`, `PlanejamentoTarefas`, `PlanejamentoBemEstar`
- **Meu Salário**: `MeuSalario`, `Retiradas`, `VisaoGeral`, `Educativo`
- **Conversa Doce**: `ConversaDoce`, `ConversaDoceRespostas`, `FavoritosSheet`
- **Organização Doce**: `OrganizacaoDoce`
- **Onboarding/Upgrade**: `BemVinda`, `Concluido`, `Upgrade`
- **Componentes globais**: `PageHeader`, `AppSidebar`, `HeaderControls`, `UserMenu`, `EncomendaStatusCard`, `ContatosLista`, `FamiliaresLista`, `TabelaInadimplencia`, `FinanceiroNav`, `MaoObraSection`

## Padrões de correção (aplicados de forma sistemática)

### A. CardHeaders com filtros + botão
```text
ANTES: flex flex-row items-center justify-between
DEPOIS: flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between
```
Filtros internos: `flex-wrap` + Select com `w-full sm:w-40`. Botão "Novo": `w-full sm:w-auto`.

### B. Tabelas
Toda `<Table>` envolvida em `<div className="overflow-x-auto -mx-4 sm:mx-0 px-4 sm:px-0">` para permitir swipe lateral sem cortar o card. Adicionar `min-w-[640px]` na table quando colunas críticas.

### C. PageHeader
Já é responsivo (`md:flex-row`). Validar — sem mudanças estruturais, apenas garantir `truncate` no título quando muito longo e `actions` com `w-full sm:w-auto` nos botões.

### D. Filtros de período (mês/ano)
```text
ANTES: flex flex-wrap items-center gap-x-8 gap-y-3
DEPOIS: flex flex-col sm:flex-row sm:flex-wrap gap-3 sm:gap-x-6
```
Selects com `flex-1 sm:flex-none sm:w-36`.

### E. Modais (DialogContent)
Adicionar `max-w-[calc(100vw-2rem)] sm:max-w-lg max-h-[90vh] overflow-y-auto` onde estiver faltando.

### F. Padding lateral
Páginas com `p-4 md:p-6` mantidas. Páginas que usam apenas `p-6` recebem `p-4 md:p-6`.

### G. Botões de ação fixos
"Voltar" + "Atualizar" + badge de usuário no topo: garantir `flex-wrap` no container e `truncate` em labels longos.

### H. Sidebar/topo
Validar que `AppSidebar` colapsa para sheet em mobile (já usa `useIsMobile`) — apenas verificar gaps.

### I. Cards de status (EncomendaStatusCard, dashboards)
Grids `grid-cols-2 sm:grid-cols-3 lg:grid-cols-5` em vez de `flex` fixo.

## Estratégia de execução

1. **Fase 1 — Componentes compartilhados** (impacto multiplicador):
   `PageHeader`, `EncomendaStatusCard`, `FinanceiroNav`, `TabelaInadimplencia`, `HeaderControls`, `UserMenu`, `AlertaExpiracaoPlano`, wrapper de tabelas reutilizável.

2. **Fase 2 — Páginas de cadastro/configuração** (mesmo padrão de CardHeader+Tabela+Dialog): aplicar padrões A, B, E em ~20 páginas.

3. **Fase 3 — Financeiro** (filtros pesados + tabelas largas): padrões A, B, D.

4. **Fase 4 — Encomendas + Precificação + Receitas + Estoque**: padrões A, B, I + revisão dos forms longos.

5. **Fase 5 — Páginas restantes** (admin, comercial, planejamento, meu-salário, conversa-doce, onboarding).

6. **QA visual**: navegar via browser tool em 390×680 pelas rotas principais (`/configuracoes/unidades-medida`, `/financeiro/contas-receber`, `/encomendas`, `/financeiro/dre`, `/admin/usuarios`, `/precificacao/ingredientes`) e capturar screenshots para confirmar zero cortes.

## Fora de escopo
- Redesign visual / mudança de paleta ou tipografia.
- Mudanças de lógica/funcionalidade.
- Otimização para tablet específica (foco mobile 360–414px; tablet já funciona com breakpoints `md:`).
- Documentação em `docs/AUDITORIA.md` (não há mudança de RLS/SQL/auth/edge function).

## Resultado esperado
Em viewport 390×680, todas as páginas listadas devem: (1) caber sem scroll horizontal indesejado no body, (2) ter todos os botões de ação acessíveis (não cortados), (3) tabelas roláveis lateralmente dentro do card quando necessário, (4) modais sem overflow vertical bloqueado, (5) filtros empilhados verticalmente quando não couberem lado a lado.