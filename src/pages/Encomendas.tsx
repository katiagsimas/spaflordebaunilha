import { useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Pencil, Trash2, Search, ShoppingBag, DollarSign, Clock, CalendarCheck } from "lucide-react";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { ExportImport } from "@/components/ExportImport";
import { HelpTooltip } from "@/components/HelpTooltip";

interface Order {
  id: string;
  orderNumber: number;
  client: string;
  phone: string;
  product: string;
  quantity: number;
  total: number;
  downPayment: number;
  balance: number;
  status: "Pendente" | "Confirmado" | "Em Produção" | "Pronto" | "Entregue" | "Cancelado";
  orderDate: string;
  deliveryDate: string;
  deliveryTime: string;
  address: string;
  notes: string;
  createdAt: string;
}

const statusColors = {
  Pendente: "bg-yellow-100 text-yellow-800 border-yellow-200",
  Confirmado: "bg-blue-100 text-blue-800 border-blue-200",
  "Em Produção": "bg-purple-100 text-purple-800 border-purple-200",
  Pronto: "bg-green-100 text-green-800 border-green-200",
  Entregue: "bg-gray-100 text-gray-800 border-gray-200",
  Cancelado: "bg-red-100 text-red-800 border-red-200",
};

const Encomendas = () => {
  const [orders, setOrders] = useLocalStorage<Order[]>("orders", []);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("Todos");
  
  const [formData, setFormData] = useState({
    client: "",
    phone: "",
    product: "",
    quantity: 1,
    total: 0,
    downPayment: 0,
    status: "Pendente" as Order["status"],
    orderDate: new Date().toISOString().split("T")[0],
    deliveryDate: "",
    deliveryTime: "",
    address: "",
    notes: "",
  });

  const getNextOrderNumber = () => {
    if (orders.length === 0) return 1;
    return Math.max(...orders.map(o => o.orderNumber)) + 1;
  };

  const resetForm = () => {
    setFormData({
      client: "",
      phone: "",
      product: "",
      quantity: 1,
      total: 0,
      downPayment: 0,
      status: "Pendente",
      orderDate: new Date().toISOString().split("T")[0],
      deliveryDate: "",
      deliveryTime: "",
      address: "",
      notes: "",
    });
    setEditingOrder(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const balance = formData.total - formData.downPayment;
    
    if (editingOrder) {
      setOrders(
        orders.map((order) =>
          order.id === editingOrder.id
            ? { 
                ...order,
                ...formData,
                balance,
              }
            : order
        )
      );
      toast.success("Encomenda atualizada!");
    } else {
      const newOrder: Order = {
        id: Date.now().toString(),
        orderNumber: getNextOrderNumber(),
        ...formData,
        balance,
        createdAt: new Date().toISOString(),
      };
      setOrders([...orders, newOrder]);
      toast.success("Encomenda criada com sucesso!");
    }
    
    setDialogOpen(false);
    resetForm();
  };

  const handleEdit = (order: Order) => {
    setEditingOrder(order);
    setFormData({
      client: order.client,
      phone: order.phone,
      product: order.product,
      quantity: order.quantity,
      total: order.total,
      downPayment: order.downPayment,
      status: order.status,
      orderDate: order.orderDate,
      deliveryDate: order.deliveryDate,
      deliveryTime: order.deliveryTime,
      address: order.address,
      notes: order.notes,
    });
    setDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm("Tem certeza que deseja excluir esta encomenda?")) {
      setOrders(orders.filter((order) => order.id !== id));
      toast.success("Encomenda excluída!");
    }
  };

  const filteredOrders = orders
    .filter(o => {
      const matchesSearch = o.client.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          o.product.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          o.orderNumber.toString().includes(searchTerm);
      const matchesStatus = statusFilter === "Todos" || o.status === statusFilter;
      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const weekFromNow = new Date(today);
  weekFromNow.setDate(weekFromNow.getDate() + 7);

  const todayOrders = orders.filter(o => {
    const deliveryDate = new Date(o.deliveryDate);
    return deliveryDate.getTime() === today.getTime() && o.status !== "Entregue" && o.status !== "Cancelado";
  }).length;

  const weekOrders = orders.filter(o => {
    const deliveryDate = new Date(o.deliveryDate);
    return deliveryDate >= today && deliveryDate <= weekFromNow && o.status !== "Entregue" && o.status !== "Cancelado";
  }).length;

  const totalReceivable = orders.filter(o => o.status !== "Entregue" && o.status !== "Cancelado")
    .reduce((sum, o) => sum + o.balance, 0);

  const stats = [
    {
      title: "Total de Encomendas",
      value: orders.length,
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
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <h1 className="text-3xl font-bold">Gestor de Encomendas</h1>
            <HelpTooltip content="Gerencie todas as suas encomendas do pedido até a entrega. Acompanhe status, pagamentos e organize entregas." />
          </div>
          <p className="text-muted-foreground">Controle completo de pedidos do cliente até a entrega</p>
        </div>
        <div className="flex gap-2">
          <ExportImport storageKey="orders" dataLabel="Encomendas" />
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
                  {editingOrder ? `Editar Encomenda #${editingOrder.orderNumber}` : "Nova Encomenda"}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="client">Nome do Cliente *</Label>
                    <Input
                      id="client"
                      required
                      value={formData.client}
                      onChange={(e) =>
                        setFormData({ ...formData, client: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Telefone/WhatsApp</Label>
                    <Input
                      id="phone"
                      type="tel"
                      value={formData.phone}
                      onChange={(e) =>
                        setFormData({ ...formData, phone: e.target.value })
                      }
                    />
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="product">Produto Encomendado *</Label>
                    <Input
                      id="product"
                      required
                      value={formData.product}
                      onChange={(e) =>
                        setFormData({ ...formData, product: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="quantity">Quantidade *</Label>
                    <Input
                      id="quantity"
                      type="number"
                      min="1"
                      required
                      value={formData.quantity}
                      onChange={(e) =>
                        setFormData({ ...formData, quantity: Number(e.target.value) })
                      }
                    />
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="orderDate">Data do Pedido *</Label>
                    <Input
                      id="orderDate"
                      type="date"
                      required
                      value={formData.orderDate}
                      onChange={(e) =>
                        setFormData({ ...formData, orderDate: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="status">Status</Label>
                    <Select
                      value={formData.status}
                      onValueChange={(value) =>
                        setFormData({ ...formData, status: value as Order["status"] })
                      }
                    >
                      <SelectTrigger className="bg-popover">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-popover z-50">
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

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="deliveryDate">Data de Entrega *</Label>
                    <Input
                      id="deliveryDate"
                      type="date"
                      required
                      value={formData.deliveryDate}
                      onChange={(e) =>
                        setFormData({ ...formData, deliveryDate: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="deliveryTime">Hora de Entrega</Label>
                    <Input
                      id="deliveryTime"
                      type="time"
                      value={formData.deliveryTime}
                      onChange={(e) =>
                        setFormData({ ...formData, deliveryTime: e.target.value })
                      }
                    />
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-3">
                  <div className="space-y-2">
                    <Label htmlFor="total">Valor Total (R$) *</Label>
                    <Input
                      id="total"
                      type="number"
                      step="0.01"
                      min="0"
                      required
                      value={formData.total || ""}
                      onChange={(e) =>
                        setFormData({ ...formData, total: Number(e.target.value) })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="downPayment">Valor de Entrada (R$)</Label>
                    <Input
                      id="downPayment"
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.downPayment || ""}
                      onChange={(e) =>
                        setFormData({ ...formData, downPayment: Number(e.target.value) })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Saldo Restante</Label>
                    <div className="h-10 px-3 py-2 rounded-md border bg-muted flex items-center">
                      <span className="font-semibold text-primary">
                        R$ {(formData.total - formData.downPayment).toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="address">Endereço de Entrega</Label>
                  <Input
                    id="address"
                    value={formData.address}
                    onChange={(e) =>
                      setFormData({ ...formData, address: e.target.value })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notes">Observações</Label>
                  <Textarea
                    id="notes"
                    rows={3}
                    value={formData.notes}
                    onChange={(e) =>
                      setFormData({ ...formData, notes: e.target.value })
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
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.title} className="shadow-soft">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {stat.title}
                </CardTitle>
                <div className={`${stat.bgColor} p-2 rounded-lg`}>
                  <Icon className={`h-4 w-4 ${stat.color}`} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
              </CardContent>
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
                  placeholder="Buscar por cliente ou produto..."
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
              <p className="text-muted-foreground mb-4">Nenhuma encomenda encontrada</p>
              <Button onClick={() => setDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Criar Primeira Encomenda
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-16">Nº</TableHead>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Produto</TableHead>
                    <TableHead>Data Entrega</TableHead>
                    <TableHead className="text-right">Valor</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredOrders.map((order) => (
                    <TableRow key={order.id}>
                      <TableCell className="font-medium">#{order.orderNumber}</TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{order.client}</p>
                          {order.phone && (
                            <p className="text-xs text-muted-foreground">{order.phone}</p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p>{order.product}</p>
                          <p className="text-xs text-muted-foreground">Qtd: {order.quantity}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p>{new Date(order.deliveryDate).toLocaleDateString("pt-BR")}</p>
                          {order.deliveryTime && (
                            <p className="text-xs text-muted-foreground">{order.deliveryTime}</p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div>
                          <p className="font-semibold">R$ {order.total.toFixed(2)}</p>
                          {order.balance > 0 && (
                            <p className="text-xs text-warning">Falta: R$ {order.balance.toFixed(2)}</p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={statusColors[order.status]} variant="outline">
                          {order.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex gap-1 justify-end">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEdit(order)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(order.id)}
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
