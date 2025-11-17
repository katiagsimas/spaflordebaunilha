# Donna's Box - Documentação Completa do Sistema

## 📋 Índice
1. [Visão Geral](#visão-geral)
2. [Stack Tecnológico](#stack-tecnológico)
3. [Estrutura do Banco de Dados](#estrutura-do-banco-de-dados)
4. [Arquitetura do Projeto](#arquitetura-do-projeto)
5. [Funcionalidades por Módulo](#funcionalidades-por-módulo)
6. [Rotas e Páginas](#rotas-e-páginas)
7. [Componentes Principais](#componentes-principais)
8. [Hooks Customizados](#hooks-customizados)
9. [Fluxos de Usuário](#fluxos-de-usuário)
10. [Integrações](#integrações)
11. [Autenticação e Segurança](#autenticação-e-segurança)

---

## 🎯 Visão Geral

**Donna's Box** é um sistema completo de gestão para confeitarias, desenvolvido para gerenciar todos os aspectos do negócio, desde o cadastro de receitas e precificação até o controle financeiro e de estoque.

### Objetivo
Fornecer uma solução integrada que permita aos confeiteiros profissionais:
- Gerenciar receitas e calcular custos precisos (CMV)
- Controlar encomendas e produção
- Acompanhar estoque de ingredientes e embalagens
- Gerir finanças (contas a receber/pagar, fluxo de caixa, DRE)
- Manter cadastro de clientes e fornecedores
- Planejar vendas e metas

### Público-Alvo
Confeiteiros profissionais, microempreendedores e pequenas empresas do setor de confeitaria.

---

## 💻 Stack Tecnológico

### Frontend
- **Framework**: React 18.3.1
- **Build Tool**: Vite 5.4.19
- **Linguagem**: TypeScript 5.8.3
- **Roteamento**: React Router DOM 6.30.1
- **State Management**: TanStack React Query 5.83.0
- **Formulários**: React Hook Form 7.65.0 + Zod 4.1.12
- **UI Components**: 
  - Radix UI (conjunto completo de componentes primitivos)
  - Shadcn/ui (componentes customizados)
  - Lucide React (ícones)
- **Estilização**: 
  - Tailwind CSS 3.4.17
  - Tailwind Animate
  - Class Variance Authority
- **Gráficos**: Recharts 2.15.4
- **Datas**: date-fns 4.1.0 + react-day-picker 9.11.1
- **Drag & Drop**: @dnd-kit 6.3.1
- **PDF**: jsPDF 3.0.3 + jspdf-autotable 5.0.2
- **Excel**: xlsx 0.18.5
- **Notificações**: Sonner 1.7.4

### Backend
- **BaaS**: Supabase (Lovable Cloud)
- **Banco de Dados**: PostgreSQL
- **Autenticação**: Supabase Auth
- **Storage**: Supabase Storage
- **Real-time**: Supabase Realtime
- **Edge Functions**: Supabase Functions

### Ferramentas de Desenvolvimento
- ESLint 9.32.0
- Autoprefixer 10.4.21
- Lovable Tagger (para deploy)

---

## 🗄️ Estrutura do Banco de Dados

### Tabelas Principais

#### 1. **Autenticação e Usuários**
- `profiles` - Perfis de usuários
  - Campos: id, user_id, nome_completo, nome_confeitaria, telefone, email, avatar_url, valor_hora
  - RLS: Usuários podem ver/editar apenas seu próprio perfil
  - Relacionamento: 1:1 com auth.users

- `user_roles` - Funções de usuários (admin/user)
  - Campos: user_id, role
  - RLS: Apenas admins visualizam

#### 2. **Cadastros Base**
- `categorias` - Categorias de receitas
  - Campos: id, usuario_id, nome, ativo, padrao_sistema
  - RLS: Usuários gerenciam suas próprias categorias
  - Categorias padrão não podem ser deletadas

- `unidades_medida` - Unidades de medida
  - Campos: id, usuario_id, nome, sigla, codigo, ativo, e_padrao
  - RLS: Usuários gerenciam suas próprias unidades

- `categorias_estoque` - Categorias de itens de estoque
  - Campos: id, nome, descricao, icone, cor, ordem, editavel, ativo
  - RLS: Apenas visualização (gerenciamento pelo sistema)
  - Categorias fixas: Ingredientes, Embalagens, Pré-Preparos, Produtos Finais

- `tags_encomendas` - Tags para categorização de encomendas
  - Campos: id, user_id, nome, cor, descricao, ativo

#### 3. **Clientes e Fornecedores**
- `clientes` - Cadastro de clientes
  - Campos: id, usuario_id, nome, tipo (PF/PJ), cpf_cnpj, telefone, email, data_aniversario, endereco, numero, cidade, estado, cep, segmento, como_conheceu, preferencias_alergias, observacoes, total_compras, quantidade_pedidos, ultima_compra
  - RLS: Usuários gerenciam seus próprios clientes
  - Triggers: Atualização automática de totais

- `cliente_familiares` - Familiares/dependentes dos clientes
  - Campos: id, usuario_id, cliente_id, nome, parentesco, data_nascimento, observacoes, ativo
  - Relacionamento: N:1 com clientes

- `fornecedores` - Cadastro de fornecedores
  - Campos: id, usuario_id, nome_fantasia, razao_social, cpf_cnpj, telefone, email, site, endereco, numero, complemento, bairro, cidade, estado, cep, observacoes, ativo
  - RLS: Usuários gerenciam seus próprios fornecedores

- `fornecedores_contatos` - Contatos dos fornecedores
  - Campos: id, fornecedor_id, nome, cargo, telefone, email, observacoes, ativo
  - Relacionamento: N:1 com fornecedores

#### 4. **Estoque**
- `itens` - Catálogo de itens
  - Campos: id, usuario_id, tipo (ingrediente/embalagem/pre_preparo/produto_final), categoria, nome, descricao, marca, unidade_base, quantidade_por_embalagem, rastrear_estoque, ponto_de_pedido, localizacao, fornecedor_padrao, imagem_url, observacoes, conversoes (JSONB), ativo
  - RLS: Usuários gerenciam seus próprios itens
  - Conversões: Permite múltiplas unidades de medida

- `precos` - Histórico de preços dos itens
  - Campos: id, item_id, usuario_id, marca, preco_total_embalagem, quantidade_embalagem, custo_unitario, data_coleta, fornecedor, link_compra, observacao, ativo
  - Relacionamento: N:1 com itens
  - RLS: Usuários gerenciam seus próprios preços

- `entradas_detalhadas` - Entradas de estoque com rastreamento FIFO
  - Campos: id, usuario_id, item_id, tipo_item, quantidade_inicial, quantidade_restante, custo_unitario, data_entrada, validade, movimentacao_entrada_id, status
  - RLS: Usuários gerenciam suas próprias entradas
  - Controle: FIFO (First In, First Out)

- `movimentacoes_estoque` - Histórico de movimentações
  - Campos: id, usuario_id, item_id, tipo_item, tipo_movimentacao (entrada/saida/ajuste/transferencia), quantidade, custo_unitario, valor_total, data_movimentacao, observacao, usuario_responsavel, referencia_tipo, referencia_id
  - RLS: Usuários visualizam suas próprias movimentações

#### 5. **Precificação**
- `custos_fixos` - Custos fixos mensais
  - Campos: id, usuario_id, nome, valor
  - RLS: Usuários gerenciam seus próprios custos

- `sub_receitas` - Pré-preparos/Subreceit as
  - Campos: id, usuario_id, nome, tempo_preparo, unidade_tempo, rendimento, unidade_rendimento_id, custo_total, modo_preparo, imagem_1_url, imagem_2_url
  - RLS: Usuários gerenciam suas próprias sub-receitas

- `sub_receitas_ingredientes` - Ingredientes das sub-receitas
  - Relacionamento: N:M entre sub_receitas e itens

- `receitas` - Fichas técnicas de produtos
  - Campos: id, usuario_id, nome, categoria, tipo (produto_avulso/produto_combo), cardapio (ativo/fora), tempo_preparo, unidade_tempo, rendimento, unidade_rendimento, custo_total, valor_venda, modo_preparo
  - RLS: Usuários gerenciam suas próprias receitas
  - Cálculos: CMV, margem de lucro, despesas de venda

- `receitas_ingredientes` - Ingredientes das receitas
  - Campos: id, receita_id, ingrediente_id, ingrediente, marca, qtde_embalagem, unidade_medida, preco_embalagem, quantidade_utilizada, custo_unitario, custo_receita
  - Relacionamento: N:1 com receitas

- `receitas_embalagens` - Embalagens das receitas
  - Estrutura similar a receitas_ingredientes

- `receitas_despesas_venda` - Despesas de venda (taxas, comissões)
  - Campos: id, receita_id, despesa_id, nome, percentual, valor

- `receitas_imagens` - Galeria de imagens das receitas
  - Campos: id, receita_id, url, ordem

#### 6. **Encomendas**
- `encomendas` - Pedidos de clientes
  - Campos: id, usuario_id, numero, cliente, telefone, data_pedido, data_entrega, hora_entrega, status (rascunho/confirmada/producao/pronta/entregue/cancelada), valor, desconto_percentual, desconto_valor, taxa_entrega, outros, endereco, cep, observacoes_cliente, observacoes_internas, pagamentos (JSONB), saldo_restante, topo_bolo, topo_aniversariante, topo_idade, topo_tema, topo_obs, topo_imagens (JSONB), conta_receber_id
  - RLS: Usuários gerenciam suas próprias encomendas
  - Status: Workflow completo de pedido

- `encomenda_itens` - Itens das encomendas
  - Campos: id, usuario_id, encomenda_id, receita_id, produto, quantidade, unidade_medida, valor_unitario, subtotal
  - Relacionamento: N:1 com encomendas

- `encomendas_tags` - Tags das encomendas
  - Relacionamento: N:M entre encomendas e tags_encomendas

#### 7. **Produção**
- `producao_tarefas` - Lista de tarefas de produção
  - Campos: id, usuario_id, data, descricao, concluida
  - RLS: Usuários gerenciam suas próprias tarefas

#### 8. **Financeiro**
- `bancos` - Contas bancárias e caixas
  - Campos: id, usuario_id, codigo, nome, tipo (conta_corrente/conta_poupanca/caixa/carteira_digital), saldo_inicial, e_banco_oficial, e_customizado, habilitado
  - RLS: Usuários gerenciam seus próprios bancos

- `categorias_financeiras` - Categorias de receitas/despesas
  - Campos: id, usuario_id, nome, tipo (receita/despesa), icone, cor
  - RLS: Usuários gerenciam suas próprias categorias

- `categorias_plano_contas` - Categorias do plano de contas (DRE)
  - Campos: id, user_id, codigo, descricao, faixa_dre (receita_bruta/deducoes/custos/despesas_operacionais/outras_receitas/outras_despesas), indicador (credora/devedora), ordem, ativo, e_padrao, padrao_sistema
  - RLS: Categorias padrão visíveis para todos

- `plano_contas` - Contas contábeis
  - Campos: id, user_id, categoria_id, codigo, codigo_estruturado, descricao, ativo, e_padrao, padrao_sistema
  - Relacionamento: N:1 com categorias_plano_contas

- `tipos_documento` - Tipos de documentos financeiros
  - Campos: id, usuario_id, nome, padrao_sistema
  - Exemplos: Dinheiro, PIX, Cartão Débito/Crédito, Boleto, Transferência

- `contas_receber` - Contas a receber
  - Campos: id, usuario_id, cliente_id, cliente_nome, cliente_documento, descricao, valor, numero_documento, data_emissao, data_vencimento, data_recebimento, banco_id, tipo_documento_id, plano_conta_id, categoria_id, numero_parcelas, tipo_lancamento (unico/parcelado/recorrente), e_recorrente, dia_vencimento_recorrente, status, observacoes
  - RLS: Usuários gerenciam suas próprias contas
  - Triggers: Geração automática de parcelas

- `contas_receber_parcelas` - Parcelas de contas a receber
  - Campos: id, conta_receber_id, numero_parcela, data_emissao, data_vencimento, data_recebimento, data_pagamento, valor_parcela, valor_total, valor_recebido, valor_pago, juros, desconto, status (aberto/pago_parcial/pago/vencido/cancelado), observacao, observacao_interna, tags
  - Relacionamento: N:1 com contas_receber
  - Cálculos: Juros e multas automáticos

- `contas_receber_pagamentos` - Pagamentos recebidos
  - Campos: id, parcela_id, data_pagamento, valor_pago, juros, desconto, banco_id, tipo_documento_id, observacao, estornado, data_estorno, motivo_estorno
  - Relacionamento: N:1 com parcelas
  - Permite múltiplos pagamentos por parcela

- `contas_receber_comprovantes` - Comprovantes de pagamentos recebidos
  - Campos: id, pagamento_id, nome_arquivo, url_storage, tipo_arquivo, tamanho_bytes
  - Storage: Supabase Storage

- `contas_pagar` - Contas a pagar
  - Estrutura similar a contas_receber
  - Adicional: fornecedor_id

- `contas_pagar_parcelas` - Parcelas de contas a pagar
  - Estrutura similar a contas_receber_parcelas

- `contas_pagar_pagamentos` - Pagamentos efetuados
  - Estrutura similar a contas_receber_pagamentos

- `contas_pagar_comprovantes` - Comprovantes de pagamentos efetuados

- `configuracoes_juros` - Configuração de juros e multas
  - Campos: id, usuario_id, cobrar_juros, tipo_juros (mensal/diario), percentual_juros, multa_atraso, percentual_multa, observacao
  - RLS: Um registro por usuário

- `tags_contas_receber` - Tags para contas a receber
  - Campos: id, usuario_id, nome, cor

#### 9. **Conciliação Bancária**
- `bank_imports` - Importações de extratos
  - Campos: id, usuario_id, filename, uploaded_by, rows_count, status
  - RLS: Usuários gerenciam suas importações

- `bank_entries` - Lançamentos bancários importados
  - Campos: id, import_id, date, amount, kind (debit/credit), description, fit_id, hash_key, status
  - RLS: Vinculado ao usuário via import

- `bank_matches` - Sugestões de conciliação
  - Campos: id, bank_entry_id, transaction_type (receber/pagar), transaction_id, score, status (suggested/confirmed/rejected), confirmed_by, confirmed_at
  - Algoritmo: Matching por data, valor e descrição

- `bank_rules` - Regras de importação por banco
  - Campos: id, usuario_id, bank_name, column_map (JSONB), csv_delimiter, date_format, decimal_comma

#### 10. **Planejamento e Métricas**
- `planejamento_vendas` - Metas mensais
  - Campos: id, usuario_id, ano, mes, meta_faturamento_mensal, meta_faturamento_anual, meta_lucro_mensal, meta_lucro_anual, meta_pedidos, meta_ticket_medio, pct_lucro_selecionado
  - RLS: Usuários gerenciam seus planejamentos

- `cmv_mensal` - CMV mensal histórico
  - Campos: id, usuario_id, ano, mes, estoque_inicial, compras, estoque_final, faturamento, tipo_dado (real/estimado), usa_dados_sistema, cmv_percentual_estimado, custos_fixos_estimado, ticket_medio_estimado, observacao
  - Cálculo: CMV = Estoque Inicial + Compras - Estoque Final

- `cliente_nps` - Pesquisas de satisfação
  - Campos: id, usuario_id, cliente_id, encomenda_id, nota (0-10), categoria (promotor/neutro/detrator), comentario, enviado_em, respondido_em
  - Cálculo: NPS Score

#### 11. **Administração**
- `admin_logs` - Logs de ações administrativas
  - Campos: id, admin_id, admin_email, acao, usuario_afetado_id, usuario_afetado_email, detalhes (JSONB)
  - RLS: Apenas admins visualizam

- `admin_audit_log` - Auditoria detalhada
  - Campos: id, admin_id, target_user_id, action, module, record_id, old_value, new_value, reason, ip_address, user_agent
  - RLS: Apenas admins

- `admin_access_tokens` - Tokens de acesso temporário
  - Campos: id, admin_id, target_user_id, token, reason, expires_at, revoked_at

#### 12. **Views (Consultas Otimizadas)**
- `vw_contas_receber_parcelas` - Parcelas com dados relacionados
- `vw_contas_receber_dashboard` - Métricas do dashboard financeiro
- `vw_resumo_financeiro` - Resumo de saldos bancários
- `vw_encomendas_com_tags` - Encomendas com tags agregadas
- `vw_bank_differences` - Diferenças na conciliação

### Relacionamentos Principais

```
profiles (1) ─── (N) clientes
clientes (1) ─── (N) cliente_familiares
clientes (1) ─── (N) encomendas
clientes (1) ─── (N) contas_receber

fornecedores (1) ─── (N) fornecedores_contatos
fornecedores (1) ─── (N) contas_pagar

itens (1) ─── (N) precos
itens (1) ─── (N) entradas_detalhadas
itens (1) ─── (N) movimentacoes_estoque

receitas (1) ─── (N) receitas_ingredientes
receitas (1) ─── (N) receitas_embalagens
receitas (1) ─── (N) receitas_despesas_venda
receitas (1) ─── (N) receitas_imagens
receitas (1) ─── (N) encomenda_itens

encomendas (1) ─── (N) encomenda_itens
encomendas (N) ─── (M) tags_encomendas (via encomendas_tags)
encomendas (1) ─── (1) contas_receber

contas_receber (1) ─── (N) contas_receber_parcelas
contas_receber_parcelas (1) ─── (N) contas_receber_pagamentos
contas_receber_pagamentos (1) ─── (N) contas_receber_comprovantes

contas_pagar (1) ─── (N) contas_pagar_parcelas
contas_pagar_parcelas (1) ─── (N) contas_pagar_pagamentos
contas_pagar_pagamentos (1) ─── (N) contas_pagar_comprovantes

categorias_plano_contas (1) ─── (N) plano_contas

bank_imports (1) ─── (N) bank_entries
bank_entries (1) ─── (N) bank_matches
```

### Políticas RLS (Row Level Security)

Todas as tabelas implementam RLS com as seguintes regras principais:
1. **Isolamento por usuário**: `auth.uid() = usuario_id`
2. **CRUD completo**: Usuários podem criar, ler, atualizar e deletar seus próprios dados
3. **Proteção de sistema**: Registros com `padrao_sistema = true` têm restrições especiais
4. **Admin**: Administradores têm acesso especial via `user_roles`

### Triggers e Functions

- `update_updated_at_column()` - Atualiza timestamp automaticamente
- `handle_new_user()` - Cria perfil ao registrar usuário
- `create_contas_receber_parcelas()` - Gera parcelas automaticamente
- `create_contas_pagar_parcelas()` - Gera parcelas automaticamente
- `update_parcela_status()` - Atualiza status baseado em pagamentos
- `calculate_fifo_cost()` - Calcula custo FIFO nas saídas
- `update_client_totals()` - Atualiza totais do cliente

---

## 🏗️ Arquitetura do Projeto

### Estrutura de Pastas

```
donna's-box/
├── public/
│   ├── favicon.ico
│   ├── placeholder.svg
│   └── robots.txt
├── src/
│   ├── assets/              # Imagens e recursos estáticos
│   │   ├── auth-background.jpg
│   │   ├── doces-background.jpg
│   │   ├── donnas-box-logo.png
│   │   ├── donnas-logo.png
│   │   ├── caixa-acucar-auth-logo.png
│   │   ├── caixa-acucar-header.png
│   │   ├── caixa-acucar-logo.png
│   │   └── caixa-acucar-sidebar.png
│   ├── components/          # Componentes reutilizáveis
│   │   ├── admin/          # Componentes administrativos
│   │   ├── auth/           # Componentes de autenticação
│   │   ├── configuracoes/  # Componentes de configuração
│   │   ├── estoque/        # Componentes de estoque
│   │   ├── financeiro/     # Componentes financeiros
│   │   ├── TiposInsumos/   # Componentes de tipos de insumos
│   │   ├── ui/             # Componentes base (Shadcn/ui)
│   │   └── [outros componentes compartilhados]
│   ├── contexts/           # Contextos React
│   │   └── AuthContext.tsx
│   ├── hooks/              # Hooks customizados
│   │   ├── use-mobile.tsx
│   │   ├── use-toast.ts
│   │   ├── useCategorias.ts
│   │   ├── useClientes.ts
│   │   ├── useEncomendas.ts
│   │   ├── useEstoque.ts
│   │   ├── useReceitas.ts
│   │   ├── useUserProfile.ts
│   │   └── [outros hooks]
│   ├── integrations/       # Integrações (gerado automaticamente)
│   │   └── supabase/
│   │       ├── client.ts
│   │       └── types.ts
│   ├── lib/                # Utilitários
│   │   ├── utils.ts
│   │   └── validacaoSenha.ts
│   ├── pages/              # Páginas da aplicação
│   │   ├── admin/
│   │   ├── auth/
│   │   ├── cadastros/
│   │   ├── configuracoes/
│   │   ├── estoque/
│   │   ├── financeiro/
│   │   ├── precificacao/
│   │   └── [outras páginas]
│   ├── schemas/            # Schemas de validação (Zod)
│   │   ├── encomendaSchema.ts
│   │   └── pagamentoSchema.ts
│   ├── services/           # Serviços e lógica de negócio
│   │   └── migrateAllData.ts
│   ├── types/              # Definições de tipos TypeScript
│   │   └── estoque.ts
│   ├── utils/              # Utilitários diversos
│   │   ├── devAuth.ts
│   │   ├── gerarReciboPagamento.ts
│   │   ├── insightsGenerator.ts
│   │   └── reorganizarCodigos.ts
│   ├── App.css
│   ├── App.tsx             # Componente principal
│   ├── index.css           # Estilos globais
│   ├── main.tsx            # Entry point
│   └── vite-env.d.ts
├── supabase/
│   ├── config.toml         # Configuração Supabase
│   ├── functions/          # Edge Functions
│   │   ├── _shared/
│   │   │   └── cors.ts
│   │   └── criar-usuario/
│   │       └── index.ts
│   └── migrations/         # Migrações do banco
├── .env                    # Variáveis de ambiente (gerado)
├── .gitignore
├── components.json         # Configuração Shadcn
├── eslint.config.js
├── index.html
├── package.json
├── postcss.config.js
├── README.md
├── tailwind.config.ts
├── tsconfig.json
├── tsconfig.app.json
├── tsconfig.node.json
├── vercel.json
└── vite.config.ts
```

### Padrões Arquiteturais

1. **Atomic Design**: Componentes organizados em hierarquia (atoms, molecules, organisms)
2. **Container/Presenter**: Separação entre lógica e apresentação
3. **Custom Hooks**: Lógica reutilizável encapsulada em hooks
4. **Context API**: Gerenciamento de estado global (AuthContext)
5. **React Query**: Cache e sincronização com backend
6. **RLS (Row Level Security)**: Segurança no nível do banco de dados

---

## 📦 Funcionalidades por Módulo

### 1. **Dashboard Principal**
**Rota**: `/dashboard`

**Funcionalidades**:
- Visão geral do negócio
- Cards com métricas principais:
  - Faturamento do mês
  - Encomendas pendentes
  - Contas a receber
  - Contas a pagar
- Calendário de entregas
- Alertas de aniversariantes
- Gráficos de vendas e produção
- Acesso rápido às funcionalidades principais

### 2. **Encomendas**
**Rota**: `/encomendas`

**Funcionalidades**:
- Listagem de encomendas com filtros (status, data, cliente)
- Criação de encomendas com:
  - Seleção de cliente
  - Adição de produtos (receitas)
  - Cálculo automático de totais
  - Definição de data/hora de entrega
  - Sistema de tags
  - Informações de topo de bolo
  - Descontos e taxas
  - Registro de pagamentos
  - Observações (cliente e internas)
- Workflow de status:
  - Rascunho → Confirmada → Em Produção → Pronta → Entregue
  - Cancelada (quando aplicável)
- Impressão de pedidos
- Vinculação com contas a receber
- Geração automática de tarefas de produção

**Componentes-chave**:
- Sistema de tags inteligente
- Calculadora de valores
- Gerenciador de pagamentos

### 3. **Produção**
**Rota**: `/producao`

**Funcionalidades**:
- Lista de tarefas de produção
  - Visualização por data
  - Marcação de concluídas
  - Adição/edição/exclusão de tarefas
- Card de encomendas do dia
  - Filtro por data de entrega
  - Organização por status
  - Acesso rápido aos detalhes
- Sugestões automáticas baseadas em encomendas

### 4. **Estoque**

#### 4.1 Catálogo de Itens
**Rota**: `/estoque`

**Funcionalidades**:
- Cadastro de itens:
  - Ingredientes
  - Embalagens
  - Pré-preparos
  - Produtos finais
- Informações por item:
  - Nome, descrição, marca
  - Categoria de estoque
  - Unidade base
  - Quantidade por embalagem
  - Conversões de unidades (JSONB)
  - Rastreamento de estoque (opcional)
  - Ponto de pedido
  - Localização
  - Fornecedor padrão
  - Imagem
  - Observações
- Gestão de preços:
  - Histórico de preços
  - Múltiplas marcas/fornecedores
  - Cálculo de custo unitário
  - Link de compra
- Movimentações:
  - Entradas (compras, ajustes)
  - Saídas (vendas, produção, perdas)
  - Transferências
  - FIFO automático
- Alertas:
  - Estoque abaixo do ponto de pedido
  - Itens sem movimentação
  - Produtos próximos ao vencimento

#### 4.2 Relatórios de Estoque
**Rota**: `/estoque/relatorios`

**Funcionalidades**:
- Relatório de Movimentações
  - Filtros: período, tipo de item, tipo de movimentação
  - Exportação para Excel
- Relatório de Consumo Médio
  - Cálculo de consumo por período
  - Sugestão de compras
  - Análise de tendências
- Relatório de CMV Global
  - CMV por categoria
  - CMV por produto
  - Análise de rentabilidade
  - Comparativo mensal

### 5. **Precificação**

#### 5.1 Ingredientes
**Rota**: `/precificacao/ingredientes`

**Funcionalidades**:
- Listagem de ingredientes cadastrados
- Vinculação com itens de estoque
- Exibição de preço atual
- Histórico de preços
- Acesso rápido ao catálogo

#### 5.2 Embalagens
**Rota**: `/precificacao/embalagens`

**Funcionalidades**:
- Similar a ingredientes
- Foco em materiais de embalagem

#### 5.3 Pré-Preparos (Sub-Receitas)
**Rota**: `/precificacao/pre-preparo`

**Funcionalidades**:
- Criação de pré-preparos (bases, recheios, coberturas)
- Composição:
  - Ingredientes com quantidades
  - Cálculo de custo total
  - Custo por unidade de rendimento
- Informações:
  - Tempo de preparo
  - Rendimento
  - Modo de preparo
  - Imagens (até 2)
- Uso em receitas finais
- Cálculo de CMV

**Componentes**:
- Formulário de sub-receita
- Seletor de ingredientes
- Calculadora de custos

#### 5.4 Fichas Técnicas (Receitas)
**Rota**: `/precificacao/ficha-tecnica`

**Funcionalidades**:
- Criação de receitas completas
- Composição:
  - Ingredientes (incluindo pré-preparos)
  - Embalagens
  - Despesas de venda (taxas, comissões)
- Cálculos automáticos:
  - **Custo Total**: Soma de ingredientes + embalagens
  - **CMV Real**: Custo Total + Despesas de Venda
  - **Percentual CMV**: (CMV Real / Valor Venda) × 100
  - **Margem de Contribuição**: Valor Venda - CMV Real
  - **Percentual Margem**: (Margem / Valor Venda) × 100
- Alertas inteligentes:
  - CMV Excelente (≤ 35%)
  - CMV Aceitável (35-45%)
  - CMV Atenção (45-55%)
  - CMV Muito Alto (> 55%)
  - Margem Baixa (< 30%)
- Informações:
  - Categoria
  - Tipo (produto avulso/combo)
  - Status no cardápio (ativo/fora)
  - Tempo de preparo
  - Rendimento
  - Modo de preparo
  - Galeria de imagens
  - Valor de venda sugerido
- Gestão de cardápio:
  - Ativar/desativar produtos
  - Duplicação de receitas
  - Histórico de alterações

**Validações**:
- CMV > 100%: Produto sem lucro
- Margem negativa: Alerta crítico
- Despesas > valor venda: Erro

#### 5.5 Custos Fixos
**Rota**: `/configuracoes/precificacao/custos-fixos`

**Funcionalidades**:
- Cadastro de custos mensais:
  - Aluguel
  - Energia
  - Água
  - Internet
  - Salários
  - Outros
- Cálculo de impacto no CMV
- Rateio por produto (opcional)

#### 5.6 Mão de Obra
**Rota**: `/configuracoes/precificacao/mao-de-obra`

**Funcionalidades**:
- Definição de valor/hora
- Cálculo de custo por receita (tempo × valor/hora)
- Inclusão no CMV
- Exemplos práticos

### 6. **Clientes**
**Rota**: `/clientes`

**Funcionalidades**:
- Cadastro completo:
  - Dados pessoais (PF/PJ)
  - Contatos (telefone, email)
  - Endereço (integração com ViaCEP)
  - Data de aniversário
  - Segmento
  - Como conheceu
  - Preferências/alergias
  - Observações
- Gestão de familiares:
  - Nome, parentesco
  - Data de nascimento
  - Alertas de aniversário
- Histórico:
  - Total de compras
  - Quantidade de pedidos
  - Última compra
  - Ticket médio
- Alertas de aniversário:
  - Cliente
  - Familiares
  - Notificações no dashboard
- Pesquisa NPS (opcional)

### 7. **Fornecedores**
**Rota**: `/fornecedores`

**Funcionalidades**:
- Cadastro completo:
  - Nome fantasia / Razão social
  - CPF/CNPJ
  - Contatos
  - Endereço completo
  - Site
  - Observações
- Gestão de contatos:
  - Múltiplos contatos por fornecedor
  - Cargo, telefone, email
- Vinculação com:
  - Itens de estoque (fornecedor padrão)
  - Contas a pagar
  - Histórico de compras

### 8. **Financeiro**

#### 8.1 Dashboard Financeiro
**Rota**: `/financeiro/dashboard`

**Funcionalidades**:
- Cards de métricas:
  - Total a receber
  - Total a pagar
  - Saldo em contas
  - Lucro do mês
- Gráficos:
  - Receitas vs Despesas (mensal)
  - Evolução de saldos
  - Categorias de despesas
- Alertas:
  - Contas vencidas
  - Vencendo hoje
  - Saldo negativo

#### 8.2 Contas a Receber
**Rota**: `/financeiro/contas-receber`

**Funcionalidades**:
- Listagem de contas:
  - Filtros: status, período, cliente
  - Ordenação
  - Busca
- Criação de contas:
  - Manual ou vinculada a encomenda
  - Cliente
  - Descrição
  - Valor
  - Datas (emissão, vencimento)
  - Banco destino
  - Tipo de documento
  - Plano de contas (DRE)
  - Categoria
- Tipos de lançamento:
  - **Único**: Pagamento à vista
  - **Parcelado**: Múltiplas parcelas com vencimentos
  - **Recorrente**: Renovação automática mensal
- Gestão de parcelas:
  - Visualização individual
  - Baixa de pagamentos:
    - Data do pagamento
    - Valor pago
    - Juros (cálculo automático ou manual)
    - Desconto
    - Banco
    - Tipo de documento
    - Comprovante (upload)
    - Observações
  - Pagamentos parciais (múltiplos pagamentos por parcela)
  - Estorno de pagamentos
- Status automático:
  - Aberto
  - Pago Parcial
  - Pago
  - Vencido
  - Cancelado
- Cálculo de juros e multas:
  - Configurável por usuário
  - Juros simples (mensal ou diário)
  - Multa por atraso
  - Aplicação automática
- Relatórios:
  - Recebimentos do período
  - Inadimplência
  - Previsão de recebimentos
- Tags personalizadas

**Detalhes da Conta**:
- Histórico completo
- Timeline de eventos
- Anexos
- Comunicações

#### 8.3 Contas a Pagar
**Rota**: `/financeiro/contas-pagar`

**Funcionalidades**:
- Similar a contas a receber
- Adicional:
  - Vinculação com fornecedor
  - Aprovação de pagamento (workflow)
- Alertas de vencimento
- Programação de pagamentos

#### 8.4 Fluxo de Caixa
**Rota**: `/financeiro/fluxo-caixa`

**Funcionalidades**:
- **Fluxo Diário** (`/diario`):
  - Visualização detalhada dia a dia
  - Entradas vs Saídas
  - Saldo do dia
  - Saldo acumulado
  - Filtro por período e banco
- **Fluxo Mensal** (`/mensal`):
  - Visão consolidada do mês
  - Totalizadores
  - Comparativo com mês anterior
  - Projeções
- Categorização:
  - Por plano de contas
  - Por tipo de documento
  - Por cliente/fornecedor
- Gráficos interativos
- Exportação para Excel/PDF

#### 8.5 DRE (Demonstração do Resultado do Exercício)
**Rota**: `/financeiro/dre`

**Funcionalidades**:
- Estrutura contábil completa:
  1. **Receita Bruta**
     - Vendas de produtos
     - Serviços prestados
  2. **(-) Deduções**
     - Devoluções
     - Descontos concedidos
     - Impostos sobre vendas
  3. **= Receita Líquida**
  4. **(-) CMV (Custo das Mercadorias Vendidas)**
     - Integrado com relatório de CMV
  5. **= Lucro Bruto**
  6. **(-) Despesas Operacionais**
     - Administrativas
     - Comerciais
     - Financeiras
  7. **= Resultado Operacional**
  8. **Outras Receitas/Despesas**
     - Não operacionais
  9. **= Resultado Líquido**
- Filtros:
  - Período (mensal/trimestral/anual)
  - Comparativo entre períodos
- Indicadores:
  - Margem bruta
  - Margem líquida
  - EBITDA
- Gráficos de evolução
- Exportação

#### 8.6 Bancos e Contas
**Rota**: `/configuracoes/bancos`

**Funcionalidades**:
- Cadastro de contas:
  - Bancos oficiais (lista predefinida)
  - Contas customizadas (carteiras digitais, etc.)
  - Caixa físico
- Tipos:
  - Conta corrente
  - Conta poupança
  - Caixa
  - Carteira digital
- Gestão:
  - Saldo inicial
  - Ativar/desativar
  - Código do banco
- Conciliação bancária:
  - Importação de extratos (OFX/CSV)
  - Matching automático com lançamentos
  - Sugestões de conciliação
  - Confirmação manual
  - Relatório de diferenças

#### 8.7 Plano de Contas
**Rota**: `/configuracoes/plano-contas`

**Funcionalidades**:
- Estrutura hierárquica
- Categorias padrão (DRE):
  - Receita Bruta
  - Deduções
  - Custos (CMV)
  - Despesas Operacionais
  - Outras Receitas/Despesas
- Contas customizadas
- Código estruturado (ex: 1.1.01)
- Indicador (credora/devedora)
- Ativo/inativo
- Proteção de contas padrão

#### 8.8 Tipos de Documentos
**Rota**: `/configuracoes/tipos-documentos`

**Funcionalidades**:
- Tipos padrão:
  - Dinheiro
  - PIX
  - Cartão de Débito
  - Cartão de Crédito
  - Boleto
  - Transferência Bancária
  - Cheque
- Tipos customizados
- Proteção de tipos padrão

#### 8.9 Configuração de Juros
**Rota**: `/configuracoes/juros`

**Funcionalidades**:
- Ativar/desativar cobrança de juros
- Tipo de juros:
  - Mensal
  - Diário
- Percentual de juros
- Ativar/desativar multa por atraso
- Percentual de multa
- Observações

### 9. **Planejamento**
**Rota**: `/planejamento`

**Funcionalidades**:
- Configuração de metas:
  - Seleção de mês/ano
  - Meta de faturamento anual
  - Meta de lucro anual (percentual)
  - Geração automática de metas mensais
- Ajustes mensais:
  - Faturamento
  - Lucro
  - Número de pedidos
  - Ticket médio
- Acompanhamento:
  - Comparação Realizado vs Meta
  - Percentual atingido
  - Projeção para o mês
  - Análise de desvios
- Gráficos:
  - Evolução mensal
  - Funil de vendas
  - Performance por produto
- Insights automáticos:
  - Produtos mais vendidos
  - Períodos de maior venda
  - Clientes top
  - Oportunidades de melhoria

### 10. **CMV Global**
**Rota**: `/estoque/cmv-global`

**Funcionalidades**:
- Cálculo de CMV mensal:
  - **Fórmula**: CMV = Estoque Inicial + Compras - Estoque Final
- Entrada de dados:
  - Manual ou automático (sistema)
  - Tipo: Real ou Estimado
- Informações:
  - Estoque inicial do mês
  - Total de compras
  - Estoque final
  - Faturamento
  - CMV percentual estimado
  - Custos fixos estimados
  - Ticket médio estimado
- Análise:
  - CMV real vs estimado
  - Evolução mensal
  - Comparativo com planejamento
  - Impacto dos custos fixos
- Relatórios:
  - CMV por categoria
  - CMV por produto
  - Rentabilidade

### 11. **Configurações**

#### 11.1 Cadastros Base
**Rota**: `/configuracoes/cadastros-base`

Acesso centralizado a:
- Categorias de Receitas
- Categorias de Estoque (visualização)
- Unidades de Medida

#### 11.2 Categorias de Receitas
**Rota**: `/configuracoes/categorias-receitas`

**Funcionalidades**:
- Criação de categorias personalizadas:
  - Bolos
  - Tortas
  - Doces Finos
  - Salgados
  - Bebidas
  - etc.
- Categorias padrão (não editáveis/excluíveis)
- Ativar/desativar

#### 11.3 Categorias de Estoque
**Rota**: `/configuracoes/categorias-estoque`

**Funcionalidades**:
- Visualização das categorias fixas:
  1. Ingredientes (🥚)
  2. Embalagens (📦)
  3. Pré-Preparos (🍰)
  4. Produtos Finais (🎂)
- Ícones e cores
- Ordem de exibição
- Não editável pelo usuário

#### 11.4 Unidades de Medida
**Rota**: `/configuracoes/unidades-medida`

**Funcionalidades**:
- Unidades padrão:
  - Massa: kg, g, mg
  - Volume: L, mL
  - Unidade: un, dz, cx
- Unidades customizadas:
  - Nome
  - Sigla
  - Código (opcional)
- Conversões automáticas (quando aplicável)
- Ativar/desativar

#### 11.5 Tags de Encomendas
**Rota**: `/configuracoes/tags-encomendas`

**Funcionalidades**:
- Criação de tags:
  - Nome
  - Cor (picker)
  - Descrição
- Uso em encomendas
- Filtros e relatórios
- Ativar/desativar

#### 11.6 Dados da Confeitaria
**Rota**: `/configuracoes/dados-confeitaria`

**Funcionalidades**:
- Perfil do usuário:
  - Nome completo
  - Nome da confeitaria
  - Telefone
  - Email
  - Avatar (upload)
  - Valor/hora (mão de obra)
- Atualização de dados
- Alteração de senha
- Configurações de notificações

### 12. **Administração** (apenas para admins)

#### 12.1 Gestão de Usuários
**Rota**: `/admin/usuarios`

**Funcionalidades**:
- Listagem de todos os usuários
- Informações:
  - Nome
  - Email
  - Confeitaria
  - Status (ativo/inativo)
  - Data de cadastro
  - Último acesso
- Ações:
  - Criar novo usuário
  - Editar usuário
  - Ativar/desativar
  - Redefinir senha
  - Acessar como usuário (impersonation)
- Filtros e busca
- Exportação

#### 12.2 Logs do Sistema
**Rota**: `/admin/logs`

**Funcionalidades**:
- Auditoria completa:
  - Ação realizada
  - Usuário responsável
  - Data/hora
  - IP
  - User Agent
  - Detalhes (antes/depois)
- Filtros:
  - Período
  - Usuário
  - Módulo
  - Tipo de ação
- Busca textual
- Exportação
- Retenção: 90 dias

### 13. **Autenticação**

#### 13.1 Login
**Rota**: `/auth/login`

**Funcionalidades**:
- Login com email/senha
- Validação:
  - Conta ativa
  - Credenciais corretas
- Mensagens de erro específicas
- Link para recuperação de senha
- Link para cadastro

#### 13.2 Cadastro
**Rota**: `/auth/signup`

**Funcionalidades**:
- Registro de novo usuário:
  - Email
  - Senha (com validação de força)
  - Nome completo
  - Nome da confeitaria
- Validações:
  - Email único
  - Senha forte (mínimo 8 caracteres, maiúsculas, minúsculas, números)
  - Campos obrigatórios
- Criação automática de perfil
- Auto-confirmação de email (desenvolvimento)
- Redirecionamento para login

#### 13.3 Recuperação de Senha
**Rota**: `/auth/forgot-password`

**Funcionalidades**:
- Envio de email de recuperação
- Link temporário
- Redefinição de senha
- Expiração do link (1 hora)

#### 13.4 Primeiro Acesso
**Componente**: `FirstAccessRedirect`

**Funcionalidades**:
- Detecção de primeiro acesso
- Redirecionamento para configurações iniciais:
  - Completar perfil
  - Configurar bancos
  - Cadastrar primeira receita (opcional)
- Tour guiado (opcional)

---

## 🛣️ Rotas e Páginas

### Mapa Completo de Rotas

```typescript
// Autenticação (públicas)
/auth/login                                    // Login
/auth/signup                                   // Cadastro
/auth/forgot-password                          // Recuperação de senha

// Dashboard (protegidas)
/                                              // Redirect para /dashboard
/dashboard                                     // Dashboard principal

// Encomendas
/encomendas                                    // Listagem de encomendas

// Produção
/producao                                      // Gestão de produção

// Clientes e Fornecedores
/clientes                                      // Cadastro de clientes
/fornecedores                                  // Cadastro de fornecedores

// Estoque
/estoque                                       // Catálogo de itens
/estoque/relatorios                            // Hub de relatórios
/estoque/movimentacoes                         // Relatório de movimentações
/estoque/consumo-medio                         // Relatório de consumo médio
/estoque/cmv-global                            // Relatório de CMV global

// Precificação
/precificacao                                  // Hub de precificação
/precificacao/ingredientes                     // Gestão de ingredientes
/precificacao/embalagens                       // Gestão de embalagens
/precificacao/pre-preparo                      // Listagem de pré-preparos
/precificacao/pre-preparo/nova                 // Nova sub-receita
/precificacao/pre-preparo/editar/:id           // Editar sub-receita
/precificacao/ficha-tecnica                    // Listagem de receitas
/precificacao/ficha-tecnica/nova               // Nova receita
/precificacao/ficha-tecnica/editar/:id         // Editar receita
/precificacao/custos-fixos                     // Gestão de custos fixos
/precificacao/pre-preparos                     // [Duplicado? Verificar]
/precificacao/pre-preparos/novo                // [Duplicado? Verificar]
/precificacao/pre-preparos/:id                 // [Duplicado? Verificar]

// Financeiro
/financeiro                                    // Hub financeiro
/financeiro/dashboard                          // Dashboard financeiro
/financeiro/contas-receber                     // Listagem contas a receber
/financeiro/contas-receber/nova                // Nova conta a receber
/financeiro/contas-receber/editar/:id          // Editar conta a receber
/financeiro/contas-receber/detalhes/:id        // Detalhes da conta
/financeiro/contas-pagar                       // Listagem contas a pagar
/financeiro/contas-pagar/nova                  // Nova conta a pagar
/financeiro/contas-pagar/editar/:id            // Editar conta a pagar
/financeiro/contas-pagar/detalhes/:id          // Detalhes da conta
/financeiro/fluxo-caixa                        // Hub fluxo de caixa
/financeiro/fluxo-caixa/diario                 // Fluxo de caixa diário
/financeiro/fluxo-caixa/mensal                 // Fluxo de caixa mensal
/financeiro/dre                                // DRE

// Planejamento
/planejamento                                  // Planejamento e metas

// Configurações
/configuracoes                                 // Hub de configurações
/configuracoes/cadastros-base                  // Cadastros base
/configuracoes/precificacao                    // Config de precificação
/configuracoes/financeiro                      // Config financeira
/configuracoes/precificacao/custos-fixos       // Custos fixos
/configuracoes/precificacao/mao-de-obra        // Mão de obra
/configuracoes/tipos-insumos                   // Tipos de insumos
/configuracoes/categorias-plano-contas         // Categorias plano contas
/configuracoes/plano-contas                    // Plano de contas
/configuracoes/bancos                          // Bancos e contas
/configuracoes/tipos-documentos                // Tipos de documentos
/configuracoes/juros                           // Configuração de juros
/configuracoes/tags-encomendas                 // Tags de encomendas
/configuracoes/dados-confeitaria               // Dados da confeitaria
/configuracoes/categorias-receitas             // Categorias de receitas
/configuracoes/categorias-estoque              // Categorias de estoque
/configuracoes/unidades-medida                 // Unidades de medida

// Administração (apenas admins)
/admin/usuarios                                // Gestão de usuários
/admin/logs                                    // Logs do sistema

// Utilitárias
/migration-status                              // Status de migração
/* (404)                                       // Página não encontrada
```

### Proteção de Rotas

Todas as rotas (exceto `/auth/*`) são protegidas pelo componente `ProtectedRoute`:
- Verifica se usuário está autenticado
- Redireciona para `/auth/login` se não autenticado
- Exibe loader durante verificação
- Algumas rotas requerem role de admin

---

## 🧩 Componentes Principais

### Componentes de Layout

#### AppSidebar
**Localização**: `src/components/AppSidebar.tsx`

**Descrição**: Sidebar principal da aplicação com navegação completa.

**Funcionalidades**:
- Menu hierárquico com agrupamentos
- Ícones para cada seção
- Indicador de rota ativa
- Versão responsiva (colapsável)
- Avatar e nome do usuário
- Logout

**Grupos**:
1. Principal: Dashboard, Encomendas, Produção
2. Cadastros: Clientes, Fornecedores
3. Estoque: Catálogo, Relatórios
4. Precificação: Ingredientes, Embalagens, Pré-Preparos, Fichas Técnicas
5. Financeiro: Dashboard, Contas, Fluxo, DRE
6. Planejamento: Metas e Análises
7. Configurações: Todas as configs
8. Admin: Usuários, Logs (apenas admin)

#### Layout
**Localização**: `src/App.tsx` (componente interno)

**Descrição**: Wrapper de todas as páginas protegidas.

**Estrutura**:
- `SidebarProvider`: Contexto do sidebar
- `AppSidebar`: Menu lateral
- Header fixo com:
  - `SidebarTrigger`: Botão para abrir/fechar
  - Separador visual
- Main content area
- `FirstAccessRedirect`: Componente de redirecionamento

### Componentes de UI Base (Shadcn/ui)

Localizados em `src/components/ui/`:
- `button.tsx` - Botões com variantes
- `card.tsx` - Cards com header/content/footer
- `dialog.tsx` - Modais
- `form.tsx` - Componentes de formulário integrados com react-hook-form
- `input.tsx` - Campos de entrada
- `select.tsx` - Seleção dropdown
- `table.tsx` - Tabelas responsivas
- `tabs.tsx` - Abas
- `badge.tsx` - Etiquetas/tags
- `calendar.tsx` - Calendário
- `alert.tsx` - Alertas
- `toast.tsx` / `toaster.tsx` / `sonner.tsx` - Notificações
- `tooltip.tsx` - Tooltips
- `dropdown-menu.tsx` - Menus dropdown
- `popover.tsx` - Popovers
- `sheet.tsx` - Painéis laterais
- `accordion.tsx` - Acordeões
- `progress.tsx` - Barras de progresso
- `avatar.tsx` - Avatares
- `checkbox.tsx` - Checkboxes
- `switch.tsx` - Toggles
- `radio-group.tsx` - Radio buttons
- `slider.tsx` - Sliders
- `separator.tsx` - Separadores
- `scroll-area.tsx` - Áreas roláveis
- `command.tsx` - Command palette
- E outros...

### Componentes Compartilhados

#### PageHeader
**Localização**: `src/components/PageHeader.tsx`

**Descrição**: Cabeçalho padrão de páginas com título e ações.

**Props**:
- `title`: Título da página
- `description?`: Descrição opcional
- `children?`: Elementos adicionais (botões, filtros)

#### BackButton
**Localização**: `src/components/BackButton.tsx`

**Descrição**: Botão para voltar à página anterior.

#### LoadingState
**Localização**: `src/components/LoadingState.tsx`

**Descrição**: Indicador de carregamento centralizado.

#### EmptyState / EstadoVazio
**Localização**: `src/components/EmptyState.tsx` / `EstadoVazio.tsx`

**Descrição**: Estado vazio com mensagem e ação.

**Props**:
- `icon`: Ícone
- `title`: Título
- `description`: Descrição
- `action?`: Botão de ação

#### ConfirmDialog
**Localização**: `src/components/ConfirmDialog.tsx`

**Descrição**: Dialog de confirmação reutilizável.

**Props**:
- `open`: Controle de visibilidade
- `onOpenChange`: Callback de mudança
- `title`: Título
- `description`: Descrição
- `onConfirm`: Ação de confirmação
- `confirmText?`: Texto do botão
- `variant?`: Variante (default/destructive)

#### HelpTooltip
**Localização**: `src/components/HelpTooltip.tsx`

**Descrição**: Tooltip de ajuda com ícone de interrogação.

**Props**:
- `content`: Conteúdo do tooltip

#### ExportImport
**Localização**: `src/components/ExportImport.tsx`

**Descrição**: Botões para exportar/importar dados.

**Funcionalidades**:
- Exportação para Excel
- Importação de planilhas
- Validação de dados

### Componentes de Domínio

#### ClienteAutocomplete
**Localização**: `src/components/ClienteAutocomplete.tsx`

**Descrição**: Seletor de clientes com busca e criação rápida.

**Funcionalidades**:
- Busca por nome/telefone
- Criação de novo cliente inline
- Exibição de informações resumidas

#### FornecedorAutocomplete
**Localização**: `src/components/FornecedorAutocomplete.tsx`

**Descrição**: Similar a ClienteAutocomplete para fornecedores.

#### EmbalagemAutocomplete
**Localização**: `src/components/EmbalagemAutocomplete.tsx`

**Descrição**: Seletor de embalagens.

#### PlanoContasAutocomplete / CategoriaPlanoContasAutocomplete
**Localização**: `src/components/PlanoContasAutocomplete.tsx`

**Descrição**: Seletor de planos/categorias de contas.

#### DatePickerField
**Localização**: `src/components/DatePickerField.tsx`

**Descrição**: Seletor de data integrado com react-hook-form.

**Props**:
- `control`: Controle do formulário
- `name`: Nome do campo
- `label`: Label
- `placeholder?`: Placeholder
- `disabled?`: Desabilitado

#### MiniCalendar
**Localização**: `src/components/MiniCalendar.tsx`

**Descrição**: Calendário compacto para seleção de data.

#### AlertaAniversariantesContatos
**Localização**: `src/components/AlertaAniversariantesContatos.tsx`

**Descrição**: Card de alertas de aniversários no dashboard.

**Funcionalidades**:
- Aniversariantes do dia
- Próximos aniversários
- Link para cliente
- Ações rápidas (enviar mensagem, criar encomenda)

#### ContatosLista / FamiliaresLista
**Localização**: `src/components/ContatosLista.tsx` / `FamiliaresLista.tsx`

**Descrição**: Listas de contatos de fornecedores e familiares de clientes.

**Funcionalidades**:
- Adicionar
- Editar
- Excluir
- Ativar/desativar

#### ProductionCard
**Localização**: `src/components/ProductionCard.tsx`

**Descrição**: Card de encomendas para produção.

**Exibição**:
- Itens da encomenda
- Quantidades
- Observações
- Status

#### PrevisaoFaturamentoCard / ProjecaoVendasCard
**Localização**: `src/components/PrevisaoFaturamentoCard.tsx` / `ProjecaoVendasCard.tsx`

**Descrição**: Cards de análise e projeção no planejamento.

#### CMVGlobalCard
**Localização**: `src/components/CMVGlobalCard.tsx`

**Descrição**: Card com resumo de CMV.

### Componentes de Estoque

**Localização**: `src/components/estoque/`

#### AlertasEstoque
**Descrição**: Lista de alertas (estoque baixo, vencimento próximo).

#### BadgeStatus
**Descrição**: Badge de status de estoque.

#### CardItem
**Descrição**: Card de item do catálogo.

#### EntradaRapida
**Descrição**: Formulário rápido de entrada de estoque.

#### ModalItem
**Descrição**: Modal de detalhes/edição de item.

#### NovaEntradaDialog / NovaSaidaDialog
**Descrição**: Dialogs de registro de movimentações.

### Componentes Financeiros

**Localização**: `src/components/financeiro/`

#### ContasReceberFormModal
**Descrição**: Modal de criação/edição de conta a receber.

**Funcionalidades**:
- Formulário completo
- Validação com Zod
- Gestão de parcelas
- Cálculo de totais

#### DarBaixaDialog / DarBaixaPagarDialog
**Descrição**: Dialogs de baixa de pagamento.

**Funcionalidades**:
- Seleção de parcela
- Informações de pagamento
- Cálculo de juros/desconto
- Upload de comprovante

### Componentes de Configuração

**Localização**: `src/components/configuracoes/`

#### ConfiguracaoJuros
**Descrição**: Formulário de configuração de juros e multas.

#### ConfiguracaoTagsEncomendas
**Descrição**: Gestão de tags de encomendas.

### Componentes Admin

**Localização**: `src/components/admin/`

#### AdicionarUsuarioDialog
**Descrição**: Dialog de criação de usuário (admin).

#### EditarUsuarioDialog
**Descrição**: Dialog de edição de usuário (admin).

### Componentes de Autenticação

**Localização**: `src/components/auth/`

#### AlterarSenhaObrigatoria
**Descrição**: Modal de alteração obrigatória de senha em primeiro acesso.

---

## 🪝 Hooks Customizados

Localizados em `src/hooks/`:

### Hooks de Dados

#### useUserProfile
**Descrição**: Busca e gerencia perfil do usuário logado.

**Retorno**:
- `profile`: Dados do perfil
- `loading`: Estado de carregamento
- `error`: Erros
- `refetch`: Função para recarregar

#### useUserId
**Descrição**: Retorna o ID do usuário autenticado.

#### useIsAdmin
**Descrição**: Verifica se o usuário é admin.

**Retorno**:
- `isAdmin`: Boolean
- `loading`: Estado de carregamento

#### useClientes
**Descrição**: Lista todos os clientes do usuário.

**Retorno**:
- `clientes`: Array de clientes
- `loading`: Estado
- `error`: Erros
- `refetch`: Recarregar

#### useFornecedores
**Descrição**: Lista todos os fornecedores.

#### useReceitas
**Descrição**: Lista receitas com ingredientes, embalagens, despesas e imagens.

**Retorno**:
- `receitas`: Receitas ativas
- `todasReceitas`: Todas as receitas (incluindo inativas)
- `isLoading`: Estado
- `error`: Erros
- `refetch`: Recarregar

**Observação**: Filtra apenas receitas com `cardapio = 'ativo'` por padrão.

#### useSubReceitas
**Descrição**: Lista pré-preparos/sub-receitas.

#### useCategorias
**Descrição**: Lista categorias de receitas.

#### useCategoriasEstoque
**Descrição**: Lista categorias de estoque (fixas).

#### useUnidadesMedida
**Descrição**: Lista unidades de medida.

#### useTiposDocumento
**Descrição**: Lista tipos de documentos financeiros.

#### useCustosFixos
**Descrição**: Lista custos fixos mensais.

#### useEncomendas
**Descrição**: Lista encomendas com filtros.

**Parâmetros**:
- `filtros?`: { status, dataInicio, dataFim, cliente }

**Retorno**:
- `encomendas`: Array
- `loading`: Estado
- `refetch`: Recarregar

#### useEncomendaItens
**Descrição**: Lista itens de uma encomenda específica.

#### useFamiliares
**Descrição**: Lista familiares de um cliente.

#### useFornecedorContatos
**Descrição**: Lista contatos de um fornecedor.

#### useProducaoTarefas
**Descrição**: Lista tarefas de produção.

**Parâmetros**:
- `data?`: Filtrar por data

#### usePlanejamento
**Descrição**: Busca planejamento de um mês específico.

**Parâmetros**:
- `ano`: Ano
- `mes`: Mês (1-12)

#### useCMVMensal
**Descrição**: Busca CMV mensal.

**Parâmetros**:
- `ano`: Ano
- `mes`: Mês

#### useCMVGlobal
**Descrição**: Calcula CMV global (anual ou por período).

#### useEstoque
**Descrição**: Lista itens de estoque.

**Parâmetros**:
- `tipo?`: Filtrar por tipo (ingrediente/embalagem/etc)
- `categoria?`: Filtrar por categoria

#### useEstoqueIntegrado
**Descrição**: Dados de estoque com cálculos integrados.

#### useMovimentacoes
**Descrição**: Lista movimentações de estoque.

**Parâmetros**:
- `filtros?`: { periodo, tipo, item }

#### useConsumoMedio
**Descrição**: Calcula consumo médio de itens.

**Parâmetros**:
- `periodo`: Número de meses

#### useConfigStatus
**Descrição**: Verifica status de configurações iniciais.

**Retorno**:
- `hasBancos`: Tem bancos cadastrados
- `hasReceitas`: Tem receitas
- `hasClientes`: Tem clientes
- `isComplete`: Todas as configs feitas

### Hooks Utilitários

#### useLocalStorage
**Descrição**: Persiste estado no localStorage.

**Parâmetros**:
- `key`: Chave
- `initialValue`: Valor inicial

**Retorno**:
- `[value, setValue]`: Estado e setter

#### useViaCEP
**Descrição**: Busca endereço por CEP.

**Parâmetros**:
- `cep`: CEP (apenas números)

**Retorno**:
- `data`: Dados do endereço
- `loading`: Estado
- `error`: Erros

**Formato de retorno**:
```typescript
{
  logradouro: string;
  bairro: string;
  localidade: string; // cidade
  uf: string; // estado
}
```

#### use-mobile
**Descrição**: Detecta se é dispositivo móvel (< 768px).

**Retorno**:
- `isMobile`: Boolean

#### use-toast
**Descrição**: Sistema de notificações toast.

**Funções**:
- `toast()`: Exibe toast
- `toast.success()`: Toast de sucesso
- `toast.error()`: Toast de erro
- `toast.info()`: Toast informativo
- `toast.warning()`: Toast de aviso

---

## 👤 Fluxos de Usuário

### 1. Cadastro e Primeiro Acesso

**Fluxo**:
1. Usuário acessa `/auth/signup`
2. Preenche formulário:
   - Email
   - Senha (com validação)
   - Nome completo
   - Nome da confeitaria
3. Sistema valida dados
4. Cria usuário no Supabase Auth
5. Trigger cria perfil na tabela `profiles`
6. Redireciona para `/auth/login`
7. Usuário faz login
8. `FirstAccessRedirect` detecta primeiro acesso
9. Redireciona para `/configuracoes/dados-confeitaria`
10. Usuário completa perfil (opcional)
11. Sistema sugere configurações iniciais:
    - Cadastrar banco
    - Definir valor/hora
    - Criar primeira receita
12. Redireciona para `/dashboard`

### 2. Criação de Receita (Ficha Técnica)

**Fluxo**:
1. Usuário acessa `/precificacao/ficha-tecnica`
2. Clica em "Nova Receita"
3. Preenche informações básicas:
   - Nome
   - Categoria
   - Tipo (avulso/combo)
   - Tempo de preparo
   - Rendimento e unidade
4. Adiciona ingredientes:
   - Seleciona ingrediente (ou pré-preparo)
   - Define quantidade utilizada
   - Sistema calcula custo automaticamente
5. Adiciona embalagens (se aplicável):
   - Seleciona embalagem
   - Define quantidade
   - Sistema calcula custo
6. Define valor de venda
7. Sistema calcula automaticamente:
   - Custo Total (ingredientes + embalagens)
   - Despesas de Venda (0 se não definidas)
   - CMV Real (Custo Total + Despesas)
   - Percentual CMV: (CMV Real / Valor Venda) × 100
   - Margem de Contribuição: Valor Venda - CMV Real
   - Percentual Margem: (Margem / Valor Venda) × 100
8. Sistema exibe alertas:
   - **CMV Excelente** (≤ 35%) - Verde
   - **CMV Aceitável** (35-45%) - Azul
   - **CMV Atenção** (45-55%) - Âmbar
   - **CMV Muito Alto** (> 55%) - Vermelho
   - **Margem Baixa** (< 30%) - Âmbar
9. Adiciona despesas de venda (opcional):
   - Taxa de entrega, comissões, etc.
   - Define percentual
   - Sistema recalcula tudo
10. Adiciona modo de preparo (opcional)
11. Upload de imagens (até 4)
12. Salva receita
13. Sistema:
    - Grava na tabela `receitas`
    - Grava ingredientes em `receitas_ingredientes`
    - Grava embalagens em `receitas_embalagens`
    - Grava despesas em `receitas_despesas_venda`
    - Grava imagens em `receitas_imagens`
14. Retorna para listagem

### 3. Criação de Encomenda

**Fluxo**:
1. Usuário acessa `/encomendas`
2. Clica em "Nova Encomenda"
3. Seleciona ou cria cliente
4. Define informações de entrega:
   - Data
   - Hora
   - Endereço (se entrega)
5. Adiciona produtos:
   - Seleciona receita
   - Define quantidade
   - Sistema calcula subtotal (quantidade × valor_venda)
6. Define informações de topo (se bolo):
   - Número do bolo
   - Aniversariante
   - Idade
   - Tema
   - Observações
   - Upload de imagens de referência
7. Adiciona taxa de entrega (se aplicável)
8. Adiciona desconto (percentual ou valor)
9. Sistema calcula:
   - Subtotal (soma dos produtos)
   - Desconto (aplicado sobre subtotal)
   - Taxa de entrega
   - Outros valores
   - **Total**: Subtotal - Desconto + Taxa + Outros
10. Registra pagamentos (opcional):
    - Tipo (entrada, sinal, etc.)
    - Valor
    - Forma de pagamento
    - Data
11. Sistema calcula saldo restante
12. Adiciona observações do cliente
13. Adiciona observações internas (privadas)
14. Adiciona tags
15. Define status inicial (Rascunho ou Confirmada)
16. Salva encomenda
17. Sistema:
    - Grava em `encomendas`
    - Grava itens em `encomenda_itens`
    - Grava tags em `encomendas_tags`
    - Se confirmada, cria conta a receber (opcional)
18. Retorna para listagem

### 4. Gestão de Encomenda (Workflow)

**Fluxo**:
1. **Rascunho → Confirmada**:
   - Cliente confirma pedido
   - Sistema pode criar conta a receber
2. **Confirmada → Em Produção**:
   - Início da produção
   - Sistema sugere tarefas
3. **Em Produção → Pronta**:
   - Produto finalizado
   - Alerta de entrega
4. **Pronta → Entregue**:
   - Produto entregue
   - Registra data de entrega
   - Atualiza dados do cliente (última_compra, total_compras)
5. **Qualquer → Cancelada**:
   - Motivo de cancelamento
   - Estorna pagamentos (se houver)
   - Cancela conta a receber

### 5. Controle de Estoque (FIFO)

**Fluxo de Entrada**:
1. Usuário registra compra:
   - Seleciona item
   - Define quantidade
   - Define custo unitário
   - Define data de entrada
   - Validade (opcional)
2. Sistema:
   - Cria registro em `movimentacoes_estoque` (tipo: entrada)
   - Cria registro em `entradas_detalhadas`:
     - `quantidade_inicial = quantidade`
     - `quantidade_restante = quantidade`
     - `status = 'disponivel'`

**Fluxo de Saída**:
1. Usuário registra saída:
   - Seleciona item
   - Define quantidade
   - Define tipo (venda, produção, perda)
2. Sistema:
   - Busca entradas disponíveis ordenadas por FIFO
   - Consome quantidade das entradas mais antigas:
     - Atualiza `quantidade_restante`
     - Se `quantidade_restante = 0`, marca `status = 'consumido'`
   - Calcula custo médio ponderado
   - Cria registro em `movimentacoes_estoque` (tipo: saida)

**Cálculo de Saldo**:
- Soma de `quantidade_restante` de todas as entradas disponíveis

### 6. Controle Financeiro (Contas a Receber)

**Fluxo Completo**:

**1. Criação da Conta**:
- Manual ou vinculada a encomenda
- Define: cliente, valor, vencimento, tipo de lançamento
- Tipos:
  - **Único**: Cria 1 parcela (vencimento = data definida)
  - **Parcelado**: Cria N parcelas (vencimentos mensais)
  - **Recorrente**: Cria parcela mensal e renova automaticamente

**2. Geração de Parcelas** (trigger):
```sql
-- Para parcelado (ex: 3 parcelas de R$ 100)
Parcela 1: vencimento = data_vencimento, valor = 100
Parcela 2: vencimento = data_vencimento + 1 mês, valor = 100
Parcela 3: vencimento = data_vencimento + 2 meses, valor = 100

-- Para recorrente (ex: mensalidade de R$ 500)
Parcela 1: vencimento = dia X do mês atual
Parcela 2: criada automaticamente no mês seguinte
```

**3. Cobrança e Vencimento**:
- Sistema verifica diariamente parcelas vencidas
- Atualiza status para `vencido`
- Calcula juros e multa (se configurado):
  ```
  Juros = valor_parcela × (percentual_juros / 100) × dias_atraso
  Multa = valor_parcela × (percentual_multa / 100)
  Total a receber = valor_parcela + juros + multa
  ```

**4. Recebimento**:
- Usuário acessa parcela
- Clica em "Dar Baixa"
- Preenche:
  - Data do pagamento
  - Valor pago
  - Juros (calculado automaticamente ou manual)
  - Desconto (opcional)
  - Banco destino
  - Tipo de documento
  - Upload de comprovante
  - Observações
- Sistema:
  - Cria registro em `contas_receber_pagamentos`
  - Atualiza `valor_pago` da parcela
  - Atualiza `status`:
    - `pago` se `valor_pago >= valor_parcela + juros - desconto`
    - `pago_parcial` caso contrário
  - Atualiza saldo do banco
  - Envia para plano de contas (DRE)

**5. Pagamentos Parciais**:
- Parcela pode ter múltiplos pagamentos
- Soma de `valor_pago` de todos os pagamentos
- Status atualizado conforme total pago

**6. Estorno**:
- Usuário marca pagamento como estornado
- Define motivo
- Sistema:
  - Marca `estornado = true`
  - Desconta do `valor_pago` da parcela
  - Reverte saldo do banco
  - Reverte lançamento no DRE

### 7. DRE (Demonstração de Resultado)

**Fluxo**:
1. Usuário acessa `/financeiro/dre`
2. Seleciona período (mês/trimestre/ano)
3. Sistema busca:
   - **Receitas**: Contas a receber pagas (plano de contas tipo receita)
   - **Despesas**: Contas a pagar pagas (plano de contas tipo despesa)
   - **CMV**: Relatório de CMV do período
4. Agrupa por categoria do plano de contas
5. Calcula:
   ```
   Receita Bruta = Σ receitas
   Deduções = Σ deduções
   Receita Líquida = Receita Bruta - Deduções
   CMV = Estoque Inicial + Compras - Estoque Final
   Lucro Bruto = Receita Líquida - CMV
   Despesas Operacionais = Σ despesas operacionais
   Resultado Operacional = Lucro Bruto - Despesas Operacionais
   Outras Receitas/Despesas = Σ não operacionais
   Resultado Líquido = Resultado Operacional + Outras Receitas - Outras Despesas
   ```
6. Calcula indicadores:
   ```
   Margem Bruta = (Lucro Bruto / Receita Líquida) × 100
   Margem Líquida = (Resultado Líquido / Receita Líquida) × 100
   EBITDA = Resultado Operacional + Depreciação + Amortização
   ```
7. Exibe gráficos de evolução
8. Permite exportação para PDF/Excel

### 8. Planejamento e Metas

**Fluxo**:
1. Usuário acessa `/planejamento`
2. Clica em "Configurar Metas"
3. Seleciona mês/ano
4. Define:
   - Meta de faturamento anual (ex: R$ 120.000)
   - Percentual de lucro desejado (ex: 30%)
5. Sistema calcula automaticamente:
   ```
   Meta Faturamento Mensal = Faturamento Anual / 12
   Meta Lucro Mensal = Faturamento Mensal × (% Lucro / 100)
   ```
6. Usuário pode ajustar mensalmente:
   - Meta de faturamento
   - Meta de lucro
   - Meta de pedidos
   - Ticket médio esperado
7. Sistema acompanha:
   - Realizado vs Meta (%)
   - Faturamento acumulado no ano
   - Projeção para o mês (baseado em dias corridos)
8. Gera insights:
   - "Você está X% acima/abaixo da meta"
   - "Para atingir a meta, precisa vender R$ X por dia"
   - "Produtos mais vendidos este mês"
   - "Clientes que mais compraram"

---

## 🔌 Integrações

### 1. Supabase (Lovable Cloud)

**Descrição**: Backend completo (BaaS).

**Serviços Utilizados**:
- **Database (PostgreSQL)**:
  - 50+ tabelas
  - Views otimizadas
  - Triggers e functions
  - RLS em todas as tabelas
- **Authentication**:
  - Email/Password
  - JWT tokens
  - Session management
  - Política de senhas
- **Storage**:
  - Upload de imagens (receitas, avatares)
  - Comprovantes de pagamento
  - Documentos
  - Bucket: `uploads/`
- **Realtime** (opcional):
  - Sincronização de encomendas
  - Notificações em tempo real
- **Edge Functions**:
  - `criar-usuario`: Criação de usuário por admin

**Configuração**:
- URL: `VITE_SUPABASE_URL`
- Anon Key: `VITE_SUPABASE_PUBLISHABLE_KEY`
- Project ID: `VITE_SUPABASE_PROJECT_ID`

### 2. ViaCEP

**Descrição**: API pública para consulta de CEP.

**Uso**: Preenchimento automático de endereço.

**Endpoint**: `https://viacep.com.br/ws/{cep}/json/`

**Implementação**: Hook `useViaCEP`.

**Exemplo**:
```typescript
const { data, loading, error } = useViaCEP('01310100');
// Retorna: { logradouro, bairro, localidade, uf }
```

### 3. Lovable (Plataforma)

**Descrição**: Plataforma de desenvolvimento e deploy.

**Funcionalidades**:
- Build automatizado (Vite)
- Deploy contínuo
- Ambiente de preview
- Integração com Supabase
- Versionamento

---

## 🔐 Autenticação e Segurança

### Autenticação

**Método**: Email e senha (Supabase Auth).

**Fluxo**:
1. Usuário faz login
2. Supabase Auth valida credenciais
3. Retorna JWT token
4. Token armazenado em `localStorage`
5. Incluído em todas as requisições (Authorization header)
6. Auto-refresh antes de expirar

**Contexto**: `AuthContext` (`src/contexts/AuthContext.tsx`)

**Funções**:
- `signIn(email, password)`: Login
- `signUp(email, password, nomeCompleto, nomeConfeitaria)`: Registro
- `signOut()`: Logout
- `resetPassword(email)`: Recuperação de senha

**Estado**:
- `user`: Dados do usuário autenticado
- `session`: Sessão ativa
- `loading`: Estado de carregamento

### Row Level Security (RLS)

**Conceito**: Segurança no nível da linha do banco de dados.

**Implementação**:
Todas as tabelas têm políticas RLS que garantem:
- Usuários só acessam seus próprios dados
- Isolamento completo entre contas
- Proteção contra SQL injection
- Proteção contra acesso não autorizado

**Padrão**:
```sql
-- Leitura
CREATE POLICY "Users can view own data"
ON tabela FOR SELECT
USING (auth.uid() = usuario_id);

-- Criação
CREATE POLICY "Users can insert own data"
ON tabela FOR INSERT
WITH CHECK (auth.uid() = usuario_id);

-- Atualização
CREATE POLICY "Users can update own data"
ON tabela FOR UPDATE
USING (auth.uid() = usuario_id);

-- Exclusão
CREATE POLICY "Users can delete own data"
ON tabela FOR DELETE
USING (auth.uid() = usuario_id);
```

**Exceções**:
- Admins têm acesso especial via `user_roles`
- Categorias/unidades padrão têm políticas específicas
- Views não têm RLS (herdam das tabelas base)

### Roles e Permissões

**Roles**:
- `user` (padrão): Acesso completo aos próprios dados
- `admin`: Acesso a funcionalidades administrativas

**Verificação**:
```typescript
const { isAdmin, loading } = useIsAdmin();

if (isAdmin) {
  // Exibe menu admin
}
```

**Proteção de Rotas**:
```typescript
<Route path="/admin/*" element={
  <ProtectedRoute requireAdmin>
    <AdminLayout />
  </ProtectedRoute>
} />
```

### Validação de Dados

**Frontend**:
- React Hook Form + Zod
- Validação em tempo real
- Mensagens de erro específicas

**Exemplo**:
```typescript
const schema = z.object({
  email: z.string().email("Email inválido"),
  senha: z.string()
    .min(8, "Mínimo 8 caracteres")
    .regex(/[A-Z]/, "Pelo menos 1 maiúscula")
    .regex(/[0-9]/, "Pelo menos 1 número"),
});
```

**Backend**:
- Constraints de banco (NOT NULL, UNIQUE, CHECK)
- Triggers de validação
- RLS policies

### Proteção contra Ataques

**SQL Injection**: Prevenido por:
- Uso de Supabase client (queries parametrizadas)
- RLS policies
- Validação de tipos

**XSS**: Prevenido por:
- React (escape automático)
- Sanitização de inputs
- Content Security Policy

**CSRF**: Prevenido por:
- JWT tokens
- SameSite cookies
- CORS configurado

---

## 📊 Métricas e Análises

### KPIs Principais

**Dashboard**:
- Faturamento do mês
- Encomendas confirmadas
- Contas a receber (abertas)
- Contas a pagar (abertas)
- Saldo em contas
- CMV médio
- Margem de contribuição média
- Ticket médio
- Produtos mais vendidos
- Clientes top

**Financeiro**:
- Total a receber
- Total a pagar
- Saldo líquido
- Lucro do mês
- Inadimplência (%)
- Previsão de recebimentos (próximos 7/30 dias)

**Estoque**:
- Valor total do estoque
- Itens abaixo do ponto de pedido
- Itens sem movimentação (últimos 30 dias)
- Produtos próximos ao vencimento
- Consumo médio mensal

**Produção**:
- Encomendas do dia/semana
- Tarefas pendentes
- Tarefas concluídas
- Itens em produção

### Relatórios Disponíveis

1. **Movimentações de Estoque**
   - Filtros: período, tipo, item
   - Agrupamento: diário/mensal
   - Exportação: Excel

2. **Consumo Médio**
   - Período configurável
   - Sugestão de compras
   - Tendências

3. **CMV Global**
   - Mensal/anual
   - Por categoria
   - Por produto
   - Evolução histórica

4. **Contas a Receber**
   - Abertas/pagas/vencidas
   - Por cliente
   - Por período
   - Inadimplência

5. **Contas a Pagar**
   - Abertas/pagas/vencidas
   - Por fornecedor
   - Por categoria

6. **Fluxo de Caixa**
   - Diário
   - Mensal
   - Projeções
   - Por banco/categoria

7. **DRE**
   - Mensal/trimestral/anual
   - Comparativo
   - Indicadores

8. **Vendas**
   - Por produto
   - Por cliente
   - Por período
   - Sazonalidade

---

## 🚀 Deployment e Ambiente

### Ambientes

1. **Desenvolvimento**:
   - Local (Vite dev server)
   - Hot reload
   - Supabase local (opcional)

2. **Preview**:
   - Deploy automático por commit
   - URL temporária
   - Dados de teste

3. **Produção**:
   - Deploy via Lovable
   - URL definitiva
   - Dados reais

### Build

**Comando**: `npm run build`

**Processo**:
1. TypeScript compilation
2. Vite bundling
3. Tree shaking
4. Minification
5. Asset optimization
6. Source maps generation

**Output**: `dist/`

### Variáveis de Ambiente

**Desenvolvimento** (`.env`):
```
VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=eyJxxx...
VITE_SUPABASE_PROJECT_ID=xxx
```

**Produção**:
- Gerenciadas pela Lovable
- Injetadas no build

### Performance

**Otimizações**:
- Code splitting (React.lazy)
- Lazy loading de imagens
- React Query caching
- Debounce em buscas
- Virtualização de listas longas (react-window)
- Memoization (useMemo, useCallback)

**Métricas**:
- First Contentful Paint: < 1s
- Time to Interactive: < 3s
- Lighthouse Score: > 90

---

## 📝 Convenções e Padrões

### Nomenclatura

**Arquivos**:
- Componentes: PascalCase (ex: `ClienteAutocomplete.tsx`)
- Hooks: camelCase com prefixo `use` (ex: `useClientes.ts`)
- Utilitários: camelCase (ex: `validacaoSenha.ts`)
- Tipos: PascalCase (ex: `estoque.ts` com tipo `ItemEstoque`)

**Variáveis**:
- camelCase (ex: `valorTotal`)
- Constantes: UPPER_SNAKE_CASE (ex: `MAX_UPLOAD_SIZE`)

**Funções**:
- camelCase (ex: `calcularCMV`)
- Handlers: prefixo `handle` (ex: `handleSubmit`)

**Banco de Dados**:
- Tabelas: snake_case plural (ex: `contas_receber`)
- Colunas: snake_case (ex: `data_vencimento`)
- Foreign keys: sufixo `_id` (ex: `cliente_id`)

### Estrutura de Componentes

**Padrão**:
```typescript
// Imports
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useClientes } from '@/hooks/useClientes';

// Types/Interfaces
interface Props {
  title: string;
  onSave: () => void;
}

// Component
export function MyComponent({ title, onSave }: Props) {
  // Hooks
  const { clientes, loading } = useClientes();
  const [value, setValue] = useState('');

  // Handlers
  const handleChange = (e) => {
    setValue(e.target.value);
  };

  // Effects
  useEffect(() => {
    // ...
  }, []);

  // Render helpers
  const renderItem = (item) => {
    return <div>{item.nome}</div>;
  };

  // Early returns
  if (loading) return <LoadingState />;

  // Main render
  return (
    <div>
      <h1>{title}</h1>
      {/* ... */}
    </div>
  );
}
```

### Git Workflow

**Branches**:
- `main`: Produção
- `develop`: Desenvolvimento
- `feature/nome`: Features
- `fix/nome`: Correções

**Commits**:
- Mensagens descritivas
- Prefixos: `feat:`, `fix:`, `refactor:`, `docs:`
- Exemplo: `feat: add CMV calculation to recipes`

---

## 🔧 Manutenção e Troubleshooting

### Logs e Debug

**Frontend**:
- Console.log (desenvolvimento)
- Sentry (produção - futuro)

**Backend**:
- Supabase Dashboard > Logs
- Edge Function logs
- Database logs

### Problemas Comuns

**1. Erro de autenticação**:
- Verificar token JWT
- Limpar localStorage
- Relogin

**2. RLS blocking queries**:
- Verificar políticas RLS
- Confirmar `usuario_id` correto
- Verificar role do usuário

**3. Cálculos incorretos**:
- Verificar conversões de tipo (Number())
- Verificar arredondamentos
- Verificar fórmulas

**4. Performance lenta**:
- Adicionar índices no banco
- Otimizar queries
- Implementar paginação
- Cache com React Query

### Backup e Restauração

**Banco de Dados**:
- Supabase faz backup automático
- Retenção: 7 dias (free tier)
- Restauração via Dashboard

**Código**:
- Git (histórico completo)
- Lovable (commits)

---

## 📚 Recursos Adicionais

### Documentação Técnica

- **React**: https://react.dev
- **TypeScript**: https://www.typescriptlang.org/docs
- **Vite**: https://vitejs.dev
- **Tailwind CSS**: https://tailwindcss.com/docs
- **Shadcn/ui**: https://ui.shadcn.com
- **React Hook Form**: https://react-hook-form.com
- **Zod**: https://zod.dev
- **TanStack Query**: https://tanstack.com/query
- **Supabase**: https://supabase.com/docs
- **Lovable**: https://docs.lovable.dev

### Roadmap Futuro

**Melhorias Planejadas**:
1. **Integrações**:
   - WhatsApp Business API
   - Mercado Pago / Stripe
   - Google Calendar
   - Instagram

2. **Funcionalidades**:
   - App móvel (React Native)
   - Modo offline
   - Relatórios avançados com BI
   - Sistema de fidelidade
   - Programa de indicação
   - Marketplace de receitas

3. **Otimizações**:
   - PWA (Progressive Web App)
   - Push notifications
   - Busca com Elasticsearch
   - CDN para assets

4. **Automações**:
   - Email marketing
   - Lembretes automáticos
   - Geração de pedidos recorrentes
   - Sugestões de compra baseadas em IA

---

## 📞 Suporte

Para dúvidas ou problemas:
1. Verificar esta documentação
2. Consultar logs do sistema
3. Revisar código-fonte
4. Contatar equipe de desenvolvimento

---

**Última atualização**: 15 de novembro de 2025
**Versão do sistema**: 1.0.0
**Autor**: Equipe Donna's Box

---

