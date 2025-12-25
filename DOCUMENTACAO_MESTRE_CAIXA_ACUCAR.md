# 📘 DOCUMENTAÇÃO MESTRE - CAIXA DE AÇÚCAR

**Sistema de Gestão para Confeitarias**  
**Versão:** 1.0 (Dezembro 2025)  
**Stack:** React 18 + TypeScript + Vite + Tailwind CSS + Supabase (Lovable Cloud)

---

## BLOCO 1: VISÃO GERAL DO SISTEMA

### 1.1 O que é o Caixa de Açúcar?

O **Caixa de Açúcar** é um sistema web de gestão completo desenvolvido especificamente para confeitarias, docerias e profissionais do ramo de confeitaria. Ele resolve os principais desafios operacionais e financeiros do negócio.

### 1.2 Para quem é?

- **Confeiteiras/Confeiteiros** individuais
- **Micro e pequenas docerias**
- **Ateliers de doces e bolos**
- **Profissionais autônomos** do segmento de confeitaria

### 1.3 Proposta de Valor

| Problema | Solução Caixa de Açúcar |
|----------|-------------------------|
| Precificação incorreta | Ficha técnica automatizada com cálculo de CMV, mão de obra e margem |
| Descontrole de encomendas | Gestão completa do ciclo de pedidos com calendário visual |
| Fluxo de caixa confuso | Contas a pagar/receber, fluxo de caixa diário/mensal, DRE |
| Perda de clientes | Cadastro com aniversários, familiares e alertas automáticos |
| Falta de visão estratégica | Dashboard com indicadores, gráficos e projeções |

### 1.4 Diferenciais

- **Multi-tenant**: Cada usuário tem seus dados isolados via RLS (Row Level Security)
- **Precificação técnica**: Cálculo baseado em fichas técnicas reais
- **Integração automática**: Encomenda → Conta a Receber (sem digitação dupla)
- **Alertas de aniversário**: Clientes, familiares e contatos de fornecedores
- **Responsivo**: Funciona em desktop, tablet e mobile

---

## BLOCO 2: MAPA DE MÓDULOS E PÁGINAS

### 2.1 Menu Principal (Sidebar)

```
📊 Dashboard (/dashboard)
📦 Encomendas (/encomendas)
👤 Clientes (/clientes)
🚚 Fornecedores (/fornecedores)
💰 Financeiro (/financeiro) ──┬── Dashboard Financeiro
                              ├── Contas a Receber
                              ├── Contas a Pagar
                              ├── Fluxo de Caixa (Diário/Mensal)
                              └── DRE
🧮 Precificação (/precificacao) ──┬── Ingredientes
                                  ├── Embalagens
                                  ├── Pré-Preparos
                                  └── Ficha Técnica
⚙️ Configurações (/configuracoes) ──┬── Cadastros Base
                                    ├── Precificação (Mão de Obra)
                                    ├── Financeiro
                                    └── Tags de Encomendas

🔐 Administração (apenas admins):
   ├── Usuários (/admin/usuarios)
   └── Logs (/admin/logs)
```

### 2.2 Rotas Completas

