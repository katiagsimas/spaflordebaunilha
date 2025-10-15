import { useState, useMemo, useEffect } from "react";
import * as XLSX from 'xlsx';
import { useContasPagar } from "@/hooks/useContasPagar";
import { useCategoriasFinanceiras } from "@/hooks/useCategoriasFinanceiras";
import { usePlanoContas } from "@/hooks/usePlanoContas";
import { useBancos } from "@/hooks/useBancos";
import { format, isToday, isAfter, isBefore, differenceInDays, startOfDay, startOfMonth, endOfMonth } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Plus, Search, Settings, MoreVertical, Clock, CheckCircle, AlertCircle, XCircle, Edit, Copy, Trash2, Eye, RotateCcw, DollarSign, TrendingDown, AlertTriangle, Calendar, Download, FileSpreadsheet, FileText, X, Filter } from "lucide-react";
import { toast } from "sonner";
import { ContaPagarFormDialog } from "@/components/ContaPagarFormDialog";
import { RegistrarPagamentoDialog } from "@/components/RegistrarPagamentoDialog";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { BackButton } from "@/components/BackButton";

interface ContaPagar {
  id: string;
  usuario_id: string;
  descricao: string;
  valor: number;
  data_vencimento: string;
  data_pagamento?: string;
  status: string;
  categoria_id?: string;
  observacoes?: string;
  created_at?: string;
  updated_at?: string;
}

