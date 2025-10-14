import { FileText, Calendar, BarChart3, TrendingUp } from "lucide-react";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";

const opcoes = [
  {
    title: "Fluxo de Caixa Diário",
    description: "Acompanhe entradas e saídas dia a dia",
    icon: Calendar,
    color: "text-primary bg-primary/10",
    active: true,
    url: "/relatorios/fluxo-caixa-diario",
  },
  {
    title: "Fluxo de Caixa Mensal",
    description: "Visão consolidada mês a mês",
    icon: BarChart3,
    color: "text-primary bg-primary/10",
    active: true,
    url: "/relatorios/fluxo-caixa-mensal",
  },
  {
    title: "DRE (Demonstrativo de Resultado)",
    description: "Análise de receitas, custos e lucro",
    icon: TrendingUp,
    color: "text-primary bg-primary/10",
    active: true,
    url: "/relatorios/dre",
  },
];

export default function Relatorios() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background p-4 md:p-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <FileText className="h-6 w-6 text-primary" />
            <h1 className="text-3xl font-bold text-foreground">Relatórios</h1>
          </div>
          <p className="text-base text-muted-foreground">
            Análises detalhadas do seu negócio
          </p>
        </div>
      </div>

      {/* Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
        {opcoes.map((opcao, index) => {
          const Icon = opcao.icon;
          return (
            <Card
              key={opcao.title}
              className={`group transition-all duration-200 animate-fade-in border-l-4 ${
                opcao.active
                  ? "cursor-pointer hover:shadow-lg hover:scale-[1.02]"
                  : "opacity-60 cursor-not-allowed"
              }`}
              style={{ 
                animationDelay: `${index * 0.05}s`,
                borderLeftColor: 'hsl(var(--primary))'
              }}
              onClick={() => opcao.active && opcao.url && navigate(opcao.url)}
            >
              <CardHeader className="p-4 space-y-2">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-10 h-10 rounded-lg ${opcao.color} flex items-center justify-center shrink-0 ${opcao.active ? 'group-hover:scale-110' : ''} transition-transform`}
                  >
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <CardTitle className="text-base font-semibold leading-tight line-clamp-2">
                      {opcao.title}
                    </CardTitle>
                  </div>
                </div>
                <CardDescription className="text-xs line-clamp-2">
                  {opcao.description}
                </CardDescription>
              </CardHeader>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
