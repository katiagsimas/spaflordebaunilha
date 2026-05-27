import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { VisaoGeral } from "./VisaoGeral";
import { Retiradas } from "./Retiradas";
import { Educativo } from "./Educativo";
import { Sparkles, CalendarDays, Settings2, ChevronLeft } from "lucide-react";
import heroImg from "@/assets/meu-salario-hero.png";

export default function MeuSalario() {
  const [tab, setTab] = useState("visao");

  return (
    <div className="renda-doce-scope -m-6 md:-m-8 p-6 md:p-8 min-h-[calc(100vh-3.5rem)] relative">
      {/* Botões superiores direita */}
      <div className="absolute top-6 right-6 md:top-8 md:right-8 flex items-center gap-2 z-10">
        <button
          type="button"
          aria-label="Calendário"
          className="w-9 h-9 rounded-full bg-white/70 backdrop-blur border border-[#5B1A2B]/15 flex items-center justify-center text-[#5B1A2B] hover:bg-white transition"
        >
          <CalendarDays className="h-4 w-4" />
        </button>
        <button
          type="button"
          aria-label="Configurações"
          className="w-9 h-9 rounded-full bg-white/70 backdrop-blur border border-[#5B1A2B]/15 flex items-center justify-center text-[#5B1A2B] hover:bg-white transition"
        >
          <Settings2 className="h-4 w-4" />
        </button>
      </div>

      {/* Header com imagem decorativa */}
      <header className="grid grid-cols-1 md:grid-cols-[55%_45%] gap-6 items-center mb-6 pr-24">
        <div>
          <div className="flex items-center gap-2 text-[#C9A14A]">
            <Sparkles className="h-3.5 w-3.5" />
            <span className="text-[11px] uppercase tracking-widest font-medium">Método Renda Doce</span>
          </div>
          <h1
            className="text-[38px] leading-tight font-normal text-[#3D0F1C] mt-1"
            style={{ fontFamily: "'Playfair Display', serif" }}
          >
            Meu Salário
          </h1>
          <p className="text-sm text-[#3D0F1C]/70 mt-2 leading-relaxed max-w-[520px]">
            Um espaço para você entender, com calma e clareza, quanto sua confeitaria pode te
            pagar sem sufocar — e construir uma relação saudável com o dinheiro do seu negócio.
          </p>
        </div>
        <div className="hidden md:flex justify-end">
          <img
            src={heroImg}
            alt=""
            loading="lazy"
            className="h-[180px] w-auto object-contain"
          />
        </div>
      </header>

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
              className="rounded-lg px-5 py-2 text-sm font-medium text-[#3D0F1C]/60 hover:text-[#3D0F1C] data-[state=active]:bg-[#3D0F1C] data-[state=active]:text-white data-[state=active]:shadow-none"
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
        className="fixed bottom-6 right-6 z-50 w-11 h-11 rounded-full bg-[#5B1A2B] hover:bg-[#3D0F1C] text-white shadow-lg flex items-center justify-center transition"
      >
        <ChevronLeft className="h-5 w-5" />
      </button>
    </div>
  );
}
