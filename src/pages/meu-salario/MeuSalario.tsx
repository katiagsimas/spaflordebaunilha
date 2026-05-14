import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { VisaoGeral } from "./VisaoGeral";
import { Retiradas } from "./Retiradas";
import { Educativo } from "./Educativo";
import { Sparkles } from "lucide-react";

export default function MeuSalario() {
  return (
    <div className="renda-doce-scope -m-6 md:-m-8 p-6 md:p-8 min-h-[calc(100vh-3.5rem)]">
      <header className="mb-6">
        <div className="flex items-center gap-2 text-[hsl(var(--rd-dourado))]">
          <Sparkles className="h-5 w-5" />
          <span className="text-xs uppercase tracking-[0.2em]">Método Renda Doce</span>
        </div>
        <h1 className="text-3xl md:text-4xl font-light text-[hsl(var(--rd-vinho))] mt-1">
          Meu Salário
        </h1>
        <p className="text-[hsl(var(--rd-vinho)/0.7)] mt-2 max-w-2xl">
          Um espaço para você entender, com calma e clareza, quanto sua confeitaria pode te pagar
          sem sufocar — e construir uma relação saudável com o dinheiro do seu negócio.
        </p>
      </header>

      <Tabs defaultValue="visao" className="w-full">
        <TabsList className="bg-[hsl(var(--rd-creme))] border border-[hsl(var(--rd-dourado)/0.3)]">
          <TabsTrigger
            value="visao"
            className="data-[state=active]:bg-[hsl(var(--rd-vinho))] data-[state=active]:text-white"
          >
            Visão geral
          </TabsTrigger>
          <TabsTrigger
            value="retiradas"
            className="data-[state=active]:bg-[hsl(var(--rd-vinho))] data-[state=active]:text-white"
          >
            Retiradas
          </TabsTrigger>
          <TabsTrigger
            value="educativo"
            className="data-[state=active]:bg-[hsl(var(--rd-vinho))] data-[state=active]:text-white"
          >
            Aprender
          </TabsTrigger>
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
    </div>
  );
}
