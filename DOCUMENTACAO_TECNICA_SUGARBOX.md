# 📘 DOCUMENTAÇÃO TÉCNICA DO SUGARBOX

**Sistema de Gestão para Confeitarias**  
**Versão Atual:** Pós-Limpeza (Novembro 2025)  
**Stack:** React + TypeScript + Supabase (Lovable Cloud)

---

## 1. VISÃO GERAL DO SISTEMA

### 1.1 O que é o SugarBox?

SugarBox é um sistema web de gestão completo para confeitarias que resolve os principais desafios do negócio:

- **Gestão de Encomendas**: Controle completo do ciclo de pedidos (criação, acompanhamento, entrega, financeiro)
- **Precificação Técnica**: Cálculo preciso de custos baseado em fichas técnicas (ingredientes, embalagens, mão de obra, pré-preparos)
- **Controle Financeiro**: Contas a pagar, contas a receber, fluxo de caixa, DRE
- **Gestão de Cadastros**: Clientes, fornecedores, contatos, familiares
- **Administração Multi-tenant**: Sistema com controle de usuários e permissões

### 1.2 Módulos Principais

1. **Painel (Dashboard)**: Visão estratégica com calendário de entregas, gráficos econômicos, top produtos
2. **Encomendas**: Criação, edição, controle de status, produtos, tags, vinculação financeira
3. **Clientes**: Cadastro de clientes PF/PJ com familiares e datas de aniversário
4. **Fornecedores**: Cadastro de fornecedores com contatos e datas de aniversário
5. **Financeiro**: Contas a receber/pagar, fluxo de caixa, DRE, saldos bancários
6. **Precificação**: Ingredientes, embalagens, pré-preparos, fichas técnicas
7. **Configurações**: Cadastros base, plano de contas, tipos de documentos, juros, tags
8. **Admin**: Gestão de usuários, logs de auditoria (acesso restrito a admins)
9. **Autenticação**: Login, cadastro, recuperação de senha, controle de acesso

### 1.3 Arquitetura Frontend ↔ Backend

**Frontend (React + TypeScript)**
- `src/pages/`: Páginas e rotas do sistema
- `src/components/`: Componentes reutilizáveis (UI, dialogs, autocompletes)
- `src/hooks/`: Hooks customizados para acesso a dados e lógica de negócio
- `src/contexts/`: Contextos React (AuthContext)
- `src/integrations/supabase/`: Cliente Supabase e tipos TypeScript auto-gerados

**Backend (Supabase / Lovable Cloud)**
- **Autenticação**: Supabase Auth com controle de conta ativa/inativa
- **Banco de Dados**: PostgreSQL com RLS (Row Level Security) por `usuario_id`
- **Views**: Views SQL para agregações (`vw_resumo_financeiro`, `v_aniversariantes_fornecedores`)
- **RPC (Funções SQL)**: Lógica de negócio no banco (criar plano padrão, cálculos, etc.)
- **Edge Functions**: Função `criar-usuario` para criação de usuários via Admin

**Fluxo de Comunicação:**
```
React Component → Hook → Supabase Client → RLS → PostgreSQL → View/RPC → Response → Hook → Component
```

---

## 2. ROTAS E PÁGINAS

### 2.1 Tabela Completa de Rotas

| Path | Componente | Módulo | Menu Lateral | Requer Auth | Requer Admin |
|------|-----------|--------|--------------|-------------|--------------|
| `/` | Redirect → `/dashboard` | - | - | Sim | Não |
| `/auth/login` | `Login.tsx` | Auth | Não | Não | Não |
| `/auth/signup` | `SignUp.tsx` | Auth | Não | Não | Não |
| `/auth/forgot-password` | `ForgotPassword.tsx` | Auth | Não | Não | Não |
| `/dashboard` | `Dashboard.tsx` | Painel | Sim | Sim | Não |
| `/encomendas` | `Encomendas.tsx` | Encomendas | Sim | Sim | Não |
| `/clientes` | `Clientes.tsx` | Cadastros | Sim | Sim | Não |
| `/fornecedores` | `Fornecedores.tsx` | Cadastros | Sim | Sim | Não |
| `/financeiro` | `Financeiro.tsx` | Financeiro | Sim | Sim | Não |
| `/financeiro/dashboard` | `DashboardFinanceiro.tsx` | Financeiro | Não | Sim | Não |
| `/financeiro/contas-receber` | `ContasReceber.tsx` | Financeiro | Não | Sim | Não |
| `/financeiro/contas-receber/nova` | `ContasReceberForm.tsx` | Financeiro | Não | Sim | Não |
| `/financeiro/contas-receber/editar/:id` | `ContasReceberForm.tsx` | Financeiro | Não | Sim | Não |
| `/financeiro/contas-receber/detalhes/:id` | `ContasReceberDetalhes.tsx` | Financeiro | Não | Sim | Não |
| `/financeiro/contas-pagar` | `ContasPagar.tsx` | Financeiro | Não | Sim | Não |
| `/financeiro/contas-pagar/nova` | `ContasPagarForm.tsx` | Financeiro | Não | Sim | Não |
| `/financeiro/contas-pagar/editar/:id` | `ContasPagarForm.tsx` | Financeiro | Não | Sim | Não |
| `/financeiro/contas-pagar/detalhes/:id` | `ContasPagarDetalhes.tsx` | Financeiro | Não | Sim | Não |
| `/financeiro/fluxo-caixa` | `FluxoCaixaHub.tsx` | Financeiro | Não | Sim | Não |
| `/financeiro/fluxo-caixa/diario` | `FluxoCaixaDiario.tsx` | Financeiro | Não | Sim | Não |
| `/financeiro/fluxo-caixa/mensal` | `FluxoCaixaMensal.tsx` | Financeiro | Não | Sim | Não |
| `/financeiro/dre` | `DRE.tsx` | Financeiro | Não | Sim | Não |
| `/precificacao` | `Precificacao.tsx` | Precificação | Sim | Sim | Não |
| `/precificacao/ficha-tecnica` | `Receitas.tsx` | Precificação | Não | Sim | Não |
| `/precificacao/ficha-tecnica/nova` | `ReceitaForm.tsx` | Precificação | Não | Sim | Não |
| `/precificacao/ficha-tecnica/editar/:id` | `ReceitaForm.tsx` | Precificação | Não | Sim | Não |
| `/precificacao/ingredientes` | `Ingredientes.tsx` | Precificação | Não | Sim | Não |
| `/precificacao/embalagens` | `Embalagens.tsx` | Precificação | Não | Sim | Não |
| `/precificacao/pre-preparos` | `PrePreparos.tsx` | Precificação | Não | Sim | Não |
| `/precificacao/pre-preparos/novo` | `PrePreparoForm.tsx` | Precificação | Não | Sim | Não |
| `/precificacao/pre-preparos/:id` | `PrePreparoForm.tsx` | Precificação | Não | Sim | Não |
| `/configuracoes` | `Configuracoes.tsx` | Configurações | Sim | Sim | Não |
| `/configuracoes/cadastros-base` | `CadastrosBase.tsx` | Configurações | Não | Sim | Não |
| `/configuracoes/precificacao` | `PrecificacaoPage.tsx` | Configurações | Não | Sim | Não |
| `/configuracoes/financeiro` | `FinanceiroPage.tsx` | Configurações | Não | Sim | Não |
| `/configuracoes/precificacao/mao-de-obra` | `MaoDeObra.tsx` | Configurações | Não | Sim | Não |
| `/configuracoes/tipos-insumos` | `TiposInsumos.tsx` | Configurações | Não | Sim | Não |
| `/configuracoes/categorias-plano-contas` | `CategoriasPlanoContas.tsx` | Configurações | Não | Sim | Não |
| `/configuracoes/plano-contas` | `PlanoContas.tsx` | Configurações | Não | Sim | Não |
| `/configuracoes/bancos` | `Bancos.tsx` | Configurações | Não | Sim | Não |
| `/configuracoes/tipos-documentos` | `TiposDocumentos.tsx` | Configurações | Não | Sim | Não |
| `/configuracoes/juros` | `ConfiguracaoJurosPage.tsx` | Configurações | Não | Sim | Não |
| `/configuracoes/tags-encomendas` | `TagsEncomendasPage.tsx` | Configurações | Não | Sim | Não |
| `/configuracoes/dados-confeitaria` | `SeusDados.tsx` | Configurações | Não | Sim | Não |
| `/configuracoes/categorias-receitas` | `Categorias.tsx` | Configurações | Não | Sim | Não |
| `/configuracoes/unidades-medida` | `UnidadesMedida.tsx` | Configurações | Não | Sim | Não |
| `/admin/usuarios` | `Usuarios.tsx` | Admin | Sim* | Sim | **Sim** |
| `/admin/logs` | `LogsAdmin.tsx` | Admin | Sim* | Sim | **Sim** |

