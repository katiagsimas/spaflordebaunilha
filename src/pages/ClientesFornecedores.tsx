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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {opcoes.map((opcao) => {
          const Icon = opcao.icon;
          return (
            <Card
              key={opcao.url}
              className="cursor-pointer hover:shadow-lg transition-all duration-200 hover:scale-105"
              onClick={() => navigate(opcao.url)}
            >
              <CardHeader>
                <div className={`w-12 h-12 rounded-lg ${opcao.color} flex items-center justify-center mb-2`}>
                  <Icon className="h-6 w-6" />
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
