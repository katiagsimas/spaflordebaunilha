interface ContaPagar {
  id: string;
  descricao: string;
  categoriaId: string;
  planoContaId: string;
  valor: number;
  valorPago?: number;
  dataEmissao: string;
  dataVencimento: string;
  dataPagamento?: string;
  status: 'pendente' | 'pago' | 'atrasado' | 'cancelado';
  formaPagamento?: 'dinheiro' | 'pix' | 'cartao_credito' | 'cartao_debito' | 'transferencia' | 'boleto' | 'outros';
  bancoId?: string;
  tipoDocumentoId?: string;
  numeroDocumento?: string;
  fornecedorNome?: string;
  fornecedorDocumento?: string;
  observacoes?: string;
  observacoesPagamento?: string;
  parcelado: boolean;
  numeroParcela?: number;
  totalParcelas?: number;
  grupoParcelasId?: string;
  recorrente: boolean;
  frequenciaRecorrencia?: 'mensal' | 'bimestral' | 'trimestral' | 'semestral' | 'anual';
  proximaRecorrencia?: string;
  centroCusto?: string;
  tags?: string[];
  createdAt: string;
  updatedAt: string;
}

export const contasPagarExemplo: Partial<ContaPagar>[] = [
  {
    id: 'cp-001',
    descricao: 'Aluguel - Outubro/2025',
    categoriaId: 'cat-desp-001',
    planoContaId: 'pc-desp-001',
    valor: 1800.00,
    dataEmissao: '2025-10-01',
    dataVencimento: '2025-10-05',
    status: 'pago',
    dataPagamento: '2025-10-04',
    formaPagamento: 'transferencia',
    bancoId: 'banco-001',
    fornecedorNome: 'Imobiliária XYZ',
    tipoDocumentoId: 'tipo-recibo',
    numeroDocumento: 'REC-10-2025',
    parcelado: false,
    recorrente: true,
    frequenciaRecorrencia: 'mensal',
    proximaRecorrencia: '2025-11-05',
    createdAt: '2025-10-01T00:00:00Z',
    updatedAt: '2025-10-04T00:00:00Z'
  },
  {
    id: 'cp-002',
    descricao: 'Conta de Luz - Outubro/2025',
    categoriaId: 'cat-desp-001',
    planoContaId: 'pc-desp-003',
    valor: 280.00,
    dataEmissao: '2025-10-10',
    dataVencimento: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // Vence em 2 dias
    status: 'pendente',
    fornecedorNome: 'CPFL',
    tipoDocumentoId: 'tipo-boleto',
    numeroDocumento: 'BOL-123456789',
    parcelado: false,
    recorrente: true,
    frequenciaRecorrencia: 'mensal',
    createdAt: '2025-10-10T00:00:00Z',
    updatedAt: '2025-10-10T00:00:00Z'
  },
  {
    id: 'cp-003',
    descricao: 'Fornecedor ABC - Ingredientes',
    categoriaId: 'cat-desp-008',
    planoContaId: 'pc-desp-041',
    valor: 450.00,
    dataEmissao: '2025-10-05',
    dataVencimento: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // Atrasado 3 dias
    status: 'atrasado',
    fornecedorNome: 'ABC Ingredientes Ltda',
    fornecedorDocumento: '12.345.678/0001-90',
    tipoDocumentoId: 'tipo-nota-fiscal',
    numeroDocumento: 'NF-45678',
    observacoes: 'Compra de farinha, açúcar e chocolate',
    parcelado: false,
    recorrente: false,
    createdAt: '2025-10-05T00:00:00Z',
    updatedAt: '2025-10-05T00:00:00Z'
  },
  {
    id: 'cp-004',
    descricao: 'Internet - Outubro/2025',
    categoriaId: 'cat-desp-001',
    planoContaId: 'pc-desp-004',
    valor: 120.00,
    dataEmissao: new Date().toISOString().split('T')[0],
    dataVencimento: new Date().toISOString().split('T')[0], // Vence hoje
    status: 'pendente',
    fornecedorNome: 'Vivo Fibra',
    tipoDocumentoId: 'tipo-boleto',
    numeroDocumento: 'BOL-987654321',
    parcelado: false,
    recorrente: true,
    frequenciaRecorrencia: 'mensal',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'cp-005',
    descricao: 'Embalagens Especiais - Parcela 1/3',
    categoriaId: 'cat-desp-009',
    planoContaId: 'pc-desp-046',
    valor: 250.00,
    dataEmissao: '2025-09-15',
    dataVencimento: '2025-10-15',
    status: 'pago',
    dataPagamento: '2025-10-14',
    formaPagamento: 'pix',
    bancoId: 'banco-002',
    fornecedorNome: 'Embalagens Premium',
    fornecedorDocumento: '98.765.432/0001-10',
    tipoDocumentoId: 'tipo-nota-fiscal',
    numeroDocumento: 'NF-12345-1',
    parcelado: true,
    numeroParcela: 1,
    totalParcelas: 3,
    grupoParcelasId: 'grupo-001',
    recorrente: false,
    createdAt: '2025-09-15T00:00:00Z',
    updatedAt: '2025-10-14T00:00:00Z'
  },
  {
    id: 'cp-006',
    descricao: 'Embalagens Especiais - Parcela 2/3',
    categoriaId: 'cat-desp-009',
    planoContaId: 'pc-desp-046',
    valor: 250.00,
    dataEmissao: '2025-09-15',
    dataVencimento: '2025-11-15',
    status: 'pendente',
    fornecedorNome: 'Embalagens Premium',
    fornecedorDocumento: '98.765.432/0001-10',
    tipoDocumentoId: 'tipo-nota-fiscal',
    numeroDocumento: 'NF-12345-2',
    parcelado: true,
    numeroParcela: 2,
    totalParcelas: 3,
    grupoParcelasId: 'grupo-001',
    recorrente: false,
    createdAt: '2025-09-15T00:00:00Z',
    updatedAt: '2025-09-15T00:00:00Z'
  },
  {
    id: 'cp-007',
    descricao: 'Embalagens Especiais - Parcela 3/3',
    categoriaId: 'cat-desp-009',
    planoContaId: 'pc-desp-046',
    valor: 250.00,
    dataEmissao: '2025-09-15',
    dataVencimento: '2025-12-15',
    status: 'pendente',
    fornecedorNome: 'Embalagens Premium',
    fornecedorDocumento: '98.765.432/0001-10',
    tipoDocumentoId: 'tipo-nota-fiscal',
    numeroDocumento: 'NF-12345-3',
    parcelado: true,
    numeroParcela: 3,
    totalParcelas: 3,
    grupoParcelasId: 'grupo-001',
    recorrente: false,
    createdAt: '2025-09-15T00:00:00Z',
    updatedAt: '2025-09-15T00:00:00Z'
  }
];

// Função para carregar dados de exemplo no localStorage
export function carregarDadosExemplo() {
  const contasExistentes = localStorage.getItem('contas_pagar');
  
  if (!contasExistentes || JSON.parse(contasExistentes).length === 0) {
    localStorage.setItem('contas_pagar', JSON.stringify(contasPagarExemplo));
    console.log('✓ Dados de exemplo carregados para Contas a Pagar');
    return true;
  }
  
  return false;
}
