# Documentação do Menu Principal - Caixa de Açúcar

## Visão Geral

O sistema **Caixa de Açúcar** é uma solução completa de gestão para confeitarias, organizado em módulos integrados que se comunicam entre si para oferecer uma experiência unificada de gerenciamento do negócio.

---

## Estrutura do Menu Principal

O menu lateral contém **7 módulos principais** + **área administrativa** (exclusiva para administradores):

```
┌─────────────────────────────────────┐
│  Menu Principal                      │
├─────────────────────────────────────┤
│  📊 Dashboard                        │
│  🛍️ Encomendas                       │
│  👤 Clientes                         │
│  🚚 Fornecedores                     │
│  💰 Financeiro                       │
│  🧮 Precificação                     │
│  ⚙️ Configurações                    │
├─────────────────────────────────────┤
│  Administração (apenas admins)      │
│  🛡️ Usuários                         │
│  📄 Logs de Ações                    │
└─────────────────────────────────────┘
```

---

## 1. Dashboard

**Rota:** `/dashboard`

### Descrição
Painel central de controle que apresenta uma visão consolidada do negócio com métricas, indicadores e alertas importantes.

### Funcionalidades
- **Cards de Resumo:** Exibe totais de encomendas, faturamento, clientes e indicadores financeiros
- **Previsão de Faturamento:** Projeção baseada em encomendas confirmadas
- **Projeção de Vendas:** Análise de tendências e metas
- **Alertas:** Aniversariantes do mês (clientes e contatos de fornecedores)
- **Gráficos:** Visualização de dados de vendas e desempenho

### Relações com Outros Módulos
| Módulo | Tipo de Relação |
|--------|-----------------|
| Encomendas | Consulta dados de pedidos para calcular métricas |
| Clientes | Busca aniversariantes e totais de clientes |
| Financeiro | Obtém dados de contas a receber/pagar |
| Planejamento | Integra metas configuradas pelo usuário |

---

## 2. Encomendas

**Rota:** `/encomendas`

### Descrição
Módulo central para gestão de pedidos, desde a criação até a entrega. Controla todo o ciclo de vida das encomendas.

### Funcionalidades
- **Listagem de Encomendas:** Visualização com filtros por status, data, cliente
- **Criação/Edição:** Formulário completo com itens, cliente, valores, descontos
- **Status do Pedido:** Pendente, Confirmado, Em Produção, Pronto, Entregue, Cancelado
- **Itens da Encomenda:** Adiciona produtos/receitas com quantidades e valores
- **Informações de Entrega:** Data, hora, endereço, CEP
- **Pagamentos:** Registro de pagamentos parciais ou totais
- **Tags:** Categorização de encomendas com tags personalizadas
- **Topo de Bolo:** Informações específicas para decorações personalizadas
- **Imagens:** Upload de referências visuais

### Relações com Outros Módulos
| Módulo | Tipo de Relação |
|--------|-----------------|
| Clientes | Vincula cliente à encomenda (autocomplete) |
| Receitas | Seleciona receitas/produtos para itens da encomenda |
| Financeiro | Gera automaticamente contas a receber |
| Precificação | Utiliza valores de venda das receitas |
| Configurações | Usa tags de encomendas configuradas |

### Fluxo de Dados
```
Encomenda Criada
      │
      ├──► Vincula Cliente (tabela clientes)
      │
      ├──► Adiciona Itens (tabela receitas)
      │
      ├──► Registra Pagamentos
      │
      └──► Gera Conta a Receber (tabela contas_receber)
```

---

## 3. Clientes

**Rota:** `/clientes`

### Descrição
Cadastro completo de clientes com informações pessoais, endereço, familiares e histórico de relacionamento.

### Funcionalidades
- **Cadastro Completo:** Nome, telefone, email, CPF/CNPJ, tipo (PF/PJ)
- **Endereço:** CEP com busca automática (ViaCEP), cidade, estado, número
- **Data de Aniversário:** Para alertas e ações de relacionamento
- **Familiares:** Cadastro de familiares com nome, parentesco e aniversário
- **Observações:** Notas sobre preferências e particularidades
- **Histórico:** Total de compras e última compra (atualizado automaticamente)

### Relações com Outros Módulos
| Módulo | Tipo de Relação |
|--------|-----------------|
| Encomendas | Clientes são selecionados ao criar encomendas |
| Financeiro | Clientes aparecem em contas a receber |
| Dashboard | Aniversariantes são exibidos no painel |

