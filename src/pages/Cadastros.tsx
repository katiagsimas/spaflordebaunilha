import { useNavigate } from "react-router-dom";
import { Scale, FlaskConical, Cake, ChevronLeft, ShoppingBag, Leaf, Sun, Home } from "lucide-react";

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
                  Configure valor/hora e tempo de preparo dos itens
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
                  Kg, litros, unidades e outras medidas usadas nos itens
                </p>
              </div>
            </div>
          </button>

          {/* Card 3 — Categorias */}
          <button
            onClick={() => {
              navigate("/configuracoes/categorias");
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

          {/* Card 4 — Produtos para Revenda */}
          <div className="group text-left bg-white border-2 border-sfb-areia/60 rounded-xl p-5 transition-all duration-200">
            <div className="flex flex-col gap-4">
              <div className="flex items-start gap-3">
                <div className="w-[52px] h-[52px] rounded-full bg-sfb-baunilha flex items-center justify-center shrink-0">
                  <ShoppingBag className="h-6 w-6 text-sfb-cacau" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-display text-[15px] font-semibold text-sfb-cacau leading-tight">
                    Produtos para Revenda
                  </p>
                  <p className="text-[12px] text-muted-foreground mt-1">
                    Gerencie itens adquiridos para revenda direta
                  </p>
                </div>
              </div>

              {/* Sub-cards vazios */}
              <div className="grid grid-cols-1 gap-2 mt-2">
                {/* Natura */}
                <button
                  onClick={() => console.log("Natura clicado")}
                  className="flex items-center gap-3 p-3 bg-sfb-baunilha/30 border border-sfb-areia/40 rounded-lg hover:border-sfb-terracota hover:bg-white transition-all text-left"
                >
                  <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center shrink-0 border border-sfb-areia/20">
                    <Leaf className="h-4 w-4 text-sfb-cacau" />
                  </div>
                  <span className="font-display text-[13px] font-medium text-sfb-cacau">Natura</span>
                </button>

                {/* Avon */}
                <button
                  onClick={() => console.log("Avon clicado")}
                  className="flex items-center gap-3 p-3 bg-sfb-baunilha/30 border border-sfb-areia/40 rounded-lg hover:border-sfb-terracota hover:bg-white transition-all text-left"
                >
                  <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center shrink-0 border border-sfb-areia/20">
                    <Sun className="h-4 w-4 text-sfb-cacau" />
                  </div>
                  <span className="font-display text-[13px] font-medium text-sfb-cacau">Avon</span>
                </button>

                {/* Casa & Estilo */}
                <button
                  onClick={() => console.log("Casa & Estilo clicado")}
                  className="flex items-center gap-3 p-3 bg-sfb-baunilha/30 border border-sfb-areia/40 rounded-lg hover:border-sfb-terracota hover:bg-white transition-all text-left"
                >
                  <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center shrink-0 border border-sfb-areia/20">
                    <Home className="h-4 w-4 text-sfb-cacau" />
                  </div>
                  <span className="font-display text-[13px] font-medium text-sfb-cacau">Casa & Estilo</span>
                </button>
              </div>
            </div>
          </div>
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
