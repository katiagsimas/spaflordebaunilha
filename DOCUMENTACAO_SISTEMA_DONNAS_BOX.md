# 📚 DOCUMENTAÇÃO TÉCNICA - DONNA'S BOX

## 🎯 VISÃO GERAL DO SISTEMA

**Donna's Box** é um sistema de gestão completo para confeitarias, desenvolvido com React + TypeScript + Supabase (Lovable Cloud), focado em:
- Gestão de encomendas e produção
- Controle de estoque integrado
- Precificação técnica de produtos
- Gestão financeira completa (contas a pagar/receber, fluxo de caixa, DRE)
- Inteligência de negócios com análises e insights

---

## 1. MÓDULOS PRINCIPAIS

### 1.1. DASHBOARD
**Rota:** `/dashboard`  
**Componente:** `src/pages/Dashboard.tsx`  
**Funcionalidades:**
- Visão geral dos principais indicadores
- Atalhos para módulos principais
- Alertas e notificações importantes

---

### 1.2. ENCOMENDAS
**Rota:** `/encomendas`  
**Componente:** `src/pages/Encomendas.tsx`  
**Funcionalidades:**
- Gestão completa de encomendas de clientes
- Controle de status (pendente, em produção, entregue, etc.)
- Vinculação com produtos do catálogo
- Sistema de tags personalizáveis
- Geração de receitas financeiras

**Componentes Relacionados:**
- `src/components/encomendas/SeletorTags.tsx`
- `src/schemas/encomendaSchema.ts`

**Tabelas do Banco:**
- `encomendas` - Cabeçalho das encomendas
- `encomenda_itens` - Itens de cada encomenda
- `encomendas_tags` - Relacionamento com tags
- `tags_encomendas` - Catálogo de tags

---

### 1.3. ESTOQUE

#### 1.3.1. Catálogo de Itens
**Rota:** `/estoque`  
**Componente:** `src/pages/CatalogoItens.tsx`  
**Funcionalidades:**
- Cadastro de ingredientes e embalagens
- Controle de estoque em tempo real
- Sistema de rastreamento por item
- Alertas de ponto de pedido
- Gestão de preços e fornecedores

**Componentes Relacionados:**
- `src/components/estoque/CardItem.tsx`
- `src/components/estoque/ModalItem.tsx`
- `src/components/estoque/AlertasEstoque.tsx`
- `src/components/estoque/BadgeStatus.tsx`
- `src/components/estoque/EntradaRapida.tsx`

#### 1.3.2. Movimentações
**Rota:** `/estoque/movimentacoes`  
**Componente:** `src/pages/estoque/RelatorioMovimentacoes.tsx`  
**Funcionalidades:**
- Registro de entradas (compras)
- Registro de saídas (consumo em produção)
- Ajustes de estoque
- Controle de perdas
- Histórico completo de movimentações

**Componentes Relacionados:**
- `src/components/estoque/ModalMovimentacao.tsx`
- `src/components/estoque/NovaEntradaDialog.tsx`
- `src/components/estoque/NovaSaidaDialog.tsx`

#### 1.3.3. Relatórios de Estoque
**Rotas:**
- `/estoque/relatorios` - Hub de relatórios
- `/estoque/consumo-medio` - Análise de consumo
- `/estoque/cmv-global` - Custo de Mercadoria Vendida

**Componentes:**
- `src/pages/estoque/RelatoriosEstoque.tsx`
- `src/pages/estoque/RelatorioConsumoMedio.tsx`
- `src/pages/estoque/RelatorioCMVGlobal.tsx`

**Tabelas do Banco:**
- `itens` - Cadastro de ingredientes/embalagens
- `precos` - Histórico de preços por fornecedor
- `movimentacoes_estoque` - Todas as movimentações
- `entradas_detalhadas` - Detalhamento de compras
- `estoque_atual` - View com saldo atual consolidado
- `categorias_estoque` - Categorização de itens

**Hooks Customizados:**
- `src/hooks/useEstoque.ts`
- `src/hooks/useEstoqueIntegrado.ts`
- `src/hooks/useMovimentacoes.ts`
- `src/hooks/useConsumoMedio.ts`
- `src/hooks/useCategoriasEstoque.ts`

---

### 1.4. PRECIFICAÇÃO

#### 1.4.1. Hub Principal
**Rota:** `/precificacao`  
**Componente:** `src/pages/Precificacao.tsx`  
**Funcionalidades:**
- Acesso centralizado para precificação
- Links para ingredientes, embalagens, pré-preparos e fichas técnicas

#### 1.4.2. Ingredientes
**Rota:** `/precificacao/ingredientes`  
**Componente:** `src/pages/precificacao/Ingredientes.tsx`  
**Funcionalidades:**
- Cadastro detalhado de ingredientes
- Vinculação com estoque
- Controle de múltiplos preços/fornecedores
- Conversão de unidades de medida

#### 1.4.3. Embalagens
**Rota:** `/precificacao/embalagens`  
**Componente:** `src/pages/precificacao/Embalagens.tsx`  
**Funcionalidades:**
- Cadastro de embalagens (primárias e secundárias)
- Controle de custos por unidade
- Vinculação com fichas técnicas

#### 1.4.4. Pré-Preparos
**Rotas:**
- `/precificacao/pre-preparos` - Listagem
- `/precificacao/pre-preparos/novo` - Criação
- `/precificacao/pre-preparos/:id` - Edição

**Componentes:**
- `src/pages/precificacao/PrePreparos.tsx`
- `src/pages/precificacao/PrePreparoForm.tsx`

**Funcionalidades:**
- Receitas intermediárias (massas, cremes, coberturas)
- Cálculo automático de custo total
- Custo por unidade de rendimento
- Controle de tempo de preparo
- Upload de imagens

**Tabelas:**
- `pre_preparos` - Cadastro dos pré-preparos
- `pre_preparos_ingredientes` - Ingredientes usados

#### 1.4.5. Fichas Técnicas (Receitas)
**Rotas:**
- `/precificacao/ficha-tecnica` - Listagem
- `/precificacao/ficha-tecnica/nova` - Criação
- `/precificacao/ficha-tecnica/editar/:id` - Edição

**Componentes:**
- `src/pages/Receitas.tsx`
- `src/pages/ReceitaForm.tsx`

**Funcionalidades:**
- Composição completa de produtos finais
- Cálculo de custo total (ingredientes + embalagens + mão de obra)
- Definição de preço de venda
- Cálculo de margem de lucro
- Modo de preparo detalhado
- Upload de múltiplas imagens

