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
        description="Gerencie a Precificação dos seus Produtos iniciando pelo Cadastro de Ingredientes e Embalagens; na sequência crie suas sub-receitas e Fichas Técnicas dos Produtos Finalizados"
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
