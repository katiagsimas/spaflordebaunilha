import React from "react";
import { Settings, DollarSign, Clock, Home, Ruler, Tag, Package, ChefHat, ArrowRight, Info, UserCircle, Tags, Building2, FileText, Layers, BookOpen, Percent } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";

export default function Configuracoes() {
  const navigate = useNavigate();

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
      <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-3 mb-8">
        
        {/* Card 1: CADASTROS BASE */}
        <Card className="hover:shadow-lg transition-all border-2 hover:border-primary">
          <CardHeader className="pb-4">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 rounded-lg bg-pink-50 text-pink-600 dark:bg-pink-950 dark:text-pink-300 flex items-center justify-center shrink-0">
                <Package className="h-6 w-6" />
              </div>
            </div>
            <CardTitle className="text-xl">📦 Cadastros Base</CardTitle>
            <CardDescription>
              Gerencie elementos usados nas fichas técnicas
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 grid-cols-2">
              <Card 
                className="cursor-pointer hover:shadow-md transition-all group border hover:border-indigo-300"
                onClick={() => navigate("/configuracoes/dados-confeitaria")}
              >
                <CardContent className="p-4">
                  <div className="flex flex-col items-center text-center gap-2">
                    <div className="w-10 h-10 rounded-lg bg-indigo-50 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-300 flex items-center justify-center group-hover:scale-110 transition-transform">
                      <UserCircle className="h-5 w-5" />
                    </div>
                    <span className="text-xs font-medium">Dados da Confeitaria</span>
                  </div>
                </CardContent>
              </Card>

              <Card 
                className="cursor-pointer hover:shadow-md transition-all group border hover:border-pink-300"
                onClick={() => navigate("/configuracoes/categorias-receitas")}
              >
                <CardContent className="p-4">
                  <div className="flex flex-col items-center text-center gap-2">
                    <div className="w-10 h-10 rounded-lg bg-pink-50 text-pink-600 dark:bg-pink-950 dark:text-pink-300 flex items-center justify-center group-hover:scale-110 transition-transform">
                      <Tag className="h-5 w-5" />
                    </div>
                    <span className="text-xs font-medium">Categorias de Receitas</span>
                  </div>
                </CardContent>
              </Card>

              <Card 
                className="cursor-pointer hover:shadow-md transition-all group border hover:border-green-300"
                onClick={() => navigate("/configuracoes/tipos-insumos")}
              >
                <CardContent className="p-4">
                  <div className="flex flex-col items-center text-center gap-2">
                    <div className="w-10 h-10 rounded-lg bg-green-50 text-green-600 dark:bg-green-950 dark:text-green-300 flex items-center justify-center group-hover:scale-110 transition-transform">
                      <Package className="h-5 w-5" />
                    </div>
                    <span className="text-xs font-medium">Tipos de Insumos</span>
                  </div>
                </CardContent>
              </Card>

              <Card 
                className="cursor-pointer hover:shadow-md transition-all group border hover:border-purple-300"
                onClick={() => navigate("/configuracoes/tags-encomendas")}
              >
                <CardContent className="p-4">
                  <div className="flex flex-col items-center text-center gap-2">
                    <div className="w-10 h-10 rounded-lg bg-purple-50 text-purple-600 dark:bg-purple-950 dark:text-purple-300 flex items-center justify-center group-hover:scale-110 transition-transform">
                      <Tags className="h-5 w-5" />
                    </div>
                    <span className="text-xs font-medium">Tags de Encomendas</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </CardContent>
        </Card>

        {/* Card 2: PRECIFICAÇÃO */}
        <Card className="hover:shadow-lg transition-all border-2 hover:border-primary">
          <CardHeader className="pb-4">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-300 flex items-center justify-center shrink-0">
                <DollarSign className="h-6 w-6" />
              </div>
            </div>
            <CardTitle className="text-xl">💼 Precificação</CardTitle>
            <CardDescription>
              Configure valores e custos para cálculo automático
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <button
                onClick={() => navigate("/configuracoes/precificacao/mao-obra")}
                className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-accent/50 transition-all group text-left"
              >
                <div className="flex items-center gap-3">
                  <Clock className="h-5 w-5 text-blue-600" />
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">Mão de Obra</span>
                    <Badge variant="secondary" className="bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300 text-xs">
                      Novo
                    </Badge>
                  </div>
                </div>
                <ArrowRight className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity" />
              </button>

              <button
                onClick={() => navigate("/configuracoes/precificacao/custos-fixos")}
                className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-accent/50 transition-all group text-left"
              >
                <div className="flex items-center gap-3">
                  <Home className="h-5 w-5 text-purple-600" />
                  <span className="text-sm font-medium">Custos Fixos</span>
                </div>
                <ArrowRight className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity" />
              </button>

              <button
                onClick={() => navigate("/configuracoes/unidades-medida")}
                className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-accent/50 transition-all group text-left"
              >
                <div className="flex items-center gap-3">
                  <Ruler className="h-5 w-5 text-amber-600" />
                  <span className="text-sm font-medium">Unidades de Medidas</span>
                </div>
                <ArrowRight className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity" />
              </button>
            </div>
          </CardContent>
        </Card>

        {/* Card 3: FINANCEIRO */}
        <Card className="hover:shadow-lg transition-all border-2 hover:border-primary">
          <CardHeader className="pb-4">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 rounded-lg bg-teal-50 text-teal-600 dark:bg-teal-950 dark:text-teal-300 flex items-center justify-center shrink-0">
                <Building2 className="h-6 w-6" />
              </div>
            </div>
            <CardTitle className="text-xl">💰 Financeiro</CardTitle>
            <CardDescription>
              Configure contas, documentos e planos financeiros
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <button
                onClick={() => navigate("/configuracoes/bancos")}
                className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-accent/50 transition-all group text-left"
              >
                <div className="flex items-center gap-3">
                  <Building2 className="h-5 w-5 text-teal-600" />
                  <span className="text-sm font-medium">Bancos</span>
                </div>
                <ArrowRight className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity" />
              </button>

              <button
                onClick={() => navigate("/configuracoes/tipos-documentos")}
                className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-accent/50 transition-all group text-left"
              >
                <div className="flex items-center gap-3">
                  <FileText className="h-5 w-5 text-pink-600" />
                  <span className="text-sm font-medium">Tipos de Documentos</span>
                </div>
                <ArrowRight className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity" />
              </button>

              <button
                onClick={() => navigate("/configuracoes/categorias-plano-contas")}
                className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-accent/50 transition-all group text-left"
              >
                <div className="flex items-center gap-3">
                  <Layers className="h-5 w-5 text-blue-600" />
                  <span className="text-sm font-medium">Categorias Plano de Contas</span>
                </div>
                <ArrowRight className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity" />
              </button>

              <button
                onClick={() => navigate("/configuracoes/plano-contas")}
                className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-accent/50 transition-all group text-left"
              >
                <div className="flex items-center gap-3">
                  <BookOpen className="h-5 w-5 text-orange-600" />
                  <span className="text-sm font-medium">Plano de Contas</span>
                </div>
                <ArrowRight className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity" />
              </button>

              <button
                onClick={() => navigate("/configuracoes/juros")}
                className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-accent/50 transition-all group text-left"
              >
                <div className="flex items-center gap-3">
                  <Percent className="h-5 w-5 text-red-600" />
                  <span className="text-sm font-medium">Juros e Multas</span>
                </div>
                <ArrowRight className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity" />
              </button>
            </div>
          </CardContent>
        </Card>
      </div>

    </div>
  );
}