**Tabelas:**
- `receitas` - Cadastro das receitas
- `receitas_ingredientes` - Ingredientes da receita
- `receitas_embalagens` - Embalagens utilizadas
- `receitas_despesas_venda` - Despesas variáveis
- `receitas_imagens` - Galeria de imagens

**Hooks:**
- `src/hooks/useReceitas.ts`
- `src/hooks/useSubReceitas.ts`

---

### 1.5. FINANCEIRO

#### 1.5.1. Hub Principal
**Rota:** `/financeiro`  
**Componente:** `src/pages/financeiro/Financeiro.tsx`  
**Funcionalidades:**
- Dashboard com KPIs financeiros
- Acesso rápido aos módulos financeiros
- Visão consolidada de contas a pagar/receber

#### 1.5.2. Dashboard Financeiro
**Rota:** `/financeiro/dashboard`  
**Componente:** `src/pages/financeiro/DashboardFinanceiro.tsx`  
**Funcionalidades:**
- Indicadores de performance financeira
- Gráficos de receitas e despesas
- Alertas de vencimentos

#### 1.5.3. Contas a Receber
**Rotas:**
- `/financeiro/contas-receber` - Listagem
- `/financeiro/contas-receber/nova` - Nova conta
- `/financeiro/contas-receber/editar/:id` - Edição
- `/financeiro/contas-receber/detalhes/:id` - Detalhes e pagamentos

**Componentes:**
- `src/pages/financeiro/ContasReceber.tsx`
- `src/pages/financeiro/ContasReceberForm.tsx`
- `src/pages/financeiro/ContasReceberDetalhes.tsx`
- `src/components/financeiro/ContasReceberFormModal.tsx`
- `src/components/financeiro/DarBaixaDialog.tsx`

**Funcionalidades:**
- Lançamento de contas a receber
- Parcelamento automático
- Controle de recebimentos parciais
- Cálculo automático de juros e multas
- Sistema de tags para categorização
- Geração de comprovantes
- Vinculação com clientes e bancos

**Tabelas:**
- `contas_receber` - Cabeçalho das contas
- `contas_receber_parcelas` - Parcelas individuais
- `contas_receber_pagamentos` - Registro de pagamentos
- `contas_receber_comprovantes` - Anexos de comprovantes
- `tags_contas_receber` - Tags de categorização
- `vw_contas_receber_parcelas` - View consolidada
- `vw_contas_receber_dashboard` - View para dashboard

#### 1.5.4. Contas a Pagar
**Rotas:**
- `/financeiro/contas-pagar` - Listagem
- `/financeiro/contas-pagar/nova` - Nova conta
- `/financeiro/contas-pagar/editar/:id` - Edição
- `/financeiro/contas-pagar/detalhes/:id` - Detalhes e pagamentos

**Componentes:**
- `src/pages/financeiro/ContasPagar.tsx`
- `src/pages/financeiro/ContasPagarForm.tsx`
- `src/pages/financeiro/ContasPagarDetalhes.tsx`
- `src/components/financeiro/DarBaixaPagarDialog.tsx`

**Funcionalidades:**
- Lançamento de despesas e compras
- Parcelamento de contas
- Controle de pagamentos
- Vinculação com fornecedores e plano de contas
- Sistema de recorrência para despesas fixas

**Tabelas:**
- `contas_pagar` - Cabeçalho das contas
- `contas_pagar_parcelas` - Parcelas individuais
- `contas_pagar_pagamentos` - Registro de pagamentos
- `contas_pagar_comprovantes` - Anexos

#### 1.5.5. Fluxo de Caixa
**Rotas:**
- `/financeiro/fluxo-caixa` - Hub
- `/financeiro/fluxo-caixa/diario` - Visão diária
- `/financeiro/fluxo-caixa/mensal` - Visão mensal

**Componentes:**
- `src/pages/financeiro/FluxoCaixaHub.tsx`
- `src/pages/financeiro/FluxoCaixaDiario.tsx`
- `src/pages/financeiro/FluxoCaixaMensal.tsx`

**Funcionalidades:**
- Controle de entradas e saídas por período
- Projeção de saldos futuros
- Visão por banco/conta
- Análise de tendências

#### 1.5.6. DRE (Demonstrativo de Resultados)
**Rota:** `/financeiro/dre`  
**Componente:** `src/pages/financeiro/DRE.tsx`  
**Funcionalidades:**
- Demonstrativo mensal e anual
- Análise de receitas, deduções, custos e despesas
- Cálculo de lucro operacional e líquido
- Vinculação automática com plano de contas

**Tabelas:**
- `plano_contas` - Contas contábeis
- `categorias_plano_contas` - Agrupamentos DRE

---

### 1.6. INTELIGÊNCIA / RELATÓRIOS

#### 1.6.1. Centro de Comando Financeiro
**Rota:** `/relatorios/inteligencia`  
**Componente:** `src/pages/relatorios/InteligenciaNegocios.tsx`  
**Funcionalidades:**
- Hub central de análises estratégicas
- Seleção de período (ano/mês)
- Cards interativos para:
  - CMV Global
  - Ponto de Equilíbrio
  - Planejamento de Vendas
  - Custos por Categoria
- Insights cruzados (origem x tipo de evento)

**Database Function:** `get_insights_cruzados()`

#### 1.6.2. CMV Global
**Rota:** `/relatorios/cmv-global`  
**Componente:** `src/pages/CMVGlobal.tsx`  
**Funcionalidades:**
- Análise anual de Custo de Mercadoria Vendida
- Comparação mês a mês
- Cálculo de: Estoque Inicial + Compras - Estoque Final = CMV
- Percentual CMV sobre faturamento
- Modo de entrada manual ou automático (sistema)

**Tabelas:**
- `cmv_mensal` - Dados históricos e estimativas

**Database Functions:**
- `get_cmv_anual()` - Calcula CMV consolidado
- `get_compras_mes()` - Total de compras do mês
- `get_estoque_final_mes()` - Valor do estoque no final do mês
- `get_faturamento_mes()` - Receita do mês

#### 1.6.3. Ponto de Equilíbrio
**Rota:** `/relatorios/ponto-equilibrio`  
**Componente:** `src/pages/relatorios/PontoEquilibrio.tsx`  
**Funcionalidades:**
- Cálculo de ponto de equilíbrio em R$ e unidades
- Análise de margem de contribuição
- Comparação real vs planejado
- Fórmula: PE = Custos Fixos / Margem de Contribuição (%)