### Indicadores no Menu
- **Ícone de Bolo Animado:** Aparece quando há aniversariantes do mês

---

## 4. Fornecedores

**Rota:** `/fornecedores`

### Descrição
Gestão de fornecedores com cadastro de múltiplos contatos por fornecedor.

### Funcionalidades
- **Cadastro de Fornecedor:** Nome, tipo (PF/PJ), CPF/CNPJ, telefone, email
- **Múltiplos Contatos:** Cada fornecedor pode ter vários contatos
- **Dados do Contato:** Nome, cargo, telefone, email, data de aniversário
- **Observações:** Notas sobre cada fornecedor e contato

### Relações com Outros Módulos
| Módulo | Tipo de Relação |
|--------|-----------------|
| Financeiro | Fornecedores vinculados a contas a pagar |
| Dashboard | Aniversariantes de contatos são exibidos |
| Precificação | Fornecedores podem ser associados a ingredientes/embalagens |

### Indicadores no Menu
- **Ícone de Bolo Animado:** Aparece quando há contatos aniversariantes do mês

---

## 5. Financeiro

**Rota:** `/financeiro`

### Descrição
Módulo completo de gestão financeira com controle de receitas, despesas, fluxo de caixa e demonstrativo de resultados.

### Submódulos

#### 5.1 Dashboard Financeiro
- Visão geral das finanças
- Saldo atual por banco
- Resumo de contas a receber e pagar
- Indicadores de saúde financeira

#### 5.2 Contas a Receber (`/financeiro/contas-receber`)
- Registro de receitas previstas e realizadas
- Parcelamento de valores
- Dar baixa em pagamentos
- Controle de juros e descontos
- Upload de comprovantes
- Estorno de pagamentos

#### 5.3 Contas a Pagar (`/financeiro/contas-pagar`)
- Registro de despesas
- Parcelamento
- Pagamentos recorrentes
- Vinculação com fornecedores
- Categorização por plano de contas

#### 5.4 Fluxo de Caixa (`/financeiro/fluxo-caixa`)
- **Diário:** Movimentações dia a dia
- **Mensal:** Consolidação por mês
- Saldo inicial configurável por período
- Projeção de saldo

#### 5.5 DRE - Demonstrativo de Resultados (`/financeiro/dre`)
- Receitas vs Despesas por faixa
- Resultado operacional
- Categorização por plano de contas

### Relações com Outros Módulos
| Módulo | Tipo de Relação |
|--------|-----------------|
| Encomendas | Gera contas a receber automaticamente |
| Clientes | Vinculados às contas a receber |
| Fornecedores | Vinculados às contas a pagar |
| Configurações | Usa bancos, tipos de documentos, plano de contas, juros |

---

## 6. Precificação

**Rota:** `/precificacao`

### Descrição
Módulo para cálculo de custos e formação de preços de receitas, considerando ingredientes, embalagens, mão de obra e custos fixos.

### Submódulos

#### 6.1 Ingredientes (`/precificacao/ingredientes`)
- Cadastro de ingredientes com preço por embalagem
- Unidade de medida e quantidade por embalagem
- Cálculo automático de custo unitário
- Vinculação com tipos de insumos

#### 6.2 Embalagens (`/precificacao/embalagens`)
- Cadastro de embalagens e itens descartáveis
- Preço e quantidade por embalagem
- Categorização por tipo

#### 6.3 Pré-Preparos (`/precificacao/pre-preparos`)
- Receitas base que são ingredientes de outras receitas
- Cálculo de custo total e por unidade
- Lista de ingredientes com quantidades
- Tempo de preparo e mão de obra

#### 6.4 Receitas (`/receitas`)
- **Ficha Técnica Completa:**
  - Ingredientes com quantidades e custos
  - Embalagens utilizadas
  - Mão de obra (perfis e horas)
  - Modo de preparo
  - Imagens da receita
- **Cálculo de Preço:**
  - Custo total de produção
  - Rendimento (quantidade produzida)
  - Custo por unidade
  - Valor de venda sugerido
  - Margem de lucro

### Relações com Outros Módulos
| Módulo | Tipo de Relação |
|--------|-----------------|
| Encomendas | Receitas são selecionadas como itens |
| Configurações | Usa categorias, unidades de medida, tipos de insumos, mão de obra |

