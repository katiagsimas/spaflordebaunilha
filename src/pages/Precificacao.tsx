import { PageHeader } from "@/components/PageHeader";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { BookOpen, Utensils, Ruler, ShoppingBag, FlaskConical } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function Precificacao() {
  const navigate = useNavigate();

  const menuItems = [
    {
      title: "Fichas Técnicas",
      description: "Crie e gerencie as fichas técnicas de seus produtos",
      icon: BookOpen,
      to: "/precificacao/ficha-tecnica",
    },
    {
      title: "Pré-Preparos",
      description: "Bases e preparos usados em várias fichas técnicas",
      icon: FlaskConical,
      to: "/precificacao/pre-preparos",
    },
    {
      title: "Insumos",
      description: "Gerencie seu banco de insumos e ingredientes",
      icon: Utensils,
      to: "/precificacao/ingredientes",
    },
    {
      title: "Embalagens",
      description: "Controle de embalagens e materiais secundários",
      icon: Ruler,
      to: "/precificacao/embalagens",
    },
    {
      title: "Produtos para Revenda",
      description: "Gerencie itens adquiridos para revenda direta (Natura, Avon)",
      icon: ShoppingBag,
      to: "/precificacao/produtos-revenda",
    },
  ];


  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-6 pt-1 pb-6 space-y-6">
        <PageHeader
          title="Serviços"
          description="Gestão dos seus serviços, custos e formação de preços"
        />
        
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {menuItems.map((item) => (
            <Card 
              key={item.to}
              className="group cursor-pointer hover:shadow-lg hover:scale-[1.02] transition-all duration-200 border-l-2 border-sfb-terracota/60"
              onClick={() => navigate(item.to)}
            >
              <CardHeader className="p-4 space-y-2">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-sfb-baunilha text-sfb-terracota flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                    <item.icon className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <CardTitle className="text-base font-semibold leading-tight text-sfb-cacau">
                      {item.title}
                    </CardTitle>
                  </div>
                </div>
                <CardDescription className="text-xs text-sfb-cacau/60">
                  {item.description}
                </CardDescription>
              </CardHeader>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
