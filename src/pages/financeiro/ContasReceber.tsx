import { useState, useEffect } from "react";
import { Plus, Search, Filter, CheckCircle, Clock, AlertCircle, XCircle, MoreVertical, Eye, Edit, Copy, Trash2, DollarSign, Calendar, Download, ChevronDown, RotateCcw } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { PageHeader } from "@/components/PageHeader";
import { BackButton } from "@/components/BackButton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { ContaReceberFormDialog } from "@/components/ContaReceberFormDialog";
import { RegistrarRecebimentoDialog } from "@/components/RegistrarRecebimentoDialog";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { useContasReceber } from "@/hooks/useContasReceber";
import { usePlanoContas } from "@/hooks/usePlanoContas";
import { useCategorias } from "@/hooks/useCategorias";


export default function ContasReceber() {
  const { items: contas, loading, refetch, deleteItem } = useContasReceber();
  const { planoContas } = usePlanoContas();
  const { categorias } = useCategorias();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("todos");
  const [periodoFilter, setPeriodoFilter] = useState<string>("todos");
  const [selectedTab, setSelectedTab] = useState("todas");
  const [selectedContas, setSelectedContas] = useState<string[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingConta, setEditingConta] = useState<any | null>(null);
  const [isRecebimentoDialogOpen, setIsRecebimentoDialogOpen] = useState(false);
  const [contaParaReceber, setContaParaReceber] = useState<any | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [contaToDelete, setContaToDelete] = useState<any | null>(null);
  
  // Novos estados para filtro avançado
  const [tipoBusca, setTipoBusca] = useState<string>("pessoa");
  const [dataEmissaoFiltro, setDataEmissaoFiltro] = useState<Date | undefined>();
  const [dataVencimentoFiltro, setDataVencimentoFiltro] = useState<Date | undefined>();
  const [dataPagamentoFiltro, setDataPagamentoFiltro] = useState<Date | undefined>();
  const [planoContaFiltro, setPlanoContaFiltro] = useState<string>("todos");
  const [categoriaFiltro, setCategoriaFiltro] = useState<string>("todos");
  const [pessoaFiltro, setPessoaFiltro] = useState<string>("");

  const getPlanoContaNome = (planoContaId?: string) => {
    if (!planoContaId) return "-";
    const plano = planoContas.find(p => p.id === planoContaId);
    return plano ? plano.nome : "-";
  };


  // Calcular resumos
  const resumo = {
    aberto: contas.filter(c => c.status === 'pendente').reduce((sum, c) => sum + c.valor, 0),
    abertoQtd: contas.filter(c => c.status === 'pendente').length,
    recebido: contas.filter(c => ['recebido', 'pagto_adiantado', 'pagto_atrasado', 'pagto_parcial'].includes(c.status)).reduce((sum, c) => sum + c.valor, 0),
    recebidoQtd: contas.filter(c => ['recebido', 'pagto_adiantado', 'pagto_atrasado', 'pagto_parcial'].includes(c.status)).length,
    vencido: contas.filter(c => c.status === 'atrasado').reduce((sum, c) => sum + c.valor, 0),
    vencidoQtd: contas.filter(c => c.status === 'atrasado').length,
    esteMes: contas.filter(c => {
      const data = new Date(c.data_vencimento);
      const hoje = new Date();
      return data.getMonth() === hoje.getMonth() && data.getFullYear() === hoje.getFullYear();
    }).reduce((sum, c) => sum + c.valor, 0),
    esteMesQtd: contas.filter(c => {
      const data = new Date(c.data_vencimento);
      const hoje = new Date();
      return data.getMonth() === hoje.getMonth() && data.getFullYear() === hoje.getFullYear();
    }).length,
  };

  // Separar contas recebidas das demais
  const contasRecebidas = contas.filter(c => 
    ['recebido', 'pagto_adiantado', 'pagto_atrasado', 'pagto_parcial'].includes(c.status)
  );

  const contasAReceber = contas.filter(c => 
    !['recebido', 'pagto_adiantado', 'pagto_atrasado', 'pagto_parcial'].includes(c.status)
  );

  // Função para verificar se é do mês atual
  const isEsteMes = (conta: any) => {
    const data = new Date(conta.data_vencimento);
    const hoje = new Date();
    return data.getMonth() === hoje.getMonth() && data.getFullYear() === hoje.getFullYear();
  };

  // Filtrar contas (excluindo as já recebidas)
  const contasFiltradas = contasAReceber.filter(conta => {
    // Filtro de busca por tipo
    if (searchTerm) {
      const termo = searchTerm.toLowerCase();
      
      switch (tipoBusca) {
        case "pessoa":
          if (!conta.cliente_nome?.toLowerCase().includes(termo)) return false;
          break;
        default:
          break;
      }
    }

    // Filtro por data de emissão
    if (dataEmissaoFiltro && conta.data_emissao) {
      const dataEmissao = new Date(conta.data_emissao);
      dataEmissao.setHours(0, 0, 0, 0);
      const filtroData = new Date(dataEmissaoFiltro);
      filtroData.setHours(0, 0, 0, 0);
      if (dataEmissao.getTime() !== filtroData.getTime()) return false;
    }

    // Filtro por data de vencimento
    if (dataVencimentoFiltro) {
      const dataVenc = new Date(conta.data_vencimento);
      dataVenc.setHours(0, 0, 0, 0);
      const filtroData = new Date(dataVencimentoFiltro);
      filtroData.setHours(0, 0, 0, 0);
      if (dataVenc.getTime() !== filtroData.getTime()) return false;
    }

    // Filtro por data de pagamento
    if (dataPagamentoFiltro && conta.data_recebimento) {
      const dataPag = new Date(conta.data_recebimento);
      dataPag.setHours(0, 0, 0, 0);
      const filtroData = new Date(dataPagamentoFiltro);
      filtroData.setHours(0, 0, 0, 0);
      if (dataPag.getTime() !== filtroData.getTime()) return false;
    }

    // Filtro por plano de contas
    if (planoContaFiltro !== "todos") {
      if (conta.plano_conta_id !== planoContaFiltro) return false;
    }

    // Filtro por categoria
    if (categoriaFiltro !== "todos") {
      if (conta.categoria_id !== categoriaFiltro) return false;
    }

    // Filtro por pessoa
    if (pessoaFiltro && tipoBusca === "pessoa") {
      const termo = pessoaFiltro.toLowerCase();
      if (!conta.cliente_nome?.toLowerCase().includes(termo)) return false;
    }

    // Filtro de status
    if (statusFilter !== "todos" && conta.status !== statusFilter) {
      return false;
    }

    // Filtro de tab
    if (selectedTab === "abertos" && conta.status !== "pendente") return false;
    if (selectedTab === "vencendo" && !isVencendoHoje(conta)) return false;
    if (selectedTab === "vencidos" && conta.status !== "atrasado") return false;
    if (selectedTab === "esteMes" && !isEsteMes(conta)) return false;

    return true;
  });

  // Filtrar contas recebidas
  const contasRecebidasFiltradas = contasRecebidas.filter(conta => {
    // Filtro de busca
    if (searchTerm) {
      const termo = searchTerm.toLowerCase();
      if (!conta.descricao.toLowerCase().includes(termo)) {
        return false;
      }
    }

    // Filtro de status (apenas para contas recebidas)
    if (statusFilter !== "todos" && conta.status !== statusFilter) {
      return false;
    }

    return true;
  });

  function isVencendoHoje(conta: any) {
    if (conta.status !== 'pendente') return false;
    const hoje = new Date();
    const vencimento = new Date(conta.data_vencimento);
    hoje.setHours(0, 0, 0, 0);
    vencimento.setHours(0, 0, 0, 0);
    return vencimento.getTime() === hoje.getTime();
  }

  function getStatusBadge(status: string) {
    const badges = {
      pendente: {
        icon: Clock,
        label: "Aberto",
        className: "bg-[#E3F2FD] text-[#1976D2] border border-[#7BA8D8]"
      },
      recebido: {
        icon: CheckCircle,
        label: "Pago",
        className: "bg-[#E8F5E9] text-[#388E3C] border border-[#8BA888]"
      },
      pagto_adiantado: {
        icon: CheckCircle,
        label: "Pagto Adiantado",
        className: "bg-[#E8F5E9] text-[#2E7D32] border border-[#81C784]"
      },
      pagto_atrasado: {
        icon: AlertCircle,
        label: "Pagto Atrasado",
        className: "bg-[#FFF3E0] text-[#E65100] border border-[#FFB74D]"
      },
      pagto_parcial: {
        icon: DollarSign,
        label: "Pagto Parcial",
        className: "bg-[#FFF9C4] text-[#F57F17] border border-[#FDD835]"
      },
      atrasado: {
        icon: AlertCircle,
        label: "Vencido",
        className: "bg-[#FFEBEE] text-[#C62828] border border-[#D88B8B]"
      },
      cancelado: {
        icon: XCircle,
        label: "Cancelado",
        className: "bg-[#F5F5F5] text-[#616161] border border-[#E0E0E0]"
      }
    };

    const badge = badges[status];
    const Icon = badge.icon;

    return (
      <Badge className={`${badge.className} gap-1`}>
        <Icon className="h-3 w-3" />
        {badge.label}
      </Badge>
    );
  }

  function getRowStyle(conta: any) {
    const hoje = new Date();
    const vencimento = new Date(conta.data_vencimento);
    hoje.setHours(0, 0, 0, 0);
    vencimento.setHours(0, 0, 0, 0);

    if (conta.status === 'atrasado') {
      return "bg-[#FFEBEE]/30 border-l-4 border-l-[#D88B8B]";
    }

    if (conta.status === 'pagto_atrasado') {
      return "bg-[#FFF3E0]/20 border-l-4 border-l-[#FFB74D]";
    }

    if (conta.status === 'pagto_parcial') {
      return "bg-[#FFF9C4]/20 border-l-4 border-l-[#FDD835]";
    }

    if (conta.status === 'pendente') {
      if (vencimento.getTime() === hoje.getTime()) {
        return "bg-[#FEF3E2]/30 border-l-4 border-l-[#E5C89F]";
      }
      const diffDays = Math.ceil((vencimento.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24));
      if (diffDays <= 3 && diffDays > 0) {
        return "bg-[#E3F2FD]/20 border-l-4 border-l-[#7BA8D8]";
      }
    }

    if (['recebido', 'pagto_adiantado'].includes(conta.status)) {
      return "opacity-70";
    }

    return "";
  }

  function handleOpenDeleteConfirm(conta: any) {
    setContaToDelete(conta);
    setDeleteConfirmOpen(true);
  }

  async function handleConfirmDelete() {
    if (!contaToDelete) return;
    
    try {
      await deleteItem(contaToDelete.id);
      toast.success("✓ Conta excluída com sucesso!");
      setDeleteConfirmOpen(false);
      setContaToDelete(null);
      refetch();
    } catch (error: any) {
      toast.error('Erro ao excluir conta: ' + error.message);
    }
  }

  function handleEditar(conta: any) {
    setEditingConta(conta);
    setIsDialogOpen(true);
  }

  function handleRegistrarRecebimento(conta: any) {
    setContaParaReceber(conta);
    setIsRecebimentoDialogOpen(true);
  }

  async function handleEstornar(conta: any) {
    toast.info("Funcionalidade em desenvolvimento");
  }

  async function handleDuplicar(conta: any) {
    toast.info("Funcionalidade em desenvolvimento");
  }

  function handleSelecionarTodas() {
    setSelectedContas(contasFiltradas.map(c => c.id));
  }

  function handleDesselecionarTodas() {
    setSelectedContas([]);
  }

  async function handleExcluirSelecionadas() {
    if (selectedContas.length === 0) {
      toast.warning("Selecione pelo menos uma conta");
      return;
    }

    if (confirm(`Tem certeza que deseja excluir ${selectedContas.length} conta(s) selecionada(s)?`)) {
      try {
        for (const id of selectedContas) {
          await deleteItem(id);
        }
        setSelectedContas([]);
        toast.success(`✓ ${selectedContas.length} conta(s) excluída(s) com sucesso!`);
        refetch();
      } catch (error: any) {
        toast.error('Erro ao excluir contas: ' + error.message);
      }
    }
  }

  function handleExportarCSV() {
    const headers = [
      'Data Emissão',
      'Data Vencimento',
      'Descrição',
      'Cliente',
      'Valor',
      'Status',
      'Data Recebimento',
      'Forma Pagamento'
    ];

    const rows = contasFiltradas.map(c => [
      formatDate(c.created_at || ''),
      formatDate(c.data_vencimento),
      c.descricao,
      '',
      c.valor.toFixed(2),
      c.status,
      c.data_recebimento ? formatDate(c.data_recebimento) : '',
      ''
    ]);

    const csv = [headers, ...rows]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `contas-receber-${format(new Date(), 'dd-MM-yyyy')}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast.success("✓ Arquivo CSV exportado com sucesso!");
  }

  function formatCurrency(value: number) {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  }

  function formatDate(dateString: string) {
    return format(new Date(dateString), 'dd/MM/yyyy');
  }

  function formatDateRelative(dateString: string): string {
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    const data = new Date(dateString);
    data.setHours(0, 0, 0, 0);
    const diffDays = Math.floor((data.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Hoje';
    if (diffDays === 1) return 'Amanhã';
    if (diffDays === -1) return 'Ontem';
    if (diffDays > 0) return `Em ${diffDays} dias`;
    return `${Math.abs(diffDays)} dias atrás`;
  }

  const contasVencemHoje = contas.filter(c => {
    if (c.status !== 'pendente') return false;
    const hoje = new Date();
    const vencimento = new Date(c.data_vencimento);
    hoje.setHours(0, 0, 0, 0);
    vencimento.setHours(0, 0, 0, 0);
    return vencimento.getTime() === hoje.getTime();
  });

  return (
    <div className="min-h-screen bg-[#FAF7F5] p-4 md:p-6 space-y-6">
      <div className="flex items-center gap-4">
        <BackButton to="/financeiro" />
        <div className="flex-1">
          <PageHeader
            title="Contas a Receber"
            description="Controle de receitas e recebimentos"
          />
        </div>
      </div>

      {/* Banners de Alertas */}

      {contasVencemHoje.length > 0 && (
        <div className="bg-[#FEF3E2] border-l-4 border-[#E5C89F] p-4 rounded-lg animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center gap-3">
            <Clock className="text-[#E5C89F] h-5 w-5 shrink-0" />
            <div className="flex-1">
              <p className="font-semibold text-[#6B5047]">
                {contasVencemHoje.length} conta(s) vencem hoje
              </p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSelectedTab('vencendo')}
              className="text-[#B8860B] hover:bg-[#FEF3E2]"
            >
              Ver contas
            </Button>
          </div>
        </div>
      )}

      {/* Cards de Resumo */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        <Card 
          className="p-4 border-l-4 border-l-[#7BA8D8] hover:shadow-lg transition-shadow cursor-pointer" 
          onClick={() => {
            setSelectedTab('abertos');
            setStatusFilter('todos');
          }}
        >
          <div className="space-y-2">
            <p className="text-sm text-[#9C8B82]">Aberto</p>
            <p className="text-2xl font-bold text-[#6B5047]">{formatCurrency(resumo.aberto)}</p>
            <p className="text-xs text-[#9C8B82]">{resumo.abertoQtd} contas</p>
          </div>
        </Card>

        <Card 
          className="p-4 border-l-4 border-l-[#D88B8B] hover:shadow-lg transition-shadow cursor-pointer" 
          onClick={() => {
            setSelectedTab('vencidos');
            setStatusFilter('todos');
          }}
        >
          <div className="space-y-2">
            <p className="text-sm text-[#9C8B82]">Vencido</p>
            <p className="text-2xl font-bold text-[#C62828]">{formatCurrency(resumo.vencido)}</p>
            <p className="text-xs text-[#9C8B82]">{resumo.vencidoQtd} contas</p>
          </div>
        </Card>

        <Card 
          className="p-4 border-l-4 border-l-[#D89B8C] hover:shadow-lg transition-shadow cursor-pointer" 
          onClick={() => {
            setSelectedTab('esteMes');
            setStatusFilter('todos');
          }}
        >
          <div className="space-y-2">
            <p className="text-sm text-[#9C8B82]">Este Mês</p>
            <p className="text-2xl font-bold text-[#D89B8C]">{formatCurrency(resumo.esteMes)}</p>
            <p className="text-xs text-[#9C8B82]">{resumo.esteMesQtd} contas</p>
          </div>
        </Card>

        <Card 
          className="p-4 border-l-4 border-l-[#8BA888] hover:shadow-lg transition-shadow cursor-pointer" 
          onClick={() => {
            setSelectedTab('recebidos');
            setStatusFilter('todos');
          }}
        >
          <div className="space-y-2">
            <p className="text-sm text-[#9C8B82]">Contas Recebidas</p>
            <p className="text-2xl font-bold text-[#388E3C]">{formatCurrency(resumo.recebido)}</p>
            <p className="text-xs text-[#9C8B82]">{resumo.recebidoQtd} contas</p>
          </div>
        </Card>
      </div>

      {/* Barra de Ferramentas */}
      <div className="flex flex-col gap-3">
        {/* Linha 1: Tipo de Busca e Campo de Pesquisa */}
        <div className="flex flex-col md:flex-row gap-3">
          <Select value={tipoBusca} onValueChange={(value) => {
            setTipoBusca(value);
            setSearchTerm("");
            setDataEmissaoFiltro(undefined);
            setDataVencimentoFiltro(undefined);
            setDataPagamentoFiltro(undefined);
            setPlanoContaFiltro("todos");
            setCategoriaFiltro("todos");
            setPessoaFiltro("");
          }}>
            <SelectTrigger className="w-full md:w-[200px]">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Filtrar por..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="pessoa">Pessoa</SelectItem>
              <SelectItem value="data_emissao">Data de Emissão</SelectItem>
              <SelectItem value="categoria">Categoria</SelectItem>
              <SelectItem value="plano_contas">Plano de Contas</SelectItem>
              <SelectItem value="data_vencimento">Data de Vencimento</SelectItem>
              <SelectItem value="data_pagamento">Data de Pagamento</SelectItem>
              <SelectItem value="status">Status</SelectItem>
            </SelectContent>
          </Select>

          {/* Campo de busca dinâmico baseado no tipo */}
          {tipoBusca === "pessoa" && (
            <div className="relative w-full md:w-[300px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#9C8B82]" />
              <Input
                placeholder="Buscar por nome da pessoa..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          )}

          {tipoBusca === "data_emissao" && (
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "flex-1 justify-start text-left font-normal",
                    !dataEmissaoFiltro && "text-muted-foreground"
                  )}
                >
                  <Calendar className="mr-2 h-4 w-4" />
                  {dataEmissaoFiltro ? format(dataEmissaoFiltro, "dd/MM/yyyy") : "Selecione a data de emissão"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <CalendarComponent
                  mode="single"
                  selected={dataEmissaoFiltro}
                  onSelect={setDataEmissaoFiltro}
                  initialFocus
                  className="p-3 pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
          )}

          {tipoBusca === "data_vencimento" && (
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "flex-1 justify-start text-left font-normal",
                    !dataVencimentoFiltro && "text-muted-foreground"
                  )}
                >
                  <Calendar className="mr-2 h-4 w-4" />
                  {dataVencimentoFiltro ? format(dataVencimentoFiltro, "dd/MM/yyyy") : "Selecione a data de vencimento"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <CalendarComponent
                  mode="single"
                  selected={dataVencimentoFiltro}
                  onSelect={setDataVencimentoFiltro}
                  initialFocus
                  className="p-3 pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
          )}

          {tipoBusca === "data_pagamento" && (
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "flex-1 justify-start text-left font-normal",
                    !dataPagamentoFiltro && "text-muted-foreground"
                  )}
                >
                  <Calendar className="mr-2 h-4 w-4" />
                  {dataPagamentoFiltro ? format(dataPagamentoFiltro, "dd/MM/yyyy") : "Selecione a data de pagamento"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <CalendarComponent
                  mode="single"
                  selected={dataPagamentoFiltro}
                  onSelect={setDataPagamentoFiltro}
                  initialFocus
                  className="p-3 pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
          )}

          {tipoBusca === "categoria" && (
            <Select value={categoriaFiltro} onValueChange={setCategoriaFiltro}>
              <SelectTrigger className="flex-1">
                <SelectValue placeholder="Selecione a categoria" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todas as categorias</SelectItem>
                {categorias.map(cat => (
                  <SelectItem key={cat.id} value={cat.id}>
                    {cat.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          {tipoBusca === "plano_contas" && (
            <Select value={planoContaFiltro} onValueChange={setPlanoContaFiltro}>
              <SelectTrigger className="flex-1">
                <SelectValue placeholder="Selecione o plano de contas" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos os planos</SelectItem>
                {planoContas
                  .filter(p => p.aceita_lancamento)
                  .map(plano => (
                    <SelectItem key={plano.id} value={plano.id}>
                      {plano.codigo} - {plano.nome}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          )}

          {tipoBusca === "status" && (
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="flex-1">
                <SelectValue placeholder="Selecione o status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos</SelectItem>
                <SelectItem value="pendente">Aberto</SelectItem>
                <SelectItem value="recebido">Pago</SelectItem>
                <SelectItem value="atrasado">Vencido</SelectItem>
                <SelectItem value="cancelado">Cancelado</SelectItem>
              </SelectContent>
            </Select>
          )}

          {/* Botão Limpar Filtros */}
          {(searchTerm || dataEmissaoFiltro || dataVencimentoFiltro || dataPagamentoFiltro || planoContaFiltro !== "todos" || categoriaFiltro !== "todos" || statusFilter !== "todos") && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSearchTerm("");
                setDataEmissaoFiltro(undefined);
                setDataVencimentoFiltro(undefined);
                setDataPagamentoFiltro(undefined);
                setPlanoContaFiltro("todos");
                setCategoriaFiltro("todos");
                setStatusFilter("todos");
                setPessoaFiltro("");
              }}
              className="shrink-0"
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              Limpar
            </Button>
          )}

          {/* Botão Exportar */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Exportar
                <ChevronDown className="h-4 w-4 ml-2" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-background">
              <DropdownMenuItem onClick={handleExportarCSV}>
                <Download className="h-4 w-4 mr-2" />
                Exportar CSV
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Linha 2: Selecionar Todas e Botões de Ação */}
        <div className="flex gap-2 justify-between items-center">
          {/* Botão Selecionar Todas - Lado Esquerdo */}
          {contasFiltradas.length > 0 && selectedContas.length === 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSelecionarTodas}
              className="text-xs text-[#9C8B82] hover:text-[#6B5047]"
            >
              <CheckCircle className="h-3 w-3 mr-1" />
              Selecionar todas ({contasFiltradas.length})
            </Button>
          )}

          {/* Botões de ação quando há seleção */}
          <div className="flex gap-2 ml-auto">
          {selectedContas.length > 0 && (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={handleDesselecionarTodas}
                className="text-xs"
              >
                Desselecionar ({selectedContas.length})
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={handleExcluirSelecionadas}
                className="text-xs"
              >
                <Trash2 className="h-3 w-3 mr-1" />
                Excluir
              </Button>
            </>
          )}
        </div>
      </div>
      </div>

      {/* Tabs */}
      <Tabs value={selectedTab} onValueChange={setSelectedTab}>
        <TabsList>
          <TabsTrigger value="todas">
            Todos ({contasAReceber.length})
          </TabsTrigger>
          <TabsTrigger value="abertos">
            Abertos ({contas.filter(c => c.status === 'pendente').length})
          </TabsTrigger>
          <TabsTrigger value="vencendo">
            Vencendo Hoje ({contas.filter(isVencendoHoje).length})
          </TabsTrigger>
          <TabsTrigger value="vencidos">
            Vencidos ({resumo.vencidoQtd})
          </TabsTrigger>
          <TabsTrigger value="esteMes">
            Este Mês ({resumo.esteMesQtd})
          </TabsTrigger>
          <TabsTrigger value="recebidos">
            Recebidos ({contasRecebidas.length})
          </TabsTrigger>
        </TabsList>

        {/* Botão Nova Conta - Centralizado */}
        <div className="flex justify-center my-4">
          <Button 
            onClick={() => setIsDialogOpen(true)} 
            className="bg-[#D89B8C] hover:bg-[#B87C6D]"
            size="lg"
          >
            <Plus className="h-5 w-5 mr-2" />
            Nova Conta a Receber
          </Button>
        </div>

        <TabsContent value={selectedTab} className="space-y-4">
          {selectedTab === 'recebidos' ? (
            // Listagem de Contas Recebidas
            contasRecebidasFiltradas.length === 0 ? (
              <Card className="p-12 text-center">
                <CheckCircle className="h-12 w-12 mx-auto text-[#9C8B82] mb-4 opacity-50" />
                <h3 className="text-lg font-semibold text-[#6B5047] mb-2">
                  Nenhuma conta recebida
                </h3>
                <p className="text-sm text-[#9C8B82]">
                  As contas pagas aparecerão aqui
                </p>
              </Card>
            ) : (
              <Card className="overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[50px]">
                        <Checkbox
                          checked={selectedContas.length === contasRecebidasFiltradas.length}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setSelectedContas(contasRecebidasFiltradas.map(c => c.id));
                            } else {
                              handleDesselecionarTodas();
                            }
                          }}
                        />
                      </TableHead>
                      <TableHead>Emissão</TableHead>
                      <TableHead>Plano de Contas</TableHead>
                      <TableHead>Pessoa</TableHead>
                      <TableHead className="text-right">Valor Total</TableHead>
                      <TableHead>Data Recebimento</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="w-[50px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {contasRecebidasFiltradas.map((conta) => (
                      <TableRow
                        key={conta.id}
                        className={getRowStyle(conta)}
                      >
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
                        <TableCell className="text-sm text-[#6B5047]">
                          {conta.data_emissao ? formatDate(conta.data_emissao) : "-"}
                        </TableCell>
                        <TableCell className="text-sm text-[#6B5047]">
                          {getPlanoContaNome(conta.plano_conta_id)}
                        </TableCell>
                        <TableCell className="text-sm text-[#6B5047]">
                          {conta.cliente_nome || "-"}
                        </TableCell>
                        <TableCell className="text-sm text-right font-semibold text-[#388E3C]">
                          {formatCurrency(conta.valor)}
                        </TableCell>
                        <TableCell className="text-sm text-[#6B5047]">
                          {conta.data_recebimento ? formatDate(conta.data_recebimento) : "-"}
                        </TableCell>
                        <TableCell>
                          {getStatusBadge(conta.status)}
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="bg-background">
                              <DropdownMenuItem onClick={() => handleEditar(conta)}>
                                <Edit className="h-4 w-4 mr-2" />
                                Editar
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleOpenDeleteConfirm(conta)}
                                className="text-destructive focus:text-destructive"
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Excluir
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Card>
            )
          ) : (
            // Listagem de Contas a Receber
            contasFiltradas.length === 0 ? (
              <Card className="p-12 text-center">
                <DollarSign className="h-12 w-12 mx-auto text-[#9C8B82] mb-4 opacity-50" />
                <h3 className="text-lg font-semibold text-[#6B5047] mb-2">
                  Nenhuma conta encontrada
                </h3>
                <p className="text-sm text-[#9C8B82] mb-6">
                  Comece adicionando sua primeira conta a receber
                </p>
                <Button onClick={() => setIsDialogOpen(true)} className="bg-[#D89B8C] hover:bg-[#B87C6D]">
                  <Plus className="h-4 w-4 mr-2" />
                  Nova Conta a Receber
                </Button>
              </Card>
            ) : (
              <Card className="overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[50px]">
                      <Checkbox
                        checked={selectedContas.length === contasFiltradas.length}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            handleSelecionarTodas();
                          } else {
                            handleDesselecionarTodas();
                          }
                        }}
                      />
                    </TableHead>
                    <TableHead>Emissão</TableHead>
                    <TableHead>Plano de Contas</TableHead>
                    <TableHead>Pessoa</TableHead>
                    <TableHead className="text-right">Valor Total</TableHead>
                    <TableHead>Vencimento</TableHead>
                    <TableHead className="text-right">Valor a Pagar</TableHead>
                    <TableHead>Data de Pagamento</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {contasFiltradas.map((conta) => (
                    <TableRow
                      key={conta.id}
                      className={getRowStyle(conta)}
                    >
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
                      <TableCell className="text-sm text-[#6B5047]">
                        {conta.data_emissao ? formatDate(conta.data_emissao) : "-"}
                      </TableCell>
                      <TableCell className="text-sm text-[#6B5047]">
                        {getPlanoContaNome(conta.plano_conta_id)}
                      </TableCell>
                      <TableCell className="text-sm text-[#6B5047]">
                        {conta.cliente_nome || "-"}
                      </TableCell>
                      <TableCell className="text-sm text-right font-semibold text-[#6B5047]">
                        {formatCurrency(conta.valor)}
                      </TableCell>
                      <TableCell className="text-sm text-[#6B5047]">
                        <div className="flex flex-col gap-1">
                          <span>{formatDate(conta.data_vencimento)}</span>
                          <span className="text-xs text-[#9C8B82]">
                            {formatDateRelative(conta.data_vencimento)}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-right font-semibold text-[#6B5047]">
                        {['recebido', 'pagto_adiantado', 'pagto_atrasado'].includes(conta.status) ? formatCurrency(0) : formatCurrency(conta.valor)}
                      </TableCell>
                      <TableCell className="text-sm text-[#6B5047]">
                        {conta.data_recebimento ? formatDate(conta.data_recebimento) : "-"}
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(conta.status)}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="bg-background">
                            {conta.status === 'pendente' && (
                              <>
                                <DropdownMenuItem onClick={() => handleRegistrarRecebimento(conta)}>
                                  <DollarSign className="h-4 w-4 mr-2" />
                                  Recebimento
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                              </>
                            )}
                            <DropdownMenuItem onClick={() => handleEditar(conta)}>
                              <Edit className="h-4 w-4 mr-2" />
                              Editar
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleOpenDeleteConfirm(conta)}
                              className="text-destructive focus:text-destructive"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Excluir
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
            )
          )}
        </TabsContent>
      </Tabs>

      {/* Formulário */}
      <ContaReceberFormDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        conta={editingConta}
        onSave={() => {
          setEditingConta(null);
          refetch();
        }}
      />

      {/* Registrar Recebimento */}
      <RegistrarRecebimentoDialog
        open={isRecebimentoDialogOpen}
        onOpenChange={setIsRecebimentoDialogOpen}
        conta={contaParaReceber}
        onSave={() => {
          setContaParaReceber(null);
          refetch();
        }}
      />

      {/* Confirmação de Exclusão */}
      <ConfirmDialog
        open={deleteConfirmOpen}
        onOpenChange={setDeleteConfirmOpen}
        onConfirm={handleConfirmDelete}
        title="Excluir Conta a Receber"
        description={`Tem certeza que deseja excluir "${contaToDelete?.descricao}"? Esta ação não pode ser desfeita.`}
        confirmLabel="Excluir"
        cancelLabel="Cancelar"
      />
    </div>
  );
}
