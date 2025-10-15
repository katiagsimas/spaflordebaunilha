import { useState, useEffect } from "react";
import { Plus, Search, Filter, CheckCircle, Clock, AlertCircle, XCircle, MoreVertical, Eye, Edit, Copy, Trash2, DollarSign, Calendar, Download, ChevronDown, RotateCcw } from "lucide-react";
import { format } from "date-fns";
import { PageHeader } from "@/components/PageHeader";
import { BackButton } from "@/components/BackButton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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


export default function ContasReceber() {
  const { items: contas, loading, refetch, deleteItem } = useContasReceber();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("todos");
  const [periodoFilter, setPeriodoFilter] = useState<string>("todos");
  const [selectedTab, setSelectedTab] = useState("todas");
  const [selectedContas, setSelectedContas] = useState<string[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingConta, setEditingConta] = useState<any | null>(null);
  const [isRecebimentoDialogOpen, setIsRecebimentoDialogOpen] = useState(false);
  const [contaParaReceber, setContaParaReceber] = useState<any | null>(null);


  // Calcular resumos
  const resumo = {
    aReceber: contas.filter(c => c.status === 'pendente').reduce((sum, c) => sum + c.valor, 0),
    aReceberQtd: contas.filter(c => c.status === 'pendente').length,
    recebido: contas.filter(c => c.status === 'recebido').reduce((sum, c) => sum + c.valor, 0),
    recebidoQtd: contas.filter(c => c.status === 'recebido').length,
    atrasado: contas.filter(c => c.status === 'atrasado').reduce((sum, c) => sum + c.valor, 0),
    atrasadoQtd: contas.filter(c => c.status === 'atrasado').length,
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

  // Filtrar contas
  const contasFiltradas = contas.filter(conta => {
    // Filtro de busca
    if (searchTerm) {
      const termo = searchTerm.toLowerCase();
      if (!conta.descricao.toLowerCase().includes(termo)) {
        return false;
      }
    }

    // Filtro de status
    if (statusFilter !== "todos" && conta.status !== statusFilter) {
      return false;
    }

    // Filtro de tab
    if (selectedTab === "pendentes" && conta.status !== "pendente") return false;
    if (selectedTab === "vencendo" && !isVencendoHoje(conta)) return false;
    if (selectedTab === "recebidas" && conta.status !== "recebido") return false;

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
        label: "Pendente",
        className: "bg-[#FEF3E2] text-[#B8860B] border border-[#E5C89F]"
      },
      recebido: {
        icon: CheckCircle,
        label: "Recebido",
        className: "bg-[#E8F5E9] text-[#388E3C] border border-[#8BA888]"
      },
      atrasado: {
        icon: AlertCircle,
        label: "Atrasado",
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

    if (conta.status === 'pendente') {
      if (vencimento.getTime() === hoje.getTime()) {
        return "bg-[#FEF3E2]/30 border-l-4 border-l-[#E5C89F]";
      }
      const diffDays = Math.ceil((vencimento.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24));
      if (diffDays <= 3 && diffDays > 0) {
        return "bg-[#E3F2FD]/20 border-l-4 border-l-[#7BA8D8]";
      }
    }

    if (conta.status === 'recebido') {
      return "opacity-70";
    }

    return "";
  }

  async function handleExcluir(conta: any) {
    if (confirm(`Tem certeza que deseja excluir "${conta.descricao}"?`)) {
      try {
        await deleteItem(conta.id);
        toast.success("✓ Conta excluída com sucesso!");
        refetch();
      } catch (error: any) {
        toast.error('Erro ao excluir conta: ' + error.message);
      }
    }
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
            actions={
              <Button onClick={() => setIsDialogOpen(true)} className="bg-[#D89B8C] hover:bg-[#B87C6D]">
                <Plus className="h-4 w-4 mr-2" />
                Nova Conta a Receber
              </Button>
            }
          />
        </div>
      </div>

      {/* Banners de Alertas */}
      {resumo.atrasadoQtd > 0 && (
        <div className="bg-[#FFEBEE] border-l-4 border-[#D88B8B] p-4 rounded-lg animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center gap-3">
            <AlertCircle className="text-[#D88B8B] h-5 w-5 shrink-0" />
            <div className="flex-1">
              <p className="font-semibold text-[#6B5047]">
                Você tem {resumo.atrasadoQtd} conta(s) atrasada(s) totalizando {formatCurrency(resumo.atrasado)}
              </p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setStatusFilter('atrasado');
                setSelectedTab('todas');
              }}
              className="text-[#D88B8B] hover:bg-[#FFEBEE]"
            >
              Ver contas
            </Button>
          </div>
        </div>
      )}

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
        <Card className="p-4 border-l-4 border-l-[#7BA8D8] hover:shadow-lg transition-shadow">
          <div className="space-y-2">
            <p className="text-sm text-[#9C8B82]">A Receber</p>
            <p className="text-2xl font-bold text-[#6B5047]">{formatCurrency(resumo.aReceber)}</p>
            <p className="text-xs text-[#9C8B82]">{resumo.aReceberQtd} contas</p>
          </div>
        </Card>

        <Card className="p-4 border-l-4 border-l-[#8BA888] hover:shadow-lg transition-shadow">
          <div className="space-y-2">
            <p className="text-sm text-[#9C8B82]">Recebido</p>
            <p className="text-2xl font-bold text-[#388E3C]">{formatCurrency(resumo.recebido)}</p>
            <p className="text-xs text-[#9C8B82]">{resumo.recebidoQtd} contas</p>
          </div>
        </Card>

        <Card className="p-4 border-l-4 border-l-[#D88B8B] hover:shadow-lg transition-shadow">
          <div className="space-y-2">
            <p className="text-sm text-[#9C8B82]">Atrasado</p>
            <p className="text-2xl font-bold text-[#C62828]">{formatCurrency(resumo.atrasado)}</p>
            <p className="text-xs text-[#9C8B82]">{resumo.atrasadoQtd} contas</p>
          </div>
        </Card>

        <Card className="p-4 border-l-4 border-l-[#D89B8C] hover:shadow-lg transition-shadow">
          <div className="space-y-2">
            <p className="text-sm text-[#9C8B82]">Este Mês</p>
            <p className="text-2xl font-bold text-[#D89B8C]">{formatCurrency(resumo.esteMes)}</p>
            <p className="text-xs text-[#9C8B82]">{resumo.esteMesQtd} contas</p>
          </div>
        </Card>
      </div>

      {/* Barra de Ferramentas */}
      <div className="flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#9C8B82]" />
          <Input
            placeholder="Buscar por descrição, cliente ou documento..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full md:w-[180px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos</SelectItem>
            <SelectItem value="pendente">Pendente</SelectItem>
            <SelectItem value="recebido">Recebido</SelectItem>
            <SelectItem value="atrasado">Atrasado</SelectItem>
            <SelectItem value="cancelado">Cancelado</SelectItem>
          </SelectContent>
        </Select>
        
        {/* Botões de Ação */}
        <div className="flex gap-2">
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
      </div>

      {/* Botão Selecionar Todas */}
      {contasFiltradas.length > 0 && selectedContas.length === 0 && (
        <div className="flex justify-end">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleSelecionarTodas}
            className="text-xs text-[#9C8B82] hover:text-[#6B5047]"
          >
            <CheckCircle className="h-3 w-3 mr-1" />
            Selecionar todas ({contasFiltradas.length})
          </Button>
        </div>
      )}

      {/* Tabs */}
      <Tabs value={selectedTab} onValueChange={setSelectedTab}>
        <TabsList>
          <TabsTrigger value="todas">
            Todas ({contas.length})
          </TabsTrigger>
          <TabsTrigger value="pendentes">
            Pendentes ({contas.filter(c => c.status === 'pendente').length})
          </TabsTrigger>
          <TabsTrigger value="vencendo">
            Vencendo Hoje ({contas.filter(isVencendoHoje).length})
          </TabsTrigger>
          <TabsTrigger value="recebidas">
            Recebidas ({contas.filter(c => c.status === 'recebido').length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value={selectedTab} className="space-y-4">
          {contasFiltradas.length === 0 ? (
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
            <div className="space-y-2">
              {contasFiltradas.map(conta => (
                <Card key={conta.id} className={`p-4 hover:shadow-md transition-all ${getRowStyle(conta)}`}>
                  {/* Layout Desktop */}
                  <div className="hidden md:flex items-start gap-4">
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

                    <div className="flex-1 grid grid-cols-1 md:grid-cols-5 gap-4">
                      <div className="md:col-span-2">
                          <div className="flex items-start gap-2">
                            <Calendar className="h-4 w-4 text-[#9C8B82] mt-0.5 shrink-0" />
                            <div>
                              <p className="text-sm text-[#9C8B82]">{format(new Date(conta.created_at || conta.data_vencimento), 'dd/MM')}</p>
                              <p className="text-xs text-[#9C8B82]">
                                {conta.status === 'recebido' && conta.data_recebimento
                                  ? `Receb: ${format(new Date(conta.data_recebimento), 'dd/MM')}`
                                  : `Venc: ${format(new Date(conta.data_vencimento), 'dd/MM')} (${formatDateRelative(conta.data_vencimento)})`
                                }
                              </p>
                            </div>
                          </div>
                          <div className="mt-2">
                            <h4 className="font-semibold text-[#6B5047]">{conta.descricao}</h4>
                            <p className="text-xs text-[#9C8B82]">Plano de Contas</p>
                          </div>
                      </div>

                        <div>
                          <p className="text-sm text-[#9C8B82]">Cliente</p>
                          <p className="font-medium text-[#6B5047]">{conta.cliente_nome || '-'}</p>
                        </div>

                      <div>
                        <p className="text-sm text-[#9C8B82]">Valor</p>
                        <p className="font-bold text-lg text-[#6B5047]">{formatCurrency(conta.valor)}</p>
                      </div>

                      <div className="flex items-start justify-between">
                        {getStatusBadge(conta.status)}
                        
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="bg-background">
                            {conta.status === 'pendente' && (
                              <>
                                <DropdownMenuItem onClick={() => {
                                  setContaParaReceber(conta);
                                  setIsRecebimentoDialogOpen(true);
                                }}>
                                  <CheckCircle className="h-4 w-4 mr-2" />
                                  Registrar Recebimento
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                              </>
                            )}
                            <DropdownMenuItem>
                              <Eye className="h-4 w-4 mr-2" />
                              Ver Detalhes
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => {
                              setEditingConta(conta);
                              setIsDialogOpen(true);
                            }}>
                              <Edit className="h-4 w-4 mr-2" />
                              Editar
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleDuplicar(conta)}>
                              <Copy className="h-4 w-4 mr-2" />
                              Duplicar
                            </DropdownMenuItem>
                            {conta.status === 'recebido' && (
                              <>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={() => handleEstornar(conta)}>
                                  <RotateCcw className="h-4 w-4 mr-2" />
                                  Estornar Recebimento
                                </DropdownMenuItem>
                              </>
                            )}
                            <DropdownMenuSeparator />
                            <DropdownMenuItem 
                              className="text-destructive"
                              onClick={() => handleExcluir(conta)}
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Excluir
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  </div>

                  {/* Layout Mobile */}
                  <div className="md:hidden space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-start gap-2 flex-1">
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
                        <div className="flex-1">
                          {getStatusBadge(conta.status)}
                          <h4 className="font-semibold text-[#6B5047] mt-2">{conta.descricao}</h4>
                        </div>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="bg-background">
                          {conta.status === 'pendente' && (
                            <>
                              <DropdownMenuItem onClick={() => {
                                setContaParaReceber(conta);
                                setIsRecebimentoDialogOpen(true);
                              }}>
                                <CheckCircle className="h-4 w-4 mr-2" />
                                Registrar Recebimento
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                            </>
                          )}
                          <DropdownMenuItem onClick={() => {
                            setEditingConta(conta);
                            setIsDialogOpen(true);
                          }}>
                            <Edit className="h-4 w-4 mr-2" />
                            Editar
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleDuplicar(conta)}>
                            <Copy className="h-4 w-4 mr-2" />
                            Duplicar
                          </DropdownMenuItem>
                          {conta.status === 'recebido' && (
                            <DropdownMenuItem onClick={() => handleEstornar(conta)}>
                              <RotateCcw className="h-4 w-4 mr-2" />
                              Estornar
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuSeparator />
                          <DropdownMenuItem 
                            className="text-destructive"
                            onClick={() => handleExcluir(conta)}
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Excluir
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>

                    <div className="flex justify-between items-center">
                      <div>
                        <p className="text-2xl font-bold text-[#6B5047]">{formatCurrency(conta.valor)}</p>
                        <p className="text-xs text-[#9C8B82] mt-1">
                          {conta.status === 'recebido' && conta.data_recebimento
                            ? `Recebido em ${format(new Date(conta.data_recebimento), 'dd/MM/yyyy')}`
                            : `Vence ${formatDateRelative(conta.data_vencimento)}`
                          }
                        </p>
                      </div>
                      {conta.status === 'pendente' && (
                        <Button
                          size="sm"
                          onClick={() => {
                            setContaParaReceber(conta);
                            setIsRecebimentoDialogOpen(true);
                          }}
                          className="bg-[#8BA888] hover:bg-[#7A9777]"
                        >
                          Receber
                        </Button>
                      )}
                    </div>

                    <div className="text-xs text-[#9C8B82]">
                      Plano de Contas
                    </div>
                  </div>
                </Card>
              ))}
            </div>
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
        }}
      />
    </div>
  );
}
