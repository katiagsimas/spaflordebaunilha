import { DollarSign, ArrowDownCircle, ArrowUpCircle, FileText, Settings } from "lucide-react";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";

const opcoes = [
  {
    title: "Contas a Receber",
    description: "Gerencie pagamentos de clientes e recebimentos",
    icon: ArrowDownCircle,
    color: "text-success bg-success/10",
    active: false,
    url: undefined,
  },
  {
    title: "Contas a Pagar",
    description: "Controle suas despesas e fornecedores",
    icon: ArrowUpCircle,
    color: "text-error bg-error/10",
    active: false,
    url: undefined,
  },
  {
    title: "Demonstrativo de Resultado",
    description: "DRE - Análise de receitas, custos e lucro",
    icon: FileText,
    color: "text-primary bg-primary/10",
    active: false,
    url: undefined,
  },
  {
    title: "Configurações",
    description: "Configure categorias e formas de pagamento",
    icon: Settings,
    color: "text-accent bg-accent/10",
    active: true,
    url: "/financeiro/configuracoes",
  },
];

export default function Financeiro() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background p-4 md:p-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <DollarSign className="h-6 w-6 text-primary" />
            <h1 className="text-3xl font-bold text-foreground">Financeiro</h1>
          </div>
          <p className="text-base text-muted-foreground">
            Controle completo das suas finanças
          </p>
        </div>
      </div>

      {/* Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
        {opcoes.map((opcao, index) => {
          const Icon = opcao.icon;
          return (
            <Card
              key={opcao.title}
              className={`transition-all duration-200 animate-fade-in-up stagger-${index + 1} ${
                opcao.active
                  ? "cursor-pointer hover:shadow-elevated hover:-translate-y-1"
                  : "opacity-60 cursor-not-allowed"
              }`}
              onClick={() => opcao.active && opcao.url && navigate(opcao.url)}
            >
              <CardHeader>
                <div className="flex items-center justify-between mb-2">
                  <div
                    className={`w-10 h-10 md:w-12 md:h-12 rounded-lg ${opcao.color} flex items-center justify-center`}
                  >
                    <Icon className="h-5 w-5 md:h-6 md:w-6" />
                  </div>
                  {!opcao.active && (
                    <Badge className="bg-warning text-foreground text-xs px-2 py-0.5 rounded-full font-medium">
                      Em breve
                    </Badge>
                  )}
                </div>
                <CardTitle className="text-lg md:text-2xl">{opcao.title}</CardTitle>
                <CardDescription>{opcao.description}</CardDescription>
              </CardHeader>
            </Card>
          );
        })}
      </div>

      {/* Footer */}
      <div className="mt-8 text-center text-sm text-muted-foreground animate-fade-in">
        <p>Estas funcionalidades estarão disponíveis em breve</p>
      </div>
    </div>
  );
}