| Rota | Componente | Descrição |
|------|------------|-----------|
| `/` | Redirect | Redireciona para `/dashboard` |
| `/auth/login` | Login | Tela de autenticação |
| `/auth/signup` | SignUp | Cadastro de novo usuário |
| `/auth/forgot-password` | ForgotPassword | Recuperação de senha |
| `/dashboard` | Dashboard | Painel principal |
| `/encomendas` | Encomendas | Gestão de encomendas |
| `/clientes` | Clientes | Cadastro de clientes |
| `/fornecedores` | Fornecedores | Cadastro de fornecedores |
| `/financeiro` | Financeiro | Hub financeiro |
| `/financeiro/dashboard` | DashboardFinanceiro | Dashboard financeiro |
| `/financeiro/contas-receber` | ContasReceber | Listagem de contas a receber |
| `/financeiro/contas-receber/nova` | ContasReceberForm | Nova conta a receber |
| `/financeiro/contas-receber/editar/:id` | ContasReceberForm | Editar conta a receber |
| `/financeiro/contas-receber/detalhes/:id` | ContasReceberDetalhes | Detalhes com parcelas e pagamentos |
| `/financeiro/contas-pagar` | ContasPagar | Listagem de contas a pagar |
| `/financeiro/contas-pagar/nova` | ContasPagarForm | Nova conta a pagar |
| `/financeiro/contas-pagar/editar/:id` | ContasPagarForm | Editar conta a pagar |
| `/financeiro/contas-pagar/detalhes/:id` | ContasPagarDetalhes | Detalhes com parcelas e pagamentos |
| `/financeiro/fluxo-caixa` | FluxoCaixaHub | Hub do fluxo de caixa |
| `/financeiro/fluxo-caixa/diario` | FluxoCaixaDiario | Fluxo de caixa diário |
| `/financeiro/fluxo-caixa/mensal` | FluxoCaixaMensal | Fluxo de caixa mensal |
| `/financeiro/dre` | DRE | Demonstrativo de Resultados |
| `/precificacao` | Precificacao | Hub de precificação |
| `/precificacao/ingredientes` | Ingredientes | Cadastro de ingredientes |
| `/precificacao/embalagens` | Embalagens | Cadastro de embalagens |
| `/precificacao/pre-preparos` | PrePreparos | Listagem de pré-preparos |
| `/precificacao/pre-preparos/novo` | PrePreparoForm | Novo pré-preparo |
| `/precificacao/pre-preparos/:id` | PrePreparoForm | Editar pré-preparo |
| `/precificacao/ficha-tecnica` | Receitas | Listagem de receitas |
| `/precificacao/ficha-tecnica/nova` | ReceitaForm | Nova receita |
| `/precificacao/ficha-tecnica/editar/:id` | ReceitaForm | Editar receita |
| `/configuracoes` | Configuracoes | Hub de configurações |
| `/configuracoes/cadastros-base` | CadastrosBase | Configurações básicas |
| `/configuracoes/precificacao` | PrecificacaoPage | Config. de precificação |
| `/configuracoes/precificacao/mao-de-obra` | MaoDeObra | Perfis de mão de obra |
| `/configuracoes/financeiro` | FinanceiroPage | Config. financeiras |
| `/configuracoes/tipos-insumos` | TiposInsumos | Tipos de insumos |
| `/configuracoes/categorias-plano-contas` | CategoriasPlanoContas | Categorias DRE |
| `/configuracoes/plano-contas` | PlanoContas | Plano de contas |
| `/configuracoes/bancos` | Bancos | Configuração de bancos |
| `/configuracoes/tipos-documentos` | TiposDocumentos | Tipos de documentos |
| `/configuracoes/juros` | ConfiguracaoJuros | Configuração de juros |
| `/configuracoes/tags-encomendas` | TagsEncomendas | Tags personalizadas |
| `/configuracoes/dados-confeitaria` | SeusDados | Dados do usuário |
| `/configuracoes/categorias-receitas` | Categorias | Categorias de receitas |
| `/configuracoes/unidades-medida` | UnidadesMedida | Unidades de medida |
| `/admin/usuarios` | Usuarios | Gestão de usuários (admin) |
| `/admin/logs` | LogsAdmin | Logs de auditoria (admin) |

---

## BLOCO 3: DETALHAMENTO DOS MÓDULOS

### 3.1 DASHBOARD (`/dashboard`)

**Objetivo:** Fornecer visão consolidada do negócio.

**Componentes principais:**
- Calendário de entregas (3 meses: anterior, atual, seguinte)
- Cards de indicadores financeiros (saldo, a receber, a pagar)
- Gráficos de visão econômica (mensal/anual)
- Top 5 produtos mais vendidos
- Alertas de inadimplência

**Entradas:**
- Mês/Ano selecionado

**Saídas visuais:**
- Encomendas do dia selecionado
- Receitas vs Custos vs Lucro
- Ticket médio mensal/anual

**Estados:**
- **Vazio:** "Nenhuma encomenda para este mês"
- **Carregando:** LoadingMascote animado
- **Erro:** Toast com mensagem de erro

**Realtime:** Sim - atualiza automaticamente via Supabase Realtime.

---

### 3.2 ENCOMENDAS (`/encomendas`)

**Objetivo:** Gerenciar o ciclo completo de pedidos.

**Status disponíveis:**
| Status | Cor | Descrição |
|--------|-----|-----------|
| pendente | Amarelo | Aguardando confirmação |
| confirmado | Azul | Cliente confirmou |
| em_producao | Roxo | Em produção |
| pronto | Verde | Pronto para entrega |
| entregue | Cinza | Entregue ao cliente |
| cancelado | Vermelho | Cancelado |

**Entradas do formulário:**
| Campo | Tipo | Obrigatório | Validação |
|-------|------|-------------|-----------|
| cliente | string | Sim | min 1, max 100 caracteres |
| data_pedido | date | Sim | Formato YYYY-MM-DD |
| data_entrega | date | Não | Formato YYYY-MM-DD |
| hora_entrega | time | Não | - |
| status | enum | Sim | Um dos 6 status |
| valor | number | Sim | > 0, max 999999.99 |
| telefone | string | Não | max 20 caracteres |
| endereco | text | Não | max 200 caracteres |
| cep | string | Não | 8 dígitos |
| observacoes | text | Não | max 1000 caracteres |
| desconto_percentual | number | Não | 0-100 |
| desconto_valor | number | Não | >= 0 |
| taxa_entrega | number | Não | >= 0 |
| topo_bolo | number | Não | >= 0 |
| outros | number | Não | >= 0 |

**Produtos da encomenda (encomenda_itens):**
| Campo | Tipo | Obrigatório |
|-------|------|-------------|
| receita_id | string | Sim |
| produto | string | Sim |
| quantidade | number | Sim |
| unidade_medida | string | Sim |
| valor_unitario | number | Sim |
| subtotal | number | Calculado |

**Regras de negócio:**
1. Ao salvar encomenda, deve configurar pagamento (cria conta_receber)
2. Valor final = soma_produtos - descontos + taxa_entrega + topo_bolo + outros
3. Tags podem ser associadas à encomenda
4. Imagens de topo de bolo podem ser enviadas ao Storage

