import { PageHeader } from "@/components/PageHeader";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { Users, ChefHat, CookingPot } from "lucide-react";

const opcoes = [
  {
    title: "Cadastros",
    description: "Realize todos os cadastros necessários",
    icon: Users,
    url: "/cadastros",
    color: "text-blue-600 bg-blue-50 dark:bg-blue-950",
  },
  {
    title: "Pré-Preparo",
    description: "Gerencie suas sub-receitas",
    icon: ChefHat,
    url: "/sub-receitas",
    color: "text-purple-600 bg-purple-50 dark:bg-purple-950",
  },
  {
    title: "FT - Fichas Técnicas",
    description: "Calcule Custos e Preços de Venda",
    icon: CookingPot,
    url: "/receitas",
    color: "text-orange-600 bg-orange-50 dark:bg-orange-950",
  },
];

export default function Precificacao() {
  const navigate = useNavigate();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Precificação"
        description="Gerencie cadastros, pré-preparo e fichas técnicas"
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
