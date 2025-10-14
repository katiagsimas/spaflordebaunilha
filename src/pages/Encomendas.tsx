import { useState, useMemo } from "react";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Pencil, Trash2, Search, ShoppingBag, DollarSign, Clock, CalendarCheck, Package } from "lucide-react";
import { useEncomendas } from "@/hooks/useEncomendas";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { ClienteAutocomplete } from "@/components/ClienteAutocomplete";
import { useClientes } from "@/hooks/useClientes";
import { useReceitas } from "@/hooks/useReceitas";
import { useEncomendaItens } from "@/hooks/useEncomendaItens";
import { useUnidadesMedida } from "@/hooks/useUnidadesMedida";

const statusColors = {
  pendente: "bg-yellow-100 text-yellow-800 border-yellow-200",
  confirmado: "bg-blue-100 text-blue-800 border-blue-200",
  em_producao: "bg-purple-100 text-purple-800 border-purple-200",
  pronto: "bg-green-100 text-green-800 border-green-200",
  entregue: "bg-gray-100 text-gray-800 border-gray-200",
  cancelado: "bg-red-100 text-red-800 border-red-200",
};

const statusLabels = {
  pendente: "Pendente",
  confirmado: "Confirmado",
  em_producao: "Em Produção",
  pronto: "Pronto",
  entregue: "Entregue",
  cancelado: "Cancelado",
};

