import { DollarSign, ArrowDownCircle, ArrowUpCircle, FileText } from "lucide-react";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";

const opcoes = [
  {
    title: "Contas a Receber",
    description: "Gerencie pagamentos de clientes e recebimentos",
    icon: ArrowDownCircle,
    color: "text-success bg-success/10",
    active: true,
    url: "/financeiro/contas-receber",
  },
  {
    title: "Contas a Pagar",
    description: "Controle suas despesas e fornecedores",
    icon: ArrowUpCircle,
    color: "text-error bg-error/10",
    active: true,
    url: "/financeiro/contas-pagar",
  },
];

export default function Financeiro() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background p-4 md:p-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
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
                borderLeftColor: opcao.color.includes('success') ? 'hsl(var(--success))' :
                                opcao.color.includes('error') ? 'hsl(var(--destructive))' :
                                'hsl(var(--primary))'
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
                  {!opcao.active && (
                    <Badge className="bg-warning text-warning-foreground text-xs px-2 py-0.5 rounded-full font-medium shrink-0">
                      Em breve
                    </Badge>
                  )}
                </div>
                <CardDescription className="text-xs line-clamp-2">
                  {opcao.description}
                </CardDescription>
              </CardHeader>
            </Card>
          );
        })}
      </div>

      {/* Footer */}
      <div className="mt-6 text-center text-sm text-muted-foreground animate-fade-in">
        <p>Mais funcionalidades em breve</p>
      </div>
    </div>
  );
}
