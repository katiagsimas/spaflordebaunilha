import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { Users, Truck, Ruler, Boxes, Package, UserCircle, DollarSign, Tag } from "lucide-react";

const cadastros = [
  {
    title: "Dados da sua Confeitaria",
    description: "Dados da sua empresa",
    icon: UserCircle,
    url: "/cadastros/seus-dados",
    color: "text-indigo-600 bg-indigo-50 dark:bg-indigo-950",
  },
  {
    title: "Custos Fixos",
    description: "Despesas mensais fixas",
    icon: DollarSign,
    url: "/cadastros/custos-fixos",
    color: "text-red-600 bg-red-50 dark:bg-red-950",
  },
  {
    title: "Categorias",
    description: "Categorias de receitas",
    icon: Tag,
    url: "/cadastros/categorias",
    color: "text-cyan-600 bg-cyan-50 dark:bg-cyan-950",
  },
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
  {
    title: "Unidades de Medidas",
    description: "Cadastro de unidades de medidas",
    icon: Ruler,
    url: "/cadastros/unidades",
    color: "text-purple-600 bg-purple-50 dark:bg-purple-950",
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
];

export default function Cadastros() {
  const navigate = useNavigate();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Cadastros"
        description="Gerencie todos os seus cadastros"
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {cadastros.map((cadastro) => {
          const Icon = cadastro.icon;
          return (
            <Card
              key={cadastro.url}
              className="cursor-pointer hover:shadow-lg transition-all duration-200 hover:scale-105"
              onClick={() => navigate(cadastro.url)}
            >
              <CardHeader>
                <div className={`w-12 h-12 rounded-lg ${cadastro.color} flex items-center justify-center mb-2`}>
                  <Icon className="h-6 w-6" />
                </div>
                <CardTitle>{cadastro.title}</CardTitle>
                <CardDescription>{cadastro.description}</CardDescription>
              </CardHeader>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