**Database Function:** `get_ponto_equilibrio_mes()`

#### 1.6.4. Planejamento de Vendas
**Rota:** `/relatorios/planejamento-vendas`  
**Componente:** `src/pages/relatorios/PlanejamentoVendas.tsx`  
**Funcionalidades:**
- Definição de metas mensais e anuais
- Projeção de faturamento
- Meta de ticket médio e número de pedidos
- Acompanhamento de realização vs meta

**Tabelas:**
- `planejamento_vendas` - Metas configuradas

**Hooks:**
- `src/hooks/usePlanejamento.ts`

#### 1.6.5. Custos por Categoria
**Rota:** `/relatorios/custos-categorias`  
**Componente:** `src/pages/relatorios/CustosPorCategoria.tsx`  
**Funcionalidades:**
- Análise de distribuição de custos
- Gráficos por categoria de despesa
- Comparação entre períodos

---

### 1.7. CADASTROS

#### 1.7.1. Clientes
**Rota:** `/clientes`  
**Componente:** `src/pages/cadastros/Clientes.tsx`  
**Funcionalidades:**
- Cadastro completo de clientes
- Dados pessoais e de contato
- Endereço com integração ViaCEP
- Aniversários (alertas no sidebar)
- Histórico de encomendas

**Componentes:**
- `src/components/AdicionarClienteDialog.tsx`
- `src/components/ClienteAutocomplete.tsx`

**Tabelas:**
- `clientes`

**Hooks:**
- `src/hooks/useClientes.ts`
- `src/hooks/useViaCEP.ts`

#### 1.7.2. Fornecedores
**Rota:** `/fornecedores`  
**Componente:** `src/pages/cadastros/Fornecedores.tsx`  
**Funcionalidades:**
- Cadastro de fornecedores
- Dados comerciais e fiscais
- Vinculação com compras e estoque
- Aniversários de contatos

**Componentes:**
- `src/components/FornecedorFormDialog.tsx`
- `src/components/FornecedorAutocomplete.tsx`

**Tabelas:**
- `fornecedores`

**Hooks:**
- `src/hooks/useFornecedores.ts`

#### 1.7.3. Categorias de Receitas
**Rota:** `/configuracoes/categorias-receitas`  
**Componente:** `src/pages/cadastros/Categorias.tsx`  
**Funcionalidades:**
- Categorização de produtos
- Organização do cardápio

**Tabelas:**
- `categorias`

**Hooks:**
- `src/hooks/useCategorias.ts`

#### 1.7.4. Unidades de Medida
**Rota:** `/configuracoes/unidades-medida`  
**Componente:** `src/pages/cadastros/UnidadesMedida.tsx`  
**Funcionalidades:**
- Cadastro de unidades customizadas
- Unidades padrão pré-cadastradas
- Usado em todo o sistema de precificação

**Tabelas:**
- `unidades_medida`

**Hooks:**
- `src/hooks/useUnidadesMedida.ts`

---

### 1.8. CONFIGURAÇÕES

#### 1.8.1. Hub de Configurações
**Rota:** `/configuracoes`  
**Componente:** `src/pages/Configuracoes.tsx`  
**Funcionalidades:**
- Acesso centralizado às configurações
- Organizado por áreas (Cadastros, Precificação, Financeiro)

#### 1.8.2. Dados da Confeitaria
**Rota:** `/configuracoes/dados-confeitaria`  
**Componente:** `src/pages/cadastros/SeusDados.tsx`  
**Funcionalidades:**
- Cadastro da empresa/confeitaria
- Dados fiscais e de contato
- Logo e identidade visual

**Tabelas:**
- `profiles` (linked to auth.users)

#### 1.8.3. Mão de Obra
**Rota:** `/configuracoes/precificacao/mao-obra`  
**Componente:** `src/pages/configuracoes/precificacao/MaoDeObra.tsx`  
**Funcionalidades:**
- Cadastro de tipos de mão de obra
- Valor por hora
- Vinculação com fichas técnicas

**Tabelas:**
- `configuracao_mao_obra`

**Hooks:**
- `src/hooks/useMaoObra.ts`

#### 1.8.4. Custos Fixos
**Rota:** `/configuracoes/precificacao/custos-fixos`  
**Componente:** `src/pages/configuracoes/precificacao/CustosFixos.tsx`  
**Funcionalidades:**
- Cadastro de despesas fixas mensais
- Usado no cálculo do ponto de equilíbrio

**Tabelas:**
- `custos_fixos`

**Hooks:**
- `src/hooks/useCustosFixos.ts`

#### 1.8.5. Plano de Contas
**Rotas:**
- `/configuracoes/categorias-plano-contas` - Categorias DRE
- `/configuracoes/plano-contas` - Contas contábeis

**Componentes:**
- `src/pages/configuracoes/CategoriasPlanoContas.tsx`
- `src/pages/configuracoes/PlanoContas.tsx`

**Funcionalidades:**
- Estrutura contábil para DRE
- Categorização de receitas e despesas
- Contas padrão + customizadas

**Tabelas:**
- `categorias_plano_contas`
- `plano_contas`

#### 1.8.6. Bancos
**Rota:** `/configuracoes/bancos`  
**Componente:** `src/pages/configuracoes/Bancos.tsx`  
**Funcionalidades:**
- Cadastro de contas bancárias e caixa
- Controle de saldo inicial
- Vinculação com movimentações financeiras

**Tabelas:**
- `bancos`

#### 1.8.7. Tipos de Documentos
**Rota:** `/configuracoes/tipos-documentos`  
**Componente:** `src/pages/configuracoes/TiposDocumentos.tsx`  
**Funcionalidades:**
- Cadastro de formas de pagamento/recebimento
- Tipos padrão (PIX, Dinheiro, Cartão, etc.)

**Tabelas:**
- `tipos_documento`

**Hooks:**
- `src/hooks/useTiposDocumento.ts`

#### 1.8.8. Configuração de Juros
**Rota:** `/configuracoes/juros`  
**Componente:** `src/pages/configuracoes/ConfiguracaoJuros.tsx`  
**Funcionalidades:**
- Definição de taxa de juros (mensal/diária)
- Percentual de multa por atraso
- Aplicado automaticamente em contas a receber

**Componentes:**
- `src/components/configuracoes/ConfiguracaoJuros.tsx`

**Tabelas:**
- `configuracoes_juros`

