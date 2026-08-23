import { useNavigate } from "react-router-dom";
import { Scale, FlaskConical, Cake, ChevronLeft, Utensils, Ruler, ShoppingBag } from "lucide-react";
import { HeroBanner } from "@/components/HeroBanner";

export default function Cadastros() {
  const navigate = useNavigate();

  const cadastrosItems = [
    {
      title: "Valores de Mão de Obra",
      description: "Configure valor/hora e tempo de preparo dos itens",
      icon: Scale,
      to: "/configuracoes/precificacao/mao-de-obra",
    },
    {
      title: "Unidades de Medidas",
      description: "Kg, litros, unidades e outras medidas usadas nos itens",
      icon: FlaskConical,
      to: "/configuracoes/unidades-medida",
    },
    {
      title: "Categorias",
      description: "Organize seus produtos por categorias",
      icon: Cake,
      to: "/configuracoes/categorias",
    },
    {
      title: "Insumos",
      description: "Gerencie seu banco de insumos",
      icon: Utensils,
      to: "/cadastros/ingredientes",
    },
    {
      title: "Embalagens",
      description: "Controle de embalagens e materiais secundários",
      icon: Ruler,
      to: "/cadastros/embalagens",
    },
    {
      title: "Produtos para Revenda",
      description: "Gerencie itens adquiridos para revenda direta (Natura, Avon)",
      icon: ShoppingBag,
      to: "/cadastros/produtos-revenda",
    },
  ];

  return (
    <div className="min-h-screen bg-sfb-baunilha pb-24">
      <div className="container mx-auto px-6 pt-6 pb-6 space-y-6">
        <HeroBanner
          title="Cadastros"
          subtitle="Centralize aqui os cadastros base do seu negócio: insumos, embalagens, revenda e configurações gerais."
        />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {cadastrosItems.map((item) => (
            <button
              key={item.to}
              onClick={() => navigate(item.to)}
              className="group text-left bg-white border-2 border-sfb-areia/60 rounded-xl p-5 transition-all duration-200 hover:border-sfb-terracota hover:shadow-md"
            >
              <div className="flex items-start gap-3">
                <div className="w-[52px] h-[52px] rounded-full bg-sfb-baunilha flex items-center justify-center shrink-0">
                  <item.icon className="h-6 w-6 text-sfb-cacau" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-display text-[15px] font-semibold text-sfb-cacau leading-tight">
                    {item.title}
                  </p>
                  <p className="text-[12px] text-muted-foreground mt-1">
                    {item.description}
                  </p>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      <button
        onClick={() => navigate(-1)}
        className="fixed bottom-6 right-6 z-50 w-11 h-11 rounded-full bg-sfb-cacau text-sfb-baunilha flex items-center justify-center shadow-lg hover:opacity-90 transition"
        aria-label="Voltar"
      >
        <ChevronLeft className="h-5 w-5" />
      </button>
    </div>
  );
}