**(*) Menu lateral exibe seção "Administração" apenas se `isAdmin === true`**

### 2.2 Proteção de Rotas

```tsx
// src/App.tsx
<ProtectedRoute>  // Verifica auth.uid()
  <Layout>        // Sidebar + Header + Main
    <Component />
  </Layout>
</ProtectedRoute>
```

**Admin Routes:**  
As páginas `/admin/*` verificam `useIsAdmin()` internamente e redirecionam se `isAdmin === false`.

---

## 3. MÓDULOS FUNCIONAIS

### 3.1 Painel (`/dashboard`)

**Responsabilidade:**  
Visão estratégica do negócio com métricas, calendário de entregas e gráficos.

**Dados Exibidos:**
- **Calendário Triplo**: Mês anterior, mês atual, mês seguinte com marcação de entregas
- **Alertas Financeiros**: Contas a receber/pagar atrasadas, inadimplência
- **Saldo Bancário**: Resumo do financeiro via `vw_resumo_financeiro`
- **Visão Econômica**: Receitas vs Custos (mensal e anual)
- **Top 5 Produtos Mais Vendidos**: Baseado em `encomenda_itens`
- **Ticket Médio**: Mensal e anual

**Tabelas/Views Envolvidas:**
- `encomendas` (status ≠ cancelado)
- `encomenda_itens`
- `contas_receber_parcelas`
- `contas_pagar_parcelas`
- `vw_resumo_financeiro` (saldos bancários)
- `profiles` (metas configuradas)

**Hooks Principais:**
- `useAuth()`
- Queries diretas ao Supabase para agregações

---

### 3.2 Encomendas (`/encomendas`)

**Responsabilidade:**  
Controle completo do ciclo de vida de encomendas.

**Fluxo Básico:**
1. **Criar Encomenda**: Cliente, data entrega, valor, produtos (vincula receitas)
2. **Editar**: Alterar status, produtos, valores, dados de entrega
3. **Status**: `pendente`, `confirmado`, `em_producao`, `pronto`, `entregue`, `cancelado`
4. **Vincular Financeiro**: Gerar conta a receber automaticamente
5. **Tags**: Categorizar encomendas (aniversário, casamento, mesversário, etc.)

**Tabelas Envolvidas:**
- `encomendas`: Dados principais da encomenda
- `encomenda_itens`: Produtos/receitas da encomenda
- `tags_encomendas`: Tags globais configuráveis
- `encomendas_tags`: Relação N:N entre encomendas e tags
- `contas_receber`: Vinculação financeira (campo `conta_receber_id`)

**Regras de Negócio:**
- Encomendas `canceladas` não contam em métricas financeiras
- Status pode ser alterado manualmente
- Produtos vêm de `receitas` cadastradas
- Tags podem ser criadas/editadas em Configurações

**Hooks Principais:**
- `useEncomendas()`
- `useEncomendaItens(encomendaId)`
- `useClientes()`
- `useReceitas()`

---

### 3.3 Clientes (`/clientes`)

**Responsabilidade:**  
Cadastro de clientes (PF/PJ) com controle de familiares e datas de aniversário.

**Campos Principais:**
- `nome`, `tipo` (PF/PJ), `cpf_cnpj`, `telefone`, `email`
- `endereco`, `numero`, `cidade`, `estado`, `cep`
- `data_aniversario`
- `observacoes`

