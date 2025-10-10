import { useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { Badge } from "@/components/ui/badge";
import { pt } from "date-fns/locale";

interface Order {
  id: string;
  client: string;
  product: string;
  quantity: number;
  status: string;
  deliveryDate: string;
}

const Producao = () => {
  const [orders] = useLocalStorage<Order[]>("orders", []);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());

  const getOrdersForDate = (date: Date | undefined) => {
    if (!date) return [];
    const dateStr = date.toISOString().split("T")[0];
    return orders.filter((order) => order.deliveryDate === dateStr);
  };

  const selectedDateOrders = getOrdersForDate(selectedDate);

  const getDatesWithOrders = () => {
    return orders.map((order) => new Date(order.deliveryDate));
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

  const upcomingOrders = orders
    .filter((order) => {
      const deliveryDate = new Date(order.deliveryDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return deliveryDate >= today && order.status !== "Concluído";
    })
    .sort((a, b) => new Date(a.deliveryDate).getTime() - new Date(b.deliveryDate).getTime())
    .slice(0, 5);

  const statusColors = {
    Pendente: "bg-yellow-100 text-yellow-800",
    "Em Produção": "bg-blue-100 text-blue-800",
    Pronto: "bg-green-100 text-green-800",
    Concluído: "bg-gray-100 text-gray-800",
  };

  return (
    <div className="space-y-8">
      <PageHeader
        title="Calendário de Produção"
        description="Visualize e organize suas entregas"
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2 shadow-soft">
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

        <Card className="shadow-soft">
          <CardHeader>
            <CardTitle>Próximas Entregas</CardTitle>
          </CardHeader>
          <CardContent>
            {upcomingOrders.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                Nenhuma entrega programada
              </p>
            ) : (
              <div className="space-y-3">
                {upcomingOrders.map((order) => (
                  <div
                    key={order.id}
                    className="p-3 border border-border rounded-lg space-y-2"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-medium">{order.client}</p>
                        <p className="text-sm text-muted-foreground">
                          {order.product}
                        </p>
                      </div>
                      <Badge className={statusColors[order.status as keyof typeof statusColors]}>
                        {order.status}
                      </Badge>
                    </div>
                    <p className="text-sm text-primary font-medium">
                      {new Date(order.deliveryDate).toLocaleDateString("pt-BR", {
                        day: "2-digit",
                        month: "short",
                      })}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {selectedDate && (
        <Card className="shadow-soft">
          <CardHeader>
            <CardTitle>
              Entregas para {selectedDate.toLocaleDateString("pt-BR", { 
                day: "2-digit", 
                month: "long", 
                year: "numeric" 
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
                    className="flex items-center justify-between p-4 border border-border rounded-lg"
                  >
                    <div className="space-y-1">
                      <p className="font-semibold">{order.client}</p>
                      <p className="text-sm text-muted-foreground">
                        {order.product} - {order.quantity} unidade(s)
                      </p>
                    </div>
                    <Badge className={statusColors[order.status as keyof typeof statusColors]}>
                      {order.status}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default Producao;
