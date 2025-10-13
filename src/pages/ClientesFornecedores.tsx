import { PageHeader } from "@/components/PageHeader";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { Users, Truck } from "lucide-react";

const opcoes = [
  {
    title: "Clientes",
    description: "Cadastro de clientes",
    icon: Users,
    url: "/cadastros/clientes",
    color: "text-blue-600 bg-blue-50 dark:bg-blue-950",
  },
  {
    title: "Fornecedores",
    description: "Cadastro de fornecedores",
    icon: Truck,
    url: "/cadastros/fornecedores",
    color: "text-green-600 bg-green-50 dark:bg-green-950",
  },
];

export default function ClientesFornecedores() {
  const navigate = useNavigate();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Clientes e Fornecedores"
        description="Gerencie seus clientes e fornecedores"
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
        {opcoes.map((opcao, index) => {
          const Icon = opcao.icon;
          return (
            <Card
              key={opcao.url}
              className="cursor-pointer hover:shadow-md transition-all duration-200 hover:-translate-y-0.5 border-l-4 border-l-[#D89B8C] group"
              onClick={() => navigate(opcao.url)}
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <CardHeader className="p-4">
                <div className="flex items-start gap-3">
                  <div className={`w-10 h-10 rounded-lg ${opcao.color} flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-base mb-1">{opcao.title}</CardTitle>
                    <CardDescription className="text-sm line-clamp-2">{opcao.description}</CardDescription>
                  </div>
                </div>
              </CardHeader>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
