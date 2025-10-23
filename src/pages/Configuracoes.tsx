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
        <Card className="hover:shadow-lg transition-all border-2">
          <CardHeader className="pb-4">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 rounded-lg bg-pink-50 text-pink-600 dark:bg-pink-950 dark:text-pink-300 flex items-center justify-center shrink-0">
                <Package className="h-6 w-6" />
              </div>
            </div>
            <CardTitle className="text-xl">📦 Cadastros Base</CardTitle>
            <CardDescription>
              Gerencie elementos usados nas fichas técnicas e organize suas receitas
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Configure categorias, tipos de insumos, embalagens e dados da confeitaria
            </p>
          </CardContent>
        </Card>

        {/* Card 2: PRECIFICAÇÃO */}
        <Card className="hover:shadow-lg transition-all border-2">
          <CardHeader className="pb-4">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-300 flex items-center justify-center shrink-0">
                <DollarSign className="h-6 w-6" />
              </div>
            </div>
            <CardTitle className="text-xl">💼 Precificação</CardTitle>
            <CardDescription>
              Configure valores e custos para cálculo automático de preços
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Defina custos fixos, valores de mão de obra e unidades de medida
            </p>
          </CardContent>
        </Card>

        {/* Card 3: FINANCEIRO */}
        <Card className="hover:shadow-lg transition-all border-2">
          <CardHeader className="pb-4">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 rounded-lg bg-teal-50 text-teal-600 dark:bg-teal-950 dark:text-teal-300 flex items-center justify-center shrink-0">
                <Building2 className="h-6 w-6" />
              </div>
            </div>
            <CardTitle className="text-xl">💰 Financeiro</CardTitle>
            <CardDescription>
              Configure contas, documentos e planos para gestão financeira
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Gerencie bancos, tipos de documentos, plano de contas e juros
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
