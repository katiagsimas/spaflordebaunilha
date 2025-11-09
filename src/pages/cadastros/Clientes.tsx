import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { PageHeader } from "@/components/PageHeader";
import { BackButton } from "@/components/BackButton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { EmptyState } from "@/components/EmptyState";
import { useClientes } from "@/hooks/useClientes";
import { useViaCEP } from "@/hooks/useViaCEP";
import { Plus, Pencil, Trash2, Users, Search, ChevronDown, Download, Cake, MoreVertical, UserPlus } from "lucide-react";
import { toast } from "sonner";
import { formatPhone, formatCpfCnpj } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import * as XLSX from 'xlsx';
import { FamiliaresManager } from "@/components/clientes/FamiliaresManager";
import { NPSManager } from "@/components/clientes/NPSManager";
import { DashboardAniversariantes } from "@/components/clientes/DashboardAniversariantes";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function Clientes() {
  const navigate = useNavigate();
  const { clientes, loading: loadingClientes, createCliente, updateCliente, deleteCliente } = useClientes();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCliente, setEditingCliente] = useState<any | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [observacoesOpen, setObservacoesOpen] = useState(false);
  const { buscarCEP, loading: loadingCEP } = useViaCEP();
  const [busca, setBusca] = useState("");
  const [porPagina, setPorPagina] = useState(10);
  const [familiarClienteId, setFamiliarClienteId] = useState<string | null>(null);
  const [isFamiliarDialogOpen, setIsFamiliarDialogOpen] = useState(false);

  const [filtroSegmento, setFiltroSegmento] = useState("todos");
  const [filtroOrigem, setFiltroOrigem] = useState("todos");

  // Query para aniversariantes do mês (mesma lógica do módulo Fornecedores)
  const { data: familiaresAniversariantesDoMes = [] } = useQuery({
    queryKey: ['familiares-aniversariantes-mes'],
    queryFn: async () => {
      const mesAtual = new Date().getMonth() + 1;
      
      const { data, error } = await supabase
        .from('cliente_familiares')
        .select(`
          id,
          nome,
          parentesco,
          data_nascimento,
          observacoes,
          cliente_id,
          clientes!inner(nome, telefone)
        `)
        .eq('ativo', true)
        .not('data_nascimento', 'is', null);
      
      if (error) throw error;
      
      // Filtrar pelo mês atual
      const familiaresDoMes = (data || []).filter(familiar => {
        if (!familiar.data_nascimento) return false;
        const dataNasc = new Date(familiar.data_nascimento + 'T00:00:00');
        return dataNasc.getMonth() + 1 === mesAtual;
      });
      
      // Calcular dias até aniversário
      return familiaresDoMes.map(familiar => {
        const hoje = new Date();
        hoje.setHours(0, 0, 0, 0); // Zerar horas para comparação precisa
        
        const nascimento = new Date(familiar.data_nascimento + 'T00:00:00');
        const anoAtual = hoje.getFullYear();
        const aniversarioEsteAno = new Date(anoAtual, nascimento.getMonth(), nascimento.getDate());
        aniversarioEsteAno.setHours(0, 0, 0, 0);
        
        // Se o aniversário já passou este ano, calcular para o próximo ano
        let proximoAniversario = aniversarioEsteAno;
        if (aniversarioEsteAno < hoje) {
          proximoAniversario = new Date(anoAtual + 1, nascimento.getMonth(), nascimento.getDate());
        }
        
        const diff = proximoAniversario.getTime() - hoje.getTime();
        const dias = Math.floor(diff / (1000 * 60 * 60 * 24));
        
        return {
          ...familiar,
          dias_ate_aniversario: Math.max(0, dias), // Garantir que nunca seja negativo ou undefined
          cliente_nome: familiar.clientes?.nome || 'Cliente não encontrado'
        };
      }).sort((a, b) => (a.dias_ate_aniversario || 0) - (b.dias_ate_aniversario || 0));
    }
  });

  // Query para aniversariantes do mês (para o card completo)
  const { data: aniversariantes } = useQuery({
    queryKey: ['aniversariantes-mes'],
    queryFn: async () => {
      const { data, error } = await supabase
        .rpc('get_aniversariantes_mes', { 
          mes_param: new Date().getMonth() + 1 
        });
      
      if (error) throw error;
      return data || [];
    }
  });

  const [formData, setFormData] = useState({
    nome: "",
    tipo: "PF",
    telefone: "",
    email: "",
    cpf_cnpj: "",
    data_aniversario: "",
    cep: "",
    endereco: "",
    numero: "",
    cidade: "",
    estado: "",
    observacoes: "",
    como_conheceu: "",
    preferencias_alergias: "",
    segmento: "novo",
    quantidade_pedidos: 0,
    total_compras: 0,
  });

  useEffect(() => {
    if (editingCliente) {
      setFormData(editingCliente);
      setIsDialogOpen(true);
    }
  }, [editingCliente]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.nome || !formData.telefone) {
      toast.error("Nome e telefone são obrigatórios!");
      return;
    }

    try {
      if (editingCliente) {
        await updateCliente(editingCliente.id, formData);
      } else {
        await createCliente(formData);
      }
      resetForm();
    } catch (error: any) {
      toast.error(error.message || "Erro ao salvar cliente");
    }
  };

  const resetForm = () => {
    setFormData({
      nome: "",
      tipo: "PF",
      telefone: "",
      email: "",
      cpf_cnpj: "",
      data_aniversario: "",
      cep: "",
      endereco: "",
      numero: "",
      cidade: "",
      estado: "",
      observacoes: "",
      como_conheceu: "",
      preferencias_alergias: "",
      segmento: "novo",
      quantidade_pedidos: 0,
      total_compras: 0,
    });
    setEditingCliente(null);
    setIsDialogOpen(false);
    setObservacoesOpen(false);
  };

  const handleBuscarCEP = async () => {
    const endereco = await buscarCEP(formData.cep);
    if (endereco) {
      setFormData({
        ...formData,
        endereco: endereco.endereco,
        cidade: endereco.cidade,
        estado: endereco.estado,
      });
    }
  };

  const handleDelete = async (id: string) => {
    try {
      // Buscar o nome do cliente
      const cliente = clientes.find(c => c.id === id);
      
      // Verificar se o cliente possui encomendas
      const { supabase } = await import('@/integrations/supabase/client');
      const { data: encomendas } = await supabase
        .from('encomendas')
        .select('id')
        .eq('cliente', cliente?.nome)
        .limit(1);
      
      if (encomendas && encomendas.length > 0) {
        toast.error('Não é possível excluir este cliente pois ele possui encomendas cadastradas.');
        setDeleteId(null);
        return;
      }
      
      await deleteCliente(id);
      setDeleteId(null);
    } catch (error: any) {
      toast.error(error.message || "Erro ao excluir cliente");
    }
  };

  const handleEdit = (cliente: any) => {
    setEditingCliente(cliente);
  };

  const handleAdicionarFamiliar = (clienteId: string) => {
    setFamiliarClienteId(clienteId);
    setIsFamiliarDialogOpen(true);
  };

  // Filtrar aniversariantes do mês
  const aniversariantesDoMes = useMemo(() => {
    const mesAtual = new Date().getMonth();
    return clientes.filter(cliente => {
      if (!cliente.data_aniversario) return false;
      const dataAniversario = new Date(cliente.data_aniversario + 'T00:00:00');
      return dataAniversario.getMonth() === mesAtual;
    }).sort((a, b) => {
      const dataA = new Date(a.data_aniversario! + 'T00:00:00').getDate();
      const dataB = new Date(b.data_aniversario! + 'T00:00:00').getDate();
      return dataA - dataB;
    });
  }, [clientes]);

  // Filtrar clientes por busca e filtros
  const clientesFiltrados = clientes.filter(cliente => {
    const matchBusca = cliente.nome.toLowerCase().includes(busca.toLowerCase());
    const matchSegmento = filtroSegmento === "todos" || cliente.segmento === filtroSegmento;
    const matchOrigem = filtroOrigem === "todos" || cliente.como_conheceu === filtroOrigem;
    return matchBusca && matchSegmento && matchOrigem;
  });

  // Paginação
  const clientesPaginados = clientesFiltrados.slice(0, porPagina);

  const handleExportarExcel = () => {
    if (clientesFiltrados.length === 0) {
      return;
    }

    const dadosExport = clientesFiltrados.map((cliente) => ({
      'Nome': cliente.nome,
      'Tipo': cliente.tipo || 'PF',
      'Telefone': cliente.telefone,
      'E-mail': cliente.email || '-',
      'CPF/CNPJ': cliente.cpf_cnpj || '-',
      'Aniversário': cliente.data_aniversario 
        ? new Date(cliente.data_aniversario + 'T00:00:00').toLocaleDateString('pt-BR')
        : '-',
      'CEP': cliente.cep || '-',
      'Endereço': cliente.endereco || '-',
      'Número': cliente.numero || '-',
      'Cidade': cliente.cidade || '-',
      'Estado': cliente.estado || '-',
    }));

    const ws = XLSX.utils.json_to_sheet(dadosExport);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Clientes');
    XLSX.writeFile(wb, `clientes_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  return (
    <div className="space-y-6">
      <Tabs defaultValue="lista" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="lista">📋 Lista</TabsTrigger>
          <TabsTrigger value="nps">⭐ NPS</TabsTrigger>
          <TabsTrigger value="aniversariantes">🎂 Aniversariantes</TabsTrigger>
        </TabsList>
        
        <TabsContent value="lista" className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-3xl font-bold tracking-tight">Clientes</h1>
        <Badge variant="secondary" className="text-sm px-3 py-1">
          {clientes.length} {clientes.length === 1 ? 'cliente cadastrado' : 'clientes cadastrados'}
        </Badge>
      </div>

      {/* Cards de Estatísticas por Segmento */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">VIP</p>
                <p className="text-2xl font-bold">
                  {clientes.filter(c => c.segmento === 'vip').length}
                </p>
              </div>
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                <span className="text-2xl">⭐</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Eventuais</p>
                <p className="text-2xl font-bold">
                  {clientes.filter(c => c.segmento === 'eventual').length}
                </p>
              </div>
              <div className="h-12 w-12 rounded-full bg-blue-500/10 flex items-center justify-center">
                <span className="text-2xl">🔄</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Novos</p>
                <p className="text-2xl font-bold">
                  {clientes.filter(c => c.segmento === 'novo').length}
                </p>
              </div>
              <div className="h-12 w-12 rounded-full bg-green-500/10 flex items-center justify-center">
                <span className="text-2xl">🌟</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Inativos</p>
                <p className="text-2xl font-bold">
                  {clientes.filter(c => c.segmento === 'inativo').length}
                </p>
              </div>
              <div className="h-12 w-12 rounded-full bg-red-500/10 flex items-center justify-center">
                <span className="text-2xl">😴</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Alerta de Familiares Aniversariantes - Seguindo padrão de Fornecedores */}
      {familiaresAniversariantesDoMes.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Cake className="h-5 w-5 animate-bounce" />
            🎉 Familiares Aniversariantes do Mês
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {familiaresAniversariantesDoMes.map((familiar: any) => (
              <Card 
                key={familiar.id}
                className="bg-gradient-to-r from-purple-500/10 via-pink-500/10 to-orange-500/10 dark:from-purple-500/20 dark:via-pink-500/20 dark:to-orange-500/20 border-2 border-purple-300/50 dark:border-purple-500/50 hover:shadow-lg transition-all duration-300 cursor-pointer"
                onClick={() => {
                  const cliente = clientes.find(c => c.id === familiar.cliente_id);
                  if (cliente) {
                    handleEdit(cliente);
                  }
                }}
              >
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="flex-shrink-0">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                        <Cake className="h-6 w-6 text-white animate-bounce" />
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm truncate">
                        {familiar.nome}
                      </p>
                      <p className="text-xs text-purple-600 dark:text-purple-400 font-medium">
                        {familiar.parentesco}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        Cliente: {familiar.cliente_nome}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(familiar.data_nascimento + 'T00:00:00').toLocaleDateString('pt-BR', { 
                          day: '2-digit', 
                          month: 'long' 
                        })}
                      </p>
                      <Badge 
                        variant={(familiar.dias_ate_aniversario || 0) <= 7 ? 'default' : 'secondary'}
                        className="mt-1"
                      >
                        {familiar.dias_ate_aniversario === 0 ? '🎉 HOJE!' :
                         familiar.dias_ate_aniversario === 1 ? '⭐ Amanhã' :
                         `Em ${familiar.dias_ate_aniversario || 0} dias`}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Card de Aniversariantes do Mês - Clientes e Familiares */}
      {aniversariantes && aniversariantes.length > 0 && (
        <Card className="bg-gradient-to-r from-pink-50 to-purple-50 dark:from-pink-950/20 dark:to-purple-950/20 border-pink-200 dark:border-pink-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Cake className="h-5 w-5 text-pink-600 animate-bounce" />
              🎉 Aniversariantes do Mês - Clientes e Familiares
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {aniversariantes.slice(0, 8).map((aniv: any) => {
                const isFamiliar = aniv.tipo === 'familiar';
                const cliente = isFamiliar ? clientes.find(c => c.id === aniv.cliente_id) : null;
                
                return (
                  <div 
                    key={`${aniv.tipo}-${aniv.cliente_id}-${aniv.nome}`}
                    className="flex items-center justify-between p-4 bg-white dark:bg-gray-900 rounded-lg border-2 hover:shadow-md transition-all cursor-pointer"
                    onClick={() => {
                      if (aniv.tipo === 'cliente') {
                        const cliente = clientes.find(c => c.id === aniv.cliente_id);
                        if (cliente) {
                          handleEdit(cliente);
                        }
                      } else {
                        const cliente = clientes.find(c => c.id === aniv.cliente_id);
                        if (cliente) {
                          handleEdit(cliente);
                        }
                      }
                    }}
                  >
                    <div className="flex items-center gap-3 flex-1">
                      {aniv.tipo === 'cliente' ? (
                        <div className="h-12 w-12 rounded-full bg-pink-100 dark:bg-pink-900/30 flex items-center justify-center flex-shrink-0">
                          <span className="text-2xl">👤</span>
                        </div>
                      ) : (
                        <div className="h-12 w-12 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center flex-shrink-0">
                          <span className="text-2xl">👶</span>
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-base">{aniv.nome}</p>
                        {isFamiliar && (
                          <p className="text-sm font-medium text-purple-600 dark:text-purple-400">
                            {aniv.parentesco} • Cliente: {cliente?.nome || 'N/A'}
                          </p>
                        )}
                        <p className="text-sm text-muted-foreground">
                          {new Date(aniv.data_nascimento + 'T00:00:00').toLocaleDateString('pt-BR', {
                            day: '2-digit',
                            month: 'long'
                          })}
                        </p>
                        {aniv.telefone && (
                          <p className="text-xs text-muted-foreground">
                            {aniv.telefone}
                          </p>
                        )}
                      </div>
                    </div>
                    <Badge 
                      variant={aniv.dias_ate_aniversario <= 7 ? 'default' : 'secondary'}
                      className="ml-2"
                    >
                      {aniv.dias_ate_aniversario === 0 ? '🎉 HOJE!' :
                       aniv.dias_ate_aniversario === 1 ? '⭐ Amanhã' :
                       `${aniv.dias_ate_aniversario} dias`}
                    </Badge>
                  </div>
                );
              })}
            </div>
            {aniversariantes.length > 8 && (
              <p className="text-sm text-muted-foreground mt-3 text-center font-medium">
                + {aniversariantes.length - 8} aniversariantes este mês
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {aniversariantesDoMes.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Cake className="h-5 w-5 animate-bounce" />
            🎉 Aniversariantes do Mês
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {aniversariantesDoMes.map((cliente) => (
              <Card 
                key={cliente.id}
                className="bg-gradient-to-r from-blue-500/10 via-cyan-500/10 to-teal-500/10 dark:from-blue-500/20 dark:via-cyan-500/20 dark:to-teal-500/20 border-2 border-blue-300/50 dark:border-blue-500/50 hover:shadow-lg transition-all duration-300 cursor-pointer"
                onClick={() => handleEdit(cliente)}
              >
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="flex-shrink-0">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
                        <Cake className="h-6 w-6 text-white animate-bounce" />
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm truncate">
                        {cliente.nome}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(cliente.data_aniversario! + 'T00:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'long' })}
                      </p>
                      {cliente.telefone && (
                        <p className="text-xs text-muted-foreground truncate">
                          {cliente.telefone}
                        </p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Lista de Clientes</CardTitle>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={() => setEditingCliente(null)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Novo Cliente
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editingCliente ? "Editar Cliente" : "Novo Cliente"}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="nome">Nome *</Label>
                    <Input
                      id="nome"
                      value={formData.nome}
                      onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="tipo">Tipo</Label>
                    <Select
                      value={formData.tipo}
                      onValueChange={(value) => setFormData({ ...formData, tipo: value })}
                    >
                      <SelectTrigger className="bg-background">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-background z-50">
                        <SelectItem value="PF">Pessoa Física</SelectItem>
                        <SelectItem value="PJ">Pessoa Jurídica</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="telefone">Telefone/WhatsApp *</Label>
                    <Input
                      id="telefone"
                      value={formData.telefone}
                      onChange={(e) => setFormData({ ...formData, telefone: e.target.value })}
                      onBlur={(e) => setFormData({ ...formData, telefone: formatPhone(e.target.value) })}
                      placeholder="(00) 00000-0000"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">E-mail</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="email@exemplo.com"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="cpf_cnpj">CPF/CNPJ</Label>
                    <Input
                      id="cpf_cnpj"
                      value={formData.cpf_cnpj}
                      onChange={(e) => setFormData({ ...formData, cpf_cnpj: e.target.value })}
                      onBlur={(e) => setFormData({ ...formData, cpf_cnpj: formatCpfCnpj(e.target.value) })}
                      placeholder="000.000.000-00"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="data_aniversario">Data de Aniversário</Label>
                    <Input
                      id="data_aniversario"
                      type="date"
                      value={formData.data_aniversario}
                      onChange={(e) => setFormData({ ...formData, data_aniversario: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="cep">CEP</Label>
                    <div className="flex gap-2">
                      <Input
                        id="cep"
                        value={formData.cep}
                        onChange={(e) => setFormData({ ...formData, cep: e.target.value })}
                        placeholder="00000-000"
                        maxLength={9}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={handleBuscarCEP}
                        disabled={loadingCEP || !formData.cep}
                      >
                        <Search className="h-4 w-4 mr-2" />
                        {loadingCEP ? "Buscando..." : "Buscar"}
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="endereco">Endereço</Label>
                    <Input
                      id="endereco"
                      value={formData.endereco}
                      onChange={(e) => setFormData({ ...formData, endereco: e.target.value })}
                      placeholder="Rua, Avenida"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="numero">Número</Label>
                    <Input
                      id="numero"
                      value={formData.numero}
                      onChange={(e) => setFormData({ ...formData, numero: e.target.value })}
                      placeholder="Nº"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="cidade">Cidade</Label>
                    <Input
                      id="cidade"
                      value={formData.cidade}
                      onChange={(e) => setFormData({ ...formData, cidade: e.target.value })}
                      placeholder="Cidade"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="estado">Estado</Label>
                    <Input
                      id="estado"
                      value={formData.estado}
                      onChange={(e) => setFormData({ ...formData, estado: e.target.value })}
                      placeholder="UF"
                      maxLength={2}
                    />
                  </div>
                </div>

                {/* NOVO: Como Conheceu */}
                <div className="space-y-2">
                  <Label htmlFor="como_conheceu">Como Conheceu?</Label>
                  <Select
                    value={formData.como_conheceu || ''}
                    onValueChange={(value) => 
                      setFormData({ ...formData, como_conheceu: value })
                    }
                  >
                    <SelectTrigger className="bg-background">
                      <SelectValue placeholder="Selecione a origem..." />
                    </SelectTrigger>
                    <SelectContent className="bg-background z-50">
                      <SelectItem value="instagram">📱 Instagram</SelectItem>
                      <SelectItem value="facebook">👥 Facebook</SelectItem>
                      <SelectItem value="whatsapp">💬 WhatsApp</SelectItem>
                      <SelectItem value="indicacao">🤝 Indicação</SelectItem>
                      <SelectItem value="google">🔍 Google</SelectItem>
                      <SelectItem value="evento">🎉 Evento</SelectItem>
                      <SelectItem value="feira">🏪 Feira</SelectItem>
                      <SelectItem value="cliente_antigo">🔄 Cliente Antigo</SelectItem>
                      <SelectItem value="outro">📝 Outro</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    Como esse cliente conheceu seu negócio?
                  </p>
                </div>

                {/* NOVO: Preferências e Alergias */}
                <div className="space-y-2">
                  <Label htmlFor="preferencias_alergias">
                    Preferências e Alergias
                  </Label>
                  <Textarea
                    id="preferencias_alergias"
                    value={formData.preferencias_alergias || ''}
                    onChange={(e) => 
                      setFormData({ ...formData, preferencias_alergias: e.target.value })
                    }
                    placeholder="Ex: Alérgico a lactose, prefere chocolate meio amargo, não gosta de coco..."
                    rows={4}
                    className="resize-none"
                  />
                  <p className="text-xs text-muted-foreground">
                    Anote restrições alimentares, preferências de sabor ou qualquer informação importante
                  </p>
                </div>

                {/* NOVO: Badge de Segmento (somente no modo edição) */}
                {editingCliente && formData.segmento && (
                  <div className="space-y-2">
                    <Label>Segmento</Label>
                    <div className="flex items-center gap-2">
                      <Badge 
                        variant={
                          formData.segmento === 'vip' ? 'default' :
                          formData.segmento === 'inativo' ? 'destructive' :
                          formData.segmento === 'eventual' ? 'secondary' :
                          'outline'
                        }
                        className="text-sm px-3 py-1"
                      >
                        {formData.segmento === 'vip' && '⭐ VIP'}
                        {formData.segmento === 'eventual' && '🔄 Eventual'}
                        {formData.segmento === 'novo' && '🌟 Novo'}
                        {formData.segmento === 'inativo' && '😴 Inativo'}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {formData.quantidade_pedidos || 0} pedido(s) • 
                        R$ {(formData.total_compras || 0).toFixed(2)}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Segmento calculado automaticamente baseado no histórico
                    </p>
                  </div>
                )}

                {/* SEÇÃO DE FAMILIARES */}
                <div className="col-span-full">
                  <FamiliaresManager 
                    clienteId={editingCliente?.id || null} 
                    isNewCliente={!editingCliente}
                  />
                </div>

                {/* Observações sempre visível */}
                <div className="space-y-2">
                  <Label htmlFor="observacoes">Observações Gerais</Label>
                  <Textarea
                    id="observacoes"
                    value={formData.observacoes}
                    onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
                    placeholder="Digite aqui observações sobre o cliente..."
                    rows={4}
                    className="resize-none"
                  />
                </div>
                <div className="flex gap-2 justify-end">
                  <Button type="button" variant="outline" onClick={resetForm}>
                    Cancelar
                  </Button>
                  <Button type="submit">
                    {editingCliente ? "Atualizar" : "Cadastrar"}
                  </Button>
                </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        
        {/* Card de Controles */}
        <div className="px-6 pb-4">
          {/* Linha única com todos os filtros */}
          <div className="flex items-center justify-between gap-4 p-4 bg-muted/30 rounded-lg flex-wrap">
            {/* Filtros à Esquerda */}
            <div className="flex items-center gap-2 flex-wrap">
              <Select value={filtroSegmento} onValueChange={setFiltroSegmento}>
                <SelectTrigger className="w-[180px] bg-popover">
                  <SelectValue placeholder="Todos os segmentos" />
                </SelectTrigger>
                <SelectContent className="bg-popover z-50">
                  <SelectItem value="todos">Todos os segmentos</SelectItem>
                  <SelectItem value="vip">⭐ VIP</SelectItem>
                  <SelectItem value="eventual">🔄 Eventual</SelectItem>
                  <SelectItem value="novo">🌟 Novo</SelectItem>
                  <SelectItem value="inativo">😴 Inativo</SelectItem>
                </SelectContent>
              </Select>

              <Select value={filtroOrigem} onValueChange={setFiltroOrigem}>
                <SelectTrigger className="w-[180px] bg-popover">
                  <SelectValue placeholder="Todas as origens" />
                </SelectTrigger>
                <SelectContent className="bg-popover z-50">
                  <SelectItem value="todos">Todas as origens</SelectItem>
                  <SelectItem value="instagram">📱 Instagram</SelectItem>
                  <SelectItem value="indicacao">🤝 Indicação</SelectItem>
                  <SelectItem value="google">🔍 Google</SelectItem>
                  <SelectItem value="evento">🎉 Evento</SelectItem>
                  <SelectItem value="outro">📝 Outro</SelectItem>
                </SelectContent>
              </Select>

              <div className="flex items-center gap-2">
                <Select value={porPagina.toString()} onValueChange={(value) => setPorPagina(Number(value))}>
                  <SelectTrigger className="w-20 bg-popover">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-popover z-50">
                    <SelectItem value="10">10</SelectItem>
                    <SelectItem value="25">25</SelectItem>
                    <SelectItem value="50">50</SelectItem>
                    <SelectItem value="100">100</SelectItem>
                  </SelectContent>
                </Select>
                <span className="text-sm text-muted-foreground whitespace-nowrap">Resultados por Página</span>
              </div>
            </div>

            {/* Botão Exportar - Centro */}
            <Button 
              variant="outline" 
              size="sm"
              onClick={handleExportarExcel}
              className="gap-2"
            >
              <Download className="h-4 w-4" />
              Exportar para Excel
            </Button>

            {/* Campo de Busca - Direita */}
            <div className="relative flex-1 max-w-xs">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome..."
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                className="pl-9 bg-popover"
              />
            </div>
          </div>
        </div>

        <CardContent>
          {clientesPaginados.length === 0 ? (
            busca ? (
              <EmptyState
                icon={Search}
                title="Nenhum cliente encontrado"
                description="Não encontramos clientes com esse nome"
              />
            ) : (
            <EmptyState
              icon={Users}
                title="Nenhum cliente cadastrado"
                description="Comece adicionando seu primeiro cliente"
              />
            )
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Segmento</TableHead>
                    <TableHead>Origem</TableHead>
                    <TableHead>Telefone</TableHead>
                    <TableHead>E-mail</TableHead>
                    <TableHead>Aniversário</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {clientesPaginados.map((cliente) => (
                    <TableRow key={cliente.id}>
                      <TableCell className="font-medium">{cliente.nome}</TableCell>
                      <TableCell>{cliente.tipo || "PF"}</TableCell>
                      <TableCell>
                        <Badge 
                          variant={
                            cliente.segmento === 'vip' ? 'default' :
                            cliente.segmento === 'inativo' ? 'destructive' :
                            cliente.segmento === 'eventual' ? 'secondary' :
                            'outline'
                          }
                          className="text-xs"
                        >
                          {cliente.segmento === 'vip' && '⭐ VIP'}
                          {cliente.segmento === 'eventual' && '🔄 Eventual'}
                          {cliente.segmento === 'novo' && '🌟 Novo'}
                          {cliente.segmento === 'inativo' && '😴 Inativo'}
                          {!cliente.segmento && '🌟 Novo'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <span className="text-xs text-muted-foreground">
                          {cliente.como_conheceu && (
                            <>
                              {cliente.como_conheceu === 'instagram' && '📱 Instagram'}
                              {cliente.como_conheceu === 'indicacao' && '🤝 Indicação'}
                              {cliente.como_conheceu === 'google' && '🔍 Google'}
                              {cliente.como_conheceu === 'evento' && '🎉 Evento'}
                              {cliente.como_conheceu === 'facebook' && '👥 Facebook'}
                              {cliente.como_conheceu === 'whatsapp' && '💬 WhatsApp'}
                              {cliente.como_conheceu === 'feira' && '🏪 Feira'}
                              {cliente.como_conheceu === 'cliente_antigo' && '🔄 Cliente Antigo'}
                              {cliente.como_conheceu === 'outro' && '📝 Outro'}
                            </>
                          )}
                          {!cliente.como_conheceu && '-'}
                        </span>
                      </TableCell>
                      <TableCell>{cliente.telefone}</TableCell>
                      <TableCell>{cliente.email || "-"}</TableCell>
                      <TableCell>
                        {cliente.data_aniversario 
                          ? new Date(cliente.data_aniversario + 'T00:00:00').toLocaleDateString('pt-BR')
                          : "-"}
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleEdit(cliente)}>
                              <Pencil className="h-4 w-4 mr-2" />
                              Editar
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleAdicionarFamiliar(cliente.id)}>
                              <UserPlus className="h-4 w-4 mr-2" />
                              Adicionar Familiar
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => setDeleteId(cliente.id)}
                              className="text-destructive"
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
            </div>
          )}
        </CardContent>
      </Card>

      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={(open) => !open && setDeleteId(null)}
        onConfirm={() => deleteId && handleDelete(deleteId)}
        title="Excluir Cliente"
        description="Tem certeza que deseja excluir este cliente? Esta ação não pode ser desfeita."
      />

      {/* Dialog para adicionar familiar */}
      <Dialog open={isFamiliarDialogOpen} onOpenChange={setIsFamiliarDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Gerenciar Familiares do Cliente</DialogTitle>
          </DialogHeader>
          {familiarClienteId && (
            <FamiliaresManager 
              clienteId={familiarClienteId}
              isNewCliente={false}
              setIsFamiliarDialogOpen={setIsFamiliarDialogOpen}
            />
          )}
        </DialogContent>
      </Dialog>
        </TabsContent>
        
        <TabsContent value="nps">
          <NPSManager />
        </TabsContent>
        
        <TabsContent value="aniversariantes">
          <DashboardAniversariantes />
        </TabsContent>
      </Tabs>
    </div>
  );
}