#### 1.8.9. Tags de Encomendas
**Rota:** `/configuracoes/tags-encomendas`  
**Componente:** `src/pages/configuracoes/TagsEncomendas.tsx`  
**Funcionalidades:**
- Criação de tags customizadas
- Cores e descrições
- Organização de encomendas

**Componentes:**
- `src/components/configuracoes/ConfiguracaoTagsEncomendas.tsx`

**Tabelas:**
- `tags_encomendas`

**Hooks:**
- `src/hooks/useTags.ts`

#### 1.8.10. Categorias de Estoque
**Rota:** `/configuracoes/categorias-estoque`  
**Componente:** `src/pages/configuracoes/CategoriasEstoque.tsx`  
**Funcionalidades:**
- Categorias fixas do sistema
- Controle de visibilidade
- Não editáveis (segurança)

**Tabelas:**
- `categorias_estoque`

---

### 1.9. PRODUÇÃO
**Rota:** `/producao` (em desenvolvimento)  
**Componente:** `src/pages/Producao.tsx`  
**Funcionalidades Planejadas:**
- Lista de tarefas de produção
- Checklist diário
- Vinculação com encomendas

**Tabelas:**
- `producao_tarefas`

**Hooks:**
- `src/hooks/useProducaoTarefas.ts`

---

### 1.10. ADMINISTRAÇÃO (Apenas para Admins)

#### 1.10.1. Gestão de Usuários
**Rota:** `/admin/usuarios`  
**Componente:** `src/pages/admin/Usuarios.tsx`  
**Funcionalidades:**
- Listar todos os usuários
- Criar novos usuários
- Editar perfis e permissões
- Atribuir roles (admin/user)

**Componentes:**
- `src/components/admin/AdicionarUsuarioDialog.tsx`
- `src/components/admin/EditarUsuarioDialog.tsx`

**Tabelas:**
- `profiles`
- `user_roles`

**Edge Functions:**
- `supabase/functions/criar-usuario/index.ts`

#### 1.10.2. Logs de Ações
**Rota:** `/admin/logs`  
**Componente:** `src/pages/admin/Logs.tsx`  
**Funcionalidades:**
- Auditoria de ações administrativas
- Histórico de alterações
- Rastreamento de usuários afetados

**Tabelas:**
- `admin_logs`

**Hooks:**
- `src/hooks/useIsAdmin.ts`

---

## 2. ESTRUTURA DO BANCO DE DADOS

### 2.1. TABELAS PRINCIPAIS

#### 2.1.1. Autenticação e Usuários
```sql
-- Gerenciado pelo Supabase Auth
auth.users (sistema)

-- Perfis estendidos
profiles (
  id uuid PRIMARY KEY,
  user_id uuid REFERENCES auth.users,
  nome_completo text,
  nome_confeitaria text,
  email text,
  telefone text,
  documento text,
  -- ... outros campos
)

-- Roles e permissões
user_roles (
  user_id uuid,
  role app_role (ENUM: 'user', 'admin')
)
```

#### 2.1.2. Encomendas
```sql
encomendas (
  id uuid PRIMARY KEY,
  usuario_id uuid,
  cliente_id uuid,
  data_pedido date,
  data_entrega date,
  valor numeric,
  status varchar,
  observacoes text,
  -- RLS: auth.uid() = usuario_id
)

encomenda_itens (
  id uuid PRIMARY KEY,
  encomenda_id uuid REFERENCES encomendas,
  receita_id text,
  produto text,
  quantidade numeric,
  valor_unitario numeric,
  subtotal numeric,
  -- RLS: auth.uid() = usuario_id
)

tags_encomendas (
  id uuid PRIMARY KEY,
  user_id uuid,
  nome varchar,
  cor varchar,
  descricao text,
  -- RLS: auth.uid() = user_id
)

encomendas_tags (
  encomenda_id uuid REFERENCES encomendas,
  tag_id uuid REFERENCES tags_encomendas
)
```

#### 2.1.3. Estoque
```sql
itens (
  id uuid PRIMARY KEY,
  usuario_id uuid,
  tipo text ('ingrediente' | 'embalagem'),
  categoria text,
  nome text,
  marca text,
  unidade_base text,
  quantidade_por_embalagem numeric,
  rastrear_estoque boolean,
  ponto_de_pedido numeric,
  ativo boolean,
  -- RLS: auth.uid() = usuario_id
)

precos (
  id uuid PRIMARY KEY,
  item_id uuid REFERENCES itens,
  usuario_id uuid,
  marca text,
  fornecedor text,
  preco_total_embalagem numeric,
  quantidade_embalagem numeric,
  custo_unitario numeric (calculado),
  ativo boolean,
  data_coleta timestamp,
  -- RLS: auth.uid() = usuario_id
  -- TRIGGER: garantir_um_preco_ativo()
)

movimentacoes_estoque (
  id uuid PRIMARY KEY,
  item_id uuid REFERENCES itens,
  usuario_id uuid,
  tipo text ('ENTRADA' | 'SAIDA' | 'AJUSTE' | 'PERDA'),
  quantidade numeric,
  custo_unitario numeric,
  valor_total numeric (calculado),
  data date,
  referencia_tipo text,
  observacao text,
  -- RLS: auth.uid() = usuario_id
  -- TRIGGER: calcular_valor_total_movimento()
)

entradas_detalhadas (
  id uuid PRIMARY KEY,
  item_id uuid REFERENCES itens,
  usuario_id uuid,
  data_compra date,
  fornecedor text,
  preco_unitario numeric,
  quantidade_comprada numeric,
  custo_total numeric,
  -- RLS: auth.uid() = usuario_id
)

estoque_atual (VIEW)
-- Consolida saldo atual, custo médio e valor total
-- Baseado em movimentacoes_estoque

categorias_estoque (
  id uuid PRIMARY KEY,
  nome text,
  descricao text,
  cor text,
  icone text,
  ordem integer,
  ativo boolean,
  editavel boolean (false - protegido),
  -- RLS: Apenas leitura para autenticados
)
```

