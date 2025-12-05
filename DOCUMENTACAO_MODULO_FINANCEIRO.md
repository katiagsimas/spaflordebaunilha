# 📊 Documentação Técnica Completa - Módulo Financeiro

## Sumário

1. [Arquitetura Geral](#arquitetura-geral)
2. [Arquivos e Funções](#arquivos-e-funcoes)
3. [Fluxos de Navegação](#fluxos-de-navegacao)
4. [Estrutura do Banco de Dados](#estrutura-do-banco-de-dados)
5. [Pontos de Integração](#pontos-de-integracao)
6. [Checklist para Standalone](#checklist-standalone)

---

## 1. Arquitetura Geral {#arquitetura-geral}

### 1.1 Visão Geral do Módulo

O Módulo Financeiro é um sistema completo de gestão financeira que gerencia:
- **Contas a Receber** (receitas, vendas, encomendas)
- **Contas a Pagar** (despesas, fornecedores)
- **Fluxo de Caixa** (diário e mensal)
- **DRE - Demonstrativo de Resultado** (relatório gerencial)
- **Dashboard Financeiro** (visão consolidada)
- **Configurações** (juros, multas, bancos, plano de contas)

### 1.2 Stack Tecnológica

```
Frontend:
- React 18.3.1 + TypeScript
- Tailwind CSS + shadcn/ui
- React Router DOM 6.30.1
- React Query (TanStack) 5.83.0
- Recharts 2.15.4 (gráficos)
- XLSX 0.18.5 (exportação)
- date-fns 4.1.0 (manipulação de datas)
- jsPDF 3.0.3 + jspdf-autotable 5.0.2 (geração de recibos)

Backend:
- Supabase (PostgreSQL)
- Row Level Security (RLS)
- Views (vw_contas_receber_parcelas, vw_resumo_financeiro)
- Functions (calcular_juros_com_config, criar_planos_contas_padrao)
- Storage (comprovantes-receber, comprovantes-pagar)
```

### 1.3 Estrutura de Diretórios

```
src/
├── pages/financeiro/
│   ├── Financeiro.tsx              # Hub principal + Dashboard
│   ├── ContasPagar.tsx             # Listagem contas a pagar
│   ├── ContasPagarForm.tsx         # Formulário criar/editar
│   ├── ContasPagarDetalhes.tsx     # Visualização detalhada
│   ├── ContasReceber.tsx           # Listagem contas a receber
│   ├── ContasReceberForm.tsx       # Formulário criar/editar
│   ├── ContasReceberDetalhes.tsx   # Visualização detalhada
│   ├── FluxoCaixaHub.tsx           # Hub fluxo de caixa
│   ├── FluxoCaixaDiario.tsx        # Fluxo diário
│   ├── FluxoCaixaMensal.tsx        # Fluxo mensal
│   ├── DRE.tsx                     # Demonstrativo de resultado
│   └── DashboardFinanceiro.tsx     # Dashboard consolidado
│
├── components/financeiro/
│   ├── ContasReceberFormModal.tsx  # Modal formulário receber
│   ├── DarBaixaDialog.tsx          # Modal dar baixa (receber)
│   └── DarBaixaPagarDialog.tsx     # Modal dar baixa (pagar)
│
├── pages/configuracoes/
│   ├── FinanceiroPage.tsx          # Hub configurações financeiras
│   ├── Bancos.tsx                  # Cadastro de bancos
│   ├── TiposDocumentos.tsx         # Tipos de documentos
│   ├── CategoriasPlanoContas.tsx   # Categorias DRE
│   ├── PlanoContas.tsx             # Plano de contas
│   └── ConfiguracaoJuros.tsx       # Juros e multas
│
└── components/configuracoes/
    └── ConfiguracaoJuros.tsx       # Componente config juros
```

---

## 2. Arquivos e Funções {#arquivos-e-funcoes}

### 2.1 Financeiro.tsx (Hub Principal)

**Localização:** `src/pages/financeiro/Financeiro.tsx`
**Linhas:** ~1120

#### Estados Principais:
```typescript
// Navegação temporal
const [mesSelecionado, setMesSelecionado] = useState(new Date().getMonth() + 1);
const [anoSelecionado, setAnoSelecionado] = useState(new Date().getFullYear());

// Banner de resumo
const [saldoAnterior, setSaldoAnterior] = useState(0);
const [entradas, setEntradas] = useState(0);
const [saidas, setSaidas] = useState(0);
const [saldoAtual, setSaldoAtual] = useState(0);
const [bancosSaldos, setBancosSaldos] = useState([]);

// Dashboard
const [resumoDashboard, setResumoDashboard] = useState({
  totalReceber: 0,
  totalPagar: 0,
  receitasRecebidas: 0,
  despesasPagas: 0,
  saldoLiquido: 0
});
const [inadimplenciaClientes, setInadimplenciaClientes] = useState([]);
const [inadimplenciaFornecedores, setInadimplenciaFornecedores] = useState([]);
```

#### Funções Principais:

**`fetchResumo()`** - Busca resumo financeiro do mês/ano
```typescript
// Utiliza view vw_resumo_financeiro
// Calcula: saldo inicial, entradas, saídas, saldo atual por banco
```

**`carregarDadosDashboard()`** - Orquestra carregamento do dashboard
```typescript
await Promise.all([
  carregarResumoDashboard(),
  carregarInadimplenciaClientes(),
  carregarInadimplenciaFornecedores()
]);
```

**`carregarResumoDashboard()`** - Calcula totais financeiros
```typescript
// Lógica de status:
// - 'aberto'/'atrasado': soma para totalReceber/totalPagar
// - 'pagamento_parcial': divide entre pendente e recebido
// - 'pago'/'adiantado': soma para recebido/pago (se no mês atual)
```

**`carregarInadimplenciaClientes()`** - Lista clientes inadimplentes
```typescript
// Busca parcelas com status = 'atrasado'
// Agrupa por cliente
// Calcula dias de atraso
// Ordena por valor (maior primeiro)
```

**`handleAbrirConfig()`** - Abre modal configuração saldo inicial
```typescript
// Busca bancos habilitados
// Busca saldos configurados do mês atual
// Permite inserir/atualizar saldo inicial por banco
```

---

### 2.2 ContasPagar.tsx

**Localização:** `src/pages/financeiro/ContasPagar.tsx`
**Linhas:** ~1383

#### Estados de Filtro:
```typescript
// Filtros principais
const [filtroStatus, setFiltroStatus] = useState('aberto');

// Filtros avançados
const [dataEmissaoInicio, setDataEmissaoInicio] = useState('');
const [dataEmissaoFim, setDataEmissaoFim] = useState('');
const [dataPagamentoInicio, setDataPagamentoInicio] = useState('');
const [dataPagamentoFim, setDataPagamentoFim] = useState('');
const [dataVencimentoInicio, setDataVencimentoInicio] = useState('');
const [dataVencimentoFim, setDataVencimentoFim] = useState('');
const [fornecedorFiltro, setFornecedorFiltro] = useState('todos');
const [planoContasFiltro, setPlanoContasFiltro] = useState('todos');
const [categoriaFiltro, setCategoriaFiltro] = useState('todos');
const [tipoDocumentoFiltro, setTipoDocumentoFiltro] = useState('todos');
const [bancoFiltro, setBancoFiltro] = useState('todos');
```

#### Dashboard Cards:
```typescript
const [dashboard, setDashboard] = useState({
  total_a_pagar: 0,      // Parcelas em aberto + atrasadas
  total_pago: 0,         // Parcelas pagas + adiantadas
  total_atrasado: 0,     // Parcelas vencidas não pagas
  vencendo_hoje: 0,      // Parcelas vencendo hoje
});
```

#### Funções Principais:

**`fetchDashboard()`** - Calcula totais do dashboard
```typescript
// Busca contas_pagar_parcelas
// Itera calculando totais por status
// Identifica parcelas vencendo hoje
```

**`fetchParcelas()`** - Carrega lista de parcelas
```typescript
// JOIN com: contas_pagar, fornecedores, tipos_documento, plano_contas, bancos
// Achata estrutura para exibição na tabela
// Ordena por data_vencimento ASC
```

**`parcelasFiltradas`** - Filtra parcelas (useMemo)
```typescript
// Filtro status: 'aberto' inclui [aberto, atrasado, pagamento_parcial]
// Filtro status: 'vencido' = apenas atrasado
// Filtros de data: emissão, pagamento, vencimento
// Filtros avançados: fornecedor, plano, categoria, tipo doc, banco
```

**`handleAbrirBaixaLote()`** - Abre modal baixa em lote
```typescript
// Valida seleção
// Verifica parcelas em aberto
// Alerta parcelas já pagas
```

**`handleConfirmarBaixaLote()`** - Processa baixa em lote
```typescript
// Para cada parcela selecionada:
// - Calcula valor restante
// - Insere em contas_pagar_pagamentos
// - Trigger atualiza status da parcela
```

**`handleExportarExcel()`** - Exporta para CSV
```typescript
// Gera CSV com BOM (UTF-8)
// Download automático
```

---

### 2.3 ContasReceber.tsx

**Localização:** `src/pages/financeiro/ContasReceber.tsx`
**Linhas:** ~1171

#### Estados Específicos:
```typescript
const [visualizacao, setVisualizacao] = useState<'ativas' | 'pagas'>('ativas');
const [configJuros, setConfigJuros] = useState(null);
const [parcelasSelecionadas, setParcelasSelecionadas] = useState(new Set());
const [modoSelecao, setModoSelecao] = useState(false);
```

#### Funções Principais:

**`fetchConfigJuros()`** - Busca configuração de juros
```typescript
// Tabela: configuracoes_juros
// Usado para calcular juros automáticos na baixa em lote
```

**`handleConfirmarBaixaLote()`** - Baixa com cálculo de juros
```typescript
// Para cada parcela:
// - Se configJuros.cobrar_juros: calcula juros por atraso
// - Se configJuros.multa_atraso: adiciona multa única
// - Insere pagamento com juros calculado
```

**`handleExcluirLote()`** - Exclui parcelas selecionadas
```typescript
// Confirmação obrigatória
// Exclui parcelas e pagamentos relacionados
```

---

### 2.4 ContasPagarForm.tsx / ContasReceberForm.tsx

**Localização:** `src/pages/financeiro/ContasPagarForm.tsx`
**Linhas:** ~814

#### Tipos de Lançamento:
```typescript
const [tipoLancamento, setTipoLancamento] = useState<'unico' | 'parcelado' | 'recorrente'>('unico');
```

#### Fluxo de Geração de Parcelas:

**`handleGerarParcelas()`**
```typescript
// Tipo 'unico': 1 parcela = valor total
// Tipo 'parcelado': N parcelas = valor total / N
// Tipo 'recorrente': N parcelas, mesmo valor, vencimento mensal

// Primeira parcela = data_vencimento informada
// Demais parcelas = +30 dias cada
```

**`handleSalvar()`**
```typescript
// 1. Valida soma das parcelas = valor total (exceto recorrente)
// 2. Insere em contas_pagar/contas_receber
// 3. Insere parcelas em contas_pagar_parcelas/contas_receber_parcelas
```

---

### 2.5 ContasPagarDetalhes.tsx / ContasReceberDetalhes.tsx

**Localização:** `src/pages/financeiro/ContasPagarDetalhes.tsx`
**Linhas:** ~1247 / ~1684

#### Funcionalidades:

1. **Visualização da Conta**
   - Dados do fornecedor/cliente
   - Tipo de documento, plano de contas
   - Valor total, número de parcelas

2. **Tabela de Parcelas**
   - Número, vencimento, valor, status
   - Ação: Dar Baixa (abre DarBaixaDialog)

3. **Histórico de Pagamentos**
   - Data, valor pago, juros, desconto
   - Banco, tipo documento
   - Comprovantes anexados
   - Ações: Editar, Estornar, Excluir

4. **Upload de Comprovantes**
```typescript
// Bucket: comprovantes-pagar / comprovantes-receber
// Tabela: contas_pagar_comprovantes / contas_receber_comprovantes
// Signed URLs para visualização (15 min)
```

5. **Estorno de Pagamento**
```typescript
// Marca estornado = true
// Registra data_estorno, motivo_estorno
// Trigger recalcula status da parcela
```

---

### 2.6 DarBaixaDialog.tsx / DarBaixaPagarDialog.tsx

**Localização:** `src/components/financeiro/DarBaixaDialog.tsx`
**Linhas:** ~628

#### Props:
```typescript
interface DarBaixaDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  parcela: any;          // Parcela a receber baixa
  onSuccess: () => void; // Callback após sucesso
}
```

#### Estados:
```typescript
const [dataPagamento, setDataPagamento] = useState(new Date().toISOString().split('T')[0]);
const [valorPago, setValorPago] = useState('');
const [juros, setJuros] = useState('0');
const [desconto, setDesconto] = useState('0');
const [bancoId, setBancoId] = useState('');
const [tipoDocumentoId, setTipoDocumentoId] = useState('');
const [observacao, setObservacao] = useState('');
const [arquivo, setArquivo] = useState(null);
```

#### Funções:

**`calcularJurosAutomatico()`**
```typescript
// Busca configuracoes_juros do usuário
// Se cobrar_juros e pagamento atrasado:
//   - mensal: valor * (taxa/30) * dias_atraso
//   - diario: valor * taxa * dias_atraso
// Se multa_atraso: valor * taxa_multa (única vez)
```

**`calcularValorLiquido()`**
```typescript
return valorPago + juros - desconto;
```

**`handleUploadComprovante()`**
```typescript
// Upload para bucket
// Insere registro em *_comprovantes
```

**`handleSalvar()`**
```typescript
// 1. Valida campos obrigatórios
// 2. Insere em *_pagamentos
// 3. Upload comprovante (se houver)
// 4. Trigger atualiza parcela automaticamente
```

---

### 2.7 FluxoCaixaDiario.tsx

**Localização:** `src/pages/financeiro/FluxoCaixaDiario.tsx`
**Linhas:** ~418

#### Estrutura de Dados:
```typescript
interface FluxoDiario {
  data: string;
  entradas: number;
  saidas: number;
  saldo_dia: number;
  saldo_acumulado: number;
}
```

#### Lógica de Cálculo:
```typescript
async function carregarFluxo() {
  // 1. Buscar saldo inicial de todos os bancos
  const saldoInicialTotal = bancos.reduce((acc, b) => acc + b.saldo_inicial, 0);
  
  // 2. Buscar saldos configurados para o mês
  const saldosConfigurados = await buscarSaldosIniciais(mes, ano);
  
  // 3. Calcular movimentações de meses anteriores
  const movimentacoesAnteriores = await calcularMovimentacoes(ateDataInicio);
  
  // 4. Saldo inicial do mês = saldos_bancos + saldos_config + mov_anteriores
  let saldoAcumulado = saldoInicialTotal + saldosConfigurados + movimentacoesAnteriores;
  
  // 5. Para cada dia do mês:
  for (let dia = 1; dia <= diasNoMes; dia++) {
    const entradas = await buscarRecebimentos(data);
    const saidas = await buscarPagamentos(data);
    const saldoDia = entradas - saidas;
    saldoAcumulado += saldoDia;
    
    fluxo.push({ data, entradas, saidas, saldo_dia, saldo_acumulado });
  }
}
```

---

### 2.8 FluxoCaixaMensal.tsx

**Localização:** `src/pages/financeiro/FluxoCaixaMensal.tsx`
**Linhas:** ~597

#### Estrutura de Dados:
```typescript
interface FluxoMensal {
  mes: number;
  saldoInicial: number;
  entradasOperacionais: { categoria: string; valor: number }[];
  saidasOperacionais: { categoria: string; valor: number }[];
  totalEntradas: number;
  totalSaidas: number;
  saldoOperacional: number;
  saldoFinal: number;
}
```

#### Categorização:
```typescript
// Entradas são categorizadas pelo plano_contas -> categoria
// Saídas são categorizadas pelo plano_contas -> categoria
// Usa faixa_dre para agrupamento
```

---

### 2.9 DRE.tsx (Demonstrativo de Resultado)

**Localização:** `src/pages/financeiro/DRE.tsx`
**Linhas:** ~951

#### Estrutura do DRE:
```typescript
interface LinhasDRE {
  receitaBruta: number[];           // 12 meses
  receitaVendas: number[];          // Categoria 1
  impostosSobreVendas: number[];    // Categoria 2
  outrasDeducoes: number[];         // Categoria 99
  totalDeducoes: number[];
  receitaLiquida: number[];
  cmv: number[];                    // Categoria 3
  despesasComerciais: number[];     // Categoria 8
  despesaOperacionalVariavel: number[]; // Categoria 103
  totalCustosVariaveis: number[];
  margemContribuicao: number[];
  margemContribuicaoPerc: number[];
  despesasPessoal: number[];        // Categoria 5
  despesasOcupacao: number[];       // Categoria 6
  despesasAdministrativas: number[]; // Categoria 7
  totalCustosFixos: number[];
  resultadoOperacional: number[];
  receitasFinanceiras: number[];    // Categoria 106
  despesasFinanceiras: number[];    // Categoria 107
  receitasNaoOperacionais: number[]; // Categoria 9
  gastosNaoOperacionais: number[];  // Categoria 10
  resultadoNaoOperacional: number[];
  lair: number[];                   // Lucro Antes IR
  impostoRenda: number[];
  lucroLiquido: number[];
  margemLiquidaPerc: number[];
}
```

#### Lógica de Cálculo:
```typescript
async function carregarDRE() {
  // 1. Buscar planos de contas e suas categorias
  const planosMap = mapearPlanosPorCategoria();
  
  // 2. Para cada mês (0-11):
  for (let mes = 0; mes < 12; mes++) {
    // 3. Buscar contas_receber e classificar por categoria
    const receitas = classificarReceitasPorCategoria(mes);
    
    // 4. Buscar contas_pagar e classificar por categoria
    const despesas = classificarDespesasPorCategoria(mes);
    
    // 5. Calcular totais e indicadores
    linhas.receitaBruta[mes] = receitas['1'] || 0;
    linhas.totalDeducoes[mes] = despesas['2'] + despesas['99'];
    linhas.receitaLiquida[mes] = receitaBruta - totalDeducoes;
    // ... demais cálculos
  }
}
```

---

### 2.10 ConfiguracaoJuros.tsx

**Localização:** `src/components/configuracoes/ConfiguracaoJuros.tsx`
**Linhas:** 306

#### Estados:
```typescript
const [cobrarJuros, setCobrarJuros] = useState(false);
const [tipoJuros, setTipoJuros] = useState('mensal'); // 'mensal' | 'diario'
const [percentualJuros, setPercentualJuros] = useState('1,00');
const [multaAtraso, setMultaAtraso] = useState(false);
const [percentualMulta, setPercentualMulta] = useState('2,00');
```

#### Fórmulas de Cálculo:
```typescript
// Juros Mensal: valor * (taxa/100) * (dias_atraso/30)
// Juros Diário: valor * (taxa/100) * dias_atraso
// Multa: valor * (taxa_multa/100) - aplicada uma única vez
```

---

## 3. Fluxos de Navegação {#fluxos-de-navegacao}

### 3.1 Mapa de Rotas

```
/financeiro                           → Financeiro.tsx (Hub + Dashboard)
  ├── /financeiro/dashboard           → DashboardFinanceiro.tsx
  ├── /financeiro/contas-receber      → ContasReceber.tsx
  │   ├── /financeiro/contas-receber/novo     → ContasReceberForm.tsx
  │   ├── /financeiro/contas-receber/:id      → ContasReceberDetalhes.tsx
  │   └── /financeiro/contas-receber/:id/editar → ContasReceberForm.tsx
  ├── /financeiro/contas-pagar        → ContasPagar.tsx
  │   ├── /financeiro/contas-pagar/novo       → ContasPagarForm.tsx
  │   ├── /financeiro/contas-pagar/:id        → ContasPagarDetalhes.tsx
  │   └── /financeiro/contas-pagar/:id/editar → ContasPagarForm.tsx
  ├── /financeiro/fluxo-caixa         → FluxoCaixaHub.tsx
  │   ├── /financeiro/fluxo-caixa/diario      → FluxoCaixaDiario.tsx
  │   └── /financeiro/fluxo-caixa/mensal      → FluxoCaixaMensal.tsx
  └── /financeiro/dre                 → DRE.tsx

/configuracoes/financeiro             → FinanceiroPage.tsx
  ├── /configuracoes/bancos           → Bancos.tsx
  ├── /configuracoes/tipos-documentos → TiposDocumentos.tsx
  ├── /configuracoes/categorias-plano-contas → CategoriasPlanoContas.tsx
  ├── /configuracoes/plano-contas     → PlanoContas.tsx
  └── /configuracoes/juros            → ConfiguracaoJuros.tsx
```

### 3.2 Fluxo: Cadastrar Conta a Receber

```
1. /financeiro/contas-receber
   └─> Clica "Nova Conta"

2. /financeiro/contas-receber/novo
   └─> Preenche formulário
   └─> Seleciona tipo: único/parcelado/recorrente
   └─> Gera parcelas
   └─> Salva

3. INSERT contas_receber
   └─> INSERT contas_receber_parcelas (N parcelas)

4. Redireciona para /financeiro/contas-receber
```

### 3.3 Fluxo: Dar Baixa em Parcela

```
1. /financeiro/contas-receber/:id (Detalhes)
   └─> Clica "Dar Baixa" em parcela

2. Abre DarBaixaDialog
   └─> Calcula juros automático (se configurado)
   └─> Preenche: data, valor, banco, tipo doc
   └─> Opcional: anexa comprovante
   └─> Confirma

3. INSERT contas_receber_pagamentos
   └─> Trigger atualiza parcela:
       - valor_pago += valor
       - status = pago/pagamento_parcial/adiantado

4. Upload comprovante (se houver)
   └─> Storage: comprovantes-receber
   └─> INSERT contas_receber_comprovantes

5. Atualiza tela de detalhes
```

### 3.4 Fluxo: Integração com Encomendas

```
1. /encomendas/:id (Detalhes da encomenda)
   └─> Clica "Ver Financeiro" ou "Dar Baixa"

2. navigate('/financeiro/contas-receber/:conta_receber_id', {
     state: { 
       voltarPara: 'encomenda', 
       encomendaId: id,
       parcelaId: parcela.id 
     }
   })

3. /financeiro/contas-receber/:id
   └─> Detecta parcelaIdInicial
   └─> Abre DarBaixaDialog automaticamente

4. Após baixa, botão "Voltar" retorna para encomenda
```

---

## 4. Estrutura do Banco de Dados {#estrutura-do-banco-de-dados}

### 4.1 Tabelas Principais

#### `contas_receber`
```sql
CREATE TABLE contas_receber (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id UUID NOT NULL,
  cliente_id UUID REFERENCES clientes(id),
  cliente_nome VARCHAR,
  cliente_documento VARCHAR,
  banco_id UUID REFERENCES bancos(id) NOT NULL,
  tipo_documento_id UUID REFERENCES tipos_documento(id),
  plano_conta_id UUID REFERENCES plano_contas(id),
  descricao TEXT NOT NULL,
  valor NUMERIC NOT NULL,
  data_emissao DATE,
  data_vencimento DATE NOT NULL,
  numero_parcelas INTEGER DEFAULT 1,
  tipo_lancamento VARCHAR DEFAULT 'unico', -- unico/parcelado/recorrente
  e_recorrente BOOLEAN DEFAULT false,
  dia_vencimento_recorrente INTEGER,
  status VARCHAR DEFAULT 'pendente',
  observacoes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

#### `contas_receber_parcelas`
```sql
CREATE TABLE contas_receber_parcelas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conta_receber_id UUID NOT NULL REFERENCES contas_receber(id) ON DELETE CASCADE,
  numero_parcela INTEGER NOT NULL,
  data_emissao DATE DEFAULT CURRENT_DATE,
  data_vencimento DATE NOT NULL,
  valor_total NUMERIC DEFAULT 0,
  valor_parcela NUMERIC NOT NULL,
  valor_pago NUMERIC DEFAULT 0,
  data_pagamento DATE,
  juros NUMERIC DEFAULT 0,
  desconto NUMERIC DEFAULT 0,
  status VARCHAR DEFAULT 'aberto', -- aberto/atrasado/pago/pagamento_parcial/adiantado/pago_em_atraso
  observacao TEXT,
  observacao_interna TEXT,
  tags TEXT[],
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

#### `contas_receber_pagamentos`
```sql
CREATE TABLE contas_receber_pagamentos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parcela_id UUID NOT NULL REFERENCES contas_receber_parcelas(id),
  data_pagamento DATE NOT NULL,
  valor_pago NUMERIC NOT NULL DEFAULT 0,
  juros NUMERIC DEFAULT 0,
  desconto NUMERIC DEFAULT 0,
  banco_id UUID NOT NULL REFERENCES bancos(id),
  tipo_documento_id UUID NOT NULL REFERENCES tipos_documento(id),
  observacao TEXT,
  estornado BOOLEAN DEFAULT false,
  data_estorno TIMESTAMPTZ,
  motivo_estorno TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

#### `contas_receber_comprovantes`
```sql
CREATE TABLE contas_receber_comprovantes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pagamento_id UUID NOT NULL REFERENCES contas_receber_pagamentos(id),
  nome_arquivo VARCHAR NOT NULL,
  tipo_arquivo VARCHAR,
  tamanho_bytes INTEGER,
  url_storage TEXT NOT NULL, -- path no bucket
  created_at TIMESTAMPTZ DEFAULT now()
);
```

#### `contas_pagar` (estrutura similar a contas_receber)
```sql
-- Campos similares, com:
-- fornecedor_id em vez de cliente_id
-- plano_contas_id em vez de plano_conta_id
```

#### `bancos`
```sql
CREATE TABLE bancos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id UUID NOT NULL,
  codigo VARCHAR NOT NULL,
  nome VARCHAR NOT NULL,
  tipo VARCHAR NOT NULL, -- Conta Corrente/Poupança/Caixa
  saldo_inicial NUMERIC DEFAULT 0,
  habilitado BOOLEAN DEFAULT false,
  e_banco_oficial BOOLEAN DEFAULT false,
  e_customizado BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

#### `saldos_iniciais_bancos`
```sql
CREATE TABLE saldos_iniciais_bancos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  banco_id UUID NOT NULL REFERENCES bancos(id),
  mes_referencia INTEGER NOT NULL,
  ano_referencia INTEGER NOT NULL,
  data_referencia DATE NOT NULL,
  saldo_inicial NUMERIC DEFAULT 0,
  observacao TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, banco_id, mes_referencia, ano_referencia)
);
```

#### `configuracoes_juros`
```sql
CREATE TABLE configuracoes_juros (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id UUID NOT NULL UNIQUE,
  cobrar_juros BOOLEAN DEFAULT false,
  tipo_juros VARCHAR DEFAULT 'mensal', -- mensal/diario
  percentual_juros NUMERIC DEFAULT 1,
  multa_atraso BOOLEAN DEFAULT false,
  percentual_multa NUMERIC DEFAULT 2,
  observacao TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

#### `categorias_plano_contas`
```sql
CREATE TABLE categorias_plano_contas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  codigo VARCHAR NOT NULL,
  descricao VARCHAR NOT NULL,
  indicador VARCHAR NOT NULL, -- Credito/Debito
  faixa_dre VARCHAR NOT NULL, -- Receitas/Deduções sobre vendas/Custos variáveis/etc
  ordem INTEGER DEFAULT 0,
  ativo BOOLEAN DEFAULT true,
  e_padrao BOOLEAN DEFAULT false,
  padrao_sistema BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, codigo)
);
```

#### `plano_contas`
```sql
CREATE TABLE plano_contas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  categoria_id UUID NOT NULL REFERENCES categorias_plano_contas(id),
  codigo INTEGER NOT NULL,
  codigo_estruturado VARCHAR NOT NULL, -- Ex: 1.01, 3.02
  descricao VARCHAR NOT NULL,
  ativo BOOLEAN DEFAULT true,
  e_padrao BOOLEAN DEFAULT false,
  padrao_sistema BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, codigo_estruturado)
);
```

### 4.2 Views

#### `vw_contas_receber_parcelas`
```sql
-- Junta parcelas com dados da conta principal
-- Inclui: cliente_id, cliente_nome, plano_contas, banco, tipo_documento
-- Usado para listagem e filtros
```

#### `vw_resumo_financeiro`
```sql
-- Agrupa por banco, mês, ano
-- Calcula: saldo_inicial, entradas_mes, saidas_mes, saldo_atual
-- Usado no banner do hub financeiro
```

#### `vw_contas_receber_dashboard`
```sql
-- Totais agregados por usuário
-- total_a_receber, total_recebido, total_atrasado, vencendo_hoje
```

### 4.3 Triggers

#### `atualizar_parcela_apos_pagamento`
```sql
-- Dispara após INSERT em contas_receber_pagamentos
-- Atualiza valor_pago da parcela
-- Define status baseado em:
--   - valor_pago >= valor_parcela → 'pago'
--   - data_pagamento > data_vencimento → 'pago_em_atraso'
--   - data_pagamento < data_vencimento → 'adiantado'
--   - valor_pago > 0 e < valor_parcela → 'pagamento_parcial'
```

### 4.4 Functions

#### `calcular_juros_com_config(p_user_id, p_valor, p_data_venc, p_data_pag)`
```sql
RETURNS TABLE(juros NUMERIC, multa NUMERIC, total NUMERIC)
-- Busca configuracao do usuário
-- Calcula juros proporcional
-- Calcula multa (se aplicável)
```

#### `criar_categorias_plano_padrao(p_user_id)`
```sql
-- Cria categorias padrão do DRE para novo usuário
-- 17 categorias predefinidas
```

#### `criar_planos_contas_padrao(p_user_id)`
```sql
-- Cria planos de contas padrão para novo usuário
-- Vinculados às categorias padrão
```

### 4.5 RLS Policies

```sql
-- Todas as tabelas financeiras seguem o padrão:
CREATE POLICY "Users can view own [table]"
  ON [table] FOR SELECT
  USING (auth.uid() = usuario_id);

CREATE POLICY "Users can insert own [table]"
  ON [table] FOR INSERT
  WITH CHECK (auth.uid() = usuario_id);

CREATE POLICY "Users can update own [table]"
  ON [table] FOR UPDATE
  USING (auth.uid() = usuario_id);

CREATE POLICY "Users can delete own [table]"
  ON [table] FOR DELETE
  USING (auth.uid() = usuario_id);

-- Parcelas e pagamentos usam subquery para verificar ownership:
USING (EXISTS (
  SELECT 1 FROM contas_receber
  WHERE contas_receber.id = contas_receber_parcelas.conta_receber_id
  AND contas_receber.usuario_id = auth.uid()
))
```

### 4.6 Storage Buckets

```
comprovantes-receber/
  └── {user_id}/{pagamento_id}/{filename}

comprovantes-pagar/
  └── {user_id}/{pagamento_id}/{filename}
```

---

## 5. Pontos de Integração {#pontos-de-integracao}

### 5.1 Integração com Encomendas

```typescript
// Ao salvar encomenda, pode criar conta a receber
// encomendas.conta_receber_id → contas_receber.id

// Fluxo:
// 1. Encomenda é criada
// 2. Usuário pode vincular a conta a receber
// 3. Link bidirecional permite:
//    - Ver financeiro da encomenda
//    - Dar baixa diretamente
```

### 5.2 Integração com Clientes

```typescript
// contas_receber.cliente_id → clientes.id
// Busca dados do cliente para recibo/relatórios
// Agrupa inadimplência por cliente
```

### 5.3 Integração com Fornecedores

```typescript
// contas_pagar.fornecedor_id → fornecedores.id
// Busca dados do fornecedor
// Agrupa inadimplência por fornecedor
```

### 5.4 Integração com Plano de Contas

```typescript
// contas_receber.plano_conta_id → plano_contas.id
// contas_pagar.plano_contas_id → plano_contas.id
// plano_contas.categoria_id → categorias_plano_contas.id

// Usado para:
// - Classificação contábil
// - Geração do DRE
// - Fluxo de caixa categorizado
```

### 5.5 Integração com Bancos

```typescript
// contas_*.banco_id → bancos.id
// *_pagamentos.banco_id → bancos.id

// Usado para:
// - Controle de saldo por banco
// - Fluxo de caixa
// - Reconciliação bancária
```

---

## 6. Checklist para Standalone {#checklist-standalone}

### 6.1 Arquivos Necessários

#### Páginas (src/pages/financeiro/)
- [ ] Financeiro.tsx
- [ ] ContasPagar.tsx
- [ ] ContasPagarForm.tsx
- [ ] ContasPagarDetalhes.tsx
- [ ] ContasReceber.tsx
- [ ] ContasReceberForm.tsx
- [ ] ContasReceberDetalhes.tsx
- [ ] FluxoCaixaHub.tsx
- [ ] FluxoCaixaDiario.tsx
- [ ] FluxoCaixaMensal.tsx
- [ ] DRE.tsx
- [ ] DashboardFinanceiro.tsx

#### Componentes (src/components/financeiro/)
- [ ] ContasReceberFormModal.tsx
- [ ] DarBaixaDialog.tsx
- [ ] DarBaixaPagarDialog.tsx

#### Configurações (src/pages/configuracoes/)
- [ ] FinanceiroPage.tsx
- [ ] Bancos.tsx
- [ ] TiposDocumentos.tsx
- [ ] CategoriasPlanoContas.tsx
- [ ] PlanoContas.tsx
- [ ] ConfiguracaoJuros.tsx (página)

#### Componentes Configurações
- [ ] src/components/configuracoes/ConfiguracaoJuros.tsx

### 6.2 Componentes UI Compartilhados

- [ ] BackButton.tsx
- [ ] PageHeader.tsx
- [ ] LoadingState.tsx
- [ ] DatePickerField.tsx
- [ ] FornecedorAutocomplete.tsx
- [ ] ClienteAutocomplete.tsx
- [ ] PlanoContasAutocomplete.tsx
- [ ] CategoriaPlanoContasAutocomplete.tsx

### 6.3 Componentes shadcn/ui

- [ ] button, card, input, label, textarea
- [ ] select, checkbox, switch, radio-group
- [ ] table, badge, alert, separator
- [ ] dialog, dropdown-menu, popover
- [ ] command, collapsible, calendar
- [ ] toast, sonner

### 6.4 Hooks

- [ ] useToast (hooks/use-toast.ts)
- [ ] useUserId (hooks/useUserId.ts)

### 6.5 Utilitários

- [ ] src/lib/utils.ts (cn function)
- [ ] src/utils/gerarReciboPagamento.ts

### 6.6 Integrações

- [ ] src/integrations/supabase/client.ts
- [ ] src/integrations/supabase/types.ts

### 6.7 Contextos

- [ ] AuthContext.tsx
- [ ] GlobalLoadingContext.tsx

### 6.8 Dependências npm

```json
{
  "@supabase/supabase-js": "^2.75.0",
  "@tanstack/react-query": "^5.83.0",
  "date-fns": "^4.1.0",
  "recharts": "^2.15.4",
  "xlsx": "^0.18.5",
  "jspdf": "^3.0.3",
  "jspdf-autotable": "^5.0.2",
  "lucide-react": "^0.462.0",
  "react-router-dom": "^6.30.1"
}
```

### 6.9 Tabelas do Banco

- [ ] contas_receber
- [ ] contas_receber_parcelas
- [ ] contas_receber_pagamentos
- [ ] contas_receber_comprovantes
- [ ] contas_pagar
- [ ] contas_pagar_parcelas
- [ ] contas_pagar_pagamentos
- [ ] contas_pagar_comprovantes
- [ ] bancos
- [ ] saldos_iniciais_bancos
- [ ] configuracoes_juros
- [ ] categorias_plano_contas
- [ ] plano_contas
- [ ] tipos_documento

### 6.10 Views

- [ ] vw_contas_receber_parcelas
- [ ] vw_resumo_financeiro
- [ ] vw_contas_receber_dashboard

### 6.11 Functions

- [ ] calcular_juros_com_config
- [ ] criar_categorias_plano_padrao
- [ ] criar_planos_contas_padrao
- [ ] gerar_proximo_codigo_categoria
- [ ] gerar_proximo_codigo_plano
- [ ] gerar_proximo_codigo_estruturado

### 6.12 Triggers

- [ ] atualizar_parcela_apos_pagamento (receber)
- [ ] atualizar_parcela_apos_pagamento (pagar)
- [ ] trigger_atualizar_status_parcela

### 6.13 Storage

- [ ] Bucket: comprovantes-receber
- [ ] Bucket: comprovantes-pagar
- [ ] Policies de acesso

### 6.14 Removals/Ajustes para Standalone

1. **Remover integração com Encomendas**
   - Remover `conta_receber_id` de encomendas
   - Remover navegação condicional em ContasReceberDetalhes

2. **Simplificar Clientes** (opcional)
   - Manter tabela clientes simplificada
   - Ou usar campo texto `cliente_nome`

3. **Simplificar Fornecedores** (opcional)
   - Manter tabela fornecedores simplificada
   - Ou usar campo texto `fornecedor_nome`

4. **Ajustar Rotas**
   - Criar router dedicado
   - Ajustar paths relativos

5. **Criar Seeds**
   - Categorias padrão
   - Planos de contas padrão
   - Bancos oficiais

---

## Apêndice: Diagrama de Relacionamentos

```
┌─────────────────┐     ┌─────────────────────┐     ┌─────────────────────┐
│    clientes     │     │   contas_receber    │     │   categorias_plano  │
│                 │◄────│                     │     │      _contas        │
└─────────────────┘     │  cliente_id         │     └──────────┬──────────┘
                        │  banco_id           │────►           │
                        │  plano_conta_id     │────►┌──────────▼──────────┐
                        │  tipo_documento_id  │     │    plano_contas     │
                        └──────────┬──────────┘     │                     │
                                   │                │  categoria_id       │
                        ┌──────────▼──────────┐     └─────────────────────┘
                        │ contas_receber      │
                        │    _parcelas        │
                        │                     │
                        │  conta_receber_id   │
                        └──────────┬──────────┘
                                   │
                        ┌──────────▼──────────┐     ┌─────────────────────┐
                        │ contas_receber      │     │       bancos        │
                        │    _pagamentos      │────►│                     │
                        │                     │     │  usuario_id         │
                        │  parcela_id         │     │  saldo_inicial      │
                        │  banco_id           │     └─────────────────────┘
                        │  tipo_documento_id  │
                        └──────────┬──────────┘
                                   │
                        ┌──────────▼──────────┐     ┌─────────────────────┐
                        │ contas_receber      │     │  tipos_documento    │
                        │    _comprovantes    │     │                     │
                        │                     │     │  usuario_id         │
                        │  pagamento_id       │     └─────────────────────┘
                        │  url_storage        │
                        └─────────────────────┘


┌─────────────────┐     ┌─────────────────────┐
│  fornecedores   │     │    contas_pagar     │
│                 │◄────│                     │
└─────────────────┘     │  fornecedor_id      │
                        │  banco_id           │
                        │  plano_contas_id    │
                        │  tipo_documento_id  │
                        └──────────┬──────────┘
                                   │
                        (estrutura similar a contas_receber)


┌─────────────────────┐     ┌─────────────────────┐
│ configuracoes_juros │     │ saldos_iniciais     │
│                     │     │      _bancos        │
│  usuario_id         │     │                     │
│  cobrar_juros       │     │  user_id            │
│  tipo_juros         │     │  banco_id           │
│  percentual_juros   │     │  mes_referencia     │
│  multa_atraso       │     │  ano_referencia     │
│  percentual_multa   │     │  saldo_inicial      │
└─────────────────────┘     └─────────────────────┘
```

---

**Documento gerado em:** 2025-12-05
**Versão:** 1.0
**Autor:** Lovable AI