**Funcionalidades:**
- **Familiares**: Cada cliente pode ter N familiares cadastrados (`cliente_familiares`)
- **Aniversários**: Exibidos no `AppSidebar` e Dashboard
- **Busca CEP**: Integração com ViaCEP
- **Exportação**: Exportar lista de clientes para Excel

**Tabelas Envolvidas:**
- `clientes`
- `cliente_familiares` (FK: `cliente_id`)

**Onde Mais É Usado:**
- `Encomendas`: Autocomplete de clientes
- `Financeiro`: Contas a receber (campo `cliente_nome`)
- `Dashboard`: Alertas de aniversariantes

**Hooks Principais:**
- `useClientes()`
- `useFamiliares(clienteId?)`
- `useViaCEP()`

---

### 3.4 Fornecedores (`/fornecedores`)

**Responsabilidade:**  
Cadastro de fornecedores com contatos e datas de aniversário.

**Campos Principais:**
- `nome`, `tipo` (PF/PJ), `cpf_cnpj`, `telefone`, `email`, `observacoes`

**Funcionalidades:**
- **Contatos**: Cada fornecedor pode ter N contatos (`fornecedor_contatos`)
- **Aniversários de Contatos**: Exibidos no `AppSidebar`
- **Exportação**: Exportar lista de fornecedores para Excel

**Tabelas Envolvidas:**
- `fornecedores`
- `fornecedor_contatos` (FK: `fornecedor_id`)

**Relação com Financeiro:**
- Campo `fornecedor_id` em `contas_pagar`

**Hooks Principais:**
- `useFornecedores()`
- `useFornecedorContatos(fornecedorId?)`

---

### 3.5 Financeiro (`/financeiro/*`)

**Módulo Mais Completo:** Controle financeiro completo da confeitaria.

#### 3.5.1 Painel Financeiro (`/financeiro`)

**Exibe:**
- **Banner de Saldos**: Saldo anterior, entradas, saídas, saldo atual (por mês/ano)
- **Configuração de Saldos Iniciais**: Modal para configurar saldo inicial por banco/mês
- **Dashboard de Indicadores**: Total a receber/pagar, inadimplência clientes/fornecedores

**Tabelas:**
- `bancos`
- `saldos_iniciais_bancos`
- `contas_receber_parcelas`
- `contas_pagar_parcelas`
- `contas_receber_pagamentos`
- `contas_pagar_pagamentos`

#### 3.5.2 Contas a Receber (`/financeiro/contas-receber`)

**Fluxo:**
1. **Criar Conta**: Cliente, valor, vencimento, número de parcelas, plano de contas, banco
2. **Parcelas**: Geradas automaticamente com status `aberto`, `atrasado`, `pago`, `pago_em_atraso`, `adiantado`
3. **Dar Baixa**: Registrar pagamento (com juros/multa/desconto) → `contas_receber_pagamentos`
4. **Comprovantes**: Upload de arquivos vinculados ao pagamento

**Conexão com Encomendas:**  
Campo `conta_receber_id` em `encomendas` permite vincular encomenda ao financeiro.

**Tabelas:**
- `contas_receber`
- `contas_receber_parcelas`
- `contas_receber_pagamentos`
- `contas_receber_comprovantes`

**Views:**
- `vw_contas_receber_parcelas` (agregação com totais)

#### 3.5.3 Contas a Pagar (`/financeiro/contas-pagar`)

**Fluxo:** Idêntico a contas a receber, mas para despesas.

**Tabelas:**
- `contas_pagar`
- `contas_pagar_parcelas`
- `contas_pagar_pagamentos`
- `contas_pagar_comprovantes`

#### 3.5.4 Fluxo de Caixa (`/financeiro/fluxo-caixa/*`)

**Hub (`/financeiro/fluxo-caixa`):**  
Página de entrada com cards para escolher entre Diário ou Mensal.

**Diário (`/financeiro/fluxo-caixa/diario`):**  
Exibe entradas/saídas dia a dia do mês selecionado.

**Mensal (`/financeiro/fluxo-caixa/mensal`):**  
Exibe entradas/saídas mês a mês do ano selecionado.

**Tabelas:**
- `contas_receber_pagamentos`
- `contas_pagar_pagamentos`
- `bancos`

#### 3.5.5 DRE (`/financeiro/dre`)

**Responsabilidade:**  
Demonstrativo de Resultado do Exercício (receitas, deduções, custos, despesas, resultado).

**Estrutura:**
1. **Receita Bruta**
2. **(-) Deduções sobre Vendas** (impostos, devoluções)
3. **= Receita Líquida**
4. **(-) CMV** (Custo de Mercadoria Vendida)
5. **= Lucro Bruto**
6. **(-) Despesas Operacionais** (fixas, variáveis)
7. **= Resultado Operacional**
8. **+/- Resultado Financeiro** (juros recebidos/pagos)
9. **+/- Resultado Não Operacional**
10. **= Resultado Líquido**

**Tabelas:**
- `plano_contas`
- `categorias_plano_contas`
- `contas_receber_pagamentos`
- `contas_pagar_pagamentos`

---

### 3.6 Precificação (`/precificacao/*`)

**Modelo de Custeio:**  
Sistema de custeio técnico que calcula o custo real de cada produto baseado em:
- Ingredientes
- Embalagens
- Pré-preparos (ingredientes intermediários)
- Mão de obra direta

#### 3.6.1 Estrutura de Dados

**Ingredientes** (`ingredientes`)
- Insumo base com preço/embalagem
- Relação com `tipos_insumos` (ex: "Farinha de Trigo 1kg")

**Embalagens** (`embalagens`)
- Caixas, sacos, fitas, etc.
- Relação com `tipos_insumos` (ex: "Caixa Kraft 15x15cm")

**Pré-Preparos** (`pre_preparos`)
- Preparações intermediárias (ex: "Brigadeiro de Panela", "Massa de Bolo")
- Compostos por ingredientes (`pre_preparos_ingredientes`)
- Possuem rendimento e mão de obra (`pre_preparos_mao_obra`)
- **Custo é calculado automaticamente** via trigger SQL