**Integrações:**
- `contas_receber`: Vincula encomenda ao financeiro
- `encomendas_tags`: Tags da encomenda
- `encomenda_itens`: Produtos da encomenda

**Estados:**
- **Vazio:** EmptyState "Nenhuma encomenda encontrada"
- **Carregando:** LoadingState
- **Erro:** Toast de erro
- **Sucesso:** Toast "Encomenda salva!"

---

### 3.3 CLIENTES (`/clientes`)

**Objetivo:** Cadastro de clientes com gestão de aniversários.

**Campos principais:**
| Campo | Tipo | Obrigatório |
|-------|------|-------------|
| nome | varchar | Sim |
| tipo | varchar | Não (PF/PJ) |
| cpf_cnpj | varchar | Não |
| telefone | varchar | Não |
| email | varchar | Não |
| data_aniversario | date | Não |
| endereco | text | Não |
| numero | varchar | Não |
| cidade | varchar | Não |
| estado | varchar | Não |
| cep | varchar | Não |
| observacoes | text | Não |

**Funcionalidades:**
- Cadastro de familiares com datas de aniversário
- Indicadores: total_compras, quantidade_pedidos, ultima_compra
- Alerta visual de aniversariantes do mês (ícone de bolo no sidebar)

**Tabela relacionada:** `cliente_familiares`

---

### 3.4 FORNECEDORES (`/fornecedores`)

**Objetivo:** Cadastro de fornecedores e contatos.

**Campos principais:**
| Campo | Tipo | Obrigatório |
|-------|------|-------------|
| nome | varchar | Sim |
| tipo | varchar | Não (PF/PJ) |
| cpf_cnpj | varchar | Não |
| telefone | varchar | Não |
| email | varchar | Não |
| observacoes | text | Não |

**Tabela relacionada:** `fornecedor_contatos`
- Contatos do fornecedor com cargo, telefone, email, data_aniversario
- Alerta visual de aniversariantes (ícone de bolo no sidebar)

---

### 3.5 FINANCEIRO (`/financeiro`)

**Objetivo:** Controle financeiro completo.

#### 3.5.1 Hub Financeiro
- Banner com: Saldo Anterior + Entradas - Saídas = Saldo Atual
- Cards por banco habilitado
- Configuração de saldos iniciais
- Dashboard com resumo e inadimplência

#### 3.5.2 Contas a Receber
**Fluxo:**
1. Criar conta a receber (manual ou via encomenda)
2. Sistema gera parcelas automaticamente
3. Dar baixa em parcelas (registrar pagamentos)
4. Anexar comprovantes

**Campos da conta:**
| Campo | Tipo | Obrigatório |
|-------|------|-------------|
| descricao | varchar | Sim |
| cliente_id | uuid | Não |
| cliente_nome | varchar | Não |
| valor | numeric | Sim |
| data_vencimento | date | Sim |
| numero_parcelas | integer | Sim (default 1) |
| banco_id | uuid | Sim |
| plano_conta_id | uuid | Não |
| tipo_documento_id | uuid | Não |
| tipo_lancamento | varchar | Sim (unico/parcelado/recorrente) |

**Status das parcelas:**
| Status | Descrição |
|--------|-----------|
| aberto | Aguardando pagamento |
| atrasado | Vencido sem pagamento |
| pagamento_parcial | Parcialmente pago |
| pago | Pago integralmente |
| pago_em_atraso | Pago após vencimento |
| adiantado | Pago antes do vencimento |

**Tabelas relacionadas:**
- `contas_receber_parcelas`
- `contas_receber_pagamentos`
- `contas_receber_comprovantes`

#### 3.5.3 Contas a Pagar
Similar ao Contas a Receber, porém:
- Vincula a `fornecedor_id` em vez de cliente
- Representa saídas de caixa

**Tabelas relacionadas:**
- `contas_pagar_parcelas`
- `contas_pagar_pagamentos`
- `contas_pagar_comprovantes`

#### 3.5.4 Fluxo de Caixa
- **Diário:** Movimentações dia a dia
- **Mensal:** Consolidado por mês

#### 3.5.5 DRE (Demonstrativo de Resultados)
Baseado em:
- Categorias do Plano de Contas
- Faixas: Receitas, Deduções, CMV, Custos Fixos, Custos Variáveis, etc.
- Indicadores: Receita Bruta, Líquida, Margem Bruta, Lucro Operacional

---

### 3.6 PRECIFICAÇÃO (`/precificacao`)

**Objetivo:** Calcular custos e definir preços de venda.

#### 3.6.1 Ingredientes
| Campo | Tipo |
|-------|------|
| tipo_insumo_id | uuid (FK) |
| marca | varchar |
| preco | numeric |
| categoria | text |
| e_pre_preparo | boolean |

#### 3.6.2 Embalagens
| Campo | Tipo |
|-------|------|
| tipo_insumo_id | uuid (FK) |
| marca | varchar |
| preco | numeric |