### Fluxo de Precificação
```
Tipos de Insumos (Configurações)
         │
         ▼
┌────────┴────────┐
│                 │
▼                 ▼
Ingredientes    Embalagens
│                 │
└────────┬────────┘
         │
         ▼
    Pré-Preparos
         │
         ▼
      Receitas ◄── Mão de Obra (Perfis)
         │
         ▼
   Valor de Venda
         │
         ▼
     Encomendas
```

---

## 7. Configurações

**Rota:** `/configuracoes`

### Descrição
Central de configurações do sistema, dividida em três grandes áreas.

### Submódulos

#### 7.1 Cadastros Base (`/configuracoes/cadastros-base`)
Configurações básicas para funcionamento do sistema:

- **Tipos de Insumos:** Ingredientes, embalagens e outros
- **Unidades de Medida:** kg, g, ml, L, unidade, etc.

#### 7.2 Precificação (`/configuracoes/precificacao`)
Configurações relacionadas ao cálculo de custos:

- **Mão de Obra:** Perfis de trabalho com valor/hora
- **Categorias de Receitas:** Organização das receitas

#### 7.3 Financeiro (`/configuracoes/financeiro`)
Configurações do módulo financeiro:

- **Bancos:** Contas bancárias e carteiras
- **Tipos de Documentos:** NF, Boleto, PIX, Cartão, etc.
- **Categorias do Plano de Contas:** Agrupamento de contas
- **Plano de Contas:** Contas contábeis para classificação
- **Juros e Multas:** Configuração de cobrança de atraso

#### 7.4 Tags de Encomendas (`/configuracoes/tags-encomendas`)
- Criação de tags personalizadas com cores
- Organização e categorização de encomendas

### Relações com Outros Módulos
| Configuração | Módulos que Utilizam |
|--------------|----------------------|
| Tipos de Insumos | Precificação (Ingredientes, Embalagens) |
| Unidades de Medida | Precificação, Receitas |
| Mão de Obra | Receitas, Pré-Preparos |
| Categorias de Receitas | Receitas |
| Bancos | Financeiro (todos) |
| Tipos de Documentos | Contas a Receber/Pagar |
| Plano de Contas | Financeiro, DRE |
| Juros e Multas | Contas a Receber |
| Tags | Encomendas |

---

## Área Administrativa (Apenas Admins)

### Usuários (`/admin/usuarios`)
- Listagem de todos os usuários do sistema
- Criação de novos usuários
- Edição de dados
- Ativação/desativação
- Atribuição de roles (admin/user)

### Logs de Ações (`/admin/logs`)
- Registro de ações administrativas
- Auditoria de alterações em usuários
- Histórico com data, admin responsável e detalhes

---

## Diagrama de Relacionamentos

```
                    ┌─────────────────┐
                    │   DASHBOARD     │
                    │  (Visão Geral)  │
                    └────────┬────────┘
                             │
         ┌───────────────────┼───────────────────┐
         │                   │                   │
         ▼                   ▼                   ▼
┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐
│   ENCOMENDAS    │ │    CLIENTES     │ │  FORNECEDORES   │
│   (Pedidos)     │ │  (Compradores)  │ │  (Insumos)      │
└────────┬────────┘ └────────┬────────┘ └────────┬────────┘
         │                   │                   │
         │         ┌─────────┴─────────┐         │
         │         │                   │         │
         ▼         ▼                   ▼         ▼
    ┌─────────────────────────────────────────────────┐
    │                  FINANCEIRO                      │
    │  ┌───────────┐  ┌───────────┐  ┌───────────┐    │
    │  │ Contas a  │  │  Fluxo    │  │    DRE    │    │
    │  │ Receber   │  │  Caixa    │  │           │    │
    │  └───────────┘  └───────────┘  └───────────┘    │
    │  ┌───────────┐                                  │
    │  │ Contas a  │                                  │
    │  │  Pagar    │                                  │
    │  └───────────┘                                  │
    └─────────────────────────────────────────────────┘
         ▲                                       ▲
         │                                       │
         │         ┌─────────────────┐           │
         └─────────┤  PRECIFICAÇÃO   ├───────────┘
                   │  ┌───────────┐  │
                   │  │Ingrediente│  │
                   │  └───────────┘  │
                   │  ┌───────────┐  │
                   │  │Embalagens │  │
                   │  └───────────┘  │
                   │  ┌───────────┐  │
                   │  │Pré-Preparo│  │
                   │  └───────────┘  │
                   │  ┌───────────┐  │
                   │  │ Receitas  │  │
                   │  └───────────┘  │
                   └────────┬────────┘
                            │
                            ▼
                   ┌─────────────────┐
                   │ CONFIGURAÇÕES   │
                   │ ┌─────────────┐ │
                   │ │Cadastros    │ │
                   │ │Base         │ │
                   │ └─────────────┘ │
                   │ ┌─────────────┐ │
                   │ │Precificação │ │
                   │ └─────────────┘ │
                   │ ┌─────────────┐ │
                   │ │Financeiro   │ │
                   │ └─────────────┘ │
                   └─────────────────┘
```