**Receitas** (`receitas`)
- Ficha técnica completa do produto final
- Compostas por:
  - Ingredientes (`receitas_ingredientes`)
  - Embalagens (`receitas_embalagens`)
  - Mão de obra (`receitas_mao_obra`)
- Cálculo de CMV, margem, lucro via `useCalculosReceita()`

#### 3.6.2 Fluxo de Custeio

```
Ingrediente Base (R$ 10/kg)
  ↓
Pré-Preparo (usa 0.5kg = R$ 5 + mão de obra)
  ↓
Receita Final (usa pré-preparo + embalagens + mão de obra)
  ↓
CMV Real = Ingredientes + Embalagens + Mão de Obra
```

#### 3.6.3 Tabelas Envolvidas

**Cadastros:**
- `tipos_insumos` (tipos globais, ex: "Farinha", "Açúcar")
- `unidades_medida` (kg, g, L, mL, und)
- `categorias` (categorias de receitas)
- `mao_obra_perfis` (perfis de mão de obra com valor/hora)
- `mao_obra_perfis_historico` (histórico de alterações de valor)

**Precificação:**
- `ingredientes`
- `embalagens`
- `pre_preparos` + `pre_preparos_ingredientes` + `pre_preparos_mao_obra`
- `receitas` + `receitas_ingredientes` + `receitas_embalagens` + `receitas_mao_obra`
- `receitas_despesas_venda` (taxas, comissões)
- `receitas_imagens` (fotos do produto)

#### 3.6.4 Hooks Principais

- `useCalculosReceita()`: Calcula CMV, margem, lucro de todas as receitas
- `useReceitas()`
- `useMaoObraPerfis()`
- `useReceitasMaoObra(receitaId)`
- `usePrePreparosMaoObra(prePreparoId)`

---

### 3.7 Configurações (`/configuracoes/*`)

**Hub Principal:** `/configuracoes`  
Exibe 3 cards: Cadastros Base, Precificação, Financeiro

#### 3.7.1 Cadastros Base

**Inclui:**
- **Tipos de Insumos** (`tipos_insumos`): Cadastro de tipos de ingredientes/embalagens
- **Unidades de Medida** (`unidades_medida`): kg, g, L, mL, und, etc.
- **Categorias de Receitas** (`categorias`): Bolos, Tortas, Doces, etc.
- **Tags de Encomendas** (`tags_encomendas`): Aniversário, Casamento, etc.
- **Dados da Confeitaria** (`profiles`): Nome, endereço, contato, logo

#### 3.7.2 Precificação

**Inclui:**
- **Mão de Obra** (`mao_obra_perfis`): Perfis de mão de obra com valor/hora

#### 3.7.3 Financeiro

**Inclui:**
- **Plano de Contas** (`plano_contas` + `categorias_plano_contas`): Estrutura contábil
- **Bancos** (`bancos`): Cadastro de contas bancárias
- **Tipos de Documentos** (`tipos_documento`): Nota Fiscal, Boleto, etc.
- **Configuração de Juros** (`configuracoes_juros`): Percentual de juros/multa por atraso

**RPC Utilizados:**
- `criar_categorias_plano_padrao(user_id)`: Cria categorias padrão no primeiro acesso
- `criar_planos_contas_padrao(user_id)`: Cria plano de contas padrão
- `criar_bancos_oficiais_usuario(user_id)`: Cria lista de bancos brasileiros oficiais

---

### 3.8 Admin (`/admin/*`)

**Acesso Restrito:** Apenas usuários com role `admin` em `user_roles`.

#### 3.8.1 Gestão de Usuários (`/admin/usuarios`)

**Funcionalidades:**
- **Listar Usuários**: Todos os usuários do sistema
- **Adicionar Usuário**: Via edge function `criar-usuario` (envia email de senha temporária)
- **Editar Usuário**: Nome, confeitaria, permissões (user/admin)
- **Desabilitar Conta**: Marca `profiles.ativo = false`
- **Excluir Usuário**: Remove usuário e todos os dados (hard delete via RPC)

**Edge Function:**
- `supabase/functions/criar-usuario`: Cria usuário no Supabase Auth + perfil + role

**Tabelas:**
- `profiles`
- `user_roles`
- `admin_logs`

#### 3.8.2 Logs de Auditoria (`/admin/logs`)

**Exibe:**
- Ações administrativas (criar usuário, editar, desabilitar, excluir)
- Admin responsável
- Usuário afetado
- Data/hora
- Detalhes da ação

**Tabela:**
- `admin_logs`

---

## 4. AUTENTICAÇÃO E AUTORIZAÇÃO

### 4.1 Autenticação (Supabase Auth)

**Telas:**
- `/auth/login`: Login com email/senha
- `/auth/signup`: Cadastro de novo usuário
- `/auth/forgot-password`: Recuperação de senha via email

**Contexto:**
- `AuthContext` (`src/contexts/AuthContext.tsx`): Gerencia `user`, `session`, funções de login/logout/signup

**Configuração:**
- **Auto-confirm emails**: Habilitado (não requer confirmação de email)
- **Storage**: localStorage (persistência de sessão)

### 4.2 Controle de Conta Ativa/Inativa

**Campo:** `profiles.ativo` (boolean)

**Validação:**  
No `AuthContext.signIn()`, após autenticação bem-sucedida:
```typescript
if (!userProfile.ativo) {
  await supabase.auth.signOut();
  throw new Error('Conta inativa. Contate o administrador.');
}
```

### 4.3 Primeiro Acesso / Alterar Senha Obrigatória

**Campo:** `profiles.primeiro_acesso` (boolean)

**Componente:**  
`AlterarSenhaObrigatoria` verifica se `primeiro_acesso === true` e força alteração de senha.

**Fluxo:**
1. Admin cria usuário → senha temporária gerada
2. Usuário faz login → `primeiro_acesso = true`
3. Modal obrigatório abre para alterar senha
4. Após alteração → `primeiro_acesso = false`