#### 3.6.3 Tipos de Insumos
- Descrição do produto (ex: "Farinha de Trigo 1kg")
- Quantidade da embalagem
- Unidade de medida
- Categoria (Ingrediente/Embalagem/Outro)

#### 3.6.4 Pré-Preparos
Preparos intermediários que viram "ingredientes virtuais" para receitas.

| Campo | Tipo |
|-------|------|
| nome | varchar |
| tempo_preparo | numeric |
| tempo_preparo_unidade | varchar |
| rendimento_quantidade | numeric |
| rendimento_unidade_id | uuid |
| custo_total | numeric (calculado) |
| custo_por_unidade | numeric (calculado) |
| modo_preparo | text |

**Tabelas relacionadas:**
- `pre_preparos_ingredientes`
- `pre_preparos_mao_obra`

#### 3.6.5 Ficha Técnica (Receitas)
**Campos principais:**
| Campo | Tipo |
|-------|------|
| nome | varchar |
| categoria | varchar |
| tipo | varchar (produto_avulso/produto_combo) |
| cardapio | varchar (ativo/fora) |
| rendimento | numeric |
| unidade_rendimento | varchar |
| tempo_preparo | numeric |
| unidade_tempo | varchar |
| custo_total | numeric (calculado) |
| valor_venda | numeric |
| modo_preparo | text |

**Composição de custos:**
1. **Custo de Ingredientes** - soma dos ingredientes utilizados
2. **Custo de Embalagens** - soma das embalagens
3. **Custo de Mão de Obra** - horas × valor_hora do perfil
4. **Outros Custos** - custos fixos rateados
5. **Despesas de Venda** - percentual sobre valor de venda

**Indicadores calculados:**
- CMV Real (%)
- Margem de Lucro (%)
- Alertas: Prejuízo, CMV Muito Alto, CMV em Atenção, Margem Baixa, CMV Excelente

**Tabelas relacionadas:**
- `receitas_ingredientes`
- `receitas_embalagens`
- `receitas_mao_obra`
- `receitas_despesas_venda`
- `receitas_imagens`

---

### 3.7 CONFIGURAÇÕES (`/configuracoes`)

#### 3.7.1 Cadastros Base
- Unidades de Medida
- Categorias de Receitas
- Tipos de Insumos

#### 3.7.2 Precificação
- **Mão de Obra:** Perfis com nome e valor_hora
- Perfil padrão para novas receitas

#### 3.7.3 Financeiro
- **Bancos:** Lista de bancos (oficiais + customizados), habilitar/desabilitar
- **Tipos de Documentos:** Boleto, PIX, Cartão, etc.
- **Categorias Plano de Contas:** Agrupamento para DRE
- **Plano de Contas:** Contas analíticas para lançamentos
- **Configuração de Juros:** Taxa de juros por atraso, multa

#### 3.7.4 Tags de Encomendas
- Tags personalizadas com nome, cor e descrição
- Tags padrão do sistema (Aniversário, Casamento, etc.)

#### 3.7.5 Dados da Confeitaria
- Perfil do usuário (nome, logo, endereço, contato)
- Metas de faturamento mensal/anual
- Configurações de alerta CMV

---

### 3.8 ADMINISTRAÇÃO (Admin Only)

#### 3.8.1 Gestão de Usuários
- Listar todos os usuários
- Ativar/Desativar usuários
- Alterar roles (user/admin)
- Resetar senhas
- Criar novos usuários

#### 3.8.2 Logs de Auditoria
- Registro de ações administrativas
- Quem fez, quando, o que alterou

---

## BLOCO 4: MODELO DE DADOS

### 4.1 Diagrama Simplificado

```
┌─────────────────┐     ┌─────────────────┐
│   auth.users    │────▶│    profiles     │
└─────────────────┘     └─────────────────┘
         │                      │
         │              ┌───────┴───────┐
         │              ▼               ▼
         │     ┌─────────────┐  ┌─────────────┐
         │     │  clientes   │  │fornecedores │
         │     └─────────────┘  └─────────────┘
         │            │                │
         │     ┌──────┴──────┐  ┌──────┴──────┐
         │     ▼             │  ▼             │
         │ cliente_familiares│ fornecedor_   │
         │                   │   contatos    │
         │                   └───────────────┘
         │
         ├──────────────────────────────────┐
         ▼                                  ▼
┌─────────────────┐              ┌─────────────────┐
│   encomendas    │◀────────────▶│ contas_receber  │
└─────────────────┘              └─────────────────┘
         │                                │
         │                         ┌──────┴──────┐
         │                         ▼             ▼
┌─────────────────┐         parcelas      pagamentos
│ encomenda_itens │              │             │
└─────────────────┘              └──────┬──────┘
                                        ▼
                                  comprovantes

┌─────────────────┐
│ tipos_insumos   │
└─────────────────┘
         │
    ┌────┴────┐
    ▼         ▼
ingredientes embalagens
    │         │
    └────┬────┘
         ▼
┌─────────────────┐
│   pre_preparos  │◀── pre_preparos_ingredientes
└─────────────────┘◀── pre_preparos_mao_obra

┌─────────────────┐
│    receitas     │
└─────────────────┘
         │
    ┌────┼────┬────┬────┐
    ▼    ▼    ▼    ▼    ▼
 ingredientes embalagens mao_obra despesas_venda imagens
```

