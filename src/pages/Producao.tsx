import { useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Plus, Trash2, AlertCircle } from "lucide-react";
import { pt } from "date-fns/locale";
import { toast } from "sonner";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ExportImport } from "@/components/ExportImport";
import { HelpTooltip } from "@/components/HelpTooltip";

interface Order {
  id: string;
  orderNumber: number;
  client: string;
  product: string;
  quantity: number;
  status: string;
  deliveryDate: string;
  deliveryTime: string;
  produced?: boolean;
  packed?: boolean;
  ready?: boolean;
}

interface Task {
  id: string;
  text: string;
  completed: boolean;
  createdAt: string;
}

const Producao = () => {
  const [orders, setOrders] = useLocalStorage<Order[]>("orders", []);
  const [tasks, setTasks] = useLocalStorage<Task[]>("tasks", []);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [newTaskText, setNewTaskText] = useState("");

  const updateOrderCheckbox = (orderId: string, field: "produced" | "packed" | "ready", value: boolean) => {
    setOrders(orders.map(order => 
      order.id === orderId ? { ...order, [field]: value } : order
    ));
    toast.success("Status atualizado!");
  };

  const addTask = () => {
    if (newTaskText.trim()) {
      const newTask: Task = {
        id: Date.now().toString(),
        text: newTaskText,
        completed: false,
        createdAt: new Date().toISOString(),
      };
      setTasks([...tasks, newTask]);
      setNewTaskText("");
      toast.success("Tarefa adicionada!");
    }
  };

  const toggleTask = (taskId: string) => {
    setTasks(tasks.map(task =>
      task.id === taskId ? { ...task, completed: !task.completed } : task
    ));
  };

  const removeTask = (taskId: string) => {
    setTasks(tasks.filter(task => task.id !== taskId));
    toast.success("Tarefa removida!");
  };

  const getOrdersForDate = (date: Date | undefined) => {
    if (!date) return [];
    const dateStr = date.toISOString().split("T")[0];
    return orders
      .filter((order) => order.deliveryDate === dateStr && order.status !== "Entregue" && order.status !== "Cancelado")
      .sort((a, b) => (a.deliveryTime || "").localeCompare(b.deliveryTime || ""));
  };

  const selectedDateOrders = getOrdersForDate(selectedDate);

  const getDatesWithOrders = () => {
    return orders
      .filter(o => o.status !== "Entregue" && o.status !== "Cancelado")
      .map((order) => new Date(order.deliveryDate));
  };

  const modifiers = {
    hasOrders: getDatesWithOrders(),
  };

  const modifiersStyles = {
    hasOrders: {
      backgroundColor: "hsl(var(--primary) / 0.2)",
      color: "hsl(var(--primary))",
      fontWeight: "bold",
    },
  };

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const todayOrders = orders.filter(o => {
    const deliveryDate = new Date(o.deliveryDate);
    deliveryDate.setHours(0, 0, 0, 0);
    return deliveryDate.getTime() === today.getTime() && o.status !== "Entregue" && o.status !== "Cancelado";
  });

  const tomorrowOrders = orders.filter(o => {
    const deliveryDate = new Date(o.deliveryDate);
    deliveryDate.setHours(0, 0, 0, 0);
    return deliveryDate.getTime() === tomorrow.getTime() && o.status !== "Entregue" && o.status !== "Cancelado";
  });

  const upcomingAlerts = orders
    .filter(o => {
      const deliveryDate = new Date(o.deliveryDate);
      const daysUntil = Math.floor((deliveryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      return daysUntil >= 0 && daysUntil <= 2 && o.status !== "Entregue" && o.status !== "Cancelado" && !o.ready;
    })
    .sort((a, b) => new Date(a.deliveryDate).getTime() - new Date(b.deliveryDate).getTime())
    .slice(0, 3);

  const pendingTasks = tasks.filter(t => !t.completed);
  const completedTasks = tasks.filter(t => t.completed);

  const statusColors = {
    Pendente: "bg-yellow-100 text-yellow-800 border-yellow-200",
    Confirmado: "bg-blue-100 text-blue-800 border-blue-200",
    "Em Produção": "bg-purple-100 text-purple-800 border-purple-200",
    Pronto: "bg-green-100 text-green-800 border-green-200",
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <h1 className="text-3xl font-bold">Planejador de Produção</h1>
            <HelpTooltip content="Organize seu cronograma de produção com checklists por data. Marque cada etapa e acompanhe o progresso." />
          </div>
          <p className="text-muted-foreground">Organize seu cronograma de produção com checklists</p>
        </div>
        <ExportImport storageKey="tasks" dataLabel="Tarefas" />
      </div>

      {(todayOrders.length > 0 || tomorrowOrders.length > 0 || upcomingAlerts.length > 0) && (
        <div className="grid gap-4 md:grid-cols-3">
          {todayOrders.length > 0 && (
            <Alert className="border-info bg-info/5">
              <AlertCircle className="h-4 w-4 text-info" />
              <AlertDescription>
                <span className="font-semibold">{todayOrders.length}</span> entrega(s) para <span className="font-semibold">hoje</span>
              </AlertDescription>
            </Alert>
          )}
          {tomorrowOrders.length > 0 && (
            <Alert className="border-warning bg-warning/5">
              <AlertCircle className="h-4 w-4 text-warning" />
              <AlertDescription>
                <span className="font-semibold">{tomorrowOrders.length}</span> entrega(s) para <span className="font-semibold">amanhã</span>
              </AlertDescription>
            </Alert>
          )}
          {upcomingAlerts.map(order => {
            const deliveryDate = new Date(order.deliveryDate);
            const daysUntil = Math.floor((deliveryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
            return (
              <Alert key={order.id} className="border-primary bg-primary/5">
                <AlertCircle className="h-4 w-4 text-primary" />
                <AlertDescription>
                  Falta{daysUntil === 0 ? "m menos de 24h" : `m ${daysUntil} dia(s)`} para entrega de <span className="font-semibold">{order.product}</span>
                </AlertDescription>
              </Alert>
            );
          })}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="shadow-soft">
          <CardHeader>
            <CardTitle>Calendário</CardTitle>
          </CardHeader>
          <CardContent className="flex justify-center">
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={setSelectedDate}
              locale={pt}
              modifiers={modifiers}
              modifiersStyles={modifiersStyles}
              className="rounded-md border"
            />
          </CardContent>
        </Card>

        <Card className="lg:col-span-2 shadow-soft">
          <CardHeader>
            <CardTitle>
              Lista de Produção -{" "}
              {selectedDate?.toLocaleDateString("pt-BR", {
                day: "2-digit",
                month: "long",
                year: "numeric",
              })}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {selectedDateOrders.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">
                Nenhuma entrega agendada para esta data
              </p>
            ) : (
              <div className="space-y-4">
                {selectedDateOrders.map((order) => (
                  <div
                    key={order.id}
                    className="p-4 border border-border rounded-lg space-y-3"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-semibold">{order.product}</p>
                          <span className="text-xs text-muted-foreground">#{order.orderNumber}</span>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                          {order.client} • {order.quantity} unidade(s)
                        </p>
                        {order.deliveryTime && (
                          <p className="text-sm text-primary font-medium mt-1">
                            Horário: {order.deliveryTime}
                          </p>
                        )}
                      </div>
                      <Badge className={statusColors[order.status as keyof typeof statusColors] || "bg-gray-100 text-gray-800 border-gray-200"} variant="outline">
                        {order.status}
                      </Badge>
                    </div>

                    <div className="flex flex-col gap-2 pt-2 border-t">
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id={`produced-${order.id}`}
                          checked={order.produced || false}
                          onCheckedChange={(checked) =>
                            updateOrderCheckbox(order.id, "produced", checked as boolean)
                          }
                        />
                        <label
                          htmlFor={`produced-${order.id}`}
                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                        >
                          ✓ Produzido
                        </label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id={`packed-${order.id}`}
                          checked={order.packed || false}
                          onCheckedChange={(checked) =>
                            updateOrderCheckbox(order.id, "packed", checked as boolean)
                          }
                        />
                        <label
                          htmlFor={`packed-${order.id}`}
                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                        >
                          ✓ Embalado
                        </label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id={`ready-${order.id}`}
                          checked={order.ready || false}
                          onCheckedChange={(checked) =>
                            updateOrderCheckbox(order.id, "ready", checked as boolean)
                          }
                        />
                        <label
                          htmlFor={`ready-${order.id}`}
                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                        >
                          ✓ Pronto para entrega
                        </label>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-soft">
        <CardHeader>
          <CardTitle>Checklist de Tarefas do Dia</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              placeholder="Adicionar nova tarefa..."
              value={newTaskText}
              onChange={(e) => setNewTaskText(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === "Enter") {
                  addTask();
                }
              }}
            />
            <Button onClick={addTask}>
              <Plus className="h-4 w-4 mr-2" />
              Adicionar
            </Button>
          </div>

          {tasks.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              Nenhuma tarefa criada ainda
            </p>
          ) : (
            <div className="space-y-4">
              {pendingTasks.length > 0 && (
                <div className="space-y-2">
                  <h3 className="text-sm font-semibold text-muted-foreground uppercase">
                    Pendentes ({pendingTasks.length})
                  </h3>
                  {pendingTasks.map((task) => (
                    <div
                      key={task.id}
                      className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                    >
                      <div className="flex items-center space-x-3 flex-1">
                        <Checkbox
                          id={`task-${task.id}`}
                          checked={task.completed}
                          onCheckedChange={() => toggleTask(task.id)}
                        />
                        <label
                          htmlFor={`task-${task.id}`}
                          className="text-sm cursor-pointer flex-1"
                        >
                          {task.text}
                        </label>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeTask(task.id)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}

              {completedTasks.length > 0 && (
                <div className="space-y-2">
                  <h3 className="text-sm font-semibold text-muted-foreground uppercase">
                    Concluídas ({completedTasks.length})
                  </h3>
                  {completedTasks.map((task) => (
                    <div
                      key={task.id}
                      className="flex items-center justify-between p-3 bg-success/5 border border-success/20 rounded-lg"
                    >
                      <div className="flex items-center space-x-3 flex-1">
                        <Checkbox
                          id={`task-${task.id}`}
                          checked={task.completed}
                          onCheckedChange={() => toggleTask(task.id)}
                        />
                        <label
                          htmlFor={`task-${task.id}`}
                          className="text-sm cursor-pointer flex-1 line-through text-muted-foreground"
                        >
                          {task.text}
                        </label>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeTask(task.id)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Producao;