### 4.4 Verificação de Admin

**Hook:** `useIsAdmin()`

**Lógica:**
```typescript
const { data: isAdmin } = useQuery({
  queryKey: ['isAdmin', user?.id],
  queryFn: async () => {
    const { data: roles } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'admin')
      .single();
    return !!roles;
  }
});
```

**Uso:**
- `AppSidebar`: Exibe seção "Administração" apenas se `isAdmin === true`
- `/admin/*`: Páginas verificam `isAdmin` e redirecionam se `false`

---

## 5. BANCO DE DADOS (SUPABASE)

### 5.1 Tabelas por Domínio

#### 5.1.1 Autenticação / Usuário

| Tabela | Descrição |
|--------|-----------|
| `profiles` | Dados complementares do usuário (nome, confeitaria, avatar, metas, configurações) |
| `user_roles` | Roles do usuário (`user`, `admin`) |
| `admin_logs` | Logs de auditoria de ações administrativas |

**RLS:** Isolamento por `id = auth.uid()` (profiles) e verificação de role (admin_logs)

---

#### 5.1.2 Cadastros

| Tabela | Descrição |
|--------|-----------|
| `clientes` | Clientes PF/PJ com dados de contato, endereço, aniversário |
| `cliente_familiares` | Familiares dos clientes (FK: `cliente_id`) |
| `fornecedores` | Fornecedores PF/PJ |
| `fornecedor_contatos` | Contatos dos fornecedores (FK: `fornecedor_id`) |

**RLS:** Isolamento por `usuario_id = auth.uid()`

---

#### 5.1.3 Encomendas

| Tabela | Descrição |
|--------|-----------|
| `encomendas` | Pedidos dos clientes (cliente, data entrega, status, valor, dados de entrega, topo de bolo) |
| `encomenda_itens` | Produtos/receitas da encomenda (FK: `encomenda_id`) |
| `tags_encomendas` | Tags globais configuráveis (Aniversário, Casamento, etc.) |
| `encomendas_tags` | Relação N:N entre encomendas e tags |

**RLS:** Isolamento por `usuario_id = auth.uid()`

---

#### 5.1.4 Precificação

| Tabela | Descrição |
|--------|-----------|
| `tipos_insumos` | Tipos de ingredientes/embalagens (ex: "Farinha de Trigo 1kg") |
| `unidades_medida` | Unidades de medida (kg, g, L, mL, und) |
| `categorias` | Categorias de receitas (Bolos, Tortas, etc.) |
| `ingredientes` | Ingredientes base com preço (FK: `tipo_insumo_id`) |
| `embalagens` | Embalagens com preço (FK: `tipo_insumo_id`) |
| `pre_preparos` | Preparações intermediárias (rendimento, tempo preparo) |
| `pre_preparos_ingredientes` | Ingredientes do pré-preparo (FK: `pre_preparo_id`, `ingrediente_id`) |
| `pre_preparos_mao_obra` | Mão de obra do pré-preparo (FK: `pre_preparo_id`, `perfil_id`) |
| `receitas` | Fichas técnicas dos produtos (rendimento, tempo, custo, valor venda) |
| `receitas_ingredientes` | Ingredientes da receita (FK: `receita_id`) |
| `receitas_embalagens` | Embalagens da receita (FK: `receita_id`) |
| `receitas_mao_obra` | Mão de obra da receita (FK: `receita_id`, `perfil_id`) |
| `receitas_despesas_venda` | Despesas variáveis de venda (taxas, comissões) |
| `receitas_imagens` | Fotos dos produtos (FK: `receita_id`) |
| `mao_obra_perfis` | Perfis de mão de obra com valor/hora |
| `mao_obra_perfis_historico` | Histórico de alterações de valor/hora |

**RLS:** Isolamento por `usuario_id = auth.uid()`

**Trigger de Cálculo:**  
`calcular_custo_pre_preparo(preparo_id)`: Recalcula custo total do pré-preparo quando ingredientes são adicionados/removidos.

---

#### 5.1.5 Financeiro

| Tabela | Descrição |
|--------|-----------|
| **Contas a Receber** |
| `contas_receber` | Conta a receber (cliente, valor, vencimento, plano contas, banco) |
| `contas_receber_parcelas` | Parcelas da conta (status, valor, data vencimento/pagamento) |
| `contas_receber_pagamentos` | Pagamentos efetuados (FK: `parcela_id`, banco, valor pago, juros, desconto) |
| `contas_receber_comprovantes` | Comprovantes de pagamento (FK: `pagamento_id`) |
| **Contas a Pagar** |
| `contas_pagar` | Conta a pagar (fornecedor, valor, vencimento, plano contas, banco) |
| `contas_pagar_parcelas` | Parcelas da conta |
| `contas_pagar_pagamentos` | Pagamentos efetuados |
| `contas_pagar_comprovantes` | Comprovantes de pagamento |
| **Configurações** |
| `bancos` | Contas bancárias (código, nome, tipo, saldo inicial) |
| `saldos_iniciais_bancos` | Saldos iniciais por banco/mês/ano |
| `plano_contas` | Plano de contas (código estruturado, descrição, categoria) |
| `categorias_plano_contas` | Categorias do plano (Receitas, Custos, Despesas, etc.) |
| `tipos_documento` | Tipos de documentos financeiros (NF, Boleto, etc.) |
| `configuracoes_juros` | Configuração de juros/multa por atraso |

**RLS:** Isolamento por `usuario_id = auth.uid()`

**Triggers:**
- `atualizar_parcela_apos_pagamento()`: Atualiza status da parcela após pagamento
- `atualizar_status_parcelas_vencidas()`: Marca parcelas como atrasadas automaticamente

---

#### 5.1.6 Outros

| Tabela | Descrição |
|--------|-----------|
| `custos_fixos` | Custos fixos mensais (LEGADO - não usado ativamente) |

---

### 5.2 Views e RPC (Funções SQL)

#### 5.2.1 Views Ativas