### 4.2 Tabelas Principais

#### profiles
```sql
id UUID PK (= auth.users.id)
email VARCHAR NOT NULL
nome_completo VARCHAR
nome_confeitaria VARCHAR
telefone VARCHAR
whatsapp VARCHAR
instagram VARCHAR
cep VARCHAR
endereco VARCHAR
numero VARCHAR
bairro VARCHAR
cidade VARCHAR
estado VARCHAR
cpf VARCHAR
razao_social VARCHAR
inscricao_estadual VARCHAR
logo_url TEXT
avatar_url TEXT
valor_hora NUMERIC
custo_fixo_mensal NUMERIC
dias_trabalho_mes INTEGER
horas_diaria_trabalho INTEGER
meta_faturamento_mensal NUMERIC
meta_faturamento_anual NUMERIC
alerta_cmv INTEGER
ativo BOOLEAN DEFAULT true
primeiro_acesso BOOLEAN DEFAULT true
last_login TIMESTAMP
created_at TIMESTAMP
updated_at TIMESTAMP
```

#### user_roles
```sql
id UUID PK
user_id UUID FK (auth.users) UNIQUE
role app_role ('admin', 'user') NOT NULL
```

#### encomendas
```sql
id UUID PK
usuario_id UUID FK NOT NULL
cliente VARCHAR NOT NULL
data_pedido DATE NOT NULL
data_entrega DATE
hora_entrega TIME
status VARCHAR DEFAULT 'pendente'
valor NUMERIC NOT NULL
telefone VARCHAR
endereco TEXT
numero VARCHAR
cep VARCHAR
observacoes TEXT
observacoes_cliente TEXT
observacoes_internas TEXT
desconto_percentual NUMERIC DEFAULT 0
desconto_valor NUMERIC DEFAULT 0
taxa_entrega NUMERIC DEFAULT 0
topo_bolo NUMERIC DEFAULT 0
outros NUMERIC DEFAULT 0
topo_tema TEXT
topo_aniversariante TEXT
topo_idade TEXT
topo_obs TEXT
topo_imagens JSONB DEFAULT '[]'
pagamentos JSONB DEFAULT '[]'
saldo_restante NUMERIC DEFAULT 0
conta_receber_id UUID FK
created_at TIMESTAMP
updated_at TIMESTAMP

INDEX: usuario_id, status, data_entrega
RLS: usuario_id = auth.uid()
```

#### contas_receber
```sql
id UUID PK
usuario_id UUID FK NOT NULL
descricao VARCHAR NOT NULL
cliente_id UUID FK
cliente_nome VARCHAR
cliente_documento VARCHAR
valor NUMERIC NOT NULL
data_vencimento DATE NOT NULL
data_emissao DATE
numero_documento VARCHAR
banco_id UUID FK NOT NULL
plano_conta_id UUID FK
categoria_id UUID FK
tipo_documento_id UUID FK
tipo_lancamento VARCHAR DEFAULT 'unico'
numero_parcelas INTEGER DEFAULT 1
e_recorrente BOOLEAN DEFAULT false
dia_vencimento_recorrente INTEGER
status VARCHAR DEFAULT 'aberto'
observacoes TEXT
created_at TIMESTAMP
updated_at TIMESTAMP

RLS: usuario_id = auth.uid()
```

#### contas_receber_parcelas
```sql
id UUID PK
conta_receber_id UUID FK NOT NULL
numero_parcela INTEGER NOT NULL
data_vencimento DATE NOT NULL
data_emissao DATE DEFAULT CURRENT_DATE
valor_parcela NUMERIC NOT NULL
valor_total NUMERIC DEFAULT 0
valor_pago NUMERIC DEFAULT 0
juros NUMERIC DEFAULT 0
desconto NUMERIC DEFAULT 0
data_pagamento DATE
data_recebimento DATE
status VARCHAR DEFAULT 'aberto'
observacao TEXT
observacao_interna TEXT
tags TEXT[]
created_at TIMESTAMP
updated_at TIMESTAMP

RLS: via conta_receber_id → usuario_id
```

#### receitas
```sql
id UUID PK
usuario_id UUID FK NOT NULL
nome VARCHAR NOT NULL
categoria VARCHAR
tipo VARCHAR ('produto_avulso', 'produto_combo')
cardapio VARCHAR DEFAULT 'ativo'
rendimento NUMERIC NOT NULL
unidade_rendimento VARCHAR NOT NULL
tempo_preparo NUMERIC NOT NULL
unidade_tempo VARCHAR NOT NULL
custo_total NUMERIC DEFAULT 0
valor_venda NUMERIC
modo_preparo TEXT
created_at TIMESTAMP
updated_at TIMESTAMP

RLS: usuario_id = auth.uid()
```

#### tipos_insumos
```sql
id UUID PK
usuario_id UUID FK NOT NULL
descricao VARCHAR NOT NULL
categoria VARCHAR NOT NULL ('Ingrediente', 'Embalagem', 'Outro')
quantidade_embalagem NUMERIC NOT NULL
unidade_medida_id UUID FK
pre_preparo_id UUID FK
ativo BOOLEAN DEFAULT true
created_at TIMESTAMP
updated_at TIMESTAMP

RLS: usuario_id = auth.uid()
```