#### 2.1.4. Precificação
```sql
pre_preparos (
  id uuid PRIMARY KEY,
  usuario_id uuid,
  nome varchar,
  categoria_id uuid,
  tempo_preparo numeric,
  tempo_preparo_unidade varchar,
  rendimento_quantidade numeric,
  rendimento_unidade_id uuid,
  custo_total numeric (calculado),
  custo_por_unidade numeric (calculado),
  modo_preparo text,
  -- RLS: auth.uid() = usuario_id
)

pre_preparos_ingredientes (
  id uuid PRIMARY KEY,
  pre_preparo_id uuid REFERENCES pre_preparos,
  ingrediente_id text,
  quantidade numeric,
  custo_ingrediente numeric,
  -- RLS: via pre_preparos
  -- TRIGGER: trigger_recalcular_custo()
)

receitas (
  id uuid PRIMARY KEY,
  usuario_id uuid,
  nome varchar,
  categoria varchar,
  tipo varchar,
  tempo_preparo numeric,
  unidade_tempo varchar,
  rendimento numeric,
  unidade_rendimento varchar,
  custo_total numeric (calculado),
  custo_mao_obra numeric,
  tipo_mao_obra_id uuid,
  valor_venda numeric,
  cardapio varchar ('ativo' | 'inativo'),
  modo_preparo text,
  -- RLS: auth.uid() = usuario_id
)

receitas_ingredientes (
  id uuid PRIMARY KEY,
  receita_id uuid REFERENCES receitas,
  ingrediente text,
  quantidade numeric,
  custo_receita numeric,
  -- RLS: via receitas
)

receitas_embalagens (
  id uuid PRIMARY KEY,
  receita_id uuid REFERENCES receitas,
  embalagem text,
  quantidade_utilizada numeric,
  custo_receita numeric,
  -- RLS: via receitas
)

receitas_despesas_venda (
  id uuid PRIMARY KEY,
  receita_id uuid REFERENCES receitas,
  despesa_id varchar,
  nome varchar,
  percentual numeric,
  valor numeric,
  -- RLS: via receitas
)

receitas_imagens (
  id uuid PRIMARY KEY,
  receita_id uuid REFERENCES receitas,
  url text,
  ordem integer,
  -- RLS: via receitas
)

configuracao_mao_obra (
  id uuid PRIMARY KEY,
  user_id uuid,
  nome varchar,
  descricao text,
  valor_hora numeric,
  cor varchar,
  ativo boolean,
  padrao boolean,
  -- RLS: auth.uid() = user_id
)

custos_fixos (
  id uuid PRIMARY KEY,
  usuario_id uuid,
  nome varchar,
  valor numeric,
  -- RLS: auth.uid() = usuario_id
)

categorias (
  id uuid PRIMARY KEY,
  usuario_id uuid,
  nome varchar,
  ativo boolean,
  -- RLS: auth.uid() = usuario_id
)

unidades_medida (
  id uuid PRIMARY KEY,
  usuario_id uuid,
  nome varchar,
  sigla varchar,
  codigo varchar,
  ativo boolean,
  e_padrao boolean,
  -- RLS: auth.uid() = usuario_id
)
```

#### 2.1.5. Financeiro
```sql
-- Contas a Receber
contas_receber (
  id uuid PRIMARY KEY,
  usuario_id uuid,
  cliente_id uuid,
  descricao varchar,
  valor numeric,
  data_emissao date,
  data_vencimento date,
  numero_parcelas integer,
  banco_id uuid,
  tipo_documento_id uuid,
  plano_conta_id uuid,
  status varchar,
  tipo_lancamento varchar ('unico' | 'parcelado' | 'recorrente'),
  e_recorrente boolean,
  dia_vencimento_recorrente integer,
  -- RLS: auth.uid() = usuario_id
)

contas_receber_parcelas (
  id uuid PRIMARY KEY,
  conta_receber_id uuid REFERENCES contas_receber,
  numero_parcela integer,
  data_vencimento date,
  valor_parcela numeric,
  valor_pago numeric,
  data_pagamento date,
  juros numeric,
  desconto numeric,
  status varchar ('aberto' | 'pago' | 'atrasado' | 'adiantado' | 'pagamento_parcial'),
  -- RLS: via contas_receber
  -- TRIGGER: trigger_atualizar_status_parcela()
)

contas_receber_pagamentos (
  id uuid PRIMARY KEY,
  parcela_id uuid REFERENCES contas_receber_parcelas,
  data_pagamento date,
  valor_pago numeric,
  juros numeric,
  desconto numeric,
  banco_id uuid,
  tipo_documento_id uuid,
  estornado boolean,
  data_estorno timestamp,
  motivo_estorno text,
  -- RLS: via parcelas
  -- TRIGGER: atualizar_parcela_apos_pagamento()
)

contas_receber_comprovantes (
  id uuid PRIMARY KEY,
  pagamento_id uuid REFERENCES contas_receber_pagamentos,
  url text,
  -- RLS: via pagamentos
)

tags_contas_receber (
  id uuid PRIMARY KEY,
  usuario_id uuid,
  nome varchar,
  cor varchar,
  -- RLS: auth.uid() = usuario_id
)

-- Views auxiliares
vw_contas_receber_parcelas (VIEW)
vw_contas_receber_dashboard (VIEW)

-- Contas a Pagar (estrutura similar)
contas_pagar (...)
contas_pagar_parcelas (...)
contas_pagar_pagamentos (...)
contas_pagar_comprovantes (...)

-- Plano de Contas
categorias_plano_contas (
  id uuid PRIMARY KEY,
  user_id uuid,
  codigo varchar,
  descricao varchar,
  indicador varchar ('Credito' | 'Debito'),
  faixa_dre varchar,
  ordem integer,
  ativo boolean,
  e_padrao boolean,
  padrao_sistema boolean,
  -- RLS: auth.uid() = user_id
  -- TRIGGER: proteger_categorias_padrao()
)

plano_contas (
  id uuid PRIMARY KEY,
  user_id uuid,
  categoria_id uuid REFERENCES categorias_plano_contas,
  codigo integer,
  codigo_estruturado varchar,
  descricao varchar,
  ativo boolean,
  e_padrao boolean,
  padrao_sistema boolean,
  -- RLS: auth.uid() = user_id
  -- TRIGGER: proteger_contas_padrao(), impedir_exclusao_padrao()
)

bancos (
  id uuid PRIMARY KEY,
  usuario_id uuid,
  codigo varchar,
  nome varchar,
  tipo varchar ('Banco' | 'Caixa'),
  saldo_inicial numeric,
  e_banco_oficial boolean,
  -- RLS: auth.uid() = usuario_id
)

tipos_documento (
  id uuid PRIMARY KEY,
  usuario_id uuid,
  codigo integer,
  descricao varchar,
  ativo boolean,
  e_padrao boolean,
  -- RLS: auth.uid() = usuario_id
)

configuracoes_juros (
  id uuid PRIMARY KEY,
  usuario_id uuid,
  cobrar_juros boolean,
  percentual_juros numeric,
  tipo_juros varchar ('mensal' | 'diario'),
  multa_atraso boolean,
  percentual_multa numeric,
  -- RLS: auth.uid() = usuario_id
)
```