| View | Uso | Onde É Usada |
|------|-----|--------------|
| `vw_resumo_financeiro` | Agrega saldos bancários | Dashboard, Financeiro |
| `v_aniversariantes_fornecedores` | Lista aniversariantes de fornecedores/contatos | AppSidebar (alerta de aniversários) |

#### 5.2.2 RPC (Remote Procedure Calls)

**Inicialização de Dados Padrão:**

| Função | Quando É Chamada | O Que Faz |
|--------|------------------|-----------|
| `criar_categorias_padrao(user_id)` | Primeiro acesso (trigger) | Cria categorias de receitas padrão (Bolos, Tortas, etc.) |
| `criar_categorias_plano_padrao(user_id)` | Configurações > Plano de Contas | Cria categorias do plano de contas padrão (Receitas, Custos, Despesas) |
| `criar_planos_contas_padrao(user_id)` | Configurações > Plano de Contas | Cria plano de contas padrão completo |
| `criar_bancos_oficiais_usuario(user_id)` | Configurações > Bancos | Cria lista de bancos brasileiros oficiais (Nubank, Inter, BB, etc.) |
| `criar_banco_caixa_empresa_padrao(user_id)` | Primeiro acesso (trigger) | Cria banco "Caixa Empresa" (código 000) |
| `criar_tags_padrao_encomendas(user_id)` | Configurações > Tags | Cria tags padrão (Aniversário, Casamento, etc.) |

**Funções de Cálculo:**

| Função | Uso |
|--------|-----|
| `calcular_custo_pre_preparo(preparo_id)` | Trigger ao modificar ingredientes de pré-preparo |
| `calcular_juros_com_config(user_id, valor_parcela, data_venc, data_pag)` | Cálculo de juros/multa ao dar baixa |
| `calcular_juros_atraso(valor, data_venc, data_pag, taxa)` | Cálculo de juros simples |

**Funções de Utilidade:**

| Função | Uso |
|--------|-----|
| `get_aniversariantes_fornecedores_mes(mes)` | Lista aniversariantes de fornecedores de um mês específico |
| `get_aniversariantes_mes(mes)` | Lista aniversariantes de clientes/familiares de um mês |
| `get_todos_aniversariantes(user_id)` | Lista todos os aniversariantes (clientes + familiares + contatos fornecedores) |
| `get_faturamento_mes(user_id, ano, mes)` | Retorna faturamento de um mês específico |

**Funções Admin:**

| Função | Uso |
|--------|-----|
| `is_admin(user_id)` | Verifica se usuário é admin |
| `log_admin_action(...)` | Registra ação administrativa em `admin_logs` |
| `hard_delete_user_data(user_id, admin_id)` | Exclusão completa de usuário e dados (backup em `deleted_data_backup`) |

---

### 5.3 Views Órfãs (Não Usadas no Código)

**Identificadas mas não removidas (aguardando validação de uso futuro):**

| View | Onde Aparece | Status |
|------|--------------|--------|
| `v_aniversariantes_completa` | Apenas em `types.ts` | **LEGADO** - Não consultada no código |
| `vw_contas_receber_dashboard` | Apenas em `types.ts` | **LEGADO** - Não consultada no código |

**Recomendação:** Manter por enquanto, pois podem ser úteis para futuras funcionalidades de dashboard.

---

## 6. HOOKS CUSTOMIZADOS E SUA RESPONSABILIDADE

### 6.1 Hooks de Autenticação e Perfil

| Hook | Função | Tabelas | Onde É Usado |
|------|--------|---------|--------------|
| `useAuth()` | Gerencia autenticação (user, session, signIn, signOut) | auth.users | Todos os componentes que precisam de user |
| `useUserId()` | Retorna `user.id` (lança erro se não autenticado) | - | Hooks que precisam garantir autenticação |
| `useUserProfile()` | Busca dados do perfil (`profiles`) | `profiles` | Dashboard, Planejamento, Configurações |
| `useIsAdmin()` | Verifica se usuário é admin | `user_roles` | AppSidebar, Admin pages |

---

### 6.2 Hooks de Cadastros

| Hook | Função | Tabelas | Onde É Usado |
|------|--------|---------|--------------|
| `useClientes()` | CRUD de clientes | `clientes` | Clientes, Encomendas (autocomplete) |
| `useFamiliares(clienteId?)` | CRUD de familiares | `cliente_familiares` | Clientes (lista de familiares) |
| `useFornecedores()` | CRUD de fornecedores | `fornecedores` | Fornecedores, Contas a Pagar |
| `useFornecedorContatos(fornecedorId?)` | CRUD de contatos de fornecedor | `fornecedor_contatos` | Fornecedores (lista de contatos) |

---

### 6.3 Hooks de Encomendas

| Hook | Função | Tabelas | Onde É Usado |
|------|--------|---------|--------------|
| `useEncomendas()` | CRUD de encomendas | `encomendas`, `encomendas_tags` | Encomendas, Dashboard |
| `useEncomendaItens(encomendaId)` | CRUD de itens da encomenda | `encomenda_itens` | Encomendas (modal de produtos) |

---

### 6.4 Hooks de Precificação

| Hook | Função | Tabelas | Onde É Usado |
|------|--------|---------|--------------|
| `useReceitas()` | CRUD de receitas | `receitas` | Receitas, Encomendas, Precificacao |
| `useCalculosReceita()` | Calcula CMV, margem, lucro de TODAS as receitas | `receitas`, `receitas_ingredientes`, `receitas_embalagens`, `receitas_mao_obra`, `receitas_despesas_venda` | Precificacao (tabela de produtos), ReceitaForm |
| `useMaoObraPerfis()` | CRUD de perfis de mão de obra | `mao_obra_perfis` | MaoDeObra, useCalculosReceita |
| `useMaoObraHistorico(perfilId?)` | Histórico de alterações de valor/hora | `mao_obra_perfis_historico` | MaoDeObra (modal de histórico) |
| `useReceitasMaoObra(receitaId)` | CRUD de mão de obra da receita | `receitas_mao_obra` | ReceitaForm |
| `usePrePreparosMaoObra(prePreparoId)` | CRUD de mão de obra do pré-preparo | `pre_preparos_mao_obra` | PrePreparoForm |

