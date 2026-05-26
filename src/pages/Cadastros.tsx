import React from "react";
import { FileText, DollarSign, Ruler, Tag } from "lucide-react";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";

export default function Cadastros() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background p-4 md:p-6">
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <FileText className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Cadastros</h1>
            <p className="text-muted-foreground">Gerencie os cadastros da sua operação</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
        {/* Card: Valores de Mão de Obra */}
        <Card
          className="group cursor-pointer hover:shadow-lg hover:scale-[1.02] transition-all duration-200 border-l-2 border-[#C9A14A]/60"
          onClick={() => navigate("/configuracoes/precificacao/mao-de-obra")}
        >
          <CardHeader className="p-4 space-y-2">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-[#FDF6EE] text-[#C9A14A] flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                <DollarSign className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <CardTitle className="text-base font-semibold leading-tight line-clamp-2">
                  Valores de Mão de Obra
                </CardTitle>
              </div>
            </div>
            <CardDescription className="text-xs line-clamp-2">
              Configure valor/hora e tempo de preparo das receitas
            </CardDescription>
          </CardHeader>
        </Card>

        {/* Card: Unidades de Medidas */}
        <Card
          className="group cursor-pointer hover:shadow-lg hover:scale-[1.02] transition-all duration-200 border-l-2 border-[#C9A14A]/60"
          onClick={() => navigate("/configuracoes/unidades-medida")}
        >
          <CardHeader className="p-4 space-y-2">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-[#FDF6EE] text-[#C9A14A] flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                <Ruler className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <CardTitle className="text-base font-semibold leading-tight line-clamp-2">
                  Unidades de Medidas
                </CardTitle>
              </div>
            </div>
            <CardDescription className="text-xs line-clamp-2">
              Kg, litros, unidades e outras medidas usadas nas receitas
            </CardDescription>
          </CardHeader>
        </Card>

        {/* Card: Categorias de Receitas */}
        <Card
          className="group cursor-pointer hover:shadow-lg hover:scale-[1.02] transition-all duration-200 border-l-2 border-[#C9A14A]/60"
          onClick={() => navigate("/configuracoes/categorias-receitas")}
        >
          <CardHeader className="p-4 space-y-2">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-[#FDF6EE] text-[#C9A14A] flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                <Tag className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <CardTitle className="text-base font-semibold leading-tight line-clamp-2">
                  Categorias de Receitas
                </CardTitle>
              </div>
            </div>
            <CardDescription className="text-xs line-clamp-2">
              Organize seus produtos por categorias
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    </div>
  );
}