export default function ContasPagar() {
  const { items: contas, loading, createItem, updateItem, deleteItem, refetch } = useContasPagar();
  const { categorias } = useCategoriasFinanceiras();
  const { planoContas: planos } = usePlanoContas();
  const { bancos } = useBancos();
  
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isPagamentoOpen, setIsPagamentoOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [deleteMultipleConfirmOpen, setDeleteMultipleConfirmOpen] = useState(false);
  const [selectedConta, setSelectedConta] = useState<ContaPagar | undefined>();
  const [contaToDelete, setContaToDelete] = useState<ContaPagar | undefined>();
  
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("todos");
  const [periodoFilter, setPeriodoFilter] = useState("todos");
  const [categoriaFilter, setCategoriaFilter] = useState("todos");
  const [fornecedorFilter, setFornecedorFilter] = useState("");
  const [dataEmissaoFilter, setDataEmissaoFilter] = useState("");
  const [planoContaFilter, setPlanoContaFilter] = useState("todos");
  const [dataVencimentoFilter, setDataVencimentoFilter] = useState("");
  const [dataPagamentoFilter, setDataPagamentoFilter] = useState("");
  const [selectedContas, setSelectedContas] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState("todos");
  const [mostrarAlertas, setMostrarAlertas] = useState(true);
  const [mostrarFiltros, setMostrarFiltros] = useState(false);

  // Atualizar status de contas atrasadas automaticamente
  const contasAtualizadas = useMemo(() => {
    const hoje = startOfDay(new Date());
    return contas.map(conta => {
      if (conta.status === 'pendente' && isBefore(new Date(conta.data_vencimento), hoje)) {
        return { ...conta, status: 'atrasado' };
      }
      return conta;
    });
  }, [contas]);

  // Contas que vencem hoje e nos próximos 3 dias
  const contasVencemHoje = useMemo(() => {
    return contasAtualizadas.filter(c => 
      c.status === 'pendente' && isToday(new Date(c.data_vencimento))
    );
  }, [contasAtualizadas]);

  const contasVencem3Dias = useMemo(() => {
    const hoje = startOfDay(new Date());
    return contasAtualizadas.filter(c => {
      if (c.status !== 'pendente') return false;
      const vencimento = new Date(c.data_vencimento);
      const dias = differenceInDays(vencimento, hoje);
      return dias > 0 && dias <= 3;
    });
  }, [contasAtualizadas]);

  // Filtros avançados
  const contasFiltradas = useMemo(() => {
    return contasAtualizadas.filter(conta => {
      const matchSearch = searchTerm === "" || 
        conta.descricao.toLowerCase().includes(searchTerm.toLowerCase()) ||
        conta.observacoes?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchStatus = statusFilter === "todos" || conta.status === statusFilter;
      const matchCategoria = categoriaFilter === "todos" || conta.categoria_id === categoriaFilter;
      const matchPlano = planoContaFilter === "todos" || conta.categoria_id === planoContaFilter;
      
      const matchDataVencimento = !dataVencimentoFilter || conta.data_vencimento === dataVencimentoFilter;
      const matchDataPagamento = !dataPagamentoFilter || conta.data_pagamento === dataPagamentoFilter;
      
      let matchPeriodo = true;
      if (periodoFilter !== "todos") {
        const hoje = new Date();
        const dataVenc = new Date(conta.data_vencimento);
        
        if (periodoFilter === "hoje") {
          matchPeriodo = isToday(dataVenc);
        } else if (periodoFilter === "semana") {
          matchPeriodo = differenceInDays(dataVenc, hoje) <= 7 && differenceInDays(dataVenc, hoje) >= 0;
        } else if (periodoFilter === "mes") {
          matchPeriodo = dataVenc.getMonth() === hoje.getMonth() && dataVenc.getFullYear() === hoje.getFullYear();
        }
      }
      
      return matchSearch && matchStatus && matchCategoria && matchPeriodo && matchPlano && matchDataVencimento && matchDataPagamento;
    });
  }, [contasAtualizadas, searchTerm, statusFilter, categoriaFilter, periodoFilter, planoContaFilter, dataVencimentoFilter, dataPagamentoFilter]);

  // Estatísticas
  const stats = useMemo(() => {
    const hoje = startOfDay(new Date());
    const inicioMes = startOfMonth(hoje);
    const fimMes = endOfMonth(hoje);

    const aPagar = contasAtualizadas.filter(c => c.status === 'pendente' || c.status === 'atrasado');
    const pagas = contasAtualizadas.filter(c => c.status === 'pago');
    const atrasadas = contasAtualizadas.filter(c => c.status === 'atrasado');
    const esteMes = contasAtualizadas.filter(c => {
      const data = new Date(c.data_vencimento);
      return data >= inicioMes && data <= fimMes;
    });
    const vencidas = contasAtualizadas.filter(c => c.status === 'atrasado');

    return {
      aPagar: { valor: aPagar.reduce((sum, c) => sum + Number(c.valor), 0), count: aPagar.length },
      pagas: { valor: pagas.reduce((sum, c) => sum + Number(c.valor), 0), count: pagas.length },
      atrasadas: { valor: atrasadas.reduce((sum, c) => sum + Number(c.valor), 0), count: atrasadas.length },
      esteMes: { valor: esteMes.reduce((sum, c) => sum + Number(c.valor), 0), count: esteMes.length },
      vencidas: { valor: vencidas.reduce((sum, c) => sum + Number(c.valor), 0), count: vencidas.length }
    };
  }, [contasAtualizadas]);

  // Filtros por aba
  const contasPorAba = useMemo(() => {
    const hoje = startOfDay(new Date());
    const inicioMes = startOfMonth(hoje);
    const fimMes = endOfMonth(hoje);
    
    return {
      todos: contasFiltradas,
      emAberto: contasFiltradas.filter(c => c.status === 'pendente' || c.status === 'atrasado'),
      vencendoHoje: contasFiltradas.filter(c => c.status === 'pendente' && isToday(new Date(c.data_vencimento))),
      vencidas: contasFiltradas.filter(c => c.status === 'atrasado'),
      esteMes: contasFiltradas.filter(c => {
        const data = new Date(c.data_vencimento);
        return data >= inicioMes && data <= fimMes;
      }),
      pagas: contasFiltradas.filter(c => c.status === 'pago')
    };
  }, [contasFiltradas]);

  const handleSave = async (conta: any) => {
    try {
      if (selectedConta) {
        await updateItem(selectedConta.id, {
          descricao: conta.descricao,
          valor: conta.valor,
          data_vencimento: conta.data_vencimento,
          data_pagamento: conta.data_pagamento,
          status: conta.status,
          categoria_id: conta.categoria_id,
          observacoes: conta.observacoes
        });
      } else {
        await createItem({
          descricao: conta.descricao,
          valor: conta.valor,
          data_vencimento: conta.data_vencimento,
          status: conta.status || 'pendente',
          categoria_id: conta.categoria_id,
          observacoes: conta.observacoes
        });
      }
      setIsFormOpen(false);
      setSelectedConta(undefined);
      refetch();
    } catch (error: any) {
      toast.error(error.message || "Erro ao salvar conta a pagar");
    }
  };

  const handleEdit = (conta: ContaPagar) => {
    setSelectedConta(conta);
    setIsFormOpen(true);
  };

  const handleDuplicate = async (conta: ContaPagar) => {
    try {
      await createItem({
        descricao: `${conta.descricao} (Cópia)`,
        valor: conta.valor,
        data_vencimento: conta.data_vencimento,
        status: 'pendente',
        categoria_id: conta.categoria_id,
        observacoes: conta.observacoes
      });
      refetch();
    } catch (error: any) {
      toast.error(error.message || "Erro ao duplicar conta");
    }
  };

  const handleDelete = async () => {
    if (!contaToDelete) return;
    
    try {
      await deleteItem(contaToDelete.id);
      setIsDeleteOpen(false);
      setContaToDelete(undefined);
      refetch();
    } catch (error: any) {
      toast.error(error.message || "Erro ao excluir conta");
    }
  };

  // Ações em lote
  const handleSelectAll = () => {
    if (selectedContas.length === contasFiltradas.length) {
      setSelectedContas([]);
    } else {
      setSelectedContas(contasFiltradas.map(c => c.id));
    }
  };

  const handleExcluirSelecionadas = () => {
    if (selectedContas.length === 0) {
      toast.error("Nenhuma conta selecionada");
      return;
    }
    setDeleteMultipleConfirmOpen(true);
  };

  const confirmExcluirSelecionadas = async () => {
    try {
      for (const id of selectedContas) {
        await deleteItem(id);
      }
      toast.success(`${selectedContas.length} conta(s) excluída(s) com sucesso!`);
      setSelectedContas([]);
      setDeleteMultipleConfirmOpen(false);
      refetch();
    } catch (error: any) {
      toast.error(error.message || "Erro ao excluir contas");
    }
  };

  const handleEditarEmLote = () => {
    toast.info("Funcionalidade de edição em lote em desenvolvimento");
  };

  const handlePagamentoEmLote = () => {
    toast.info("Funcionalidade de pagamento em lote em desenvolvimento");
  };

  const handleRegistrarPagamento = (conta: ContaPagar) => {
    setSelectedConta(conta);
    setIsPagamentoOpen(true);
  };

  const handlePagamentoRegistrado = async (contaAtualizada: any) => {
    try {
      // Atualizar conta com dados do pagamento
      await updateItem(contaAtualizada.id, {
        status: 'pago',
        data_pagamento: contaAtualizada.data_pagamento,
        observacoes: contaAtualizada.observacoes
      });
      
      toast.success("Pagamento registrado com sucesso!");
      setIsPagamentoOpen(false);
      setSelectedConta(undefined);
      refetch();
    } catch (error: any) {
      toast.error(error.message || "Erro ao registrar pagamento");
    }
  };

  const handlePagamentoRegistrado_OLD = (contaAtualizada: any) => {
    // Construir observação automática
    let obsAdicional = '';
    
    // Verificar diferença de valor (removido: não existe valorPago no schema atual)
    const diferenca = 0;
    if (diferenca !== 0) {
      if (diferenca > 0) {
        obsAdicional = `Acréscimo de ${formatCurrency(diferenca)} (juros/multa)`;
      } else {
        obsAdicional = `Desconto de ${formatCurrency(Math.abs(diferenca))}`;
      }
    }
    
    // Verificar atraso
    const vencimento = new Date(contaAtualizada.data_vencimento);
    const pagamento = contaAtualizada.data_pagamento ? new Date(contaAtualizada.data_pagamento) : new Date();
    vencimento.setHours(0, 0, 0, 0);
    pagamento.setHours(0, 0, 0, 0);
    
    if (pagamento > vencimento) {
      const diasAtraso = Math.floor((pagamento.getTime() - vencimento.getTime()) / (1000 * 60 * 60 * 24));
      const atrasoObs = `Pago com ${diasAtraso} dia(s) de atraso`;
      obsAdicional = obsAdicional ? `${obsAdicional}. ${atrasoObs}` : atrasoObs;
    }
    
  };


  const handleEstornarPagamento = async (conta: ContaPagar) => {
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    const vencimento = new Date(conta.data_vencimento);
    vencimento.setHours(0, 0, 0, 0);
    
    try {
      await updateItem(conta.id, {
        status: vencimento < hoje ? 'atrasado' : 'pendente',
        data_pagamento: null,
        observacoes: conta.observacoes 
          ? `${conta.observacoes}\nPagamento estornado em ${format(new Date(), "dd/MM/yyyy", { locale: ptBR })}`
          : `Pagamento estornado em ${format(new Date(), "dd/MM/yyyy", { locale: ptBR })}`
      });
      toast.success("Pagamento estornado com sucesso!");
      refetch();
    } catch (error: any) {
      toast.error(error.message || "Erro ao estornar pagamento");
    }
  };

  const getStatusBadge = (status: string) => {
    const badges = {
      pendente: { label: "Pendente", variant: "pendente" as const, icon: Clock },
      pago: { label: "Pago", variant: "pronto" as const, icon: CheckCircle },
      atrasado: { label: "Atrasado", variant: "cancelado" as const, icon: AlertCircle },
      cancelado: { label: "Cancelado", variant: "entregue" as const, icon: XCircle }
    };
    const badge = badges[status as keyof typeof badges];
    const Icon = badge.icon;
    return (
      <Badge variant={badge.variant} className="flex items-center gap-1">
        <Icon className="h-3 w-3" />
        {badge.label}
      </Badge>
    );
  };

  const getRowClassName = (conta: ContaPagar) => {
    const hoje = startOfDay(new Date());
    const vencimento = new Date(conta.data_vencimento);
    const diasAteVencimento = differenceInDays(vencimento, hoje);

    if (conta.status === 'atrasado') {
      return "bg-[#FFEBEE] bg-opacity-40 border-l-4 border-[#D88B8B]";
    }
    if (conta.status === 'pendente' && isToday(vencimento)) {
      return "bg-[#FEF3E2] bg-opacity-40 border-l-4 border-[#E5C89F]";
    }
    if (conta.status === 'pendente' && diasAteVencimento <= 3 && diasAteVencimento > 0) {
      return "bg-[#FFF3E0] bg-opacity-30 border-l-4 border-[#E5A868]";
    }
    if (conta.status === 'pago') {
      return "opacity-70";
    }
    return "";
  };

  const getPrioridadeConta = (conta: ContaPagar): 'alta' | 'media' | 'baixa' => {
    if (conta.status === 'atrasado') return 'alta';
    
    const hoje = new Date();
    const vencimento = new Date(conta.data_vencimento);
    const diffDays = Math.floor((vencimento.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays <= 0) return 'alta';
    if (diffDays <= 3) return 'media';
    return 'baixa';
  };

  const PrioridadeIndicador = ({ prioridade }: { prioridade: 'alta' | 'media' | 'baixa' }) => {
    if (prioridade === 'alta') {
      return <span className="text-[#D88B8B] text-lg" title="Prioridade Alta">🔴</span>;
    }
    if (prioridade === 'media') {
      return <span className="text-[#E5C89F] text-lg" title="Prioridade Média">🟡</span>;
    }
    return null;
  };

  const exportarExcel = () => {
    const dados = contasFiltradas.map(conta => {
      const categoria = getCategoriaById(conta.categoria_id);

      return {
        'Data Vencimento': format(new Date(conta.data_vencimento), "dd/MM/yyyy"),
        'Descrição': conta.descricao,
        'Categoria': categoria?.nome || '',
        'Valor': conta.valor,
        'Status': conta.status,
        'Data Pagamento': conta.data_pagamento ? format(new Date(conta.data_pagamento), "dd/MM/yyyy") : '',
        'Observações': conta.observacoes || ''
      };
    });

    const ws = XLSX.utils.json_to_sheet(dados);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Contas a Pagar");
    
    // Ajustar largura das colunas
    const colWidths = [
      { wch: 12 }, // Data Emissão
      { wch: 12 }, // Data Vencimento
      { wch: 40 }, // Descrição
      { wch: 25 }, // Fornecedor
      { wch: 20 }, // Categoria
      { wch: 20 }, // Plano de Contas
      { wch: 12 }, // Valor
      { wch: 10 }, // Status
      { wch: 12 }, // Data Pagamento
      { wch: 18 }, // Forma Pagamento
      { wch: 20 }, // Banco
      { wch: 30 }, // Observações
    ];
    ws['!cols'] = colWidths;

    XLSX.writeFile(wb, `contas-pagar-${format(new Date(), "yyyy-MM-dd")}.xlsx`);
    toast.success("Arquivo Excel exportado com sucesso!");
  };

  const exportarCSV = () => {
    const headers = [
      'Data Vencimento',
      'Descrição',
      'Categoria',
      'Valor',
      'Status',
      'Data Pagamento',
      'Observações'
    ];

    const rows = contasFiltradas.map(conta => {
      const categoria = getCategoriaById(conta.categoria_id);

      return [
        format(new Date(conta.data_vencimento), "dd/MM/yyyy"),
        conta.descricao,
        categoria?.nome || '',
        conta.valor.toFixed(2),
        conta.status,
        conta.data_pagamento ? format(new Date(conta.data_pagamento), "dd/MM/yyyy") : '',
        conta.observacoes || ''
      ];
    });

    const csv = [headers, ...rows]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `contas-pagar-${format(new Date(), "yyyy-MM-dd")}.csv`;
    link.click();
    
    toast.success("Arquivo CSV exportado com sucesso!");
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  const getCategoriaById = (id: string) => categorias.find(c => c.id === id);
  const getPlanoById = (id: string) => planos.find(p => p.id === id);
  const getBancoById = (id: string) => bancos.find(b => b.id === id);

  const formasPagamentoLabels: Record<string, string> = {
    dinheiro: 'Dinheiro',
    pix: 'Pix',
    cartao_credito: 'Cartão de Crédito',
    cartao_debito: 'Cartão de Débito',
    transferencia: 'Transferência',
    boleto: 'Boleto',
    outros: 'Outros'
  };

  return (
    <div className="min-h-screen bg-[#FAF7F5]">
      <div className="bg-white border-b border-[#E8E3DF] shadow-sm">
        <div className="container mx-auto px-4 py-6">
          <BackButton to="/financeiro" />
          <h1 className="text-3xl font-bold text-[#6B5047]">Contas a Pagar</h1>
          <p className="text-[#9C8B82] mt-1">Controle de despesas e pagamentos</p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 space-y-6">
        {/* Banner de Alertas */}
        {mostrarAlertas && (stats.atrasadas.count > 0 || contasVencemHoje.length > 0 || contasVencem3Dias.length > 0) && (
          <div className="space-y-3">
            {/* Contas Atrasadas - Prioridade Alta */}
            {stats.atrasadas.count > 0 && (
              <div className="bg-[#FFEBEE] border-l-4 border-[#D88B8B] p-4 rounded-lg relative animate-pulse">
                <button
                  onClick={() => setMostrarAlertas(false)}
                  className="absolute top-2 right-2 text-[#9C8B82] hover:text-[#6B5047] transition"
                >
                  <X className="h-4 w-4" />
                </button>
                <div className="flex items-center gap-3">
                  <AlertCircle className="text-[#D88B8B] h-6 w-6 shrink-0" />
                  <div className="flex-1">
                    <p className="font-bold text-[#6B5047]">
                      ⚠️ ATENÇÃO: {stats.atrasadas.count} conta(s) atrasada(s)
                    </p>
                    <p className="text-sm text-[#9C8B82]">
                      Total: {formatCurrency(stats.atrasadas.valor)}
                    </p>
                  </div>
                  <Button
                    onClick={() => {
                      setStatusFilter('atrasado');
                      setActiveTab('todas');
                    }}
                    variant="destructive"
                    size="sm"
                  >
                    Ver contas
                  </Button>
                </div>
              </div>
            )}

            {/* Vence Hoje */}
            {contasVencemHoje.length > 0 && (
              <div className="bg-[#FEF3E2] border-l-4 border-[#E5C89F] p-4 rounded-lg relative">
                <button
                  onClick={() => setMostrarAlertas(false)}
                  className="absolute top-2 right-2 text-[#9C8B82] hover:text-[#6B5047] transition"
                >
                  <X className="h-4 w-4" />
                </button>
                <div className="flex items-center gap-3">
                  <Clock className="text-[#E5C89F] h-5 w-5 shrink-0" />
                  <div className="flex-1">
                    <p className="font-semibold text-[#6B5047]">
                      {contasVencemHoje.length} conta(s) vence(m) hoje
                    </p>
                    <p className="text-sm text-[#9C8B82]">
                      Total: {formatCurrency(contasVencemHoje.reduce((sum, c) => sum + c.valor, 0))}
                    </p>
                  </div>
                  <Button
                    onClick={() => {
                      setPeriodoFilter('hoje');
                      setActiveTab('vencendoHoje');
                    }}
                    variant="outline"
                    size="sm"
                  >
                    Ver contas
                  </Button>
                </div>
              </div>
            )}

            {/* Vence em 3 dias */}
            {contasVencem3Dias.length > 0 && (
              <div className="bg-[#E3F2FD] border-l-4 border-[#7BA8D8] p-4 rounded-lg relative">
                <button
                  onClick={() => setMostrarAlertas(false)}
                  className="absolute top-2 right-2 text-[#9C8B82] hover:text-[#6B5047] transition"
                >
                  <X className="h-4 w-4" />
                </button>
                <div className="flex items-center gap-3">
                  <AlertTriangle className="text-[#7BA8D8] h-5 w-5 shrink-0" />
                  <div className="flex-1">
                    <p className="font-medium text-[#6B5047]">
                      💡 {contasVencem3Dias.length} conta(s) vence(m) nos próximos 3 dias
                    </p>
                    <p className="text-sm text-[#9C8B82]">
                      Total: {formatCurrency(contasVencem3Dias.reduce((sum, c) => sum + c.valor, 0))}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Cards de Resumo */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
          <Card className="p-4 border-l-4 border-l-[#7BA8D8] hover:shadow-lg transition-shadow">
            <div className="space-y-2">
              <p className="text-sm text-[#9C8B82]">A Pagar</p>
              <p className="text-2xl font-bold text-[#6B5047]">{formatCurrency(stats.aPagar.valor)}</p>
              <p className="text-xs text-[#9C8B82]">{stats.aPagar.count} contas</p>
            </div>
          </Card>

          <Card className="p-4 border-l-4 border-l-[#D88B8B] hover:shadow-lg transition-shadow">
            <div className="space-y-2">
              <p className="text-sm text-[#9C8B82]">Vencido</p>
              <p className="text-2xl font-bold text-[#C62828]">{formatCurrency(stats.atrasadas.valor)}</p>
              <p className="text-xs text-[#9C8B82]">{stats.atrasadas.count} contas</p>
            </div>
          </Card>

          <Card className="p-4 border-l-4 border-l-[#D89B8C] hover:shadow-lg transition-shadow">
            <div className="space-y-2">
              <p className="text-sm text-[#9C8B82]">Este Mês</p>
              <p className="text-2xl font-bold text-[#D89B8C]">{formatCurrency(stats.esteMes.valor)}</p>
              <p className="text-xs text-[#9C8B82]">{stats.esteMes.count} contas</p>
            </div>
          </Card>

          <Card className="p-4 border-l-4 border-l-[#8BA888] hover:shadow-lg transition-shadow">
            <div className="space-y-2">
              <p className="text-sm text-[#9C8B82]">Contas Pagas</p>
              <p className="text-2xl font-bold text-[#388E3C]">{formatCurrency(stats.pagas.valor)}</p>
              <p className="text-xs text-[#9C8B82]">{stats.pagas.count} contas</p>
            </div>
          </Card>
        </div>

        {/* Filtros e Ações */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col lg:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-[#9C8B82]" />
                <Input
                  placeholder="Buscar por descrição, fornecedor ou documento..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full lg:w-[180px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos os Status</SelectItem>
                  <SelectItem value="pendente">Pendente</SelectItem>
                  <SelectItem value="pago">Pago</SelectItem>
                  <SelectItem value="atrasado">Atrasado</SelectItem>
                  <SelectItem value="cancelado">Cancelado</SelectItem>
                </SelectContent>
              </Select>

              <Select value={periodoFilter} onValueChange={setPeriodoFilter}>
                <SelectTrigger className="w-full lg:w-[180px]">
                  <SelectValue placeholder="Período" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos os Períodos</SelectItem>
                  <SelectItem value="hoje">Hoje</SelectItem>
                  <SelectItem value="semana">Esta Semana</SelectItem>
                  <SelectItem value="mes">Este Mês</SelectItem>
                </SelectContent>
              </Select>

              <Select value={categoriaFilter} onValueChange={setCategoriaFilter}>
                <SelectTrigger className="w-full lg:w-[180px]">
                  <SelectValue placeholder="Categoria" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todas as Categorias</SelectItem>
                  {categorias.map(cat => (
                    <SelectItem key={cat.id} value={cat.id}>{cat.nome}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Button
                onClick={() => {
                  setSelectedConta(undefined);
                  setIsFormOpen(true);
                }}
                className="w-full lg:w-auto"
              >
                <Plus className="h-4 w-4 mr-2" />
                Nova Conta a Pagar
              </Button>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="w-full lg:w-auto">
                    <Download className="h-4 w-4 mr-2" />
                    Exportar
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={exportarExcel}>
                    <FileSpreadsheet className="h-4 w-4 mr-2" />
                    Exportar para Excel
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={exportarCSV}>
                    <FileText className="h-4 w-4 mr-2" />
                    Exportar para CSV
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </CardContent>
        </Card>

        {/* Tabs e Tabela */}
        <Card>
          <CardContent className="pt-6">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-6">
                <TabsTrigger value="todos">Todos ({contasPorAba.todos.length})</TabsTrigger>
                <TabsTrigger value="emAberto">Em Aberto ({contasPorAba.emAberto.length})</TabsTrigger>
                <TabsTrigger value="vencendoHoje">Vencendo Hoje ({contasPorAba.vencendoHoje.length})</TabsTrigger>
                <TabsTrigger value="vencidas">Vencidas ({contasPorAba.vencidas.length})</TabsTrigger>
                <TabsTrigger value="esteMes">Este Mês ({contasPorAba.esteMes.length})</TabsTrigger>
                <TabsTrigger value="pagas">Pagas ({contasPorAba.pagas.length})</TabsTrigger>
              </TabsList>

              {Object.entries(contasPorAba).map(([key, contas]) => (
                <TabsContent key={key} value={key} className="mt-6">
                  {contas.length === 0 ? (
                    <div className="text-center py-12 text-[#9C8B82]">
                      <DollarSign className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>Nenhuma conta encontrada</p>
                    </div>
                  ) : (
                    <>
                      {/* Barra de Ações em Lote */}
                      <div className="flex items-center gap-3 mb-4">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleSelectAll}
                        >
                          {selectedContas.length === contas.length ? "Desmarcar todas" : "Selecionar todas"}
                        </Button>

                        {selectedContas.length > 0 && (
                          <>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={handleEditarEmLote}
                            >
                              <Edit className="h-4 w-4 mr-2" />
                              Editar
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={handlePagamentoEmLote}
                            >
                              <DollarSign className="h-4 w-4 mr-2" />
                              Pagamento
                            </Button>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={handleExcluirSelecionadas}
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Excluir
                            </Button>
                            <span className="text-sm text-[#9C8B82]">
                              {selectedContas.length} selecionada(s)
                            </span>
                          </>
                        )}
                      </div>

                      <div className="overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead className="w-[50px]">
                                <Checkbox 
                                  checked={selectedContas.length === contas.length && contas.length > 0}
                                  onCheckedChange={handleSelectAll}
                                />
                              </TableHead>
                            <TableHead className="w-[50px]"></TableHead>
                            <TableHead>Data</TableHead>
                            <TableHead>Descrição</TableHead>
                            <TableHead>Fornecedor</TableHead>
                            <TableHead>Valor</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="w-[70px]">Ações</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {contas.map((conta) => {
                            const categoria = getCategoriaById(conta.categoria_id);

                            return (
                              <TableRow key={conta.id} className={getRowClassName(conta)}>
                                <TableCell>
                                  <Checkbox 
                                    checked={selectedContas.includes(conta.id)}
                                    onCheckedChange={(checked) => {
                                      if (checked) {
                                        setSelectedContas([...selectedContas, conta.id]);
                                      } else {
                                        setSelectedContas(selectedContas.filter(id => id !== conta.id));
                                      }
                                    }}
                                  />
                                </TableCell>
                                <TableCell>
                                  <PrioridadeIndicador prioridade={getPrioridadeConta(conta)} />
                                </TableCell>
                                <TableCell>
                                  <div className="flex flex-col text-sm">
                                    <span className="text-xs text-[#9C8B82]">
                                      {conta.status === 'pago' ? 'Pago: ' : 'Venc: '}
                                      {format(new Date(conta.status === 'pago' && conta.data_pagamento ? conta.data_pagamento : conta.data_vencimento), "dd/MMM", { locale: ptBR })}
                                    </span>
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <div className="flex flex-col">
                                    <span className="font-semibold text-[#6B5047]">{conta.descricao}</span>
                                    <span className="text-sm text-[#9C8B82]">{categoria?.nome}</span>
                                  </div>
                                </TableCell>
                                <TableCell className="text-sm text-[#9C8B82]">
                                  -
                                </TableCell>
                                <TableCell className={`font-semibold ${conta.status === 'atrasado' ? 'text-[#D88B8B] font-bold' : 'text-[#6B5047]'}`}>
                                  {formatCurrency(conta.valor)}
                                </TableCell>
                                <TableCell>
                                  {getStatusBadge(conta.status)}
                                </TableCell>
                                <TableCell>
                                  <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                      <Button variant="ghost" size="icon">
                                        <MoreVertical className="h-4 w-4" />
                                      </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                      {conta.status === 'pendente' || conta.status === 'atrasado' ? (
                                        <>
                                          <DropdownMenuItem onClick={() => handleRegistrarPagamento(conta)}>
                                            <CheckCircle className="h-4 w-4 mr-2" />
                                            Registrar Pagamento
                                          </DropdownMenuItem>
                                          <DropdownMenuItem onClick={() => handleEdit(conta)}>
                                            <Edit className="h-4 w-4 mr-2" />
                                            Editar
                                          </DropdownMenuItem>
                                          <DropdownMenuItem onClick={() => handleDuplicate(conta)}>
                                            <Copy className="h-4 w-4 mr-2" />
                                            Duplicar
                                          </DropdownMenuItem>
                                        </>
                                      ) : (
                                        <>
                                          <DropdownMenuItem onClick={() => handleEdit(conta)}>
                                            <Eye className="h-4 w-4 mr-2" />
                                            Ver Detalhes
                                          </DropdownMenuItem>
                                          <DropdownMenuItem onClick={() => handleEdit(conta)}>
                                            <Edit className="h-4 w-4 mr-2" />
                                            Editar
                                          </DropdownMenuItem>
                                          <DropdownMenuItem onClick={() => handleEstornarPagamento(conta)}>
                                            <RotateCcw className="h-4 w-4 mr-2" />
                                            Estornar Pagamento
                                          </DropdownMenuItem>
                                        </>
                                      )}
                                      <DropdownMenuSeparator />
                                      <DropdownMenuItem 
                                        onClick={() => {
                                          setContaToDelete(conta);
                                          setIsDeleteOpen(true);
                                        }}
                                        className="text-destructive"
                                      >
                                        <Trash2 className="h-4 w-4 mr-2" />
                                        Excluir
                                      </DropdownMenuItem>
                                    </DropdownMenuContent>
                                  </DropdownMenu>
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </div>
                    </>
                  )}
                </TabsContent>
              ))}
            </Tabs>
          </CardContent>
        </Card>
      </div>

      <ContaPagarFormDialog
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        conta={selectedConta as any}
        onSave={handleSave}
      />

      <RegistrarPagamentoDialog
        open={isPagamentoOpen}
        onOpenChange={setIsPagamentoOpen}
        conta={selectedConta as any}
        onSave={handlePagamentoRegistrado}
        tipo="pagar"
      />

      <ConfirmDialog
        open={isDeleteOpen}
        onOpenChange={setIsDeleteOpen}
        title="Excluir Conta a Pagar"
        description="Tem certeza que deseja excluir esta conta? Esta ação não pode ser desfeita."
        onConfirm={handleDelete}
      />

      <ConfirmDialog
        open={deleteMultipleConfirmOpen}
        onOpenChange={setDeleteMultipleConfirmOpen}
        title="Excluir Múltiplas Contas"
        description={`Tem certeza que deseja excluir TODOS os ${selectedContas.length} lançamento(s) selecionado(s)? Esta ação não pode ser desfeita e todos os registros serão permanentemente removidos.`}
        onConfirm={confirmExcluirSelecionadas}
      />
    </div>
  );
}