---

### 6.5 Hooks de Configuração

| Hook | Função | Tabelas | Onde É Usado |
|------|--------|---------|--------------|
| `useCategorias()` | CRUD de categorias de receitas | `categorias` | Categorias, ReceitaForm |
| `useUnidadesMedida()` | CRUD de unidades de medida | `unidades_medida` | UnidadesMedida, ReceitaForm |
| `useTiposDocumento()` | CRUD de tipos de documentos | `tipos_documento` | TiposDocumentos, Financeiro |

---

### 6.6 Hooks de Planejamento

| Hook | Função | Tabelas | Onde É Usado |
|------|--------|---------|--------------|
| `usePlanejamento()` | Calcula previsão de faturamento, projeção de vendas | `encomendas`, `profiles` | **Página Planejamento (órfã - sem rota)** |

**Observação:** `usePlanejamento()` é um hook completo e funcional, mas a página `/planejamento` não está roteada em `App.tsx`.

---

### 6.7 Hooks de Utilidade

| Hook | Função | Onde É Usado |
|------|--------|--------------|
| `useViaCEP()` | Busca CEP via API ViaCEP | Clientes (preenchimento automático de endereço) |
| `useCustosFixos()` | CRUD de custos fixos | **LEGADO** - Não usado ativamente |

---

## 7. RLS E SEGURANÇA

### 7.1 Estratégia de Segurança Geral

**Princípio:** Multi-tenant por `usuario_id`

**Como Funciona:**
1. Todas as tabelas de dados têm a coluna `usuario_id` (UUID)
2. RLS (Row Level Security) ativado em TODAS as tabelas
3. Políticas RLS filtram por `auth.uid() = usuario_id`
4. Usuário só vê/edita seus próprios dados

**Exemplo de Política:**
```sql
CREATE POLICY "Users can view own clientes"
ON clientes FOR SELECT
USING (auth.uid() = usuario_id);
```

---

### 7.2 Tabelas e RLS

#### 7.2.1 Tabelas de Dados (RLS por `usuario_id`)

**Tabelas:**
- `clientes`, `cliente_familiares`
- `fornecedores`, `fornecedor_contatos`
- `encomendas`, `encomenda_itens`
- `receitas`, `receitas_*`
- `pre_preparos`, `pre_preparos_*`
- `ingredientes`, `embalagens`
- `contas_receber`, `contas_receber_*`
- `contas_pagar`, `contas_pagar_*`
- `bancos`, `saldos_iniciais_bancos`
- `plano_contas`, `categorias_plano_contas`
- `tipos_documento`, `configuracoes_juros`
- `mao_obra_perfis`, `mao_obra_perfis_historico`
- `categorias`, `unidades_medida`, `tipos_insumos`

**Políticas Padrão:**
```sql
-- SELECT
USING (auth.uid() = usuario_id)

-- INSERT
WITH CHECK (auth.uid() = usuario_id)

-- UPDATE
USING (auth.uid() = usuario_id)
WITH CHECK (auth.uid() = usuario_id)

-- DELETE
USING (auth.uid() = usuario_id)
```

---

#### 7.2.2 Tabelas Admin (RLS por `is_admin()`)

**Tabelas:**
- `user_roles`
- `admin_logs`

**Políticas:**
```sql
-- user_roles: apenas admins podem ver/editar
CREATE POLICY "Admins can manage roles"
ON user_roles FOR ALL
USING (is_admin(auth.uid()))
WITH CHECK (is_admin(auth.uid()));

-- admin_logs: apenas admins podem ver
CREATE POLICY "Admins can view logs"
ON admin_logs FOR SELECT
USING (is_admin(auth.uid()));
```

---

#### 7.2.3 Tabela `profiles` (RLS por `id`)

**Políticas:**
```sql
-- Usuário vê/edita apenas seu próprio perfil
CREATE POLICY "Users can view own profile"
ON profiles FOR SELECT
USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
ON profiles FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);
```

**Exceção para Admins:**
Admins podem ver todos os perfis via Service Role (não via RLS, mas via edge function `criar-usuario`).

---

#### 7.2.4 Tabelas Compartilhadas (RLS especial)

**`tags_encomendas`:**
- Tags podem ser do sistema (`padrao_sistema = true`) ou do usuário
- Usuário vê tags do sistema + tags próprias
- Usuário só pode editar/deletar tags próprias

```sql
CREATE POLICY "Users can view all active tags"
ON tags_encomendas FOR SELECT
USING (ativo = true AND (user_id IS NULL OR user_id = auth.uid()));

CREATE POLICY "Users can manage own tags"
ON tags_encomendas FOR ALL
USING (user_id = auth.uid() AND padrao_sistema = false)
WITH CHECK (user_id = auth.uid() AND padrao_sistema = false);
```

---

### 7.3 Operações que Exigem Service Role

**Edge Functions:**
- `criar-usuario`: Criação de usuário no Supabase Auth + inserção em `profiles` + `user_roles`
  - Usa Service Role Key (ignora RLS)
  - Apenas admins podem chamar (validação na função)

**Funções SQL (RPC):**
- `hard_delete_user_data(user_id, admin_id)`: Exclusão completa de usuário
  - Marcada como `SECURITY DEFINER` (roda com permissões do owner)
  - Valida se `admin_id` é admin antes de executar

---

### 7.4 Validações de Segurança no Frontend

**AuthContext:**
```typescript
// Validação de conta ativa
if (!userProfile.ativo) {
  await supabase.auth.signOut();
  throw new Error('Conta inativa');
}
```

**useIsAdmin:**
```typescript
// Verifica role 'admin' antes de exibir seção Admin
const { isAdmin } = useIsAdmin();
if (!isAdmin) {
  navigate('/dashboard'); // redireciona
}
```

**ProtectedRoute:**
```typescript
if (!user) {
  return <Navigate to="/auth/login" />;
}
```

---

### 7.5 Pontos Críticos de Segurança

**✅ Implementado Corretamente:**
- RLS ativo em todas as tabelas de dados
- Isolamento por `usuario_id`
- Controle de role (admin/user)
- Validação de conta ativa no login
- Edge functions validam permissão admin

