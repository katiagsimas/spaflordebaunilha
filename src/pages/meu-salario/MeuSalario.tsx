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
          className="relative overflow-hidden rounded-2xl border border-[#3D2F28]/10 shadow-[0_4px_24px_-16px_rgba(91,26,43,0.18)]"
          style={{ background: "#FAEFEB" }}
        >
          <div className="flex items-center gap-3 px-4 py-4 sm:gap-4 sm:px-6 sm:py-5 lg:px-8 lg:py-6 pr-[150px] sm:pr-[200px] lg:pr-[260px] min-h-[130px] sm:min-h-[150px] lg:min-h-[170px]">
            <div className="flex-1 min-w-0">
              <h1 className="font-display text-2xl font-normal leading-tight text-[#2A1F1A] sm:text-3xl lg:text-[36px]">
                Meu Salário
              </h1>
              <div className="mt-2 flex items-center gap-3">
                <span className="h-px w-8 bg-[#C98A75] sm:w-10" />
                <p className="text-xs italic text-[#C98A75] sm:text-sm">
                  Método Renda Doce — quanto sua confeitaria pode te pagar sem sufocar.
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
        <TabsList className="bg-transparent p-0 h-auto gap-1 border-0">
          {[
            { v: "visao", l: "Visão geral" },
            { v: "retiradas", l: "Retiradas" },
            { v: "educativo", l: "Aprender" },
          ].map((t) => (
            <TabsTrigger
              key={t.v}
              value={t.v}
              className="rounded-lg px-5 py-2 text-sm font-medium text-[#2A1F1A]/60 hover:text-[#2A1F1A] data-[state=active]:bg-[#2A1F1A] data-[state=active]:text-white data-[state=active]:shadow-none"
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
        className="fixed bottom-6 right-6 z-50 w-11 h-11 rounded-full bg-[#3D2F28] hover:bg-[#2A1F1A] text-white shadow-lg flex items-center justify-center transition"
      >
        <ChevronLeft className="h-5 w-5" />
      </button>
    </div>
  );
}