### 4.3 Views Importantes

- `vw_resumo_financeiro`: Saldo por banco (inicial + entradas - saídas)
- `vw_contas_receber_parcelas`: Parcelas com dados da conta pai
- `vw_contas_receber_dashboard`: Totais de recebíveis
- `v_aniversariantes_completa`: União de clientes + familiares
- `v_aniversariantes_fornecedores`: Contatos de fornecedores

### 4.4 Functions de Banco

| Function | Descrição |
|----------|-----------|
| `has_role(uuid, app_role)` | Verifica se usuário tem role |
| `is_admin(uuid)` | Verifica se é admin |
| `calcular_custo_pre_preparo(uuid)` | Recalcula custo do pré-preparo |
| `calcular_juros_com_config(...)` | Calcula juros baseado na config do usuário |
| `criar_categorias_plano_padrao(uuid)` | Cria categorias padrão para novo usuário |
| `criar_planos_contas_padrao(uuid)` | Cria plano de contas padrão |
| `criar_bancos_oficiais_usuario(uuid)` | Cria lista de bancos oficiais |
| `criar_tags_padrao_encomendas(uuid)` | Cria tags padrão de encomendas |
| `atualizar_parcela_apos_pagamento()` | Trigger para atualizar status |
| `get_todos_aniversariantes(uuid)` | Retorna todos os aniversariantes |

---

## BLOCO 5: FLUXOS PRINCIPAIS

### 5.1 Fluxo de Cadastro de Usuário

```
1. Usuário acessa /auth/signup
2. Preenche: email, senha, nome, nome_confeitaria
3. Supabase Auth cria usuário
4. Trigger cria:
   - profile (dados do usuário)
   - user_roles (role 'user')
   - categorias padrão
   - categorias_plano_contas padrão
   - plano_contas padrão
   - bancos oficiais
   - tags_encomendas padrão
5. Usuário é redirecionado para /dashboard
6. Se primeiro_acesso = true, redireciona para /configuracoes/dados-confeitaria
```

### 5.2 Fluxo de Criação de Encomenda

```
1. Usuário acessa /encomendas
2. Clica em "Nova Encomenda"
3. Seleciona ou cria cliente (autocomplete)
4. Adiciona produtos (receitas do cadastro)
5. Sistema calcula:
   - Subtotal de produtos
   - Descontos
   - Taxas adicionais
   - Valor final
6. Usuário configura pagamento (abre modal de conta_receber)
7. Escolhe: banco, parcelas, vencimentos
8. Ao salvar:
   - Cria encomenda
   - Cria conta_receber vinculada
   - Cria parcelas automaticamente
   - Vincula tags selecionadas
9. Encomenda aparece no calendário do Dashboard
```

### 5.3 Fluxo de Precificação (Ficha Técnica)

```
1. Pré-requisitos:
   - Ingredientes cadastrados
   - Embalagens cadastradas
   - Perfis de mão de obra configurados
   
2. Criar nova receita:
   a) Informações básicas (nome, categoria, tipo, rendimento)
   b) Adicionar ingredientes (busca por nome, define quantidade)
   c) Adicionar embalagens
   d) Configurar mão de obra (perfil + horas)
   e) Adicionar outros gastos (custos fixos)
   f) Adicionar despesas de venda (% sobre preço)
   g) Definir preço de venda
   h) Adicionar modo de preparo
   i) Upload de imagens

3. Sistema calcula em tempo real:
   - Custo ingredientes = Σ(qtd_utilizada × custo_unitario)
   - Custo embalagens = Σ(qtd_utilizada × custo_unitario)
   - Custo mão de obra = Σ(horas × valor_hora)
   - Outros custos = valores fixos
   - Despesas venda = Σ(valor_venda × percentual)
   - Custo Total = soma de tudo
   - CMV % = (custo_ingredientes + custo_embalagens) / valor_venda × 100
   - Margem % = (valor_venda - custo_total) / valor_venda × 100

4. Alertas automáticos:
   - Prejuízo: margem < 0
   - CMV Muito Alto: CMV > 55%
   - CMV em Atenção: CMV 45-55%
   - Margem Baixa: margem < 15%
   - CMV Aceitável: CMV 35-45%
   - CMV Excelente: CMV < 35%
```

### 5.4 Fluxo Financeiro (Conta a Receber)

```
1. Conta criada (manual ou via encomenda)
2. Parcelas geradas automaticamente
3. No vencimento, status muda para 'atrasado' (se não pago)
4. Dar baixa:
   a) Selecionar parcela
   b) Informar: valor_pago, data, banco, tipo_documento
   c) Sistema calcula juros automáticos (se configurado)
   d) Registra pagamento
   e) Atualiza status da parcela
   f) Opção de anexar comprovante (Storage)
5. Parcela pode ter múltiplos pagamentos parciais
6. Quando valor_pago >= valor_parcela, status = 'pago'
```

