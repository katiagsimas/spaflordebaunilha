import { useState, useEffect } from "react";
import { Plus, Search, Filter, CheckCircle, Clock, AlertCircle, XCircle, MoreVertical, Eye, Edit, Copy, Trash2, DollarSign, Calendar } from "lucide-react";
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
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { toast } from "sonner";
import { ContaReceberFormDialog } from "@/components/ContaReceberFormDialog";

interface ContaReceber {
  id: string;
  descricao: string;
  categoriaId: string;
  planoContaId: string;
  valor: number;
  dataEmissao: string;
  dataVencimento: string;
  dataPagamento?: string;
  status: 'pendente' | 'recebido' | 'atrasado' | 'cancelado';
  formaPagamento?: string;
  bancoId?: string;
  tipoDocumentoId?: string;
  numeroDocumento?: string;
  clienteNome?: string;
  clienteDocumento?: string;
  observacoes?: string;
  parcelado: boolean;
  numeroParcela?: number;
  totalParcelas?: number;
  recorrente: boolean;
  createdAt: string;
  updatedAt: string;
}

export default function ContasReceber() {
  const [contas, setContas] = useLocalStorage<ContaReceber[]>("sugarbox_contas_receber", []);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("todos");
  const [periodoFilter, setPeriodoFilter] = useState<string>("todos");
  const [selectedTab, setSelectedTab] = useState("todas");
  const [selectedContas, setSelectedContas] = useState<string[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingConta, setEditingConta] = useState<ContaReceber | null>(null);

  // Calcular status automaticamente
  useEffect(() => {
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);

    const contasAtualizadas = contas.map(conta => {
      if (conta.status === 'pendente') {
        const vencimento = new Date(conta.dataVencimento);
        vencimento.setHours(0, 0, 0, 0);
        
        if (vencimento < hoje) {
          return { ...conta, status: 'atrasado' as const };
        }
      }
      return conta;
    });

    if (JSON.stringify(contasAtualizadas) !== JSON.stringify(contas)) {
      setContas(contasAtualizadas);
    }
  }, [contas, setContas]);

  // Calcular resumos
  const resumo = {
    aReceber: contas.filter(c => c.status === 'pendente').reduce((sum, c) => sum + c.valor, 0),
    aReceberQtd: contas.filter(c => c.status === 'pendente').length,
    recebido: contas.filter(c => c.status === 'recebido').reduce((sum, c) => sum + c.valor, 0),
    recebidoQtd: contas.filter(c => c.status === 'recebido').length,
    atrasado: contas.filter(c => c.status === 'atrasado').reduce((sum, c) => sum + c.valor, 0),
    atrasadoQtd: contas.filter(c => c.status === 'atrasado').length,
    esteMes: contas.filter(c => {
      const data = new Date(c.dataVencimento);
      const hoje = new Date();
      return data.getMonth() === hoje.getMonth() && data.getFullYear() === hoje.getFullYear();
    }).reduce((sum, c) => sum + c.valor, 0),
    esteMesQtd: contas.filter(c => {
      const data = new Date(c.dataVencimento);
      const hoje = new Date();
      return data.getMonth() === hoje.getMonth() && data.getFullYear() === hoje.getFullYear();
    }).length,
  };

  // Filtrar contas
  const contasFiltradas = contas.filter(conta => {
    // Filtro de busca
    if (searchTerm) {
      const termo = searchTerm.toLowerCase();
      if (
        !conta.descricao.toLowerCase().includes(termo) &&
        !conta.clienteNome?.toLowerCase().includes(termo) &&
        !conta.numeroDocumento?.toLowerCase().includes(termo)
      ) {
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

  function isVencendoHoje(conta: ContaReceber) {
    if (conta.status !== 'pendente') return false;
    const hoje = new Date();
    const vencimento = new Date(conta.dataVencimento);
    hoje.setHours(0, 0, 0, 0);
    vencimento.setHours(0, 0, 0, 0);
    return vencimento.getTime() === hoje.getTime();
  }

  function getStatusBadge(status: ContaReceber['status']) {
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

  function getRowStyle(conta: ContaReceber) {
    const hoje = new Date();
    const vencimento = new Date(conta.dataVencimento);
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

  function formatCurrency(value: number) {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  }

  function formatDate(dateString: string) {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'short'
    });
  }

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

      {/* Cards de Resumo */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
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
      </div>

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
                  <div className="flex items-start gap-4">
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
                            <p className="text-sm text-[#9C8B82]">{formatDate(conta.dataEmissao)}</p>
                            <p className="text-xs text-[#9C8B82]">
                              {conta.status === 'recebido' && conta.dataPagamento
                                ? `Receb: ${formatDate(conta.dataPagamento)}`
                                : `Venc: ${formatDate(conta.dataVencimento)}`
                              }
                            </p>
                          </div>
                        </div>
                        <div className="mt-2">
                          <h4 className="font-semibold text-[#6B5047]">{conta.descricao}</h4>
                          <p className="text-xs text-[#9C8B82]">Plano de Contas</p>
                          {conta.formaPagamento && conta.status === 'recebido' && (
                            <p className="text-xs text-[#9C8B82]">{conta.formaPagamento}</p>
                          )}
                        </div>
                      </div>

                      <div>
                        <p className="text-sm text-[#9C8B82]">Cliente</p>
                        <p className="font-medium text-[#6B5047]">{conta.clienteNome || '-'}</p>
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
                                <DropdownMenuItem>
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
                            <DropdownMenuItem>
                              <Edit className="h-4 w-4 mr-2" />
                              Editar
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Copy className="h-4 w-4 mr-2" />
                              Duplicar
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-destructive">
                              <Trash2 className="h-4 w-4 mr-2" />
                              Excluir
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
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
        }}
      />
    </div>
  );
}
