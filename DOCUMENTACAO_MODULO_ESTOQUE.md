# 📦 Documentação do Módulo de Estoque

## Índice
1. [Visão Geral do Sistema](#visão-geral-do-sistema)
2. [Estrutura de Banco de Dados](#estrutura-de-banco-de-dados)
3. [Tipos de Dados e Enums](#tipos-de-dados-e-enums)
4. [Funcionalidades Principais](#funcionalidades-principais)
5. [Hook Principal](#hook-principal-useestoqueintegrado)
6. [Componentes Visuais](#componentes-visuais)
7. [Segurança e Permissões](#segurança-e-permissões)
8. [Integração com Outros Módulos](#integração-com-outros-módulos)
9. [Fluxo de Uso](#fluxo-típico-de-uso)

---

## 📊 Visão Geral do Sistema

O Módulo de Estoque é um sistema completo de gestão de inventário desenvolvido especificamente para negócios de confeitaria. Utiliza o método **FIFO (First In, First Out)** para controle preciso de custos e movimentações de estoque.

### Características Principais
- ✅ Controle de entrada e saída de produtos
- ✅ Rastreamento de lotes (FIFO)
- ✅ Cálculo automático de custo médio
- ✅ Alertas de estoque baixo
- ✅ Múltiplos preços por produto
- ✅ Integração com receitas e encomendas
- ✅ Relatórios detalhados
- ✅ Controle de validade

---

## 🗄️ Estrutura de Banco de Dados

### 1. Tabela `itens`
Armazena o cadastro completo dos itens do estoque.

**Campos Principais:**
```
- id: uuid (PK)
- usuario_id: uuid (FK)
- nome: text (obrigatório)
- tipo: text ('ingrediente' | 'embalagem' | 'outros')
- categoria: text (opcional)
- marca: text (opcional)
- descricao: text (opcional)
- unidade_base: text (g, kg, ml, l, un, caixa, pct)
- quantidade_por_embalagem: numeric (padrão: 1)
- conversoes: jsonb (conversões de unidades)
- rastrear_estoque: boolean (padrão: false)
- ponto_de_pedido: numeric (alerta de reposição)
- localizacao: text (localização física)
- fornecedor_padrao: text
- imagem_url: text
- observacoes: text
- ativo: boolean (padrão: true)
- criado_em: timestamp
- atualizado_em: timestamp
```

**Políticas RLS:**
- ✅ Usuários veem apenas seus próprios itens
- ✅ Isolamento por `usuario_id`

---

### 2. Tabela `precos`
Armazena múltiplos preços para cada item (diferentes marcas/fornecedores).

**Campos Principais:**
```
- id: uuid (PK)
- item_id: uuid (FK → itens)
- usuario_id: uuid (FK)
- marca: text (obrigatório)
- fornecedor: text (opcional)
- preco_total_embalagem: numeric (obrigatório)
- quantidade_embalagem: numeric (obrigatório)
- custo_unitario: numeric (calculado automaticamente)
- ativo: boolean (apenas um ativo por item)
- data_coleta: timestamp
- link_compra: text
- observacao: text
- criado_em: timestamp
```

**Cálculo Automático:**
```typescript
custo_unitario = preco_total_embalagem / quantidade_embalagem
```

**Exemplo:**
- Embalagem com 1kg de farinha por R$ 5,00
- Custo unitário: R$ 5,00 / 1000g = R$ 0,005 por grama

---

### 3. Tabela `movimentacoes_estoque`
Registra todas as movimentações de entrada, saída, perda e ajuste.

**Campos Principais:**
```
- id: uuid (PK)
- item_id: uuid (FK → itens)
- usuario_id: uuid (FK)
- tipo: enum ('entrada' | 'saida' | 'perda' | 'ajuste')
- subtipo: text (motivo detalhado)
- quantidade: numeric (obrigatório)
- custo_unitario: numeric
- valor_total: numeric
- data: timestamp (obrigatório)
- referencia_id: uuid (link para receita/encomenda)
- referencia_tipo: text ('receita' | 'encomenda' | etc)
- responsavel: text
- observacao: text
- criado_em: timestamp
```

**Tipos de Movimentação:**
1. **Entrada**: Compra de produtos
2. **Saída**: Uso em produção ou venda
3. **Perda**: Vencimento, quebra, descarte
4. **Ajuste**: Correção de inventário

---

### 4. Tabela `entradas_detalhadas`
Controla os lotes de entrada para implementação do método FIFO.

**Campos Principais:**
```
- id: uuid (PK)
- item_id: uuid (FK → itens)
- usuario_id: uuid (FK)
- movimentacao_entrada_id: uuid (FK → movimentacoes_estoque)
- tipo_item: enum ('ingrediente' | 'embalagem' | 'outros')
- data_entrada: date (obrigatório)
- quantidade_inicial: numeric (quantidade comprada)
- quantidade_restante: numeric (atualizado nas saídas)
- custo_unitario: numeric (custo específico deste lote)
- validade: date (opcional)
- status: enum ('disponivel' | 'esgotado' | 'vencido')
- created_at: timestamp
```

**Funcionamento FIFO:**
1. Cada entrada cria um novo lote
2. Saídas consomem primeiro os lotes mais antigos
3. `quantidade_restante` é atualizado a cada saída
4. Status muda para 'esgotado' quando quantidade_restante = 0

**Exemplo de Lotes:**
```
Lote 1: 5kg farinha a R$ 0,004/g (mais antigo)
Lote 2: 3kg farinha a R$ 0,005/g
Lote 3: 2kg farinha a R$ 0,0045/g (mais recente)

Saída de 6kg:
- Consome 5kg do Lote 1 (R$ 0,004 × 5000g = R$ 20,00)
- Consome 1kg do Lote 2 (R$ 0,005 × 1000g = R$ 5,00)
- Custo total da saída: R$ 25,00
- Custo médio: R$ 25,00 / 6000g = R$ 0,00417/g
```

---

### 5. Tabela `estoque_atual`
Visão consolidada e agregada do saldo de cada item.

**Campos Principais:**
```
- id: uuid (PK)
- item_id: uuid (FK → itens, UNIQUE)
- usuario_id: uuid (FK)
- tipo_item: enum ('ingrediente' | 'embalagem' | 'outros')
- quantidade_atual: numeric (saldo atual)
- custo_medio: numeric (custo médio ponderado)
- valor_total: numeric (quantidade × custo_medio)
- ultima_atualizacao: timestamp
```

**Atualização Automática:**
- Triggers do banco de dados atualizam automaticamente
- Recalcula após cada movimentação
- Mantém histórico preciso de valores

**Cálculo do Custo Médio Ponderado:**
```typescript
// Exemplo com movimentações:
Entrada 1: 10kg a R$ 4,00/kg = R$ 40,00
Entrada 2: 5kg a R$ 5,00/kg = R$ 25,00

Total: 15kg por R$ 65,00
Custo Médio: R$ 65,00 / 15kg = R$ 4,33/kg

Após saída de 8kg:
Saldo: 7kg
Valor: 7kg × R$ 4,33/kg = R$ 30,31
```

---

## 📋 Tipos de Dados e Enums

### Tipos TypeScript

```typescript
// Tipo do Item
export type TipoItem = 'ingrediente' | 'embalagem' | 'outros';

// Unidades de Medida
export type UnidadeBase = 'g' | 'kg' | 'ml' | 'l' | 'un' | 'caixa' | 'pct';

// Tipo de Movimentação
export type TipoMovimento = 'entrada' | 'saida' | 'perda' | 'ajuste';

// Status do Estoque
export type StatusEstoque = 
  | 'ok'           // Estoque acima do ponto de pedido
  | 'atencao'      // Entre 50% e 100% do ponto de pedido
  | 'baixo'        // Abaixo do ponto de pedido
  | 'zerado'       // Quantidade = 0
  | 'sem_rastreio' // Item não rastreado
;
```

### Interfaces Principais

```typescript
// Item Completo
export interface Item {
  id: string;
  usuario_id: string;
  tipo: TipoItem;
  categoria?: string;
  nome: string;
  descricao?: string;
  unidade_base: UnidadeBase;
  quantidade_por_embalagem: number;
  conversoes?: Record<string, any>;
  rastrear_estoque: boolean;
  ponto_de_pedido?: number;
  localizacao?: string;
  fornecedor_padrao?: string;
  imagem_url?: string;
  ativo: boolean;
  observacoes?: string;
  criado_em: string;
  atualizado_em: string;
}

// Preço do Item
export interface Preco {
  id: string;
  item_id: string;
  usuario_id: string;
  marca: string;
  fornecedor?: string;
  preco_total_embalagem: number;
  quantidade_embalagem: number;
  custo_unitario: number;
  ativo: boolean;
  data_coleta: string;
  link_compra?: string;
  observacao?: string;
  criado_em: string;
}

// Movimentação de Estoque
export interface MovimentoEstoque {
  id: string;
  item_id: string;
  usuario_id: string;
  tipo: TipoMovimento;
  subtipo?: string;
  quantidade: number;
  custo_unitario?: number;
  valor_total?: number;
  data: string;
  referencia_id?: string;
  referencia_tipo?: string;
  responsavel?: string;
  observacao?: string;
  criado_em: string;
}

// Estoque Atual (Saldo)
export interface EstoqueAtual {
  item_id: string;
  usuario_id: string;
  nome: string;
  tipo: TipoItem;
  categoria?: string;
  unidade_base: string;
  ponto_de_pedido?: number;
  saldo: number;
  custo_medio: number;
  valor_estoque: number;
  ultima_movimentacao?: string;
}

// Item com Estoque (Visão Completa)
export interface ItemComEstoque extends Item {
  estoque?: EstoqueAtual;
  preco_ativo?: Preco;
  status?: StatusEstoque;
}

// Filtros de Busca
export interface FiltrosEstoque {
  tipo?: TipoItem;
  categoria?: string;
  status?: StatusEstoque;
  rastrear_estoque?: boolean;
  busca?: string;
}

// Resumo do Estoque
export interface ResumoEstoque {
  total_itens: number;
  itens_rastreados: number;
  alertas_baixo: number;
  alertas_zerado: number;
  valor_total: number;
}
```

---

## 🎯 Funcionalidades Principais

### 1. Cadastro de Itens

**Localização:** `/estoque` (Página CatalogoItens)

#### Informações Básicas
- **Nome do Item**: Campo obrigatório, identificador principal
- **Tipo**: Seleção entre Ingrediente, Embalagem ou Outros
- **Categoria**: Classificação customizável (opcional)
- **Marca**: Identificação do fabricante (opcional)
- **Descrição**: Detalhes adicionais sobre o produto

#### Configurações de Estoque
- **Rastrear Estoque**: Toggle para ativar/desativar controle
  - Quando desativado: Item não aparece nos relatórios de estoque
  - Quando ativado: Habilita todas as funcionalidades de controle
  
- **Unidade de Medida Base**: Unidade padrão para cálculos
  - Peso: g, kg
  - Volume: ml, l
  - Unidade: un, caixa, pct

- **Quantidade por Embalagem**: Quantas unidades vêm na embalagem
  - Exemplo: Caixa com 12 unidades = 12
  - Usado para converter entre embalagem e unidade base

- **Ponto de Pedido**: Quantidade mínima antes de alerta
  - Sistema gera alerta quando estoque < ponto_de_pedido
  - Status muda para "baixo" ou "atencao"

- **Localização**: Onde o item fica armazenado fisicamente
  - Exemplo: "Prateleira A3", "Freezer 2", "Depósito"

- **Fornecedor Padrão**: Fornecedor preferencial para compras

#### Precificação Multi-marca
Sistema permite cadastrar múltiplos preços para o mesmo item:

**Campos do Preço:**
- Marca/Fabricante (obrigatório)
- Fornecedor (opcional)
- Preço total da embalagem
- Quantidade na embalagem
- **Custo unitário** (calculado automaticamente)
- Link de compra (para reposição rápida)
- Data da coleta do preço
- Observações
- Status ativo/inativo (apenas 1 preço ativo por vez)

**Exemplo de Múltiplos Preços:**
```
Farinha de Trigo:
├─ Marca Sinhá - 1kg - R$ 4,50 (R$ 0,0045/g) - ATIVO
├─ Marca Rosa Branca - 1kg - R$ 5,20 (R$ 0,0052/g)
└─ Marca Dona Benta - 5kg - R$ 21,00 (R$ 0,0042/g)
```

#### Recursos Adicionais
- **Upload de Imagem**: Foto do produto para identificação visual
- **Conversões de Unidades**: JSON para conversões customizadas
- **Observações**: Notas gerais sobre o item
- **Ativar/Desativar**: Ocultar itens sem deletar o histórico

---

### 2. Movimentações de Estoque

#### 2.1 Entrada de Produtos

**Dialog:** `NovaEntradaDialog`

**Campos do Formulário:**
1. **Data da Compra** (obrigatório)
   - Formato: DD/MM/AAAA
   - Máscara automática durante digitação
   - Seletor de calendário disponível

2. **Local de Compra/Fornecedor**
   - Onde foi adquirido o produto
   - Útil para histórico de compras

3. **Quantidade** (obrigatório)
   - Quantidade adquirida na unidade base
   - Validação: deve ser > 0

4. **Custo Total** (obrigatório)
   - Valor total pago na compra
   - Sistema calcula custo unitário automaticamente

5. **Data de Validade** (opcional)
   - Importante para controle de perdas
   - Permite alertas de produtos próximos ao vencimento

6. **Observações** (opcional)
   - Notas sobre a compra
   - Condições especiais, promoções, etc.

**Processo de Registro:**
```typescript
1. Valida dados do formulário
2. Calcula custo_unitario = custo_total / quantidade
3. Busca usuario_id do usuário logado
4. Insere em movimentacoes_estoque:
   - tipo: 'entrada'
   - data da movimentação
   - quantidade
   - custo_unitario
   - valor_total

5. Cria lote em entradas_detalhadas:
   - quantidade_inicial = quantidade
   - quantidade_restante = quantidade
   - custo_unitario (específico deste lote)
   - data_entrada
   - validade (se informada)
   - status: 'disponivel'

6. Atualiza estoque_atual (via trigger):
   - quantidade_atual += quantidade
   - Recalcula custo_medio ponderado
   - Recalcula valor_total
   - Atualiza ultima_atualizacao

7. Exibe toast de sucesso
8. Recarrega lista de itens
```

**Exemplo Prático:**
```
Compra de Farinha:
- Data: 15/11/2025
- Local: Atacadão do Centro
- Quantidade: 5kg (5000g)
- Custo Total: R$ 22,50
- Custo Unitário: R$ 0,0045/g
- Validade: 15/05/2026

Sistema registra:
✓ Movimentação de entrada
✓ Novo lote FIFO com 5000g disponíveis
✓ Atualiza saldo: +5000g
✓ Recalcula custo médio
```

---

#### 2.2 Saída de Produtos

**Dialog:** `NovaSaidaDialog`

**Campos do Formulário:**
1. **Data da Saída** (obrigatório)
   - Formato: DD/MM/AAAA
   - Data em que o produto foi utilizado/vendido

2. **Motivo da Saída**
   - Produção de receita
   - Venda direta
   - Amostra/degustação
   - Outros motivos

3. **Quantidade** (obrigatório)
   - Quantidade a ser retirada
   - Sistema valida se há estoque disponível

4. **Observações** (opcional)
   - Detalhes sobre a utilização
   - Referência a receita ou encomenda

**Campos OCULTOS quando tipo = "saída":**
- ❌ Valor (não necessário)
- ❌ Data de Validade (não aplicável)

**Processo de Saída (FIFO):**
```typescript
1. Valida quantidade disponível
   - Se quantidade > estoque atual: ERRO

2. Busca lotes disponíveis ordenados por data_entrada ASC
   - WHERE status = 'disponivel'
   - WHERE quantidade_restante > 0
   - ORDER BY data_entrada ASC (mais antigo primeiro)

3. Consome lotes seguindo FIFO:
   let quantidadeRestante = quantidadeSolicitada;
   let custoTotal = 0;

   for each lote (do mais antigo ao mais novo) {
     if (quantidadeRestante === 0) break;
     
     const quantidadeDoLote = Math.min(
       lote.quantidade_restante,
       quantidadeRestante
     );
     
     // Calcula custo específico deste lote
     custoTotal += quantidadeDoLote * lote.custo_unitario;
     
     // Atualiza lote
     lote.quantidade_restante -= quantidadeDoLote;
     
     if (lote.quantidade_restante === 0) {
       lote.status = 'esgotado';
     }
     
     quantidadeRestante -= quantidadeDoLote;
   }

4. Registra movimentação:
   - tipo: 'saida'
   - quantidade
   - custo_unitario: custoTotal / quantidadeSolicitada
   - valor_total: custoTotal

5. Atualiza estoque_atual:
   - quantidade_atual -= quantidade
   - Recalcula custo_medio
   - Recalcula valor_total

6. Atualiza status do item (se necessário):
   - Se quantidade_atual === 0: status = 'zerado'
   - Se quantidade_atual < ponto_de_pedido: status = 'baixo'
```

**Exemplo de Saída FIFO:**
```
Estado Inicial:
Lote 1: 3000g a R$ 0,0040/g (mais antigo)
Lote 2: 4000g a R$ 0,0045/g
Lote 3: 2000g a R$ 0,0048/g (mais recente)

Saída de 5000g:
1. Consome 3000g do Lote 1:
   - Custo: 3000g × R$ 0,0040 = R$ 12,00
   - Lote 1: quantidade_restante = 0 (status: esgotado)

2. Consome 2000g do Lote 2:
   - Custo: 2000g × R$ 0,0045 = R$ 9,00
   - Lote 2: quantidade_restante = 2000g (ainda disponível)

3. Custo Total da Saída:
   - R$ 12,00 + R$ 9,00 = R$ 21,00
   - Custo Médio: R$ 21,00 / 5000g = R$ 0,0042/g

Estado Final:
Lote 1: 0g (esgotado)
Lote 2: 2000g a R$ 0,0045/g
Lote 3: 2000g a R$ 0,0048/g (não usado)
Saldo Total: 4000g
```

**Validações Importantes:**
- ✅ Não permite saída > estoque disponível
- ✅ Alerta se estoque ficar abaixo do ponto de pedido
- ✅ Atualiza status visualmente (cores de alerta)

---

#### 2.3 Ajuste de Estoque

**Dialog:** `AtualizarEstoqueDialog`

**Quando Usar:**
- Divergências no inventário físico
- Correção de erros de lançamento
- Acerto após contagem de estoque
- Perda não registrada anteriormente

**Campos Dinâmicos Conforme Tipo:**

**Campo Sempre Visível:**
1. **Data da Movimentação** (obrigatório)
   - Quando ocorreu a movimentação/ajuste
   - Formato: DD/MM/AAAA com máscara

**Seleção de Tipo:**
- ✓ Entrada
- ✓ Saída  
- ✓ Ajuste

**Se Tipo = ENTRADA:**
- ✅ Campo Quantidade (obrigatório)
- ✅ Campo Valor (opcional)
- ✅ Campo Data de Validade (opcional)
- ✅ Campo Observação (opcional)

**Se Tipo = SAÍDA:**
- ✅ Campo Quantidade (obrigatório)
- ❌ Campo Valor (OCULTO)
- ❌ Campo Data de Validade (OCULTO)
- ✅ Campo Observação (opcional)

**Se Tipo = AJUSTE:**
- ✅ Todos os campos disponíveis
- Permite correções completas
- Importante documentar o motivo na observação

**Processo de Ajuste:**
```typescript
1. Identifica o tipo de ajuste
2. Se for correção para cima (entrada):
   - Cria novo lote FIFO
   - Adiciona quantidade ao estoque
   
3. Se for correção para baixo (saída):
   - Consome dos lotes existentes (FIFO)
   - Reduz quantidade do estoque

4. Registra movimentação com tipo 'ajuste'
5. Atualiza estoque_atual
6. Recalcula valores e custos médios
```

**Exemplo de Ajuste:**
```
Contagem Física vs Sistema:
Sistema: 7500g
Físico: 7200g
Diferença: -300g (perda não registrada)

Ajuste:
- Tipo: Saída
- Quantidade: 300g
- Observação: "Ajuste pós-inventário - perda por umidade"
- Sistema registra saída de 300g
- Novo saldo: 7200g (correto)
```

---

### 3. Controle de Estoque Atual

#### Cálculos Automáticos

**1. Quantidade Atual**
```typescript
quantidade_atual = Σ(entradas) - Σ(saídas) - Σ(perdas) + Σ(ajustes)
```

**2. Custo Médio Ponderado**
```typescript
custo_medio = Σ(custo_unitario × quantidade) / Σ(quantidade)
```

**Exemplo:**
```
Entrada 1: 10kg a R$ 4,00/kg
Entrada 2: 5kg a R$ 5,00/kg
Entrada 3: 3kg a R$ 4,50/kg

Custo Médio = (10×4 + 5×5 + 3×4,5) / (10+5+3)
            = (40 + 25 + 13,5) / 18
            = 78,5 / 18
            = R$ 4,36/kg
```

**3. Valor Total do Estoque**
```typescript
valor_total = quantidade_atual × custo_medio
```

**4. Última Movimentação**
- Data e hora do último registro
- Tipo da movimentação (entrada/saída/ajuste)

---

#### Status do Estoque

O sistema classifica automaticamente cada item:

**1. Status "OK" (Verde)**
```typescript
Status = 'ok' quando:
- rastrear_estoque = true
- quantidade_atual > ponto_de_pedido
- ponto_de_pedido foi configurado
```

**2. Status "ATENÇÃO" (Amarelo)**
```typescript
Status = 'atencao' quando:
- rastrear_estoque = true
- quantidade_atual <= ponto_de_pedido
- quantidade_atual > (ponto_de_pedido × 0,5)
```

**3. Status "BAIXO" (Laranja)**
```typescript
Status = 'baixo' quando:
- rastrear_estoque = true
- quantidade_atual <= (ponto_de_pedido × 0,5)
- quantidade_atual > 0
```

**4. Status "ZERADO" (Vermelho)**
```typescript
Status = 'zerado' quando:
- rastrear_estoque = true
- quantidade_atual = 0
```

**5. Status "SEM RASTREIO" (Cinza)**
```typescript
Status = 'sem_rastreio' quando:
- rastrear_estoque = false
```

**Exemplo Visual:**
```
Farinha (Ponto de Pedido: 5000g)
├─ 8000g → 🟢 OK
├─ 4000g → 🟡 ATENÇÃO
├─ 2000g → 🟠 BAIXO
└─ 0g    → 🔴 ZERADO
```

---

### 4. Visualização e Filtros

#### Página Principal (`/estoque`)

**Resumo em Tempo Real:**

No topo da página, cards com indicadores:

```
┌──────────────────┐ ┌──────────────────┐ ┌──────────────────┐
│ Total de Itens   │ │ Itens Rastreados │ │ Alertas Baixo    │
│      247         │ │       198        │ │        12        │
└──────────────────┘ └──────────────────┘ └──────────────────┘

┌──────────────────┐ ┌──────────────────┐
│ Alertas Zerado   │ │ Valor Total      │
│        5         │ │   R$ 15.847,23   │
└──────────────────┘ └──────────────────┘
```

---

#### Sistema de Filtros

**1. Busca por Nome**
- Campo de texto livre
- Busca em tempo real (debounced)
- Procura em: nome, marca, descrição

**2. Filtro por Tipo**
- Dropdown multi-seleção
- Opções:
  - 🥚 Ingrediente
  - 📦 Embalagem
  - 🔧 Outros

**3. Filtro por Categoria**
- Dropdown com categorias cadastradas
- Lista dinâmica baseada nos itens
- Exemplo: Farinhas, Açúcares, Laticínios, etc.

**4. Filtro por Status**
- Dropdown multi-seleção
- Opções:
  - 🟢 OK
  - 🟡 Atenção
  - 🟠 Baixo
  - 🔴 Zerado
  - ⚪ Sem Rastreio

**5. Filtro por Rastreamento**
- Toggle simples
- Opções:
  - ✓ Apenas rastreados
  - ✗ Apenas não rastreados
  - ○ Todos

**Exemplo de Filtro Combinado:**
```
Busca: "açúcar"
Tipo: Ingrediente
Status: Baixo, Zerado
Rastreamento: Apenas rastreados

Resultado: Todos os ingredientes de açúcar com estoque
baixo ou zerado que possuem rastreamento ativo
```

---

#### Cards de Itens

Cada item é exibido em um card com:

**Cabeçalho:**
```
┌─────────────────────────────────────┐
│ [IMG] FARINHA DE TRIGO SINHÁ        │
│       Marca Sinhá                   │
│       [Badge: Ingrediente] [Status] │
└─────────────────────────────────────┘
```

**Corpo do Card:**
```
├─ Categoria: Farinhas
├─ Estoque: 8.500g
├─ Custo Médio: R$ 0,0045/g
├─ Valor Total: R$ 38,25
├─ Ponto de Pedido: 5.000g
├─ Última Mov.: 15/11/2025 14:30
└─ Status: 🟢 OK
```

**Rodapé (Ações Rápidas):**
```
┌─────────────────────────────────────┐
│ [➕ Entrada] [➖ Saída] [🔄 Ajustar] │
│ [✏️ Editar] [🗑️ Excluir]           │
└─────────────────────────────────────┘
```

**Cores por Status:**
- Verde suave: OK
- Amarelo claro: Atenção
- Laranja claro: Baixo
- Vermelho claro: Zerado
- Cinza claro: Sem rastreio

---

### 5. Ações Disponíveis

#### Ações por Item

**1. ➕ Nova Entrada**
- Abre `NovaEntradaDialog`
- Registra compra de produto
- Cria novo lote FIFO

**2. ➖ Nova Saída**
- Abre `NovaSaidaDialog`
- Registra uso/venda
- Consome lotes pelo método FIFO

**3. 🔄 Ajustar Estoque**
- Abre `AtualizarEstoqueDialog`
- Permite entrada/saída/ajuste
- Útil para correções de inventário

**4. ✏️ Editar Cadastro**
- Abre `ModalItem` em modo edição
- Permite alterar todas as informações
- Mantém histórico de movimentações

**5. 🗑️ Excluir Item**
- Validação: apenas se sem movimentações
- Confirmação obrigatória
- Exclusão permanente (sem soft delete)

---

#### Ações Gerais

**1. ➕ Adicionar Novo Item**
- Botão no topo da página
- Abre `ModalItem` vazio
- Cadastro completo de novo produto

**2. 📥 Exportar Dados**
- Formato: Excel (XLSX)
- Inclui: todos os itens filtrados
- Colunas: todas as informações + estoque

**3. 📤 Importar Dados**
- Formato aceito: Excel (XLSX)
- Template disponível para download
- Validação de dados antes de importar
- Preview antes de confirmar

**4. 🔄 Atualizar Listagem**
- Recarrega dados do servidor
- Útil após operações em massa
- Sincroniza com alterações de outros usuários

---

## 🔧 Hook Principal: `useEstoqueIntegrado`

### Localização
```typescript
src/hooks/useEstoqueIntegrado.ts
```

### Assinatura

```typescript
function useEstoqueIntegrado(filtros?: FiltrosEstoque): {
  // Estado
  itens: ItemComEstoque[];
  loading: boolean;
  resumo: ResumoEstoque;
  
  // Métodos
  carregarItens: () => Promise<void>;
  criarItem: (item: Partial<Item>) => Promise<void>;
  atualizarItem: (id: string, dados: Partial<Item>) => Promise<void>;
  salvarPreco: (itemId: string, preco: Partial<Preco>) => Promise<void>;
  registrarMovimento: (movimento: RegistroMovimento) => Promise<void>;
  ativarRastreamento: (itemId: string) => Promise<void>;
  desativarRastreamento: (itemId: string) => Promise<void>;
}
```

---

### Métodos Detalhados

#### 1. `carregarItens()`

Busca todos os itens do usuário com estoque e preços ativos.

```typescript
const carregarItens = useCallback(async () => {
  setLoading(true);
  try {
    // 1. Busca itens
    const { data: itensData } = await supabase
      .from('itens')
      .select('*')
      .eq('usuario_id', userId)
      .eq('ativo', true)
      .order('nome');

    // 2. Busca estoque atual
    const { data: estoqueData } = await supabase
      .from('estoque_atual')
      .select('*')
      .eq('usuario_id', userId);

    // 3. Busca preços ativos
    const { data: precosData } = await supabase
      .from('precos')
      .select('*')
      .eq('usuario_id', userId)
      .eq('ativo', true);

    // 4. Combina dados
    const itensCompletos = itensData.map(item => ({
      ...item,
      estoque: estoqueData.find(e => e.item_id === item.id),
      preco_ativo: precosData.find(p => p.item_id === item.id),
      status: getStatusEstoque(item, estoque)
    }));

    // 5. Aplica filtros
    const itensFiltrados = aplicarFiltros(itensCompletos, filtros);

    // 6. Calcula resumo
    const resumo = calcularResumo(itensFiltrados);

    setItens(itensFiltrados);
    setResumo(resumo);
  } catch (error) {
    toast.error('Erro ao carregar itens');
  } finally {
    setLoading(false);
  }
}, [userId, filtros]);
```

---

#### 2. `criarItem(item)`

Cria um novo item no catálogo.

```typescript
const criarItem = useCallback(async (item: Partial<Item>) => {
  try {
    // Validações
    if (!item.nome) throw new Error('Nome é obrigatório');
    if (!item.tipo) throw new Error('Tipo é obrigatório');
    if (!item.unidade_base) throw new Error('Unidade é obrigatória');

    // Insere item
    const { data, error } = await supabase
      .from('itens')
      .insert({
        ...item,
        usuario_id: userId,
        rastrear_estoque: item.rastrear_estoque ?? false,
        quantidade_por_embalagem: item.quantidade_por_embalagem ?? 1,
        ativo: true
      })
      .select()
      .single();

    if (error) throw error;

    // Se rastrear estoque, cria registro em estoque_atual
    if (item.rastrear_estoque) {
      await supabase
        .from('estoque_atual')
        .insert({
          item_id: data.id,
          usuario_id: userId,
          tipo_item: item.tipo,
          quantidade_atual: 0,
          custo_medio: 0,
          valor_total: 0
        });
    }

    toast.success('Item criado com sucesso');
    await carregarItens();
  } catch (error) {
    toast.error('Erro ao criar item');
    throw error;
  }
}, [userId, carregarItens]);
```

---

#### 3. `atualizarItem(id, dados)`

Atualiza informações de um item existente.

```typescript
const atualizarItem = useCallback(async (
  id: string, 
  dados: Partial<Item>
) => {
  try {
    const { error } = await supabase
      .from('itens')
      .update({
        ...dados,
        atualizado_em: new Date().toISOString()
      })
      .eq('id', id)
      .eq('usuario_id', userId);

    if (error) throw error;

    toast.success('Item atualizado');
    await carregarItens();
  } catch (error) {
    toast.error('Erro ao atualizar item');
    throw error;
  }
}, [userId, carregarItens]);
```

---

#### 4. `salvarPreco(itemId, preco)`

Cadastra ou atualiza preço de um item.

```typescript
const salvarPreco = useCallback(async (
  itemId: string,
  preco: Partial<Preco>
) => {
  try {
    // Se ativo = true, desativa outros preços do mesmo item
    if (preco.ativo) {
      await supabase
        .from('precos')
        .update({ ativo: false })
        .eq('item_id', itemId)
        .eq('usuario_id', userId);
    }

    // Calcula custo unitário
    const custoUnitario = preco.preco_total_embalagem! / 
                         preco.quantidade_embalagem!;

    // Insere novo preço
    const { error } = await supabase
      .from('precos')
      .insert({
        ...preco,
        item_id: itemId,
        usuario_id: userId,
        custo_unitario: custoUnitario,
        data_coleta: new Date().toISOString()
      });

    if (error) throw error;

    toast.success('Preço salvo');
    await carregarItens();
  } catch (error) {
    toast.error('Erro ao salvar preço');
    throw error;
  }
}, [userId, carregarItens]);
```

---

#### 5. `registrarMovimento(movimento)`

Registra uma movimentação de estoque (entrada/saída/ajuste).

```typescript
interface RegistroMovimento {
  item_id: string;
  tipo: TipoMovimento;
  quantidade: number;
  custo_unitario?: number;
  valor_total?: number;
  data?: string;
  observacao?: string;
  referencia_id?: string;
  referencia_tipo?: string;
}

const registrarMovimento = useCallback(async (
  movimento: RegistroMovimento
) => {
  try {
    // 1. Registra movimentação
    const { data: mov, error: movError } = await supabase
      .from('movimentacoes_estoque')
      .insert({
        ...movimento,
        usuario_id: userId,
        data: movimento.data || new Date().toISOString()
      })
      .select()
      .single();

    if (movError) throw movError;

    // 2. Se for entrada, cria lote FIFO
    if (movimento.tipo === 'entrada') {
      const { error: loteError } = await supabase
        .from('entradas_detalhadas')
        .insert({
          item_id: movimento.item_id,
          usuario_id: userId,
          movimentacao_entrada_id: mov.id,
          tipo_item: tipoItem, // buscar do item
          quantidade_inicial: movimento.quantidade,
          quantidade_restante: movimento.quantidade,
          custo_unitario: movimento.custo_unitario,
          data_entrada: movimento.data,
          status: 'disponivel'
        });

      if (loteError) throw loteError;
    }

    // 3. Se for saída, consome lotes FIFO
    if (movimento.tipo === 'saida') {
      await consumirLotesFIFO(
        movimento.item_id,
        movimento.quantidade
      );
    }

    // 4. Trigger atualiza estoque_atual automaticamente

    toast.success('Movimentação registrada');
    await carregarItens();
  } catch (error) {
    toast.error('Erro ao registrar movimentação');
    throw error;
  }
}, [userId, carregarItens]);
```

---

#### 6. `ativarRastreamento(itemId)`

Ativa o controle de estoque para um item.

```typescript
const ativarRastreamento = useCallback(async (itemId: string) => {
  try {
    // 1. Atualiza flag no item
    await supabase
      .from('itens')
      .update({ rastrear_estoque: true })
      .eq('id', itemId)
      .eq('usuario_id', userId);

    // 2. Cria registro em estoque_atual (se não existir)
    const { data: estoqueExiste } = await supabase
      .from('estoque_atual')
      .select('id')
      .eq('item_id', itemId)
      .single();

    if (!estoqueExiste) {
      await supabase
        .from('estoque_atual')
        .insert({
          item_id: itemId,
          usuario_id: userId,
          tipo_item: tipoItem,
          quantidade_atual: 0,
          custo_medio: 0,
          valor_total: 0
        });
    }

    toast.success('Rastreamento ativado');
    await carregarItens();
  } catch (error) {
    toast.error('Erro ao ativar rastreamento');
    throw error;
  }
}, [userId, carregarItens]);
```

---

#### 7. `desativarRastreamento(itemId)`

Desativa o controle de estoque (não deleta histórico).

```typescript
const desativarRastreamento = useCallback(async (itemId: string) => {
  try {
    await supabase
      .from('itens')
      .update({ rastrear_estoque: false })
      .eq('id', itemId)
      .eq('usuario_id', userId);

    toast.success('Rastreamento desativado');
    await carregarItens();
  } catch (error) {
    toast.error('Erro ao desativar rastreamento');
    throw error;
  }
}, [userId, carregarItens]);
```

---

### Funções Auxiliares

#### `getStatusEstoque(item, estoque)`

Calcula o status do estoque baseado na quantidade e ponto de pedido.

```typescript
const getStatusEstoque = useCallback((
  item: Item,
  estoque?: EstoqueAtual
): StatusEstoque => {
  // Sem rastreamento
  if (!item.rastrear_estoque) {
    return 'sem_rastreio';
  }

  // Sem estoque cadastrado
  if (!estoque) {
    return 'zerado';
  }

  // Zerado
  if (estoque.saldo === 0) {
    return 'zerado';
  }

  // Sem ponto de pedido configurado
  if (!item.ponto_de_pedido) {
    return 'ok';
  }

  // Baixo (< 50% do ponto de pedido)
  if (estoque.saldo <= (item.ponto_de_pedido * 0.5)) {
    return 'baixo';
  }

  // Atenção (entre 50% e 100% do ponto de pedido)
  if (estoque.saldo <= item.ponto_de_pedido) {
    return 'atencao';
  }

  // OK
  return 'ok';
}, []);
```

---

#### `calcularResumo(itens)`

Calcula estatísticas agregadas do estoque.

```typescript
const calcularResumo = (itens: ItemComEstoque[]): ResumoEstoque => {
  return {
    total_itens: itens.length,
    
    itens_rastreados: itens.filter(i => 
      i.rastrear_estoque
    ).length,
    
    alertas_baixo: itens.filter(i => 
      i.status === 'baixo' || i.status === 'atencao'
    ).length,
    
    alertas_zerado: itens.filter(i => 
      i.status === 'zerado'
    ).length,
    
    valor_total: itens.reduce((sum, item) => 
      sum + (item.estoque?.valor_estoque || 0), 
      0
    )
  };
};
```

---

## 🎨 Componentes Visuais

### 1. Cards de Itens

**Componente:** `CardItem`

```typescript
<Card className={cn(
  "transition-all hover:shadow-md",
  statusColors[item.status]
)}>
  <CardHeader>
    <div className="flex items-start gap-3">
      {item.imagem_url && (
        <img 
          src={item.imagem_url}
          className="w-16 h-16 object-cover rounded"
        />
      )}
      <div className="flex-1">
        <CardTitle>{item.nome}</CardTitle>
        <div className="flex gap-2 mt-2">
          <Badge variant={tipoBadgeVariant[item.tipo]}>
            {item.tipo}
          </Badge>
          <Badge variant={statusBadgeVariant[item.status]}>
            {statusLabels[item.status]}
          </Badge>
        </div>
      </div>
    </div>
  </CardHeader>
  
  <CardContent>
    <div className="space-y-2 text-sm">
      <div className="flex justify-between">
        <span className="text-muted-foreground">Estoque:</span>
        <span className="font-semibold">
          {item.estoque?.saldo} {item.unidade_base}
        </span>
      </div>
      
      <div className="flex justify-between">
        <span className="text-muted-foreground">Custo Médio:</span>
        <span>R$ {item.estoque?.custo_medio.toFixed(4)}</span>
      </div>
      
      <div className="flex justify-between">
        <span className="text-muted-foreground">Valor Total:</span>
        <span className="font-semibold">
          R$ {item.estoque?.valor_estoque.toFixed(2)}
        </span>
      </div>
      
      {item.ponto_de_pedido && (
        <div className="flex justify-between">
          <span className="text-muted-foreground">Ponto de Pedido:</span>
          <span>{item.ponto_de_pedido} {item.unidade_base}</span>
        </div>
      )}
    </div>
  </CardContent>
  
  <CardFooter className="flex gap-2">
    <Button size="sm" onClick={() => handleEntrada(item)}>
      <Plus className="h-4 w-4" />
      Entrada
    </Button>
    <Button size="sm" variant="outline" onClick={() => handleSaida(item)}>
      <Minus className="h-4 w-4" />
      Saída
    </Button>
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button size="sm" variant="ghost">
          <MoreVertical className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuItem onClick={() => handleAjuste(item)}>
          Ajustar
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleEditar(item)}>
          Editar
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleExcluir(item)}>
          Excluir
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  </CardFooter>
</Card>
```

---

### 2. Badges de Status

**Cores por Status:**

```typescript
const statusColors = {
  ok: 'bg-green-50 border-green-200',
  atencao: 'bg-yellow-50 border-yellow-200',
  baixo: 'bg-orange-50 border-orange-200',
  zerado: 'bg-red-50 border-red-200',
  sem_rastreio: 'bg-gray-50 border-gray-200'
};

const statusBadgeVariant = {
  ok: 'default',
  atencao: 'warning',
  baixo: 'destructive',
  zerado: 'destructive',
  sem_rastreio: 'secondary'
};

const statusLabels = {
  ok: 'OK',
  atencao: 'Atenção',
  baixo: 'Baixo',
  zerado: 'Zerado',
  sem_rastreio: 'Sem Rastreio'
};
```

---

### 3. Estado Vazio

**Componente:** `EmptyState`

```typescript
<EmptyState
  icon={Package}
  title="Nenhum item cadastrado"
  description="Comece adicionando seu primeiro item ao estoque"
  action={
    <Button onClick={handleNovoItem}>
      <Plus className="mr-2 h-4 w-4" />
      Adicionar Primeiro Item
    </Button>
  }
/>
```

---

### 4. Alertas de Estoque

**Componente:** `AlertasEstoque`

```typescript
<Card>
  <CardHeader>
    <CardTitle className="flex items-center gap-2">
      <AlertTriangle className="h-5 w-5 text-yellow-500" />
      Alertas de Estoque
    </CardTitle>
  </CardHeader>
  <CardContent>
    {resumo.alertas_baixo > 0 && (
      <Alert variant="warning">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Estoque Baixo</AlertTitle>
        <AlertDescription>
          {resumo.alertas_baixo} {resumo.alertas_baixo === 1 ? 'item' : 'itens'}
          {' '}abaixo do ponto de pedido
        </AlertDescription>
      </Alert>
    )}
    
    {resumo.alertas_zerado > 0 && (
      <Alert variant="destructive" className="mt-2">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Estoque Zerado</AlertTitle>
        <AlertDescription>
          {resumo.alertas_zerado} {resumo.alertas_zerado === 1 ? 'item' : 'itens'}
          {' '}sem estoque
        </AlertDescription>
      </Alert>
    )}
  </CardContent>
</Card>
```

---

## 🔐 Segurança e Permissões

### Row Level Security (RLS)

Todas as tabelas do módulo possuem políticas RLS ativas:

#### Tabela `itens`

```sql
-- Política de SELECT
CREATE POLICY "Usuários podem ver seus próprios itens"
ON public.itens FOR SELECT
USING (auth.uid() = usuario_id);

-- Política de INSERT
CREATE POLICY "Usuários podem inserir seus próprios itens"
ON public.itens FOR INSERT
WITH CHECK (auth.uid() = usuario_id);

-- Política de UPDATE
CREATE POLICY "Usuários podem atualizar seus próprios itens"
ON public.itens FOR UPDATE
USING (auth.uid() = usuario_id);

-- Política de DELETE
CREATE POLICY "Usuários podem deletar seus próprios itens"
ON public.itens FOR DELETE
USING (auth.uid() = usuario_id);
```

#### Tabela `precos`

```sql
CREATE POLICY "Usuários podem ver seus próprios preços"
ON public.precos FOR SELECT
USING (auth.uid() = usuario_id);

CREATE POLICY "Usuários podem inserir seus próprios preços"
ON public.precos FOR INSERT
WITH CHECK (auth.uid() = usuario_id);

CREATE POLICY "Usuários podem atualizar seus próprios preços"
ON public.precos FOR UPDATE
USING (auth.uid() = usuario_id);

CREATE POLICY "Usuários podem deletar seus próprios preços"
ON public.precos FOR DELETE
USING (auth.uid() = usuario_id);
```

#### Tabela `movimentacoes_estoque`

```sql
CREATE POLICY "Usuários podem ver suas próprias movimentações"
ON public.movimentacoes_estoque FOR SELECT
USING (auth.uid() = usuario_id);

CREATE POLICY "Usuários podem inserir suas próprias movimentações"
ON public.movimentacoes_estoque FOR INSERT
WITH CHECK (auth.uid() = usuario_id);
```

#### Tabela `entradas_detalhadas`

```sql
CREATE POLICY "Usuários podem ver suas próprias entradas"
ON public.entradas_detalhadas FOR SELECT
USING (auth.uid() = usuario_id);

CREATE POLICY "Usuários podem inserir suas próprias entradas"
ON public.entradas_detalhadas FOR INSERT
WITH CHECK (auth.uid() = usuario_id);

CREATE POLICY "Usuários podem atualizar suas próprias entradas"
ON public.entradas_detalhadas FOR UPDATE
USING (auth.uid() = usuario_id);
```

#### Tabela `estoque_atual`

```sql
CREATE POLICY "Usuários podem ver seu próprio estoque"
ON public.estoque_atual FOR SELECT
USING (auth.uid() = usuario_id);

-- INSERT e UPDATE via triggers (não manual)
```

---

### Validações de Segurança

**1. Validação de Propriedade**
```typescript
// Sempre valida se o registro pertence ao usuário
const { data } = await supabase
  .from('itens')
  .select('*')
  .eq('id', itemId)
  .eq('usuario_id', userId)
  .single();

if (!data) {
  throw new Error('Item não encontrado ou sem permissão');
}
```

**2. Validação de Quantidade**
```typescript
// Não permite saída maior que estoque
if (quantidadeSaida > estoqueAtual.quantidade_atual) {
  throw new Error('Quantidade insuficiente em estoque');
}
```

**3. Validação de Dados**
```typescript
// Valida tipos e formatos
const schema = z.object({
  nome: z.string().min(1),
  tipo: z.enum(['ingrediente', 'embalagem', 'outros']),
  quantidade: z.number().positive()
});

const validated = schema.parse(input);
```

---

## 📊 Integração com Outros Módulos

### 1. Integração com Receitas

**Quando uma receita é criada:**
- Sistema lê os ingredientes e embalagens
- Para cada item com `rastrear_estoque = true`:
  - Não afeta o estoque no cadastro da receita
  - Estoque só é afetado quando a receita é produzida

**Quando uma receita é produzida:**
```typescript
async function produzirReceita(receita_id: string, quantidade: number) {
  // 1. Busca ingredientes da receita
  const { data: ingredientes } = await supabase
    .from('receitas_ingredientes')
    .select('*')
    .eq('receita_id', receita_id);

  // 2. Para cada ingrediente
  for (const ing of ingredientes) {
    const quantidadeNecessaria = ing.quantidade * quantidade;
    
    // 3. Registra saída de estoque
    await registrarMovimento({
      item_id: ing.item_id,
      tipo: 'saida',
      quantidade: quantidadeNecessaria,
      referencia_id: receita_id,
      referencia_tipo: 'receita',
      observacao: `Produção de ${quantidade}x ${receita.nome}`
    });
  }

  // 4. Calcula CMV da produção
  const cmv = await calcularCMVProducao(receita_id, quantidade);
  
  return { cmv, producao_id };
}
```

**Cálculo de CMV (Custo de Mercadoria Vendida):**
```typescript
async function calcularCMVProducao(receita_id: string, qtd: number) {
  // 1. Busca ingredientes usados
  const ingredientes = await buscarIngredientesReceita(receita_id);
  
  // 2. Para cada ingrediente, busca custo FIFO real
  let custoTotal = 0;
  
  for (const ing of ingredientes) {
    const quantidadeUsada = ing.quantidade * qtd;
    
    // Simula consumo FIFO para calcular custo
    const custoFIFO = await simularConsumoFIFO(
      ing.item_id,
      quantidadeUsada
    );
    
    custoTotal += custoFIFO;
  }
  
  return custoTotal;
}
```

---

### 2. Integração com Encomendas

**Quando uma encomenda é criada:**
- Vincula receitas e quantidades
- Pode gerar alertas de estoque insuficiente
- Reserva de estoque (opcional, não implementado)

**Quando uma encomenda é marcada como "Em Produção":**
```typescript
async function iniciarProducaoEncomenda(encomenda_id: string) {
  // 1. Busca itens da encomenda
  const { data: itens } = await supabase
    .from('encomenda_itens')
    .select('*, receitas(*)')
    .eq('encomenda_id', encomenda_id);

  // 2. Para cada item
  for (const item of itens) {
    // Produz receita e consome estoque
    await produzirReceita(
      item.receita_id,
      item.quantidade
    );
  }

  // 3. Atualiza status da encomenda
  await supabase
    .from('encomendas')
    .update({ status: 'em_producao' })
    .eq('id', encomenda_id);
}
```

**Relatório de Necessidades:**
```typescript
async function calcularNecessidadesEncomenda(encomenda_id: string) {
  // Calcula o que precisa ser comprado para produzir a encomenda
  
  const itens = await buscarItensEncomenda(encomenda_id);
  const necessidades = {};

  for (const item of itens) {
    const ingredientes = await buscarIngredientesReceita(item.receita_id);
    
    for (const ing of ingredientes) {
      const necessario = ing.quantidade * item.quantidade;
      const disponivel = await buscarEstoqueAtual(ing.item_id);
      const falta = Math.max(0, necessario - disponivel);
      
      if (falta > 0) {
        necessidades[ing.item_id] = {
          nome: ing.nome,
          necessario,
          disponivel,
          falta
        };
      }
    }
  }

  return necessidades;
}
```

---

### 3. Integração com Precificação

**Atualização Automática de Custos:**
```typescript
// Quando preço ativo muda, atualiza receitas
async function onPrecoAtualizado(item_id: string) {
  // 1. Busca novo preço ativo
  const { data: preco } = await supabase
    .from('precos')
    .select('custo_unitario')
    .eq('item_id', item_id)
    .eq('ativo', true)
    .single();

  // 2. Busca receitas que usam este item
  const { data: receitas } = await supabase
    .from('receitas_ingredientes')
    .select('receita_id')
    .eq('item_id', item_id);

  // 3. Atualiza custo de cada receita
  for (const r of receitas) {
    await recalcularCustoReceita(r.receita_id);
  }
}
```

**Cálculo de Preço Sugerido:**
```typescript
async function calcularPrecoSugerido(receita_id: string, margem: number) {
  // 1. Calcula custo total da receita
  const custoReceita = await calcularCustoReceita(receita_id);
  
  // 2. Adiciona mão de obra
  const custoMaoObra = await calcularMaoObra(receita_id);
  
  // 3. Adiciona embalagens
  const custoEmbalagens = await calcularEmbalagens(receita_id);
  
  // 4. Custo Total
  const custoTotal = custoReceita + custoMaoObra + custoEmbalagens;
  
  // 5. Aplica margem
  const precoSugerido = custoTotal * (1 + margem);
  
  return {
    custo_total: custoTotal,
    margem,
    preco_sugerido: precoSugerido,
    detalhamento: {
      ingredientes: custoReceita,
      mao_obra: custoMaoObra,
      embalagens: custoEmbalagens
    }
  };
}
```

---

### 4. Integração com Relatórios

**Relatório de CMV Global:**
```sql
-- Calcula CMV do período
SELECT 
  DATE_TRUNC('month', data) as mes,
  SUM(
    CASE 
      WHEN tipo = 'saida' THEN valor_total
      ELSE 0
    END
  ) as cmv_mensal,
  COUNT(DISTINCT item_id) as itens_consumidos
FROM movimentacoes_estoque
WHERE tipo = 'saida'
  AND usuario_id = $userId
  AND data BETWEEN $dataInicio AND $dataFim
GROUP BY mes
ORDER BY mes DESC;
```

**Relatório de Consumo Médio:**
```sql
-- Calcula consumo médio por item
SELECT 
  i.nome,
  i.unidade_base,
  AVG(m.quantidade) as consumo_medio,
  SUM(m.quantidade) as consumo_total,
  COUNT(*) as total_movimentacoes
FROM itens i
JOIN movimentacoes_estoque m ON m.item_id = i.id
WHERE m.tipo = 'saida'
  AND m.usuario_id = $userId
  AND m.data >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY i.id
ORDER BY consumo_total DESC;
```

**Relatório de Movimentações:**
```sql
-- Lista todas as movimentações do período
SELECT 
  m.*,
  i.nome as item_nome,
  i.unidade_base,
  i.tipo as item_tipo
FROM movimentacoes_estoque m
JOIN itens i ON i.id = m.item_id
WHERE m.usuario_id = $userId
  AND m.data BETWEEN $dataInicio AND $dataFim
ORDER BY m.data DESC, m.criado_em DESC;
```

---

## 🚀 Fluxo Típico de Uso

### Cenário Completo: Do Cadastro à Produção

#### Fase 1: Configuração Inicial

**Passo 1: Cadastrar Fornecedores**
```
1. Acessar Módulo Cadastros
2. Seção Fornecedores
3. Adicionar fornecedores principais
   - Atacadão do Centro
   - Distribuidora Doce Vida
   - Mercado Local
```

**Passo 2: Cadastrar Itens**
```
1. Acessar Módulo Estoque
2. Clicar em "Adicionar Item"
3. Preencher informações:
   ├─ Nome: Farinha de Trigo
   ├─ Tipo: Ingrediente
   ├─ Categoria: Farinhas
   ├─ Unidade Base: g
   ├─ Quantidade por Embalagem: 1000
   ├─ Rastrear Estoque: ✓ SIM
   ├─ Ponto de Pedido: 5000g
   ├─ Fornecedor Padrão: Atacadão do Centro
   └─ Upload de Imagem
```

**Passo 3: Cadastrar Preços**
```
1. No item criado, clicar "Gerenciar Preços"
2. Adicionar preço ativo:
   ├─ Marca: Sinhá
   ├─ Fornecedor: Atacadão do Centro
   ├─ Preço Total: R$ 22,50
   ├─ Quantidade Embalagem: 5kg
   ├─ Custo Unitário: R$ 0,0045/g (automático)
   └─ Ativo: ✓ SIM
```

---

#### Fase 2: Primeira Compra

**Passo 4: Registrar Entrada**
```
1. No card do item, clicar "➕ Entrada"
2. Preencher formulário:
   ├─ Data Compra: 15/11/2025
   ├─ Local: Atacadão do Centro
   ├─ Quantidade: 10000g (10kg)
   ├─ Custo Total: R$ 45,00
   ├─ Validade: 15/05/2026
   └─ Observações: Primeira compra do mês

3. Sistema processa:
   ✓ Cria movimentação de entrada
   ✓ Cria Lote 1 FIFO: 10kg a R$ 0,0045/g
   ✓ Atualiza estoque_atual: 10kg
   ✓ Status: 🟢 OK (acima do ponto de pedido)
```

---

#### Fase 3: Uso em Produção

**Passo 5: Criar Receita (Bolo de Chocolate)**
```
1. Acessar Módulo Receitas
2. Criar nova receita
3. Adicionar ingredientes:
   ├─ Farinha: 500g
   ├─ Açúcar: 300g
   ├─ Ovos: 4un
   ├─ Chocolate: 200g
   └─ Outros...

4. Sistema calcula custo automaticamente
   (baseado nos preços ativos)
```

**Passo 6: Produzir Receita**
```
1. Produzir 3 bolos
2. Sistema registra saídas:
   ├─ Farinha: 1500g (3 × 500g)
   │  Consume Lote 1: 1500g
   │  Custo: R$ 6,75
   │
   ├─ Açúcar: 900g
   ├─ Ovos: 12un
   └─ Chocolate: 600g

3. Estoque atualizado:
   Farinha:
   ├─ Antes: 10.000g
   ├─ Saída: -1.500g
   └─ Depois: 8.500g (ainda 🟢 OK)
```

---

#### Fase 4: Nova Compra (Preço Diferente)

**Passo 7: Segunda Compra**
```
1. Registrar nova entrada
   ├─ Data: 20/11/2025
   ├─ Quantidade: 5000g
   ├─ Custo Total: R$ 24,00
   ├─ Custo Unitário: R$ 0,0048/g (mais caro)
   └─ Validade: 20/06/2026

2. Sistema cria Lote 2:
   ├─ 5kg a R$ 0,0048/g
   └─ Status: disponível

3. Estoque consolidado:
   ├─ Lote 1: 8.500g a R$ 0,0045/g
   ├─ Lote 2: 5.000g a R$ 0,0048/g
   ├─ Total: 13.500g
   └─ Custo Médio: R$ 0,00463/g
```

---

#### Fase 5: Saída com Múltiplos Lotes

**Passo 8: Produção Grande**
```
1. Produzir 20 bolos (10.000g de farinha)
2. Sistema consome por FIFO:
   
   Lote 1 (mais antigo):
   ├─ Disponível: 8.500g
   ├─ Consome: 8.500g
   ├─ Custo: 8500 × R$ 0,0045 = R$ 38,25
   └─ Restante: 0g (esgotado)

   Lote 2:
   ├─ Disponível: 5.000g
   ├─ Consome: 1.500g (restante necessário)
   ├─ Custo: 1500 × R$ 0,0048 = R$ 7,20
   └─ Restante: 3.500g

3. Custo total da saída:
   R$ 38,25 + R$ 7,20 = R$ 45,45
   Custo médio: R$ 45,45 / 10kg = R$ 0,004545/g

4. Novo estoque:
   ├─ Lote 1: 0g (esgotado)
   ├─ Lote 2: 3.500g a R$ 0,0048/g
   ├─ Total: 3.500g
   └─ Status: 🟠 BAIXO (< ponto de pedido)
```

---

#### Fase 6: Alerta e Reposição

**Passo 9: Sistema Gera Alerta**
```
Alerta de Estoque Baixo!
├─ Item: Farinha de Trigo
├─ Atual: 3.500g
├─ Ponto de Pedido: 5.000g
└─ Sugestão: Comprar no mínimo 1.500g
```

**Passo 10: Nova Compra para Repor**
```
1. Fazer nova compra
   ├─ Quantidade: 15.000g
   ├─ Custo: R$ 66,00
   └─ Custo Unitário: R$ 0,0044/g (promoção)

2. Novo estoque:
   ├─ Lote 2: 3.500g a R$ 0,0048/g
   ├─ Lote 3: 15.000g a R$ 0,0044/g
   ├─ Total: 18.500g
   └─ Status: 🟢 OK
```

---

#### Fase 7: Ajuste de Inventário

**Passo 11: Contagem Física**
```
Divergência encontrada:
├─ Sistema: 18.500g
├─ Físico: 18.100g
└─ Diferença: -400g (perda)

Registrar ajuste:
├─ Tipo: Saída
├─ Quantidade: 400g
├─ Observação: "Ajuste pós-inventário - umidade"
└─ Sistema corrige para 18.100g
```

---

## 📈 Métricas e Indicadores

### KPIs Principais

**1. Giro de Estoque**
```typescript
giro_estoque = custo_mercadorias_vendidas / valor_medio_estoque
```

**2. Cobertura de Estoque (dias)**
```typescript
dias_cobertura = (estoque_atual / consumo_medio_diario)
```

**3. Acuracidade de Estoque**
```typescript
acuracidade = (itens_corretos / total_itens) × 100%
```

**4. Taxa de Ruptura**
```typescript
taxa_ruptura = (itens_zerados / total_itens_rastreados) × 100%
```

---

## 🔄 Manutenção e Boas Práticas

### Rotinas Recomendadas

**Diária:**
- ✅ Registrar todas as entradas do dia
- ✅ Registrar saídas de produção
- ✅ Verificar alertas de estoque baixo

**Semanal:**
- ✅ Revisar itens com status baixo/zerado
- ✅ Planejar compras da semana
- ✅ Verificar produtos próximos ao vencimento

**Mensal:**
- ✅ Realizar inventário físico completo
- ✅ Ajustar divergências encontradas
- ✅ Analisar relatório de CMV
- ✅ Avaliar consumo médio de itens
- ✅ Revisar pontos de pedido

**Trimestral:**
- ✅ Revisar preços cadastrados
- ✅ Limpar itens inativos
- ✅ Avaliar fornecedores
- ✅ Analisar giro de estoque

---

## 🎓 Dicas e Melhores Práticas

**1. Configure Pontos de Pedido Realistas**
```
Ponto de Pedido = (Consumo Médio Diário × Lead Time) + Estoque de Segurança

Exemplo:
- Consumo: 500g/dia
- Lead Time: 3 dias
- Estoque Segurança: 20%
- Ponto: (500 × 3) + (1500 × 0,2) = 1800g
```

**2. Use Categorias Consistentes**
- Padronize nomes de categorias
- Evite categorias muito específicas
- Facilita filtros e relatórios

**3. Mantenha Histórico Completo**
- Nunca delete movimentações antigas
- Use campo "ativo" para ocultar itens
- Histórico é valioso para análises

**4. Registre Observações Relevantes**
- Motivo de ajustes
- Condições de compra
- Problemas de qualidade
- Facilita auditorias futuras

**5. Valide Dados na Entrada**
- Confira quantidades recebidas
- Verifique datas de validade
- Confira preços pagos
- Previne erros futuros

---

## 📞 Suporte e Documentação Adicional

Para mais informações sobre:
- Integrações específicas
- Personalizações
- Relatórios avançados
- Importação/Exportação
- APIs e webhooks

Entre em contato com a equipe de suporte.

---

**Documento gerado em:** 16/11/2025
**Versão do Sistema:** 2.0.0
**Última Atualização:** 16/11/2025