---

## Fluxo Típico de Uso

### 1. Configuração Inicial
```
1. Configurações > Cadastros Base
   └── Criar Tipos de Insumos
   └── Configurar Unidades de Medida

2. Configurações > Precificação
   └── Cadastrar Perfis de Mão de Obra
   └── Criar Categorias de Receitas

3. Configurações > Financeiro
   └── Cadastrar Bancos
   └── Configurar Tipos de Documentos
   └── Criar Plano de Contas
```

### 2. Cadastro de Dados Mestres
```
1. Precificação > Ingredientes
   └── Cadastrar todos os ingredientes

2. Precificação > Embalagens
   └── Cadastrar embalagens

3. Clientes
   └── Cadastrar clientes

4. Fornecedores
   └── Cadastrar fornecedores e contatos
```

### 3. Criação de Receitas
```
1. Precificação > Pré-Preparos (se necessário)
   └── Criar bases como ganache, recheios

2. Receitas
   └── Criar receitas com ingredientes
   └── Adicionar embalagens
   └── Configurar mão de obra
   └── Definir valor de venda
```

### 4. Operação Diária
```
1. Encomendas
   └── Receber pedido
   └── Selecionar cliente
   └── Adicionar itens (receitas)
   └── Registrar pagamentos

2. Financeiro
   └── Acompanhar contas a receber
   └── Registrar contas a pagar
   └── Monitorar fluxo de caixa

3. Dashboard
   └── Acompanhar indicadores
   └── Verificar aniversariantes
```

---

## Recursos Especiais

### Aniversariantes
O sistema monitora automaticamente:
- **Clientes:** Data de aniversário do cadastro
- **Familiares de Clientes:** Cadastrados como familiares
- **Contatos de Fornecedores:** Data de aniversário dos contatos

Quando há aniversariantes no mês corrente, um ícone animado de bolo aparece no menu ao lado do respectivo item.

### Integração Automática Encomendas → Financeiro
Ao criar uma encomenda com valor, o sistema pode gerar automaticamente uma conta a receber vinculada, facilitando o controle financeiro.

### Tags de Encomendas
Sistema flexível de tags com cores personalizadas para categorizar encomendas de acordo com a necessidade do negócio (ex: "Urgente", "Delivery", "Retirada", "Casamento").

---

## Segurança e Controle de Acesso

- **Row Level Security (RLS):** Cada usuário só visualiza seus próprios dados
- **Roles:** 
  - `user`: Acesso ao sistema completo, exceto administração
  - `admin`: Acesso total, incluindo gestão de usuários e logs
- **Autenticação:** Via email/senha com opção de recuperação

---

## Considerações Técnicas

### Stack Tecnológica
- **Frontend:** React + TypeScript + Vite
- **UI:** Tailwind CSS + Shadcn/ui
- **Estado:** TanStack React Query
- **Backend:** Supabase (PostgreSQL + Auth + Storage)
- **Roteamento:** React Router DOM

### Principais Tabelas do Banco
| Tabela | Módulo Principal |
|--------|------------------|
| `encomendas` | Encomendas |
| `encomenda_itens` | Encomendas |
| `clientes` | Clientes |
| `cliente_familiares` | Clientes |
| `fornecedores` | Fornecedores |
| `fornecedor_contatos` | Fornecedores |
| `contas_receber` | Financeiro |
| `contas_pagar` | Financeiro |
| `receitas` | Receitas |
| `ingredientes` | Precificação |
| `embalagens` | Precificação |
| `pre_preparos` | Precificação |
| `bancos` | Configurações |
| `plano_contas` | Configurações |
| `profiles` | Sistema/Auth |

---

*Documento gerado em: Dezembro/2024*
*Sistema: Caixa de Açúcar - Gestão para Confeitarias*
