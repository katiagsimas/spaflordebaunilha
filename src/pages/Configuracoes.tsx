import { Settings, Tag, FileText, CreditCard, Building2, UserCircle, Ruler } from "lucide-react";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { PageHeader } from "@/components/PageHeader";

const opcoes = [
  {
    title: "Dados da sua Confeitaria",
    description: "Dados da sua empresa",
    icon: UserCircle,
    url: "/configuracoes/seus-dados",
    color: "text-indigo-600 bg-indigo-50 dark:bg-indigo-950",
  },
  {
    title: "Categorias de Receitas",
    description: "Categorias de receitas",
    icon: Tag,
    url: "/configuracoes/categorias-receitas",
    color: "text-cyan-600 bg-cyan-50 dark:bg-cyan-950",
  },
  {
    title: "Unidades de Medidas",
    description: "Cadastro de unidades de medidas",
    icon: Ruler,
    url: "/configuracoes/unidades",
    color: "text-purple-600 bg-purple-50 dark:bg-purple-950",
  },
  {
    title: "Categorias Financeiras",
    description: "Gerencie categorias de receitas e despesas",
    icon: Tag,
    color: "text-primary bg-primary/10",
    url: "/configuracoes/categorias",
  },
  {
    title: "Planos de Contas",
    description: "Configure e organize seu plano de contas contábil",
    icon: FileText,
    color: "text-secondary bg-secondary/10",
    url: "/configuracoes/planos-contas",
  },
  {
    title: "Tipos de Documento",
    description: "Cadastre formas de pagamento e tipos de documento",
    icon: CreditCard,
    color: "text-success bg-success/10",
    url: "/configuracoes/tipos-documento",
  },
  {
    title: "Bancos",
    description: "Gerencie as instituições bancárias utilizadas",
    icon: Building2,
    color: "text-warning bg-warning/10",
    url: "/configuracoes/bancos",
  },
];

export default function Configuracoes() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background p-4 md:p-6">
      <PageHeader
        title="Configurações"
        description="Configure categorias, planos de contas e formas de pagamento"
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-4">
        {opcoes.map((opcao, index) => {
          const Icon = opcao.icon;
          return (
            <Card
              key={opcao.title}
              className={`group transition-all duration-200 cursor-pointer hover:shadow-lg hover:scale-[1.02] animate-fade-in border-l-4`}
              style={{ 
                animationDelay: `${index * 0.05}s`,
                borderLeftColor: opcao.color.includes('indigo') ? 'hsl(var(--primary))' :
                                opcao.color.includes('cyan') ? 'hsl(var(--accent))' :
                                opcao.color.includes('purple') ? 'hsl(var(--secondary))' :
                                'hsl(var(--muted-foreground))'
              }}
              onClick={() => navigate(opcao.url)}
            >
              <CardHeader className="p-4 space-y-2">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-10 h-10 rounded-lg ${opcao.color} flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform`}
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