const Encomendas = () => {
  const { encomendas, loading, createEncomenda, updateEncomenda, deleteEncomenda } = useEncomendas();
  const { clientes } = useClientes();
  const { receitas } = useReceitas();
  const { unidades } = useUnidadesMedida();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [produtoDialogOpen, setProdutoDialogOpen] = useState(false);
  const [editingOrder, setEditingOrder] = useState<any | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("Todos");
  const [tempProdutos, setTempProdutos] = useState<Array<{
    id: string;
    receita_id: string;
    produto: string;
    quantidade: number;
    unidade_medida: string;
    valor_unitario: number;
    subtotal: number;
  }>>([]);
  
  const [formData, setFormData] = useState({
    cliente: "",
    data_pedido: new Date().toISOString().split("T")[0],
    data_entrega: "",
    hora_entrega: "",
    status: "pendente",
    valor: 0,
    observacoes: "",
    telefone: "",
    endereco: "",
    numero: "",
    cep: "",
  });

  const [produtoForm, setProdutoForm] = useState({
    receita_id: "",
    produto: "",
    quantidade: "",
    unidade_medida: "",
    valor_unitario: 0,
  });

  const { itens: produtosEncomenda, createItem, deleteItem } = useEncomendaItens(editingOrder?.id || null);

  // Usar produtos temporários quando criando nova encomenda, ou produtos salvos quando editando
  const produtosExibidos = editingOrder ? produtosEncomenda : tempProdutos;

  const valorTotalProdutos = useMemo(() => {
    return produtosExibidos.reduce((total, item) => total + item.subtotal, 0);
  }, [produtosExibidos]);

  const resetForm = () => {
    setFormData({
      cliente: "",
      data_pedido: new Date().toISOString().split("T")[0],
      data_entrega: "",
      hora_entrega: "",
      status: "pendente",
      valor: 0,
      observacoes: "",
      telefone: "",
      endereco: "",
      numero: "",
      cep: "",
    });
    setEditingOrder(null);
    setTempProdutos([]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (editingOrder) {
        await updateEncomenda(editingOrder.id, formData);
      } else {
        const novaEncomenda = await createEncomenda(formData);
        
        // Salvar produtos temporários na encomenda criada
        if (tempProdutos.length > 0 && novaEncomenda) {
          for (const produto of tempProdutos) {
            await createItem({
              encomenda_id: novaEncomenda.id,
              receita_id: produto.receita_id,
              produto: produto.produto,
              quantidade: produto.quantidade,
              unidade_medida: produto.unidade_medida,
              valor_unitario: produto.valor_unitario,
              subtotal: produto.subtotal,
            });
          }
        }
      }
      setDialogOpen(false);
      resetForm();
    } catch (error: any) {
      toast.error(error.message || "Erro ao salvar encomenda");
    }
  };

  const handleEdit = (encomenda: any) => {
    setEditingOrder(encomenda);
    setFormData({
      cliente: encomenda.cliente,
      data_pedido: encomenda.data_pedido,
      data_entrega: encomenda.data_entrega,
      hora_entrega: encomenda.hora_entrega || "",
      status: encomenda.status,
      valor: encomenda.valor,
      observacoes: encomenda.observacoes || "",
      telefone: encomenda.telefone || "",
      endereco: encomenda.endereco || "",
      numero: encomenda.numero || "",
      cep: encomenda.cep || "",
    });
    setDialogOpen(true);
  };

  const handleClienteSelect = (clienteNome: string) => {
    const cliente = clientes.find(c => c.nome === clienteNome);
    if (cliente) {
      setFormData({
        ...formData,
        cliente: clienteNome,
        telefone: cliente.telefone || "",
        endereco: cliente.endereco || "",
        numero: cliente.numero || "",
        cep: cliente.cep || "",
      });
    } else {
      setFormData({ ...formData, cliente: clienteNome });
    }
  };

  const handleProdutoSelect = (receitaId: string) => {
    const receita = receitas.find(r => r.id === receitaId);
    if (receita) {
      console.log("Receita selecionada:", receita);
      console.log("unidadeRendimento da receita:", receita.unidadeRendimento);
      console.log("Unidades disponíveis:", unidades);
      
      // Buscar a unidade de medida pelo ID
      const unidade = unidades.find(u => u.id === receita.unidadeRendimento);
      console.log("Unidade encontrada por ID:", unidade);
      
      // Se não encontrar pelo ID, tentar buscar pela sigla (para compatibilidade com dados antigos)
      const unidadePorSigla = !unidade ? unidades.find(u => u.sigla === receita.unidadeRendimento) : null;
      console.log("Unidade encontrada por sigla:", unidadePorSigla);
      
      const unidadeTexto = unidade?.sigla || unidadePorSigla?.sigla || receita.unidadeRendimento;
      console.log("Unidade de medida final:", unidadeTexto);
      
      setProdutoForm({
        receita_id: receitaId,
        produto: receita.nome,
        quantidade: "",
        unidade_medida: unidadeTexto,
        valor_unitario: receita.valorVenda || 0,
      });
    }
  };

  const handleAddProduto = async () => {
    if (!produtoForm.receita_id || !produtoForm.quantidade) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }

    const quantidade = parseFloat(produtoForm.quantidade);
    const subtotal = quantidade * produtoForm.valor_unitario;

    if (editingOrder) {
      // Se está editando, salvar direto no banco
      try {
        await createItem({
          encomenda_id: editingOrder.id,
          receita_id: produtoForm.receita_id,
          produto: produtoForm.produto,
          quantidade,
          unidade_medida: produtoForm.unidade_medida,
          valor_unitario: produtoForm.valor_unitario,
          subtotal,
        });
      } catch (error: any) {
        toast.error(error.message || "Erro ao adicionar produto");
        return;
      }
    } else {
      // Se está criando nova encomenda, adicionar em memória
      const novoProduto = {
        id: Math.random().toString(36).substr(2, 9),
        receita_id: produtoForm.receita_id,
        produto: produtoForm.produto,
        quantidade,
        unidade_medida: produtoForm.unidade_medida,
        valor_unitario: produtoForm.valor_unitario,
        subtotal,
      };
      setTempProdutos([...tempProdutos, novoProduto]);
      toast.success("Produto adicionado!");
    }

    setProdutoForm({
      receita_id: "",
      produto: "",
      quantidade: "",
      unidade_medida: "",
      valor_unitario: 0,
    });
    setProdutoDialogOpen(false);
  };

  const handleRemoveProduto = async (itemId: string) => {
    if (confirm("Tem certeza que deseja remover este produto?")) {
      if (editingOrder) {
        // Se está editando, deletar do banco
        try {
          await deleteItem(itemId);
        } catch (error: any) {
          toast.error(error.message || "Erro ao remover produto");
        }
      } else {
        // Se está criando, remover da lista temporária
        setTempProdutos(tempProdutos.filter(p => p.id !== itemId));
        toast.success("Produto removido!");
      }
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm("Tem certeza que deseja excluir esta encomenda?")) {
      try {
        await deleteEncomenda(id);
      } catch (error: any) {
        toast.error(error.message || "Erro ao excluir encomenda");
      }
    }
  };

  const filteredOrders = encomendas
    .filter(e => {
      const matchesSearch = e.cliente.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === "Todos" || e.status === statusFilter.toLowerCase().replace(" ", "_");
      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => new Date(b.created_at || "").getTime() - new Date(a.created_at || "").getTime());

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const weekFromNow = new Date(today);
  weekFromNow.setDate(weekFromNow.getDate() + 7);

  const todayOrders = encomendas.filter(e => {
    const deliveryDate = new Date(e.data_entrega);
    return deliveryDate.getTime() === today.getTime() && e.status !== "entregue" && e.status !== "cancelado";
  }).length;

  const weekOrders = encomendas.filter(e => {
    const deliveryDate = new Date(e.data_entrega);
    return deliveryDate >= today && deliveryDate <= weekFromNow && e.status !== "entregue" && e.status !== "cancelado";
  }).length;

  const totalReceivable = encomendas.filter(e => e.status !== "entregue" && e.status !== "cancelado")
    .reduce((sum, e) => sum + e.valor, 0);

  const stats = [
    {
      title: "Total de Encomendas",
      value: encomendas.length,
      icon: ShoppingBag,
      color: "text-primary",
      bgColor: "bg-primary/10",
    },
    {
      title: "Entregas Hoje",
      value: todayOrders,
      icon: CalendarCheck,
      color: "text-info",
      bgColor: "bg-info/10",
    },
    {
      title: "Entregas na Semana",
      value: weekOrders,
      icon: Clock,
      color: "text-warning",
      bgColor: "bg-warning/10",
    },
    {
      title: "Valor a Receber",
      value: `R$ ${totalReceivable.toFixed(2)}`,
      icon: DollarSign,
      color: "text-success",
      bgColor: "bg-success/10",
    },
  ];

  return (
    <div className="space-y-8">
      <PageHeader
        title="Gestor de Encomendas"
        description="Controle completo de pedidos do cliente até a entrega"
        actions={
          <Dialog open={dialogOpen} onOpenChange={(open) => {
            setDialogOpen(open);
            if (!open) resetForm();
          }}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Nova Encomenda
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {editingOrder ? "Editar Encomenda" : "Nova Encomenda"}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="cliente">Nome do Cliente *</Label>
                    <ClienteAutocomplete
                      value={formData.cliente}
                      onSelect={handleClienteSelect}
                      placeholder="Selecione ou busque um cliente..."
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="telefone">Telefone/WhatsApp</Label>
                    <Input
                      id="telefone"
                      type="text"
                      value={formData.telefone}
                      onChange={(e) =>
                        setFormData({ ...formData, telefone: e.target.value })
                      }
                    />
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-3">
                  <div className="space-y-2">
                    <Label htmlFor="endereco">Endereço</Label>
                    <Input
                      id="endereco"
                      type="text"
                      value={formData.endereco}
                      onChange={(e) =>
                        setFormData({ ...formData, endereco: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="numero">Número</Label>
                    <Input
                      id="numero"
                      type="text"
                      value={formData.numero}
                      onChange={(e) =>
                        setFormData({ ...formData, numero: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="cep">CEP</Label>
                    <Input
                      id="cep"
                      type="text"
                      value={formData.cep}
                      onChange={(e) =>
                        setFormData({ ...formData, cep: e.target.value })
                      }
                    />
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="data_pedido">Data do Pedido *</Label>
                    <Input
                      id="data_pedido"
                      type="date"
                      required
                      value={formData.data_pedido}
                      onChange={(e) =>
                        setFormData({ ...formData, data_pedido: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="status">Status</Label>
                    <Select
                      value={formData.status}
                      onValueChange={(value) =>
                        setFormData({ ...formData, status: value })
                      }
                    >
                      <SelectTrigger className="bg-popover">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-popover z-50">
                        <SelectItem value="pendente">Pendente</SelectItem>
                        <SelectItem value="confirmado">Confirmado</SelectItem>
                        <SelectItem value="em_producao">Em Produção</SelectItem>
                        <SelectItem value="pronto">Pronto</SelectItem>
                        <SelectItem value="entregue">Entregue</SelectItem>
                        <SelectItem value="cancelado">Cancelado</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="data_entrega">Data de Entrega *</Label>
                    <Input
                      id="data_entrega"
                      type="date"
                      required
                      value={formData.data_entrega}
                      onChange={(e) =>
                        setFormData({ ...formData, data_entrega: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="hora_entrega">Hora da Entrega</Label>
                    <Input
                      id="hora_entrega"
                      type="time"
                      value={formData.hora_entrega}
                      onChange={(e) =>
                        setFormData({ ...formData, hora_entrega: e.target.value })
                      }
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label>Produtos da Encomenda</Label>
                    <Dialog open={produtoDialogOpen} onOpenChange={setProdutoDialogOpen}>
                      <DialogTrigger asChild>
                        <Button type="button" variant="outline" size="sm">
                          <Plus className="h-4 w-4 mr-2" />
                          Adicionar Produtos
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-2xl">
                        <DialogHeader>
                          <DialogTitle>Adicionar Produto</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div className="space-y-2">
                            <Label htmlFor="produto-select">Produto *</Label>
                            <Select
                              value={produtoForm.receita_id}
                              onValueChange={handleProdutoSelect}
                            >
                              <SelectTrigger className="bg-popover">
                                <SelectValue placeholder="Selecione um produto..." />
                              </SelectTrigger>
                              <SelectContent className="bg-popover z-50">
                                {receitas.map((receita) => (
                                  <SelectItem key={receita.id} value={receita.id}>
                                    {receita.nome}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>

                          <div className="grid gap-4 md:grid-cols-2">
                            <div className="space-y-2">
                              <Label htmlFor="quantidade">Quantidade *</Label>
                              <Input
                                id="quantidade"
                                type="number"
                                step="0.01"
                                min="0"
                                value={produtoForm.quantidade}
                                onChange={(e) =>
                                  setProdutoForm({ ...produtoForm, quantidade: e.target.value })
                                }
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="unidade-medida">Unidade de Medida</Label>
                              <Input
                                id="unidade-medida"
                                type="text"
                                disabled
                                value={produtoForm.unidade_medida || "Selecione um produto"}
                                className="bg-muted"
                              />
                            </div>
                          </div>

                          <div className="grid gap-4 md:grid-cols-2">
                            <div className="space-y-2">
                              <Label htmlFor="valor-unitario">Valor Unitário (R$)</Label>
                              <Input
                                id="valor-unitario"
                                type="number"
                                step="0.01"
                                min="0"
                                value={produtoForm.valor_unitario}
                                onChange={(e) =>
                                  setProdutoForm({ ...produtoForm, valor_unitario: Number(e.target.value) })
                                }
                              />
                            </div>
                            <div className="space-y-2">
                              <Label>Subtotal</Label>
                              <Input
                                type="text"
                                disabled
                                value={`R$ ${(parseFloat(produtoForm.quantidade || "0") * produtoForm.valor_unitario).toFixed(2)}`}
                              />
                            </div>
                          </div>

                          <div className="flex gap-2 justify-end">
                            <Button
                              type="button"
                              variant="outline"
                              onClick={() => setProdutoDialogOpen(false)}
                            >
                              Cancelar
                            </Button>
                            <Button type="button" onClick={handleAddProduto}>
                              Adicionar
                            </Button>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>

                  {produtosExibidos.length > 0 && (
                    <div className="border rounded-lg">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Produto</TableHead>
                            <TableHead className="text-right">Qtd</TableHead>
                            <TableHead className="text-center">Un.</TableHead>
                            <TableHead className="text-right">Valor Unit.</TableHead>
                            <TableHead className="text-right">Subtotal</TableHead>
                            <TableHead className="text-center">Ações</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {produtosExibidos.map((item) => (
                            <TableRow key={item.id}>
                              <TableCell>{item.produto}</TableCell>
                              <TableCell className="text-right">{item.quantidade}</TableCell>
                              <TableCell className="text-center">{item.unidade_medida}</TableCell>
                              <TableCell className="text-right">R$ {item.valor_unitario.toFixed(2)}</TableCell>
                              <TableCell className="text-right">R$ {item.subtotal.toFixed(2)}</TableCell>
                              <TableCell className="text-center">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleRemoveProduto(item.id)}
                                >
                                  <Trash2 className="h-4 w-4 text-destructive" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                          <TableRow>
                            <TableCell colSpan={4} className="text-right font-bold">Total:</TableCell>
                            <TableCell className="text-right font-bold">R$ {valorTotalProdutos.toFixed(2)}</TableCell>
                            <TableCell></TableCell>
                          </TableRow>
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="valor">Valor Total (R$) *</Label>
                  <Input
                    id="valor"
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={formData.valor || ""}
                    onChange={(e) =>
                      setFormData({ ...formData, valor: Number(e.target.value) })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="observacoes">Observações</Label>
                  <Textarea
                    id="observacoes"
                    rows={3}
                    value={formData.observacoes}
                    onChange={(e) =>
                      setFormData({ ...formData, observacoes: e.target.value })
                    }
                  />
                </div>

                <div className="flex gap-2 justify-end">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setDialogOpen(false);
                      resetForm();
                    }}
                  >
                    Cancelar
                  </Button>
                  <Button type="submit">
                    {editingOrder ? "Salvar Alterações" : "Criar Encomenda"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        }
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Card 
              key={stat.title} 
              className="p-4 border-l-4 border-l-[#D89B8C] hover:shadow-lg transition-shadow"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-[#9C8B82]">{stat.title}</p>
                  <div className={`${stat.bgColor} p-2 rounded-lg`}>
                    <Icon className={`h-4 w-4 ${stat.color}`} />
                  </div>
                </div>
                <p className="text-2xl font-bold text-[#6B5047]">{stat.value}</p>
              </div>
            </Card>
          );
        })}
      </div>

      <Card className="shadow-soft">
        <CardHeader>
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <CardTitle>Lista de Encomendas</CardTitle>
            <div className="flex flex-col gap-2 sm:flex-row">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por cliente..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 w-full sm:w-64"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-40 bg-popover">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-popover z-50">
                  <SelectItem value="Todos">Todos</SelectItem>
                  <SelectItem value="Pendente">Pendente</SelectItem>
                  <SelectItem value="Confirmado">Confirmado</SelectItem>
                  <SelectItem value="Em Produção">Em Produção</SelectItem>
                  <SelectItem value="Pronto">Pronto</SelectItem>
                  <SelectItem value="Entregue">Entregue</SelectItem>
                  <SelectItem value="Cancelado">Cancelado</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredOrders.length === 0 ? (
            <div className="text-center py-12">
              <ShoppingBag className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">
                {searchTerm || statusFilter !== "Todos" 
                  ? "Nenhuma encomenda encontrada com os filtros aplicados"
                  : "Nenhuma encomenda cadastrada"}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Data Pedido</TableHead>
                    <TableHead>Data Entrega</TableHead>
                    <TableHead>Valor</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredOrders.map((encomenda) => (
                    <TableRow key={encomenda.id}>
                      <TableCell className="font-medium">{encomenda.cliente}</TableCell>
                      <TableCell>
                        <Badge className={statusColors[encomenda.status as keyof typeof statusColors]} variant="outline">
                          {statusLabels[encomenda.status as keyof typeof statusLabels]}
                        </Badge>
                      </TableCell>
                      <TableCell>{new Date(encomenda.data_pedido).toLocaleDateString("pt-BR")}</TableCell>
                      <TableCell>{new Date(encomenda.data_entrega).toLocaleDateString("pt-BR")}</TableCell>
                      <TableCell>R$ {encomenda.valor.toFixed(2)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex gap-1 justify-end">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEdit(encomenda)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(encomenda.id)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Encomendas;
