import React from "react";
import { Settings, DollarSign, Package, Building2, Info } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function Configuracoes() {
  return (
    <div className="min-h-screen bg-background p-4 md:p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <Settings className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Configurações</h1>
            <p className="text-muted-foreground">Configure o sistema de acordo com suas necessidades</p>
          </div>
        </div>
      </div>

      {/* Card Informativo */}
      <Card className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20 border-blue-200 dark:border-blue-800 mb-8">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <Info className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5 shrink-0" />
            <div className="space-y-2">
              <h3 className="font-semibold text-blue-900 dark:text-blue-100">
                💡 Dica: Configure uma vez, use sempre!
              </h3>
              <p className="text-sm text-blue-700 dark:text-blue-300">
                Configure estes valores agora e eles serão aplicados automaticamente em todas as suas 
                fichas técnicas. Você sempre pode voltar aqui para ajustar conforme seu negócio cresce.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Grid Principal com 3 Cards */}
      <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-3">
        
        {/* Card 1: CADASTROS BASE */}
        <Card className="hover:shadow-lg transition-all cursor-pointer group border-2 hover:border-primary">
          <CardHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 rounded-lg bg-pink-50 text-pink-600 dark:bg-pink-950 dark:text-pink-300 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                <Package className="h-6 w-6" />
              </div>
            </div>
            <CardTitle className="text-lg">Cadastros Base</CardTitle>
            <CardDescription>
              Gerencie categorias, tipos de insumos e dados da confeitaria
            </CardDescription>
          </CardHeader>
        </Card>

        {/* Card 2: PRECIFICAÇÃO */}
        <Card className="hover:shadow-lg transition-all cursor-pointer group border-2 hover:border-primary">
          <CardHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-300 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                <DollarSign className="h-6 w-6" />
              </div>
            </div>
            <CardTitle className="text-lg">Precificação</CardTitle>
            <CardDescription>
              Configure custos fixos, mão de obra e unidades de medida
            </CardDescription>
          </CardHeader>
        </Card>

        {/* Card 3: FINANCEIRO */}
        <Card className="hover:shadow-lg transition-all cursor-pointer group border-2 hover:border-primary">
          <CardHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 rounded-lg bg-teal-50 text-teal-600 dark:bg-teal-950 dark:text-teal-300 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                <Building2 className="h-6 w-6" />
              </div>
            </div>
            <CardTitle className="text-lg">Financeiro</CardTitle>
            <CardDescription>
              Gerencie bancos, documentos e plano de contas
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    </div>
  );
}
