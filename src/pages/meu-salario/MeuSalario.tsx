import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { VisaoGeral } from "./VisaoGeral";
import { Retiradas } from "./Retiradas";
import { Educativo } from "./Educativo";
import { ChevronLeft } from "lucide-react";
import heroSide from "@/assets/meu-salario-hero-side.png";

export default function MeuSalario() {
  const [tab, setTab] = useState("visao");

  return (
    <div className="renda-doce-scope -mx-6 md:-mx-8 -mt-2 -mb-6 md:-mb-8 min-h-[calc(100vh-3.5rem)] relative px-6 md:px-8 pt-2 pb-6 md:pb-8">
      {/* ===== HEADER PREMIUM (mesmo padrão do módulo Encomendas) ===== */}
      <div className="mb-6">

        <div
          className="relative overflow-hidden rounded-2xl border border-sfb-cacau/10 shadow-[0_4px_24px_-16px_rgba(91,26,43,0.18)]"
          style={{ background: "var(--sfb-baunilha)" }}
        >
          <div className="flex items-center gap-3 px-4 py-4 sm:gap-4 sm:px-6 sm:py-5 lg:px-8 lg:py-6 pr-[150px] sm:pr-[200px] lg:pr-[260px] min-h-[130px] sm:min-h-[150px] lg:min-h-[170px]">
            <div className="flex-1 min-w-0">
              <h1 className="font-display text-2xl font-normal leading-tight text-sfb-cacau sm:text-3xl lg:text-[36px]">
                Meu Salário
              </h1>
              <div className="mt-2 flex items-center gap-3">
                <span className="h-px w-8 bg-sfb-terracota sm:w-10" />
                <p className="text-xs italic text-sfb-terracota sm:text-sm">
                  Quanto seu negócio pode te pagar sem sufocar.
                </p>
              </div>
            </div>
          </div>
          <img
            src={heroSide}
            alt=""
            aria-hidden="true"
            className="pointer-events-none absolute right-0 inset-y-0 my-auto h-[140px] w-auto object-contain sm:h-[180px] lg:h-[220px]"
          />

        </div>
      </div>


      <Tabs value={tab} onValueChange={setTab} className="w-full">
        <TabsList className="bg-sfb-terracota p-1 h-auto gap-1 border-0 rounded-xl">
          {[
            { v: "visao", l: "Visão geral" },
            { v: "retiradas", l: "Retiradas" },
            { v: "educativo", l: "Aprender" },
          ].map((t) => (
            <TabsTrigger
              key={t.v}
              value={t.v}
              className="rounded-lg px-5 py-2 text-sm font-medium text-sfb-baunilha/80 hover:text-sfb-baunilha data-[state=active]:bg-sfb-baunilha data-[state=active]:text-sfb-terracota data-[state=active]:shadow-none"
            >
              {t.l}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="visao" className="mt-6">
          <VisaoGeral />
        </TabsContent>
        <TabsContent value="retiradas" className="mt-6">
          <Retiradas />
        </TabsContent>
        <TabsContent value="educativo" className="mt-6">
          <Educativo />
        </TabsContent>
      </Tabs>

      {/* Botão flutuante voltar */}
      <button
        type="button"
        onClick={() => window.history.back()}
        aria-label="Voltar"
        className="fixed bottom-6 right-6 z-50 w-11 h-11 rounded-full bg-sfb-terracota hover:bg-sfb-terracota/90 text-sfb-baunilha shadow-lg flex items-center justify-center transition"
      >
        <ChevronLeft className="h-5 w-5" />
      </button>
    </div>
  );
}
