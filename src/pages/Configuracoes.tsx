import React from "react";
import { Settings, DollarSign, Package, Building2, Info, Clock, Home, Ruler, Tag, UserCircle, Tags, FileText, Layers, BookOpen, Percent, ArrowRight } from "lucide-react";
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
      <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-3">
        
        {/* Card 1: CADASTROS BASE */}
        <Card 
          className="hover:shadow-lg transition-all cursor-pointer group border-2 hover:border-primary"
          onClick={() => navigate("/configuracoes/cadastros-base")}
        >
          <CardHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 rounded-lg bg-pink-50 text-pink-600 dark:bg-pink-950 dark:text-pink-300 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                <Package className="h-6 w-6" />
              </div>
            </div>
            <CardTitle className="text-lg">
              Cadastros Base
              <ArrowRight className="inline-block ml-2 h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity" />
            </CardTitle>
            <CardDescription>
              Gerencie categorias, tipos de insumos e dados da confeitaria
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              4 configurações disponíveis
            </p>
          </CardContent>
        </Card>

        {/* Card 2: PRECIFICAÇÃO */}
        <Card className="hover:shadow-lg transition-all border-2 hover:border-primary">
          <CardHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-300 flex items-center justify-center shrink-0">
                <DollarSign className="h-6 w-6" />
              </div>
            </div>
            <CardTitle className="text-lg">Precificação</CardTitle>
            <CardDescription>
              Configure custos fixos, mão de obra e unidades de medida
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <button
                onClick={() => navigate("/configuracoes/precificacao/mao-obra")}
                className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-accent/50 transition-all group text-left"
              >
                <div className="flex items-center gap-3">
                  <Clock className="h-4 w-4 text-blue-600" />
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
                  <Home className="h-4 w-4 text-purple-600" />
                  <span className="text-sm font-medium">Custos Fixos</span>
                </div>
                <ArrowRight className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity" />
              </button>

              <button
                onClick={() => navigate("/configuracoes/unidades-medida")}
                className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-accent/50 transition-all group text-left"
              >
                <div className="flex items-center gap-3">
                  <Ruler className="h-4 w-4 text-amber-600" />
                  <span className="text-sm font-medium">Unidades de Medidas</span>
                </div>
                <ArrowRight className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity" />
              </button>
            </div>
          </CardContent>
        </Card>

        {/* Card 3: FINANCEIRO */}
        <Card className="hover:shadow-lg transition-all border-2 hover:border-primary">
          <CardHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 rounded-lg bg-teal-50 text-teal-600 dark:bg-teal-950 dark:text-teal-300 flex items-center justify-center shrink-0">
                <Building2 className="h-6 w-6" />
              </div>
            </div>
            <CardTitle className="text-lg">Financeiro</CardTitle>
            <CardDescription>
              Gerencie bancos, documentos e plano de contas
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <button
                onClick={() => navigate("/configuracoes/bancos")}
                className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-accent/50 transition-all group text-left"
              >
                <div className="flex items-center gap-3">
                  <Building2 className="h-4 w-4 text-teal-600" />
                  <span className="text-sm font-medium">Bancos</span>
                </div>
                <ArrowRight className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity" />
              </button>

              <button
                onClick={() => navigate("/configuracoes/tipos-documentos")}
                className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-accent/50 transition-all group text-left"
              >
                <div className="flex items-center gap-3">
                  <FileText className="h-4 w-4 text-pink-600" />
                  <span className="text-sm font-medium">Tipos de Documentos</span>
                </div>
                <ArrowRight className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity" />
              </button>

              <button
                onClick={() => navigate("/configuracoes/categorias-plano-contas")}
                className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-accent/50 transition-all group text-left"
              >
                <div className="flex items-center gap-3">
                  <Layers className="h-4 w-4 text-blue-600" />
                  <span className="text-sm font-medium">Categorias Plano de Contas</span>
                </div>
                <ArrowRight className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity" />
              </button>

              <button
                onClick={() => navigate("/configuracoes/plano-contas")}
                className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-accent/50 transition-all group text-left"
              >
                <div className="flex items-center gap-3">
                  <BookOpen className="h-4 w-4 text-orange-600" />
                  <span className="text-sm font-medium">Plano de Contas</span>
                </div>
                <ArrowRight className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity" />
              </button>

              <button
                onClick={() => navigate("/configuracoes/juros")}
                className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-accent/50 transition-all group text-left"
              >
                <div className="flex items-center gap-3">
                  <Percent className="h-4 w-4 text-red-600" />
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
