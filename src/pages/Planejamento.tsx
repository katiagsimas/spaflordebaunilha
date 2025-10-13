import { PageHeader } from "@/components/PageHeader";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, Target, DollarSign, LineChart } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";

const opcoes = [
  {
    title: "Previsão de Faturamento",
    description: "Em breve",
    icon: TrendingUp,
    color: "text-blue-600 bg-blue-50 dark:bg-blue-950",
    active: false,
  },
  {
    title: "Ponto de Equilíbrio",
    description: "Em breve",
    icon: Target,
    color: "text-green-600 bg-green-50 dark:bg-green-950",
    active: false,
  },
  {
    title: "CMV Global",
    description: "Custo de Mercadoria Vendida",
    icon: DollarSign,
    color: "text-purple-600 bg-purple-50 dark:bg-purple-950",
    url: "/cmv-global",
    active: true,
  },
  {
    title: "Projeção de Vendas",
    description: "Em breve",
    icon: LineChart,
    color: "text-orange-600 bg-orange-50 dark:bg-orange-950",
    active: false,
  },
];

export default function Planejamento() {
  const navigate = useNavigate();
  return (
    <div className="space-y-6">
      <PageHeader
        title="Planejamento"
        description="Ferramentas de análise e projeção para o seu negócio"
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {opcoes.map((opcao) => {
          const Icon = opcao.icon;
          return (
            <Card
              key={opcao.title}
              className={opcao.active ? "cursor-pointer hover:shadow-lg transition-all duration-200 hover:scale-105" : "opacity-60 cursor-not-allowed"}
              onClick={() => opcao.active && opcao.url && navigate(opcao.url)}
            >
              <CardHeader>
                <div className="flex items-center justify-between mb-2">
                  <div className={`w-12 h-12 rounded-lg ${opcao.color} flex items-center justify-center`}>
                    <Icon className="h-6 w-6" />
                  </div>
                  {!opcao.active && (
                    <Badge className="bg-warning text-foreground text-xs px-2 py-0.5 rounded-full font-medium">
                      Em breve
                    </Badge>
                  )}
                </div>
                <CardTitle>{opcao.title}</CardTitle>
                <CardDescription>{opcao.description}</CardDescription>
              </CardHeader>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
