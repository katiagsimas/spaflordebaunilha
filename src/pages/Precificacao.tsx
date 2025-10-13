import { PageHeader } from "@/components/PageHeader";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { Users, ChefHat, CookingPot, DollarSign, Boxes, Package } from "lucide-react";

const opcoes = [
  {
    title: "Custos Fixos",
    description: "Despesas mensais fixas",
    icon: DollarSign,
    url: "/cadastros/custos-fixos",
    color: "text-red-600 bg-red-50 dark:bg-red-950",
  },
  {
    title: "Ingredientes",
    description: "Cadastro de Insumos",
    icon: Boxes,
    url: "/cadastros/ingredientes",
    color: "text-orange-600 bg-orange-50 dark:bg-orange-950",
  },
  {
    title: "Embalagens",
    description: "Cadastro de embalagens",
    icon: Package,
    url: "/cadastros/embalagens",
    color: "text-pink-600 bg-pink-50 dark:bg-pink-950",
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

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
