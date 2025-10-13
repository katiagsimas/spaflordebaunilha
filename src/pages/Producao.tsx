import { useState, useEffect } from "react";
import { PageHeader } from "@/components/PageHeader";
import { MiniCalendar } from "@/components/MiniCalendar";
import { ProductionCard } from "@/components/ProductionCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { 
  CalendarClock, 
  AlertCircle, 
  CheckSquare, 
  Trash2, 
  CheckCircle,
  CalendarDays,
  ChevronDown
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface Order {
  id: string;
  orderNumber: number;
  client: string;
  phone?: string;
  product: string;
  quantity: number;
  status: string;
  deliveryDate: string;
  deliveryTime: string;
  totalValue?: number;
  remainingBalance?: number;
  observations?: string;
  producao?: {
    iniciada: boolean;
    pronta: boolean;
    embalada: boolean;
    prontoEntrega: boolean;
  };
}

interface Task {
  id: string;
  descricao: string;
  concluida: boolean;
  data: string;
  createdAt: string;
}

export default function Producao() {
  const [orders] = useLocalStorage<Order[]>("orders", []);
  const [tasks, setTasks] = useLocalStorage<Task[]>("producao_tasks", []);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [newTaskText, setNewTaskText] = useState("");
  const [showCompleted, setShowCompleted] = useState(false);

  // Atualizar checklist de uma encomenda
  const updateOrderChecklist = (orderId: string, checklist: any) => {
    // Esta função será implementada quando integrarmos com o sistema de encomendas
    toast.success("Checklist atualizado!");
  };

  // Marcar como entregue
  const markAsDelivered = (orderId: string) => {
    toast.success("Encomenda marcada como entregue!");
  };

  // Funções de tarefas
  const addTask = () => {
    if (!newTaskText.trim()) return;
    
    const newTask: Task = {
      id: Date.now().toString(),
      descricao: newTaskText,
      concluida: false,
      data: new Date().toISOString().split('T')[0],
      createdAt: new Date().toISOString()
    };
    
    setTasks([...tasks, newTask]);
    setNewTaskText("");
    toast.success("✓ Tarefa adicionada");
  };

  const toggleTask = (taskId: string) => {
    setTasks(tasks.map(t => 
      t.id === taskId ? { ...t, concluida: !t.concluida } : t
    ));
  };

  const removeTask = (taskId: string) => {
    setTasks(tasks.filter(t => t.id !== taskId));
    toast.success("Tarefa removida");
  };

  const clearCompletedTasks = () => {
    setTasks(tasks.filter(t => !t.concluida));
    toast.success("Tarefas concluídas removidas");
  };

  // Limpar tarefas antigas automaticamente (> 7 dias)
  useEffect(() => {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const cutoffDate = sevenDaysAgo.toISOString().split('T')[0];
    
    const filteredTasks = tasks.filter(t => 
      !t.concluida || t.data >= cutoffDate
    );
    
    if (filteredTasks.length < tasks.length) {
      setTasks(filteredTasks);
    }
  }, []);

  // Filtrar encomendas por data
  const getOrdersForDate = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0];
    return orders.filter(o => 
      o.deliveryDate === dateStr && 
      o.status !== "Entregue" && 
      o.status !== "Cancelado"
    ).sort((a, b) => (a.deliveryTime || "").localeCompare(b.deliveryTime || ""));
  };

  const selectedDateOrders = getOrdersForDate(selectedDate);

  // Gerar mapa de datas com encomendas
  const getDatesWithOrders = () => {
    const datesMap: Record<string, { count: number; status: string }> = {};
    
    orders.filter(o => o.status !== "Entregue" && o.status !== "Cancelado")
      .forEach(order => {
        if (!datesMap[order.deliveryDate]) {
          datesMap[order.deliveryDate] = { count: 0, status: 'pronto' };
        }
        datesMap[order.deliveryDate].count++;
        
        // Determinar status pior
        if (order.status.toLowerCase() === 'pendente') {
          datesMap[order.deliveryDate].status = 'pendente';
        } else if (order.status.toLowerCase() === 'em produção' && datesMap[order.deliveryDate].status !== 'pendente') {
          datesMap[order.deliveryDate].status = 'producao';
        }
      });
    
    return datesMap;
  };

  const datesWithOrders = getDatesWithOrders();

  // Alertas
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const todayOrders = orders.filter(o => {
    const deliveryDate = new Date(o.deliveryDate + 'T00:00:00');
    deliveryDate.setHours(0, 0, 0, 0);
    return deliveryDate.getTime() === today.getTime() && 
      o.status !== "Entregue" && 
      o.status !== "Cancelado";
  });

  const tomorrowOrders = orders.filter(o => {
    const deliveryDate = new Date(o.deliveryDate + 'T00:00:00');
    deliveryDate.setHours(0, 0, 0, 0);
    return deliveryDate.getTime() === tomorrow.getTime() && 
      o.status !== "Entregue" && 
      o.status !== "Cancelado";
  });

  const pendingSaldos = todayOrders.reduce((acc, o) => acc + (o.remainingBalance || 0), 0);

  const pendingTasks = tasks.filter(t => !t.concluida);
  const completedTasks = tasks.filter(t => t.concluida);

  // Resumo da semana
  const getWeekRange = () => {
    const start = new Date(today);
    start.setDate(today.getDate() - today.getDay());
    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    return { start, end };
  };

  const weekRange = getWeekRange();
  const weekOrders = orders.filter(o => {
    const deliveryDate = new Date(o.deliveryDate + 'T00:00:00');
    return deliveryDate >= weekRange.start && 
      deliveryDate <= weekRange.end && 
      o.status !== "Cancelado";
  });

  const uniqueProducts = new Set(weekOrders.map(o => o.product)).size;
  const weekRevenue = weekOrders.reduce((acc, o) => acc + (o.remainingBalance || 0), 0);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Planejamento de Produção"
        description="Organize sua produção e entregas"
      />

      {/* Layout responsivo 2 colunas */}
      <div className="grid grid-cols-1 lg:grid-cols-[60%_40%] gap-6">
        {/* COLUNA ESQUERDA */}
        <div className="space-y-6">
          {/* Mini Calendário */}
          <MiniCalendar
            selectedDate={selectedDate}
            onSelectDate={setSelectedDate}
            datesWithOrders={datesWithOrders}
          />

          {/* Lista de Produção */}
          <Card className="shadow-lg">
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle className="text-lg font-semibold text-[#6B5047]">
                    Produção para {selectedDate.toLocaleDateString('pt-BR', { 
                      day: '2-digit', 
                      month: 'short' 
                    })}
                  </CardTitle>
                  <p className="text-sm text-[#9C8B82] mt-1">
                    ({selectedDateOrders.length} {selectedDateOrders.length === 1 ? 'item' : 'itens'})
                  </p>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {selectedDateOrders.length === 0 ? (
                <div className="py-12 text-center">
                  <CalendarClock className="h-16 w-16 mx-auto mb-4 text-[#D89B8C] opacity-30" />
                  <h3 className="text-lg font-medium text-[#6B5047] mb-2">
                    Nenhuma entrega programada
                  </h3>
                  <p className="text-[#9C8B82] mb-4">
                    para este dia
                  </p>
                  <Button 
                    variant="outline" 
                    onClick={() => setSelectedDate(new Date())}
                  >
                    Ver todas as datas
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {selectedDateOrders.map(order => (
                    <ProductionCard
                      key={order.id}
                      order={order}
                      onUpdateChecklist={updateOrderChecklist}
                      onMarkAsDelivered={markAsDelivered}
                    />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* COLUNA DIREITA */}
        <div className="space-y-6">
          {/* Alertas Importantes */}
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg font-semibold text-[#6B5047]">
                <AlertCircle className="h-5 w-5 text-[#E5C89F]" />
                Alertas
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {todayOrders.length === 0 && tomorrowOrders.length === 0 && pendingSaldos === 0 ? (
                <div className="py-8 text-center">
                  <CheckCircle className="h-12 w-12 mx-auto mb-3 text-[#8BA888]" />
                  <p className="text-[#9C8B82]">
                    ✓ Tudo tranquilo por aqui!
                    <br />
                    <span className="text-sm">Nenhum alerta no momento.</span>
                  </p>
                </div>
              ) : (
                <>
                  {todayOrders.length > 0 && (
                    <Alert className="bg-[#FFEBEE] border-l-4 border-[#D88B8B]">
                      <AlertDescription className="text-sm">
                        🔴 <Badge className="bg-[#D88B8B] text-white">{todayOrders.length}</Badge>{' '}
                        {todayOrders.length === 1 ? 'entrega' : 'entregas'} para <strong>HOJE</strong>!
                      </AlertDescription>
                    </Alert>
                  )}
                  
                  {tomorrowOrders.length > 0 && (
                    <Alert className="bg-[#FEF3E2] border-l-4 border-[#E5C89F]">
                      <AlertDescription className="text-sm">
                        🟡 <Badge className="bg-[#E5C89F] text-[#6B5047]">{tomorrowOrders.length}</Badge>{' '}
                        {tomorrowOrders.length === 1 ? 'entrega' : 'entregas'} amanhã
                      </AlertDescription>
                    </Alert>
                  )}
                  
                  {pendingSaldos > 0 && (
                    <Alert className="bg-[#E8F5E9] border-l-4 border-[#8BA888]">
                      <AlertDescription className="text-sm">
                        💰 R$ {pendingSaldos.toFixed(2)} em saldos a receber hoje
                      </AlertDescription>
                    </Alert>
                  )}
                </>
              )}
            </CardContent>
          </Card>

          {/* Minhas Tarefas */}
          <Card className="shadow-lg">
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle className="flex items-center gap-2 text-lg font-semibold text-[#6B5047]">
                  <CheckSquare className="h-5 w-5 text-[#D89B8C]" />
                  Minhas Tarefas
                </CardTitle>
                <span className="text-sm text-[#9C8B82]">
                  {new Date().toLocaleDateString('pt-BR', { 
                    weekday: 'long', 
                    day: '2-digit', 
                    month: 'short' 
                  })}
                </span>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Input para adicionar tarefa */}
              <div className="relative">
                <Input
                  placeholder="+ Adicionar nova tarefa..."
                  value={newTaskText}
                  onChange={(e) => setNewTaskText(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && addTask()}
                  className="border-2 border-dashed border-[#E8E3DF] focus:border-[#D89B8C] focus:border-solid"
                />
              </div>

              {/* Lista de tarefas */}
              {tasks.length === 0 ? (
                <div className="py-8 text-center">
                  <p className="text-[#9C8B82]">
                    📝 Nenhuma tarefa para hoje
                    <br />
                    <span className="text-sm">Adicione suas tarefas acima!</span>
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Tarefas Pendentes */}
                  {pendingTasks.length > 0 && (
                    <div className="space-y-2">
                      {pendingTasks.map(task => (
                        <div
                          key={task.id}
                          className="flex items-center justify-between py-3 border-b border-[#E8E3DF] last:border-b-0 hover:bg-[#FAF7F5] transition-colors group"
                        >
                          <div className="flex items-center space-x-3 flex-1">
                            <Checkbox
                              id={`task-${task.id}`}
                              checked={task.concluida}
                              onCheckedChange={() => toggleTask(task.id)}
                              className="accent-[#D89B8C]"
                            />
                            <label
                              htmlFor={`task-${task.id}`}
                              className="text-base text-[#6B5047] cursor-pointer flex-1"
                            >
                              {task.descricao}
                            </label>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => removeTask(task.id)}
                            className="opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <Trash2 className="h-4 w-4 text-[#D88B8B]" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Tarefas Concluídas */}
                  {completedTasks.length > 0 && (
                    <div className="space-y-2">
                      <button
                        onClick={() => setShowCompleted(!showCompleted)}
                        className="flex items-center justify-between w-full text-sm text-[#9C8B82] hover:text-[#D89B8C] transition-colors"
                      >
                        <div className="flex items-center gap-2">
                          <ChevronDown className={cn(
                            "h-4 w-4 transition-transform",
                            showCompleted && "rotate-180"
                          )} />
                          <span>Concluídas ({completedTasks.length})</span>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            clearCompletedTasks();
                          }}
                          className="text-xs text-[#9C8B82] hover:text-[#D89B8C]"
                        >
                          Limpar todas
                        </Button>
                      </button>
                      
                      {showCompleted && (
                        <div className="space-y-2">
                          {completedTasks.map(task => (
                            <div
                              key={task.id}
                              className="flex items-center justify-between py-3"
                            >
                              <div className="flex items-center space-x-3 flex-1">
                                <Checkbox
                                  id={`task-${task.id}`}
                                  checked={task.concluida}
                                  onCheckedChange={() => toggleTask(task.id)}
                                  disabled
                                />
                                <label
                                  className="text-base text-[#9C8B82] line-through opacity-50 flex-1"
                                >
                                  {task.descricao}
                                </label>
                              </div>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => removeTask(task.id)}
                              >
                                <Trash2 className="h-4 w-4 text-[#D88B8B]" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Resumo da Semana */}
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg font-semibold text-[#6B5047]">
                <CalendarDays className="h-5 w-5 text-[#D89B8C]" />
                Resumo da Semana
              </CardTitle>
              <p className="text-sm text-[#9C8B82]">
                {weekRange.start.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })} - {' '}
                {weekRange.end.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
              </p>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="bg-[#F5E6E0] rounded-lg p-4">
                <div className="text-2xl font-bold text-[#D89B8C]">
                  🎂 {weekOrders.length}
                </div>
                <div className="text-sm text-[#9C8B82]">
                  entregas programadas
                </div>
              </div>
              
              <div className="bg-[#F5E6E0] rounded-lg p-4">
                <div className="text-2xl font-bold text-[#D89B8C]">
                  🧁 {uniqueProducts}
                </div>
                <div className="text-sm text-[#9C8B82]">
                  produtos diferentes
                </div>
              </div>
              
              <div className="bg-[#F5E6E0] rounded-lg p-4">
                <div className="text-2xl font-bold text-[#8BA888]">
                  💰 R$ {weekRevenue.toFixed(2)}
                </div>
                <div className="text-sm text-[#9C8B82]">
                  a receber
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