#### 2.1.6. Inteligência e Relatórios
```sql
cmv_mensal (
  id uuid PRIMARY KEY,
  usuario_id uuid,
  ano integer,
  mes integer,
  tipo_dado varchar ('real' | 'estimado'),
  estoque_inicial numeric,
  compras numeric,
  estoque_final numeric,
  faturamento numeric,
  custos_fixos_estimado numeric,
  cmv_percentual_estimado numeric,
  ticket_medio_estimado numeric,
  usa_dados_sistema boolean,
  -- RLS: auth.uid() = usuario_id
)

planejamento_vendas (
  id uuid PRIMARY KEY,
  usuario_id uuid,
  ano integer,
  mes integer,
  meta_faturamento_anual numeric,
  meta_lucro_anual numeric,
  meta_faturamento_mensal numeric,
  meta_lucro_mensal numeric,
  meta_pedidos integer,
  meta_ticket_medio numeric,
  pct_lucro_selecionado numeric,
  -- RLS: auth.uid() = usuario_id
)

producao_tarefas (
  id uuid PRIMARY KEY,
  usuario_id uuid,
  descricao text,
  data date,
  concluida boolean,
  -- RLS: auth.uid() = usuario_id
)
```

#### 2.1.7. Cadastros Auxiliares
```sql
clientes (
  id uuid PRIMARY KEY,
  usuario_id uuid,
  nome varchar,
  documento varchar,
  email varchar,
  telefone varchar,
  data_nascimento date,
  cep varchar,
  endereco text,
  numero varchar,
  complemento varchar,
  bairro varchar,
  cidade varchar,
  estado varchar,
  -- RLS: auth.uid() = usuario_id
)

fornecedores (
  id uuid PRIMARY KEY,
  usuario_id uuid,
  nome varchar,
  razao_social varchar,
  documento varchar,
  email varchar,
  telefone varchar,
  contato_principal varchar,
  data_nascimento_contato date,
  -- ... endereço
  -- RLS: auth.uid() = usuario_id
)
```

#### 2.1.8. Administração
```sql
admin_logs (
  id uuid PRIMARY KEY,
  admin_id uuid,
  admin_email text,
  acao text,
  usuario_afetado_id uuid,
  usuario_afetado_email text,
  detalhes jsonb,
  created_at timestamp,
  -- RLS: Apenas admins
)
```

---

### 2.2. FUNCTIONS IMPORTANTES DO BANCO

#### 2.2.1. Autenticação e Roles
```sql
-- Verifica se usuário tem determinada role
has_role(_user_id uuid, _role app_role) RETURNS boolean

-- Adiciona role 'user' automaticamente
handle_new_user_role() TRIGGER
```

#### 2.2.2. Estoque
```sql
-- Garante apenas um preço ativo por item
garantir_um_preco_ativo() TRIGGER

-- Calcula valor total da movimentação
calcular_valor_total_movimento() TRIGGER

-- Retorna status do estoque (ok, baixo, zerado, etc.)
get_status_estoque(p_saldo, p_ponto_pedido) RETURNS text

-- Valida categoria do item
validar_categoria_item() TRIGGER
```

#### 2.2.3. Precificação
```sql
-- Recalcula custo total de pré-preparo
calcular_custo_pre_preparo(preparo_id uuid)

-- Trigger para recálculo automático
trigger_recalcular_custo() TRIGGER
```

#### 2.2.4. Financeiro
```sql
-- Atualiza status de parcelas vencidas
atualizar_status_parcelas_vencidas()

-- Atualiza status após mudanças
trigger_atualizar_status_parcela() TRIGGER

-- Atualiza parcela após pagamento
atualizar_parcela_apos_pagamento() TRIGGER

-- Calcula juros de atraso
calcular_juros_atraso(
  p_valor_parcela numeric,
  p_data_vencimento date,
  p_data_pagamento date,
  p_taxa_juros_dia numeric
) RETURNS numeric

-- Calcula juros com configuração do usuário
calcular_juros_com_config(
  p_user_id uuid,
  p_valor_parcela numeric,
  p_data_vencimento date,
  p_data_pagamento date
) RETURNS TABLE(juros, multa, total)

-- Proteção de dados padrão
proteger_contas_padrao() TRIGGER
proteger_categorias_padrao() TRIGGER
impedir_exclusao_padrao() TRIGGER
```

#### 2.2.5. Plano de Contas
```sql
-- Cria categorias padrão DRE
criar_categorias_plano_padrao(p_user_id uuid)

-- Cria contas contábeis padrão
criar_planos_contas_padrao(p_user_id uuid)

-- Gera próximo código de categoria
gerar_proximo_codigo_categoria(p_user_id uuid) RETURNS varchar

-- Gera código estruturado (ex: 1.01)
gerar_proximo_codigo_estruturado(
  p_user_id uuid,
  p_categoria_id uuid
) RETURNS varchar

-- Gera próximo código de plano
gerar_proximo_codigo_plano(p_user_id uuid) RETURNS integer
```

#### 2.2.6. Configurações Iniciais
```sql
-- Cria banco "Caixa Empresa" padrão
criar_banco_caixa_empresa_padrao(p_user_id uuid)
trigger_criar_banco_caixa_novo_usuario() TRIGGER

-- Cria tipos de documentos padrão
criar_tipos_documentos_padrao(p_user_id uuid)
gerar_proximo_codigo_tipo_documento(p_user_id uuid) RETURNS integer

-- Cria tags padrão de encomendas
criar_tags_padrao_encomendas(p_user_id uuid)
trigger_criar_tags_novo_usuario() TRIGGER

-- Cria unidades de medida padrão
criar_unidades_medida_padrao(p_user_id uuid)
```