### 5.5 Fluxo de Relatório (DRE)

```
1. Usuário acessa /financeiro/dre
2. Seleciona período (mês/ano)
3. Sistema busca:
   - Pagamentos de contas_receber (entradas)
   - Pagamentos de contas_pagar (saídas)
4. Agrupa por categoria_plano_contas → faixa_dre
5. Calcula:
   - Receita Bruta (faixa 'Receitas')
   - (-) Deduções (faixa 'Deduções sobre vendas')
   - = Receita Líquida
   - (-) CMV (faixa 'Custos variáveis')
   - = Lucro Bruto
   - (-) Custos Fixos
   - (-) Custos Variáveis
   - = Lucro Operacional
   - (+/-) Resultado Financeiro
   - (+/-) Resultado Não Operacional
   - = Lucro Líquido
```

---

## BLOCO 6: PERMISSÕES E PERFIS DE ACESSO

### 6.1 Roles do Sistema

| Role | Descrição |
|------|-----------|
| `user` | Usuário padrão - acesso ao próprio tenant |
| `admin` | Administrador - acesso à área administrativa |

### 6.2 Verificação de Admin

```typescript
// Hook useIsAdmin
const { isAdmin, loading } = useIsAdmin();

// Function no banco
SELECT public.has_role(auth.uid(), 'admin');
SELECT public.is_admin(auth.uid());
```

### 6.3 RLS (Row Level Security)

Todas as tabelas principais usam RLS com a política:
```sql
-- SELECT/INSERT/UPDATE/DELETE
USING (auth.uid() = usuario_id)
WITH CHECK (auth.uid() = usuario_id)
```

Tabelas filhas (parcelas, pagamentos) usam RLS via JOIN:
```sql
USING (EXISTS (
  SELECT 1 FROM tabela_pai
  WHERE tabela_pai.id = tabela_filha.parent_id
  AND tabela_pai.usuario_id = auth.uid()
))
```

### 6.4 Proteção de Rotas

```typescript
// ProtectedRoute em App.tsx
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  
  if (loading) return <Loading />;
  if (!user) return <Navigate to="/auth/login" />;
  
  return children;
};

// Rotas admin verificam isAdmin no componente
{isAdmin && (
  <SidebarGroup>
    <NavLink to="/admin/usuarios">Usuários</NavLink>
  </SidebarGroup>
)}
```

---

## BLOCO 7: INTEGRAÇÕES

### 7.1 Integrações Existentes

| Integração | Status | Descrição |
|------------|--------|-----------|
| Supabase Auth | ✅ Ativo | Login, cadastro, recuperação de senha |
| Supabase Database | ✅ Ativo | PostgreSQL com RLS |
| Supabase Storage | ✅ Ativo | Upload de imagens (logos, receitas, comprovantes) |
| Supabase Realtime | ✅ Ativo | Atualizações em tempo real no Dashboard |
| ViaCEP | ✅ Ativo | Busca de endereço por CEP |

### 7.2 Integrações Futuras (Backlog)

| Integração | Prioridade | Descrição |
|------------|------------|-----------|
| WhatsApp | Alta | Envio de mensagens para clientes |
| Email Transacional | Alta | Notificações, cobranças |
| Gateway de Pagamento | Média | PIX, boleto, cartão online |
| Google Calendar | Média | Sincronização de entregas |
| Nota Fiscal | Baixa | Emissão de NFC-e |
| Google Drive | Baixa | Backup de documentos |

### 7.3 Edge Functions Existentes

| Function | Endpoint | Descrição |
|----------|----------|-----------|
| criar-usuario | POST /criar-usuario | Criação de usuário via admin |
| migrate-logos-to-storage | POST /migrate-logos-to-storage | Migração de logos |

---

## BLOCO 8: PENDÊNCIAS E RISCOS TÉCNICOS

### 8.1 Pendências Conhecidas

| ID | Área | Descrição | Impacto |
|----|------|-----------|---------|
| P01 | Encomendas | Falta validação de CEP no frontend | Baixo |
| P02 | Financeiro | DRE não considera cancelamentos | Médio |
| P03 | Precificação | Ingredientes excluídos não atualizam receitas | Alto |
| P04 | Storage | Imagens antigas não são deletadas | Baixo |
| P05 | Auth | Falta confirmação de email em produção | Alto |
| P06 | Mobile | Alguns modais não são 100% responsivos | Médio |
| P07 | Performance | Dashboard carrega muitos dados | Médio |

### 8.2 Riscos Técnicos

| Risco | Probabilidade | Impacto | Mitigação |
|-------|---------------|---------|-----------|
| Limite de rows Supabase (1000) | Alta | Alto | Implementar paginação em todas as queries |
| Storage sem cleanup | Média | Médio | Criar job de limpeza de arquivos órfãos |
| RLS bypass | Baixa | Crítico | Auditar todas as policies |
| Cálculos de custo incorretos | Média | Alto | Testes automatizados |
| Concorrência em pagamentos | Baixa | Médio | Transactions no banco |

### 8.3 Débitos Técnicos

