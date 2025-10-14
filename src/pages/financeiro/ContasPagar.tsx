import { useState, useMemo, useEffect } from "react";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { format, isToday, isAfter, isBefore, differenceInDays, startOfDay } from "date-fns";
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
import { Plus, Search, Settings, MoreVertical, Clock, CheckCircle, AlertCircle, XCircle, Edit, Copy, Trash2, Eye, RotateCcw, DollarSign, TrendingDown, AlertTriangle, Calendar } from "lucide-react";
import { toast } from "sonner";
import { ContaPagarFormDialog } from "@/components/ContaPagarFormDialog";
import { RegistrarPagamentoDialog } from "@/components/RegistrarPagamentoDialog";
import { ConfirmDialog } from "@/components/ConfirmDialog";

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

interface Categoria {
  id: string;
  nome: string;
  cor: string;
}

interface PlanoContas {
  id: string;
  nome: string;
  categoriaId: string;
}

interface Banco {
  id: string;
  nome: string;
}

export default function ContasPagar() {
  const [contas, setContas] = useLocalStorage<ContaPagar[]>("contas_pagar", []);
  const [categorias] = useLocalStorage<Categoria[]>("categorias_financeiras", []);
  const [planos] = useLocalStorage<PlanoContas[]>("planos_contas", []);
  const [bancos] = useLocalStorage<Banco[]>("bancos", []);
  
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isPagamentoOpen, setIsPagamentoOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedConta, setSelectedConta] = useState<ContaPagar | undefined>();
  const [contaToDelete, setContaToDelete] = useState<ContaPagar | undefined>();
  
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("todos");
  const [periodoFilter, setPeriodoFilter] = useState("todos");
  const [categoriaFilter, setCategoriaFilter] = useState("todos");
  const [selectedContas, setSelectedContas] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState("todas");

  // Atualizar status de contas atrasadas
  useEffect(() => {
    const hoje = startOfDay(new Date());
    let atualizou = false;
    
    const contasAtualizadas = contas.map(conta => {
      if (conta.status === 'pendente') {
        const vencimento = new Date(conta.dataVencimento);
        if (isBefore(vencimento, hoje)) {
          atualizou = true;
          return { ...conta, status: 'atrasado' as const };
        }
      }
      return conta;
    });
    
    if (atualizou) {
      setContas(contasAtualizadas);
    }
    
    // Atualizar a cada hora
    const interval = setInterval(() => {
      const hoje = startOfDay(new Date());
      let precisaAtualizar = false;
      
      const novasContas = contas.map(conta => {
        if (conta.status === 'pendente') {
          const vencimento = new Date(conta.dataVencimento);
          if (isBefore(vencimento, hoje)) {
            precisaAtualizar = true;
            return { ...conta, status: 'atrasado' as const };
          }
        }
        return conta;
      });
      
      if (precisaAtualizar) {
        setContas(novasContas);
      }
    }, 60 * 60 * 1000); // 1 hora
    
    return () => clearInterval(interval);
  }, []);

  // Atualizar status de contas quando mudar a lista
  const contasAtualizadas = useMemo(() => {
    const hoje = startOfDay(new Date());
    return contas.map(conta => {
      if (conta.status === 'pendente' && isBefore(new Date(conta.dataVencimento), hoje)) {
        return { ...conta, status: 'atrasado' as const };
      }
      return conta;
    });
  }, [contas]);

  // Filtros
  const contasFiltradas = useMemo(() => {
    return contasAtualizadas.filter(conta => {
      const matchSearch = searchTerm === "" || 
        conta.descricao.toLowerCase().includes(searchTerm.toLowerCase()) ||
        conta.fornecedorNome?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        conta.numeroDocumento?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchStatus = statusFilter === "todos" || conta.status === statusFilter;
      
      const matchCategoria = categoriaFilter === "todos" || conta.categoriaId === categoriaFilter;
      
      let matchPeriodo = true;
      if (periodoFilter !== "todos") {
        const hoje = new Date();
        const dataVenc = new Date(conta.dataVencimento);
        
        if (periodoFilter === "hoje") {
          matchPeriodo = isToday(dataVenc);
        } else if (periodoFilter === "semana") {
          matchPeriodo = differenceInDays(dataVenc, hoje) <= 7 && differenceInDays(dataVenc, hoje) >= 0;
        } else if (periodoFilter === "mes") {
          matchPeriodo = dataVenc.getMonth() === hoje.getMonth() && dataVenc.getFullYear() === hoje.getFullYear();
        }
      }
      
      return matchSearch && matchStatus && matchCategoria && matchPeriodo;
    });
  }, [contasAtualizadas, searchTerm, statusFilter, categoriaFilter, periodoFilter]);

  // Estatísticas
  const stats = useMemo(() => {
    const hoje = startOfDay(new Date());
    const mesAtual = new Date().getMonth();
    const anoAtual = new Date().getFullYear();

    const aPagar = contasAtualizadas.filter(c => c.status === 'pendente');
    const pagas = contasAtualizadas.filter(c => c.status === 'pago');
    const atrasadas = contasAtualizadas.filter(c => c.status === 'atrasado');
    const esteMes = contasAtualizadas.filter(c => {
      const data = new Date(c.dataVencimento);
      return data.getMonth() === mesAtual && data.getFullYear() === anoAtual;
    });

    return {
      aPagar: { valor: aPagar.reduce((sum, c) => sum + c.valor, 0), count: aPagar.length },
      pagas: { valor: pagas.reduce((sum, c) => sum + c.valor, 0), count: pagas.length },
      atrasadas: { valor: atrasadas.reduce((sum, c) => sum + c.valor, 0), count: atrasadas.length },
      esteMes: { valor: esteMes.reduce((sum, c) => sum + c.valor, 0), count: esteMes.length }
    };
  }, [contasAtualizadas]);

  // Filtros por aba
  const contasPorAba = useMemo(() => {
    const hoje = startOfDay(new Date());
    
    return {
      todas: contasFiltradas,
      pendentes: contasFiltradas.filter(c => c.status === 'pendente'),
      vencendoHoje: contasFiltradas.filter(c => c.status === 'pendente' && isToday(new Date(c.dataVencimento))),
      pagas: contasFiltradas.filter(c => c.status === 'pago')
    };
  }, [contasFiltradas]);

  const handleSave = (conta: ContaPagar) => {
    if (selectedConta) {
      setContas(contas.map(c => c.id === conta.id ? conta : c));
      toast.success("Conta atualizada com sucesso!");
    } else {
      setContas([...contas, conta]);
      toast.success("Conta criada com sucesso!");
    }
    setIsFormOpen(false);
    setSelectedConta(undefined);
  };

  const handleEdit = (conta: ContaPagar) => {
    setSelectedConta(conta);
    setIsFormOpen(true);
  };

  const handleDuplicate = (conta: ContaPagar) => {
    const novaConta: ContaPagar = {
      ...conta,
      id: crypto.randomUUID(),
      descricao: `${conta.descricao} (Cópia)`,
      status: 'pendente',
      dataPagamento: undefined,
      formaPagamento: undefined,
      bancoId: undefined,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    setContas([...contas, novaConta]);
    toast.success("Conta duplicada com sucesso!");
  };

  const handleDelete = () => {
    if (!contaToDelete) return;
    
    // Verificar se é parcelado
    if (contaToDelete.parcelado && contaToDelete.grupoParcelasId) {
      const parcelas = contas.filter(c => c.grupoParcelasId === contaToDelete.grupoParcelasId);
      
      if (parcelas.length > 1) {
        // Mostrar opções de exclusão
        toast.info(`Esta conta faz parte de ${parcelas.length} parcelas. Use o menu de ações para excluir todas.`);
        setContas(contas.filter(c => c.id !== contaToDelete.id));
        toast.success("Parcela excluída com sucesso!");
      } else {
        setContas(contas.filter(c => c.id !== contaToDelete.id));
        toast.success("Conta excluída com sucesso!");
      }
    } else {
      setContas(contas.filter(c => c.id !== contaToDelete.id));
      toast.success("Conta excluída com sucesso!");
    }
    
    setIsDeleteOpen(false);
    setContaToDelete(undefined);
  };

  const handleRegistrarPagamento = (conta: ContaPagar) => {
    setSelectedConta(conta);
    setIsPagamentoOpen(true);
  };

  const handlePagamentoRegistrado = (contaAtualizada: ContaPagar) => {
    // Construir observação automática
    let obsAdicional = '';
    
    // Verificar diferença de valor
    const diferenca = (contaAtualizada.valorPago || contaAtualizada.valor) - contaAtualizada.valor;
    if (diferenca !== 0) {
      if (diferenca > 0) {
        obsAdicional = `Acréscimo de ${formatCurrency(diferenca)} (juros/multa)`;
      } else {
        obsAdicional = `Desconto de ${formatCurrency(Math.abs(diferenca))}`;
      }
    }
    
    // Verificar atraso
    const vencimento = new Date(contaAtualizada.dataVencimento);
    const pagamento = contaAtualizada.dataPagamento ? new Date(contaAtualizada.dataPagamento) : new Date();
    vencimento.setHours(0, 0, 0, 0);
    pagamento.setHours(0, 0, 0, 0);
    
    if (pagamento > vencimento) {
      const diasAtraso = Math.floor((pagamento.getTime() - vencimento.getTime()) / (1000 * 60 * 60 * 24));
      const atrasoObs = `Pago com ${diasAtraso} dia(s) de atraso`;
      obsAdicional = obsAdicional ? `${obsAdicional}. ${atrasoObs}` : atrasoObs;
    }
    
    // Adicionar observações
    let observacoes = contaAtualizada.observacoes || '';
    if (obsAdicional) {
      observacoes = observacoes ? `${observacoes}\n${obsAdicional}` : obsAdicional;
    }
    if (contaAtualizada.observacoesPagamento) {
      observacoes = observacoes ? `${observacoes}\n${contaAtualizada.observacoesPagamento}` : contaAtualizada.observacoesPagamento;
    }
    
    const contaFinal = {
      ...contaAtualizada,
      observacoes: observacoes || undefined,
    };
    
    setContas(contas.map(c => c.id === contaFinal.id ? contaFinal : c));
    toast.success("Pagamento registrado com sucesso!");
    setIsPagamentoOpen(false);
    setSelectedConta(undefined);
    
    // Se for recorrente, criar próxima ocorrência
    if (contaFinal.recorrente && contaFinal.proximaRecorrencia) {
      criarProximaRecorrencia(contaFinal);
    }
  };

  const criarProximaRecorrencia = (contaOriginal: ContaPagar) => {
    if (!contaOriginal.recorrente || !contaOriginal.proximaRecorrencia) return;
    
    const proximaData = new Date(contaOriginal.proximaRecorrencia);
    const hoje = new Date();
    
    if (proximaData <= hoje) return;
    
    const novaConta: ContaPagar = {
      ...contaOriginal,
      id: crypto.randomUUID(),
      dataEmissao: new Date().toISOString(),
      dataVencimento: contaOriginal.proximaRecorrencia,
      status: 'pendente',
      dataPagamento: undefined,
      formaPagamento: undefined,
      bancoId: undefined,
      valorPago: undefined,
      observacoesPagamento: undefined,
      proximaRecorrencia: calcularProximaRecorrencia(
        contaOriginal.proximaRecorrencia,
        contaOriginal.frequenciaRecorrencia!
      ),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    setContas(prev => [...prev, novaConta]);
    toast.info("Próxima recorrência criada automaticamente!");
  };

  const calcularProximaRecorrencia = (dataAtual: string, frequencia: string): string => {
    const data = new Date(dataAtual);
    
    switch (frequencia) {
      case 'mensal':
        data.setMonth(data.getMonth() + 1);
        break;
      case 'bimestral':
        data.setMonth(data.getMonth() + 2);
        break;
      case 'trimestral':
        data.setMonth(data.getMonth() + 3);
        break;
      case 'semestral':
        data.setMonth(data.getMonth() + 6);
        break;
      case 'anual':
        data.setFullYear(data.getFullYear() + 1);
        break;
    }
    
    return data.toISOString();
  };

  const handleEstornarPagamento = (conta: ContaPagar) => {
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    const vencimento = new Date(conta.dataVencimento);
    vencimento.setHours(0, 0, 0, 0);
    
    const contaEstornada: ContaPagar = {
      ...conta,
      status: vencimento < hoje ? 'atrasado' : 'pendente',
      dataPagamento: undefined,
      valorPago: undefined,
      formaPagamento: undefined,
      bancoId: undefined,
      observacoesPagamento: undefined,
      observacoes: conta.observacoes 
        ? `${conta.observacoes}\nPagamento estornado em ${format(new Date(), "dd/MM/yyyy", { locale: ptBR })}`
        : `Pagamento estornado em ${format(new Date(), "dd/MM/yyyy", { locale: ptBR })}`,
      updatedAt: new Date().toISOString()
    };
    setContas(contas.map(c => c.id === conta.id ? contaEstornada : c));
    toast.success("Pagamento estornado com sucesso!");
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
    const vencimento = new Date(conta.dataVencimento);
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
          <h1 className="text-3xl font-bold text-[#6B5047]">Contas a Pagar</h1>
          <p className="text-[#9C8B82] mt-1">Controle de despesas e pagamentos</p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 space-y-6">
        {/* Cards de Resumo */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="border-l-4 border-[#E5A868] hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-[#9C8B82] flex items-center gap-2">
                <TrendingDown className="h-4 w-4" />
                A Pagar
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-[#6B5047]">{formatCurrency(stats.aPagar.valor)}</div>
              <p className="text-xs text-[#9C8B82] mt-1">{stats.aPagar.count} contas</p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-[#8BA888] hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-[#9C8B82] flex items-center gap-2">
                <CheckCircle className="h-4 w-4" />
                Pago
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-[#6B5047]">{formatCurrency(stats.pagas.valor)}</div>
              <p className="text-xs text-[#9C8B82] mt-1">{stats.pagas.count} contas</p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-[#D88B8B] hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-[#9C8B82] flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" />
                Atrasado
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-[#D88B8B]">{formatCurrency(stats.atrasadas.valor)}</div>
              <p className="text-xs text-[#9C8B82] mt-1">{stats.atrasadas.count} contas</p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-[#D89B8C] hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-[#9C8B82] flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Este Mês
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-[#6B5047]">{formatCurrency(stats.esteMes.valor)}</div>
              <p className="text-xs text-[#9C8B82] mt-1">{stats.esteMes.count} contas</p>
            </CardContent>
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
            </div>
          </CardContent>
        </Card>

        {/* Tabs e Tabela */}
        <Card>
          <CardContent className="pt-6">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="todas">Todas ({contasPorAba.todas.length})</TabsTrigger>
                <TabsTrigger value="pendentes">Pendentes ({contasPorAba.pendentes.length})</TabsTrigger>
                <TabsTrigger value="vencendoHoje">Vencendo Hoje ({contasPorAba.vencendoHoje.length})</TabsTrigger>
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
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="w-[50px]">
                              <Checkbox />
                            </TableHead>
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
                            const categoria = getCategoriaById(conta.categoriaId);
                            const plano = getPlanoById(conta.planoContaId);
                            const banco = conta.bancoId ? getBancoById(conta.bancoId) : null;

                            return (
                              <TableRow key={conta.id} className={getRowClassName(conta)}>
                                <TableCell>
                                  <Checkbox />
                                </TableCell>
                                <TableCell>
                                  <div className="flex flex-col text-sm">
                                    <span className="font-medium text-[#6B5047]">
                                      {format(new Date(conta.dataEmissao), "dd/MMM", { locale: ptBR })}
                                    </span>
                                    <span className="text-xs text-[#9C8B82]">
                                      {conta.status === 'pago' ? 'Pago: ' : 'Venc: '}
                                      {format(new Date(conta.status === 'pago' && conta.dataPagamento ? conta.dataPagamento : conta.dataVencimento), "dd/MMM", { locale: ptBR })}
                                    </span>
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <div className="flex flex-col">
                                    <span className="font-semibold text-[#6B5047]">{conta.descricao}</span>
                                    <span className="text-sm text-[#9C8B82]">{categoria?.nome}</span>
                                    <span className="text-xs text-[#9C8B82]">{plano?.nome}</span>
                                    {conta.status === 'pago' && conta.formaPagamento && (
                                      <span className="text-xs text-[#9C8B82] mt-1">
                                        {formasPagamentoLabels[conta.formaPagamento]}
                                        {banco && ` - ${banco.nome}`}
                                      </span>
                                    )}
                                  </div>
                                </TableCell>
                                <TableCell className="text-sm text-[#9C8B82]">
                                  {conta.fornecedorNome || '-'}
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
        conta={selectedConta}
        onSave={handleSave}
      />

      <RegistrarPagamentoDialog
        open={isPagamentoOpen}
        onOpenChange={setIsPagamentoOpen}
        conta={selectedConta}
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
    </div>
  );
}