**⚠️ Atenção:**
- Views órfãs (`v_aniversariantes_completa`, `vw_contas_receber_dashboard`) não têm RLS configurado mas não são usadas no código
- Service Role Key exposta em edge functions (comportamento normal, mas requer validação de admin na função)

---

## 8. PONTOS DE USO PARCIAL / OBSERVAÇÕES

### 8.1 Funcionalidades Órfãs Identificadas

#### 8.1.1 Página Planejamento (Órfã)

**Status:** Código completo e funcional, mas **SEM ROTA**.

**Arquivo:** `src/pages/Planejamento.tsx` (existe, mas não está em App.tsx)

**Hook:** `usePlanejamento()` (ativo e funcional)

**Funcionalidade:**
- Previsão de Faturamento (meta mensal, percentual atingido)
- Projeção de Vendas (tendência de crescimento/queda)
- Comparativo com mês anterior

**Recomendação:**  
Adicionar rota em `App.tsx`:
```typescript
<Route path="/planejamento" element={<ProtectedRoute><Layout><Planejamento /></Layout></ProtectedRoute>} />
```

---

#### 8.1.2 Views SQL Não Consultadas

**Views Órfãs:**
- `v_aniversariantes_completa`
- `vw_contas_receber_dashboard`

**Status:** Existem em `types.ts` (gerado automaticamente) mas nunca são consultadas no código.

**Recomendação:** Manter por enquanto (podem ser úteis para dashboards futuros).

---

#### 8.1.3 Tabela `custos_fixos`

**Status:** Existe no banco, tem RLS configurado, mas **NÃO É USADA ATIVAMENTE**.

**Hook:** `useCustosFixos()` (existe mas não é chamado em nenhuma página)

**Recomendação:** Avaliar se será implementado futuramente ou se deve ser removido.

---

### 8.2 Funcionalidades Parcialmente Implementadas

#### 8.2.1 Exportação para Excel

**Status:** Implementado em:
- ✅ Clientes (`Clientes.tsx`)
- ✅ Fornecedores (`Fornecedores.tsx`)
- ✅ Admin > Usuários (`Usuarios.tsx`)

**Não Implementado em:**
- ❌ Encomendas
- ❌ Receitas
- ❌ Financeiro

---

#### 8.2.2 Upload de Comprovantes

**Status:** Implementado em:
- ✅ Contas a Receber (tabela `contas_receber_comprovantes`)
- ✅ Contas a Pagar (tabela `contas_pagar_comprovantes`)

**Observação:** Storage não está sendo usado (URLs são salvas como `url_storage` mas sem upload real para Supabase Storage).

---

### 8.3 Dependências e Relacionamentos Importantes

**Encomendas → Financeiro:**
- Campo `conta_receber_id` em `encomendas` permite vincular encomenda a conta a receber
- Fluxo: Criar encomenda → Gerar financeiro → Vincula `conta_receber_id`

**Pré-Preparos → Receitas:**
- Pré-preparos podem ser usados como ingredientes em receitas
- Campo `e_pre_preparo` em `ingredientes` marca se o ingrediente é um pré-preparo

**Receitas → Encomendas:**
- Produtos de encomendas (`encomenda_itens`) referenciam receitas
- Permite rastrear quais produtos foram vendidos

---

### 8.4 Migração de Dados Legados

**Estruturas Removidas Recentemente (Limpeza de Nov/2025):**
- ❌ `admin_audit_log` (substituída por `admin_logs`)
- ❌ `user_statistics` (view nunca usada)
- ❌ `profiles.tags` (coluna decorativa nunca usada)

---

## 9. RESUMO EXECUTIVO

### 9.1 Estado Atual do Sistema

**✅ Núcleo Sólido e Funcional:**
- Autenticação completa com RLS
- Módulos principais (Encomendas, Clientes, Financeiro, Precificação) 100% funcionais
- Admin com gestão de usuários e auditoria
- Cálculos de custeio técnico robustos

**⚠️ Pontos de Atenção:**
- Página Planejamento sem rota (código pronto, mas inacessível)
- Views órfãs (podem ser úteis futuramente)
- Tabela `custos_fixos` não utilizada
- Exportação Excel parcial (só em algumas telas)

**🧹 Limpeza Recente:**
- Removidos arquivos mortos (ComingSoon, FluxoCaixa antigo, hooks e componentes órfãos)
- Removidas estruturas legadas de banco (`admin_audit_log`, `user_statistics`, `profiles.tags`)

---

### 9.2 Stack Tecnológico

**Frontend:**
- React 18 + TypeScript
- Vite (build tool)
- TanStack Query (data fetching)
- React Router v6 (navegação)
- Shadcn UI + Tailwind CSS (design system)
- Recharts (gráficos)
- date-fns (manipulação de datas)
- xlsx (exportação Excel)
- jspdf + jspdf-autotable (geração PDF)

**Backend:**
- Supabase (Lovable Cloud)
- PostgreSQL (banco de dados)
- Row Level Security (RLS)
- Edge Functions (Deno)
- Supabase Auth

---

### 9.3 Próximos Passos Recomendados

1. **Conectar Planejamento ao Menu:**
   - Adicionar rota em `App.tsx`
   - Adicionar card em `Dashboard` ou `AppSidebar`

2. **Avaliar Custos Fixos:**
   - Implementar funcionalidade completa OU
   - Remover tabela e hook definitivamente

3. **Completar Exportação Excel:**
   - Adicionar em Encomendas, Receitas, Financeiro

4. **Implementar Upload Real de Comprovantes:**
   - Usar Supabase Storage para armazenar arquivos
   - Atualizar `contas_*_comprovantes` com URLs reais

5. **Validar e Documentar Views Órfãs:**
   - Confirmar se `v_aniversariantes_completa` será usado
   - Implementar dashboard com `vw_contas_receber_dashboard`

---

**Documentação gerada em:** Novembro 2025  
**Autor:** Sistema SugarBox  
**Contato Técnico:** Equipe de Desenvolvimento