- [ ] Migrar de `any` para tipos corretos em vários hooks
- [ ] Consolidar lógica de cálculo de parcelas
- [ ] Criar testes E2E para fluxos críticos
- [ ] Documentar todas as functions do banco
- [ ] Implementar logging estruturado

---

## BLOCO 9: BACKLOG SUGERIDO

### 9.1 MVP (Já implementado) ✅

- [x] Autenticação (login, cadastro, recuperação)
- [x] Dashboard com calendário
- [x] Gestão de encomendas
- [x] Cadastro de clientes e fornecedores
- [x] Precificação básica (ingredientes, embalagens, receitas)
- [x] Contas a receber e pagar
- [x] Fluxo de caixa básico

### 9.2 V1 (Próximas entregas)

| Prioridade | Feature | Estimativa |
|------------|---------|------------|
| 🔴 Alta | Confirmação de email em produção | 2h |
| 🔴 Alta | Paginação em listagens grandes | 4h |
| 🔴 Alta | Backup automático de dados | 4h |
| 🟡 Média | Integração WhatsApp (mensagens) | 8h |
| 🟡 Média | Relatório de vendas por período | 4h |
| 🟡 Média | Exportação de dados (Excel/PDF) | 4h |
| 🟡 Média | Notificações de vencimento | 4h |
| 🟢 Baixa | Modo escuro aprimorado | 2h |
| 🟢 Baixa | PWA (instalação mobile) | 4h |

### 9.3 V2 (Futuro)

| Feature | Descrição |
|---------|-----------|
| Controle de Estoque | Entrada/saída de insumos |
| Multi-usuários | Colaboradores na mesma confeitaria |
| App Mobile | React Native ou PWA avançado |
| Gateway de Pagamento | PIX automático, boleto |
| Marketplace | Cardápio online para clientes |
| BI/Analytics | Dashboards avançados com gráficos |
| Integração iFood/Rappi | Recebimento de pedidos |
| Nota Fiscal | Emissão de NFC-e |

---

## BLOCO 10: STACK TECNOLÓGICA

### 10.1 Frontend

| Tecnologia | Versão | Uso |
|------------|--------|-----|
| React | 18.3.1 | Framework UI |
| TypeScript | 5.x | Tipagem estática |
| Vite | 5.x | Build tool |
| Tailwind CSS | 3.x | Estilização |
| Shadcn/ui | - | Componentes base |
| TanStack Query | 5.83.0 | Cache e fetching |
| React Router DOM | 6.30.1 | Roteamento |
| React Hook Form | 7.65.0 | Formulários |
| Zod | 4.1.12 | Validação |
| Recharts | 2.15.4 | Gráficos |
| date-fns | 4.1.0 | Manipulação de datas |
| Lucide React | 0.462.0 | Ícones |
| Sonner | 1.7.4 | Toast notifications |

### 10.2 Backend (Lovable Cloud / Supabase)

| Serviço | Uso |
|---------|-----|
| PostgreSQL | Banco de dados principal |
| Supabase Auth | Autenticação |
| Supabase Storage | Arquivos |
| Supabase Realtime | WebSockets |
| Edge Functions | Lógica backend customizada |

### 10.3 Ferramentas de Desenvolvimento

| Ferramenta | Uso |
|------------|-----|
| ESLint | Linting |
| PostCSS | Processamento CSS |
| Bun | Package manager |

---

## BLOCO 11: COMANDOS ÚTEIS

```bash
# Instalar dependências
bun install

# Rodar em desenvolvimento
bun run dev

# Build para produção
bun run build

# Preview do build
bun run preview

# Lint
bun run lint
```

---

## BLOCO 12: ARQUIVOS DE CONFIGURAÇÃO

### 12.1 Estrutura de Pastas

```
/
├── public/               # Assets estáticos
├── src/
│   ├── assets/           # Imagens importadas
│   ├── components/       # Componentes reutilizáveis
│   │   ├── ui/           # Shadcn components
│   │   ├── admin/        # Componentes admin
│   │   ├── auth/         # Componentes de auth
│   │   ├── configuracoes/# Componentes de config
│   │   └── financeiro/   # Componentes financeiros
│   ├── contexts/         # React Contexts
│   ├── hooks/            # Custom hooks
│   ├── integrations/     # Integrações (Supabase)
│   ├── lib/              # Utilitários
│   ├── pages/            # Páginas/Rotas
│   │   ├── admin/
│   │   ├── auth/
│   │   ├── cadastros/
│   │   ├── configuracoes/
│   │   ├── financeiro/
│   │   └── precificacao/
│   ├── schemas/          # Schemas Zod
│   └── utils/            # Funções utilitárias
├── supabase/
│   ├── config.toml       # Configuração Supabase
│   ├── functions/        # Edge Functions
│   └── migrations/       # Migrations SQL
├── index.html
├── tailwind.config.ts
├── vite.config.ts
└── tsconfig.json
```

### 12.2 Variáveis de Ambiente

```env
VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=eyJxxx...
VITE_SUPABASE_PROJECT_ID=xxx
```

---

**Documentação gerada em:** 25 de Dezembro de 2025  
**Versão do documento:** 1.0  
**Autor:** Sistema Caixa de Açúcar / Lovable AI
