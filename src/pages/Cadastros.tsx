import { useNavigate } from "react-router-dom";
import { Scale, FlaskConical, Cake, ChevronLeft, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { HeroBanner } from "@/components/HeroBanner";

export default function Cadastros() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-sfb-baunilha pb-24">
      <div className="px-6 pt-6">
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => navigate("/configuracoes")}
          className="flex items-center gap-2 text-sfb-cacau/60 hover:text-sfb-cacau"
        >
          <ChevronLeft className="h-4 w-4" />
          Voltar para Configurações
        </Button>
      </div>
      <div className="container mx-auto px-6 pt-1 pb-6 space-y-6">
        <HeroBanner
          title="Cadastros"
          subtitle="Centralize aqui os cadastros base do seu negócio: mão de obra, unidades de medida e categorias."
        />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button
            onClick={() => navigate("/configuracoes/precificacao/mao-de-obra")}
            className="group text-left bg-white border-2 border-sfb-areia/60 rounded-xl p-5 transition-all duration-200 hover:border-sfb-terracota hover:shadow-md"
          >
            <div className="flex items-start gap-3">
              <div className="w-[52px] h-[52px] rounded-full bg-sfb-baunilha flex items-center justify-center shrink-0">
                <Scale className="h-6 w-6 text-sfb-cacau" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-display text-[15px] font-semibold text-sfb-cacau leading-tight">
                  Valores de Mão de Obra
                </p>
                <p className="text-[12px] text-muted-foreground mt-1">
                  Configure valor/hora e tempo de preparo dos itens
                </p>
              </div>
            </div>
          </button>

          <button
            onClick={() => navigate("/configuracoes/unidades-medida")}
            className="group text-left bg-white border-2 border-sfb-areia/60 rounded-xl p-5 transition-all duration-200 hover:border-sfb-terracota hover:shadow-md"
          >
            <div className="flex items-start gap-3">
              <div className="w-[52px] h-[52px] rounded-full bg-sfb-baunilha flex items-center justify-center shrink-0">
                <FlaskConical className="h-6 w-6 text-sfb-cacau" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-display text-[15px] font-semibold text-sfb-cacau leading-tight">
                  Unidades de Medidas
                </p>
                <p className="text-[12px] text-muted-foreground mt-1">
                  Kg, litros, unidades e outras medidas usadas nos itens
                </p>
              </div>
            </div>
          </button>

          <button
            onClick={() => navigate("/configuracoes/categorias")}
            className="group text-left bg-white border-2 border-sfb-areia/60 rounded-xl p-5 transition-all duration-200 hover:border-sfb-terracota hover:shadow-md"
          >
            <div className="flex items-start gap-3">
              <div className="w-[52px] h-[52px] rounded-full bg-sfb-baunilha flex items-center justify-center shrink-0">
                <Cake className="h-6 w-6 text-sfb-cacau" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-display text-[15px] font-semibold text-sfb-cacau leading-tight">
                  Categorias
                </p>
                <p className="text-[12px] text-muted-foreground mt-1">
                  Organize seus produtos por categorias
                </p>
              </div>
            </div>
          </button>

          <button
            onClick={() => navigate("/cadastros/produtos-revenda")}
            className="group text-left bg-white border-2 border-sfb-areia/60 rounded-xl p-5 transition-all duration-200 hover:border-sfb-terracota hover:shadow-md"
          >
            <div className="flex items-start gap-3">
              <div className="w-[52px] h-[52px] rounded-full bg-sfb-baunilha flex items-center justify-center shrink-0">
                <ShoppingBag className="h-6 w-6 text-sfb-cacau" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-display text-[15px] font-semibold text-sfb-cacau leading-tight">
                  Produtos para Revenda
                </p>
                <p className="text-[12px] text-muted-foreground mt-1">
                  Gerencie itens adquiridos para revenda direta (Natura, Avon, etc.)
                </p>
              </div>
            </div>
          </button>
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
