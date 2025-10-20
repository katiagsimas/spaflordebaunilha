import { PageHeader } from "@/components/PageHeader";
import { BackButton } from "@/components/BackButton";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { DollarSign } from "lucide-react";

const cadastros = [
  {
    title: "Custos Fixos",
    description: "Despesas mensais fixas",
    icon: DollarSign,
    url: "/cadastros/custos-fixos",
    color: "text-red-600 bg-red-50 dark:bg-red-950",
  },
];

export default function Cadastros() {
  const navigate = useNavigate();

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div className="flex items-center gap-4">
        <BackButton to="/precificacao" />
        <div className="flex-1">
          <PageHeader
            title="Cadastros"
            description="Realize todos os cadastros e mantenha-os sempre atualizados para garantir o correto funcionamento do sistema"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-4">
        {cadastros.map((cadastro, index) => {
          const Icon = cadastro.icon;
          return (
            <Card
              key={cadastro.url}
              className="group cursor-pointer hover:shadow-lg hover:scale-[1.02] transition-all duration-200 animate-fade-in border-l-4"
              style={{ 
                animationDelay: `${index * 0.05}s`,
                borderLeftColor: cadastro.color.includes('red') ? 'hsl(var(--destructive))' :
                                cadastro.color.includes('orange') ? 'hsl(var(--warning))' :
                                'hsl(var(--primary))'
              }}
              onClick={() => navigate(cadastro.url)}
            >
              <CardHeader className="p-4 space-y-2">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-lg ${cadastro.color} flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <CardTitle className="text-base font-semibold leading-tight line-clamp-2">
                      {cadastro.title}
                    </CardTitle>
                  </div>
                </div>
                <CardDescription className="text-xs line-clamp-2">
                  {cadastro.description}
                </CardDescription>
              </CardHeader>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
