import React from "react";
import { Home, Ruler, DollarSign } from "lucide-react";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { PageHeader } from "@/components/PageHeader";
import { BackButton } from "@/components/BackButton";

export default function PrecificacaoPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <PageHeader
        title="Precificação"
        description="Configure custos fixos, mão de obra e unidades de medida"
        backButton={<BackButton to="/configuracoes" />}
      />
      
      <div className="p-4 md:p-6">
        {/* Grid com 3 Cards */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">

        {/* Card: Custos Fixos */}
        <Card 
          className="group cursor-pointer hover:shadow-lg hover:scale-[1.02] transition-all duration-200 border-l-4 border-l-purple-500"
          onClick={() => navigate("/configuracoes/precificacao/custos-fixos")}
        >
          <CardHeader className="p-4 space-y-2">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-purple-50 dark:bg-purple-950 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                <Home className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <CardTitle className="text-base font-semibold leading-tight line-clamp-2">
                  Custos Fixos
                </CardTitle>
              </div>
            </div>
            <CardDescription className="text-xs line-clamp-2">
              Configure despesas mensais do negócio para rateio automático
            </CardDescription>
          </CardHeader>
        </Card>

        {/* Card: Valores de Mão de Obra */}
        <Card 
          className="group cursor-pointer hover:shadow-lg hover:scale-[1.02] transition-all duration-200 border-l-4 border-l-blue-500"
          onClick={() => navigate("/configuracoes/precificacao/mao-de-obra")}
        >
          <CardHeader className="p-4 space-y-2">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
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
          className="group cursor-pointer hover:shadow-lg hover:scale-[1.02] transition-all duration-200 border-l-4 border-l-amber-500"
          onClick={() => navigate("/configuracoes/unidades-medida")}
        >
          <CardHeader className="p-4 space-y-2">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-amber-50 dark:bg-amber-950 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
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
        </div>
      </div>
    </div>
  );
}
