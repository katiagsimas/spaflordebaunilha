import React from "react";
import { DollarSign, Clock, Home, Ruler, ArrowRight, ArrowLeft } from "lucide-react";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function PrecificacaoPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background p-4 md:p-6">
      {/* Header */}
      <div className="mb-8">
        <Button
          variant="ghost"
          onClick={() => navigate("/configuracoes")}
          className="gap-2 text-muted-foreground hover:text-foreground mb-4"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar
        </Button>
        <div className="flex items-center gap-3 mb-2">
          <DollarSign className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Precificação</h1>
            <p className="text-muted-foreground">Configure custos fixos, mão de obra e unidades de medida</p>
          </div>
        </div>
      </div>

      {/* Grid com 3 Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        
        {/* Card: Mão de Obra */}
        <Card 
          className="hover:shadow-lg transition-all cursor-pointer group border-2 hover:border-blue-300"
          onClick={() => navigate("/configuracoes/precificacao/mao-obra")}
        >
          <CardHeader className="pb-3">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-300 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                <Clock className="h-6 w-6" />
              </div>
              <Badge variant="secondary" className="bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                Novo
              </Badge>
            </div>
            <CardTitle className="text-lg">
              Valores de Mão de Obra
              <ArrowRight className="inline-block ml-2 h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity" />
            </CardTitle>
            <CardDescription>
              Defina quanto vale sua hora de trabalho para cálculo automático
            </CardDescription>
          </CardHeader>
        </Card>

        {/* Card: Custos Fixos */}
        <Card 
          className="hover:shadow-lg transition-all cursor-pointer group border-2 hover:border-purple-300"
          onClick={() => navigate("/configuracoes/precificacao/custos-fixos")}
        >
          <CardHeader className="pb-3">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 rounded-lg bg-purple-50 text-purple-600 dark:bg-purple-950 dark:text-purple-300 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                <Home className="h-6 w-6" />
              </div>
            </div>
            <CardTitle className="text-lg">
              Custos Fixos
              <ArrowRight className="inline-block ml-2 h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity" />
            </CardTitle>
            <CardDescription>
              Configure despesas mensais do negócio para rateio automático
            </CardDescription>
          </CardHeader>
        </Card>

        {/* Card: Unidades de Medidas */}
        <Card 
          className="hover:shadow-lg transition-all cursor-pointer group border-2 hover:border-amber-300"
          onClick={() => navigate("/configuracoes/unidades-medida")}
        >
          <CardHeader className="pb-3">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 rounded-lg bg-amber-50 text-amber-600 dark:bg-amber-950 dark:text-amber-300 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                <Ruler className="h-6 w-6" />
              </div>
            </div>
            <CardTitle className="text-lg">
              Unidades de Medidas
              <ArrowRight className="inline-block ml-2 h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity" />
            </CardTitle>
            <CardDescription>
              Kg, litros, unidades e outras medidas usadas nas receitas
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    </div>
  );
}
