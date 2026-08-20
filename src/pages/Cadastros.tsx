import { useNavigate } from "react-router-dom";
import { Scale, FlaskConical, Cake, ChevronLeft } from "lucide-react";

import { HeroBanner } from "@/components/HeroBanner";
import { useUserProfile } from "@/hooks/useUserProfile";
import { toast } from "sonner";


export default function Cadastros() {
  const { profile: userProfile } = useUserProfile();
  

  const navigate = useNavigate();


  return (
    <div className="min-h-screen bg-sfb-baunilha pb-24">
      <div className="container mx-auto px-6 pt-1 pb-6 space-y-6">
        {/* HERO BANNER padronizado - Imagem removida conforme solicitação */}
        <HeroBanner
          title="Cadastros"
          subtitle="Centralize aqui os cadastros base do seu negócio: mão de obra, unidades de medida e categorias."
        />

        {/* CARDS DE NAVEGAÇÃO */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Card 1 — Mão de Obra */}
          <button
            onClick={() => {
              navigate("/configuracoes/precificacao/mao-de-obra");
            }}

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
                  Configure valor/hora e tempo de preparo das receitas
                </p>
              </div>
            </div>
          </button>

          {/* Card 2 — Unidades de Medidas */}
          <button
            onClick={() => {
              navigate("/configuracoes/unidades-medida");
            }}

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
                  Kg, litros, unidades e outras medidas usadas nas receitas
                </p>
              </div>
            </div>
          </button>

          {/* Card 3 — Categorias */}
          <button
            onClick={() => {
              navigate("/configuracoes/categorias-receitas");
            }}

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
        </div>
      </div>

      {/* Botão flutuante voltar */}
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