#### 2.2.7. Inteligência e Relatórios
```sql
-- Retorna insights cruzados (origem x evento)
get_insights_cruzados(
  dias integer,
  user_id_param uuid
) RETURNS TABLE(origem, evento, total_vendas, valor_total, ticket_medio, percentual)

-- CMV Anual consolidado
get_cmv_anual(
  p_usuario_id uuid,
  p_ano integer
) RETURNS TABLE(mes, mes_nome, estoque_inicial, compras, estoque_final, cmv, faturamento, percentual_cmv, editavel, tem_historico)

-- Funções auxiliares CMV
get_compras_mes(p_usuario_id, p_ano, p_mes) RETURNS numeric
get_estoque_final_mes(p_usuario_id, p_ano, p_mes) RETURNS numeric
get_faturamento_mes(p_usuario_id, p_ano, p_mes) RETURNS numeric

-- Ponto de Equilíbrio
get_ponto_equilibrio_mes(
  p_usuario_id uuid,
  p_ano integer,
  p_mes integer
) RETURNS TABLE(
  ano, mes, mes_nome, tipo_dado, editavel,
  custos_fixos, cmv, cmv_percentual, faturamento,
  margem_contribuicao_percentual, ponto_equilibrio_reais,
  ticket_medio, ponto_equilibrio_unidades,
  quantidade_vendas_real, resultado_mes,
  percentual_acima_pe, status
)

-- Funções auxiliares PE
get_custos_fixos_mes(p_usuario_id, p_ano, p_mes) RETURNS numeric
get_ticket_medio_mes(p_usuario_id, p_ano, p_mes) RETURNS numeric
get_quantidade_vendas_mes(p_usuario_id, p_ano, p_mes) RETURNS integer
```

#### 2.2.8. Utilitários
```sql
-- Deleta todos os cadastros de um usuário (use com cuidado!)
deletar_cadastros_usuario(p_user_id uuid)
```

---

### 2.3. RLS POLICIES (Row Level Security)

**Padrão Geral:** Todas as tabelas de dados do usuário seguem o padrão:
```sql
-- Leitura
Users can view own X
USING (auth.uid() = usuario_id)

-- Inserção
Users can insert own X
WITH CHECK (auth.uid() = usuario_id)

-- Atualização
Users can update own X
USING (auth.uid() = usuario_id)
WITH CHECK (auth.uid() = usuario_id)

-- Exclusão
Users can delete own X
USING (auth.uid() = usuario_id)
```

**Exceções Notáveis:**

1. **categorias_estoque:** Apenas leitura para autenticados, sem edição (sistema)
2. **plano_contas e categorias_plano_contas:** 
   - Leitura: `padrao_sistema = true OR user_id = auth.uid()`
   - Edição/Exclusão: Apenas itens customizados (`padrao_sistema = false`)
3. **admin_logs:** Apenas admins (`has_role(auth.uid(), 'admin')`)
4. **Tabelas relacionadas:** Verificam permissão via JOIN com tabela pai
   - Ex: `receitas_ingredientes` verifica via `receitas`
   - Ex: `contas_receber_parcelas` verifica via `contas_receber`

---

## 3. FLUXOS DE DADOS

### 3.1. FLUXO DE ENCOMENDAS
```
Cliente (cadastro) 
  ↓
Encomenda (criação)
  ↓
Itens da Encomenda (seleção de receitas)
  ↓
Tags (categorização)
  ↓
Confirmação
  ↓
Geração automática de Conta a Receber
  ↓
Controle de Status (pendente → em produção → entregue)
  ↓
Baixa no Financeiro
```

### 3.2. FLUXO DE PRECIFICAÇÃO
```
Ingredientes/Embalagens (cadastro + preços)
  ↓
Pré-Preparos (opcional - receitas intermediárias)
  ↓
Ficha Técnica (receita final)
  - Ingredientes diretos
  - Pré-preparos
  - Embalagens
  - Mão de obra
  ↓
Cálculo Automático de Custos
  ↓
Definição de Preço de Venda
  ↓
Margem de Lucro Calculada
  ↓
Disponível para Encomendas
```

### 3.3. FLUXO DE ESTOQUE
```
Cadastro de Item (ingrediente/embalagem)
  ↓
Definição de Preço (marca + fornecedor)
  ↓
Entrada de Estoque (compra)
  → Movimentação tipo "ENTRADA"
  → Atualiza estoque_atual
  → Recalcula custo médio
  ↓
Utilização em Receitas/Produção
  → Movimentação tipo "SAIDA"
  → Reduz estoque_atual
  ↓
Alertas de Ponto de Pedido
  ↓
Nova Compra (ciclo reinicia)
```

### 3.4. FLUXO FINANCEIRO

#### Contas a Receber:
```
Lançamento Manual OU Encomenda
  ↓
Geração de Parcelas (se parcelado)
  ↓
Vencimento → Status: Aberto/Atrasado
  ↓
Pagamento (total ou parcial)
  → Registro em contas_receber_pagamentos
  → Cálculo automático de juros/multa
  → Atualização da parcela
  → Upload de comprovante
  ↓
Status: Pago/Adiantado
  ↓
Impacto no Fluxo de Caixa
  ↓
Lançamento no DRE (via Plano de Contas)
```

#### Contas a Pagar:
```
Lançamento Manual (despesa/compra)
  ↓
Vinculação com:
  - Fornecedor
  - Plano de Contas
  - Banco
  ↓
Parcelamento (se aplicável)
  ↓
Recorrência (para despesas fixas)
  ↓
Pagamento
  → Baixa da parcela
  → Impacto no saldo bancário
  ↓
Consolidação no Fluxo de Caixa e DRE
```

### 3.5. FLUXO DE INTELIGÊNCIA
```
Dados Transacionais (encomendas, movimentações, financeiro)
  ↓
Consolidação Mensal
  ↓
Cálculos Automáticos:
  - CMV (estoque_inicial + compras - estoque_final)
  - Ponto de Equilíbrio (custos_fixos / margem_contribuição)
  - Faturamento Real vs Meta
  ↓
Geração de Insights Cruzados
  - Origem do Pedido x Tipo de Evento
  - Análise de rentabilidade
  ↓
Visualização em Dashboards e Relatórios
  ↓
Tomada de Decisões Estratégicas
```

---

## 4. INTEGRAÇÕES E APIS

### 4.1. Supabase (Backend Completo)
- **Autenticação:** Email/senha com auto-confirm
- **Database:** PostgreSQL com RLS
- **Realtime:** Não utilizado atualmente
- **Storage:** Planejado para upload de imagens
- **Edge Functions:** `criar-usuario` (gestão de usuários por admin)

### 4.2. ViaCEP
**Hook:** `src/hooks/useViaCEP.ts`  
**Uso:** Preenchimento automático de endereços (clientes/fornecedores)

