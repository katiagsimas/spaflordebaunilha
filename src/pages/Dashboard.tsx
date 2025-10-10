import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ShoppingBag, TrendingUp, DollarSign, Package, Clock } from "lucide-react";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

interface Order {
  id: string;
  orderNumber: number;
  client: string;
  product: string;
  total: number;
  status: string;
  deliveryDate: string;
  createdAt: string;
}

const Dashboard = () => {
  const [orders] = useLocalStorage<Order[]>("orders", []);

  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();
  
  const monthlyOrders = orders.filter(o => {
    const orderDate = new Date(o.createdAt);
    return orderDate.getMonth() === currentMonth && orderDate.getFullYear() === currentYear;
  });

  const monthlyRevenue = monthlyOrders.reduce((sum, order) => sum + order.total, 0);
  const pendingOrders = orders.filter(o => o.status === "Pendente" || o.status === "Confirmado").length;

  const productCount: Record<string, number> = {};
  orders.forEach(order => {
    productCount[order.product] = (productCount[order.product] || 0) + 1;
  });
  const topProduct = Object.entries(productCount).sort((a, b) => b[1] - a[1])[0];

  const last6Months = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(currentYear, currentMonth - (5 - i), 1);
    return {
      month: d.toLocaleDateString("pt-BR", { month: "short" }),
      revenue: orders
        .filter(o => {
          const od = new Date(o.createdAt);
          return od.getMonth() === d.getMonth() && od.getFullYear() === d.getFullYear();
        })
        .reduce((sum, o) => sum + o.total, 0)
    };
  });

  const upcomingOrders = orders
    .filter(o => {
      const deliveryDate = new Date(o.deliveryDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return deliveryDate >= today && o.status !== "Concluído";
    })
    .sort((a, b) => new Date(a.deliveryDate).getTime() - new Date(b.deliveryDate).getTime())
    .slice(0, 5);

  const greeting = () => {
    const hour = now.getHours();
    if (hour < 12) return "Bom dia";
    if (hour < 18) return "Boa tarde";
    return "Boa noite";
  };

  const stats = [
    {
      title: "Encomendas do Mês",
      value: monthlyOrders.length,
      icon: ShoppingBag,
      color: "text-primary",
      bgColor: "bg-primary/10",
    },
    {
      title: "Receita do Mês",
      value: `R$ ${monthlyRevenue.toFixed(2)}`,
      icon: DollarSign,
      color: "text-success",
      bgColor: "bg-success/10",
    },
    {
      title: "Encomendas Pendentes",
      value: pendingOrders,
      icon: Clock,
      color: "text-warning",
      bgColor: "bg-warning/10",
    },
    {
      title: "Produto Mais Vendido",
      value: topProduct ? topProduct[0] : "—",
      subtitle: topProduct ? `${topProduct[1]} vendas` : "",
      icon: Package,
      color: "text-info",
      bgColor: "bg-info/10",
    },
  ];

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <h1 className="text-4xl font-bold">
          {greeting()}! 👋
        </h1>
        <p className="text-muted-foreground text-lg">
          {now.toLocaleDateString("pt-BR", { 
            weekday: "long", 
            year: "numeric", 
            month: "long", 
            day: "numeric" 
          })}
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.title} className="shadow-soft hover:shadow-elevated transition-shadow">
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
                {stat.subtitle && (
                  <p className="text-xs text-muted-foreground mt-1">{stat.subtitle}</p>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card className="shadow-soft">
        <CardHeader>
          <CardTitle>Faturamento dos Últimos 6 Meses</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={last6Months}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis 
                dataKey="month" 
                stroke="hsl(var(--muted-foreground))"
                style={{ textTransform: 'capitalize' }}
              />
              <YAxis stroke="hsl(var(--muted-foreground))" />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "0.5rem",
                }}
                formatter={(value: number) => `R$ ${value.toFixed(2)}`}
              />
              <Line
                type="monotone"
                dataKey="revenue"
                stroke="hsl(var(--primary))"
                strokeWidth={3}
                dot={{ fill: "hsl(var(--primary))", strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card className="shadow-soft">
        <CardHeader>
          <CardTitle>Próximas Entregas</CardTitle>
        </CardHeader>
        <CardContent>
          {upcomingOrders.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              Nenhuma entrega programada
            </p>
          ) : (
            <div className="space-y-4">
              {upcomingOrders.map((order) => (
                <div key={order.id} className="flex items-center justify-between p-4 border border-border rounded-lg hover:border-primary transition-colors">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold">{order.client}</p>
                      <span className="text-xs text-muted-foreground">#{order.orderNumber}</span>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">{order.product}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-primary">R$ {order.total.toFixed(2)}</p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(order.deliveryDate).toLocaleDateString("pt-BR")}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;