### 4.3. React Query (TanStack Query)
- Cache de dados do Supabase
- Invalidação automática
- Estados de loading/error
- Utilizado em todos os hooks customizados

### 4.4. React Hook Form + Zod
- Validação de formulários
- Schemas em `src/schemas/`

---

## 5. COMPONENTES COMPARTILHADOS

### 5.1. UI Base (Shadcn)
Localizados em `src/components/ui/`:
- `button`, `card`, `dialog`, `select`, `input`, `table`, etc.
- Todos tematizados via design system (`index.css` + `tailwind.config.ts`)

### 5.2. Componentes de Negócio
- **PageHeader:** Header padrão de páginas
- **BackButton:** Botão de retorno com navegação
- **EmptyState / EstadoVazio:** Estados vazios
- **LoadingState:** Indicador de carregamento
- **ConfirmDialog:** Diálogo de confirmação
- **DatePickerField:** Seletor de data
- **HelpTooltip:** Tooltip de ajuda
- **MiniCalendar:** Calendário compacto

### 5.3. Autocompletes
- `ClienteAutocomplete`
- `FornecedorAutocomplete`
- `CategoriaReceitaAutocomplete`
- `CategoriaPlanoContasAutocomplete`
- `PlanoContasAutocomplete`
- `EmbalagemAutocomplete`

### 5.4. Navegação
- **AppSidebar:** Menu lateral principal
- **FirstAccessRedirect:** Redireciona para configuração inicial

---

## 6. ESTRUTURA DE PASTAS

```
src/
├── assets/                    # Logos e imagens
├── components/
│   ├── ui/                   # Componentes Shadcn
│   ├── admin/                # Admin específicos
│   ├── auth/                 # Autenticação
│   ├── configuracoes/        # Configurações
│   ├── encomendas/           # Encomendas
│   ├── estoque/              # Estoque
│   ├── financeiro/           # Financeiro
│   └── *.tsx                 # Compartilhados
├── contexts/
│   └── AuthContext.tsx       # Contexto de autenticação
├── hooks/                    # Hooks customizados (integração Supabase)
├── integrations/
│   └── supabase/
│       ├── client.ts         # Cliente Supabase
│       └── types.ts          # Types gerados automaticamente
├── lib/
│   ├── utils.ts              # Utilitários
│   └── validacaoSenha.ts     # Validação de senha
├── pages/                    # Todas as páginas/rotas
│   ├── admin/
│   ├── auth/
│   ├── cadastros/
│   ├── configuracoes/
│   ├── estoque/
│   ├── financeiro/
│   ├── precificacao/
│   └── relatorios/
├── schemas/                  # Schemas Zod
├── services/
│   └── migrateAllData.ts     # Utilitário de migração
├── types/
│   └── estoque.ts            # Types customizados
├── utils/
│   ├── devAuth.ts
│   ├── gerarReciboPagamento.ts
│   ├── insightsGenerator.ts
│   └── reorganizarCodigos.ts
├── App.tsx                   # Rotas principais
├── index.css                 # Design system (tokens CSS)
├── main.tsx                  # Entry point
└── vite-env.d.ts

supabase/
├── config.toml               # Configuração Supabase
├── migrations/               # Migrations SQL (geradas automaticamente)
└── functions/
    ├── _shared/
    │   └── cors.ts
    ├── criar-usuario/
    │   └── index.ts
    └── planejamento-vendas/
        └── index.ts
```

---

## 7. DESIGN SYSTEM

### 7.1. Tokens Principais (index.css)
```css
--background: hsl(...)      /* Fundo principal */
--foreground: hsl(...)      /* Texto principal */
--primary: hsl(...)         /* Cor primária */
--secondary: hsl(...)       /* Cor secundária */
--accent: hsl(...)          /* Cor de destaque */
--muted: hsl(...)           /* Cor neutra */
--border: hsl(...)          /* Bordas */
--destructive: hsl(...)     /* Ações destrutivas */
```

### 7.2. Tailwind Config
**Arquivo:** `tailwind.config.ts`  
- Extensões de cores via semantic tokens
- Animações customizadas
- Breakpoints responsivos

### 7.3. Padrões de Uso
- ✅ Usar: `bg-primary`, `text-foreground`, `border-border`
- ❌ Evitar: `bg-white`, `text-black`, cores diretas

---

## 8. SEGURANÇA

### 8.1. Autenticação
- Email + senha (Supabase Auth)
- Auto-confirm de emails (desenvolvimento)
- Sessão persistida em localStorage
- Proteção de rotas via `ProtectedRoute`

### 8.2. Row Level Security (RLS)
- Todas as tabelas protegidas
- Usuário só acessa seus próprios dados
- Admins têm acesso via role
- Functions SECURITY DEFINER para operações privilegiadas

### 8.3. Proteção de Dados Padrão
- Categorias e Planos padrão não podem ser deletados
- Triggers impedem edição acidental
- Validações em triggers e constraints

---

## 9. PERFORMANCE

### 9.1. Otimizações de Banco
- Índices em colunas de busca frequente
- Views para consultas complexas
- Functions para cálculos pesados
- Triggers para manutenção automática

### 9.2. Frontend
- React Query para cache
- Lazy loading de rotas (potencial melhoria)
- Componentes otimizados com memo (onde necessário)
- Debounce em autocompletes

---

## 10. PONTOS DE ATENÇÃO

### 10.1. Manutenções Futuras
1. **Storage de Imagens:** Migrar para Supabase Storage
2. **Realtime:** Implementar updates em tempo real para produção
3. **Relatórios PDF:** Exportação de relatórios
4. **Mobile:** Versão PWA ou app nativo
5. **Backup:** Rotina automatizada

### 10.2. Melhorias Sugeridas
1. **Dashboard:** Mais KPIs e gráficos
2. **Notificações:** Sistema de alertas push
3. **Email:** Envio automático de recibos/comprovantes
4. **API Externa:** Integração com sistemas de delivery
5. **IA:** Sugestões de precificação baseadas em histórico

### 10.3. Documentação Técnica
- **Código:** Comentários em pontos críticos
- **Commits:** Mensagens descritivas
- **Changelog:** Manter histórico de versões

---

## 11. CONTATOS E SUPORTE

**Desenvolvido com:** Lovable (https://lovable.dev)  
**Stack:** React + TypeScript + Tailwind + Supabase  
**Versão do Documento:** 1.0  
**Última Atualização:** 2025

---

**FIM DA DOCUMENTAÇÃO TÉCNICA**
