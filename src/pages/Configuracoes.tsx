import React from "react";
import { Settings, DollarSign, Clock, Home, Ruler, Tag, Package, ChefHat, ArrowRight, Info, UserCircle, Tags, Building2, FileText, Layers, BookOpen, Percent } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { useConfigStatus } from "@/hooks/useConfigStatus";

export default function Configuracoes() {
  const navigate = useNavigate();
  const { status, isLoading } = useConfigStatus();

  const getStatusBadge = (statusKey: "seusDados" | null) => {
    if (!statusKey || !status) return null;
    
    const isCompleted = status[statusKey];
    
    if (isCompleted) {
      return (
        <Badge variant="secondary" className="bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300">
          ✓ Concluído
        </Badge>
      );
    }
    
    return (
      <Badge variant="secondary" className="bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300">
        ⏱ Pendente
      </Badge>
    );
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background p-4 md:p-6 flex items-center justify-center">
        <div className="text-muted-foreground">Carregando...</div>
      </div>
    );
  }


  return (
    <div className="min-h-screen bg-background p-4 md:p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <Settings className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Configurações</h1>
            <p className="text-muted-foreground">Configure o sistema de acordo com suas necessidades</p>
          </div>
        </div>
      </div>

      {/* Seção 1: PRECIFICAÇÃO */}
      <div className="mb-12">
        <div className="mb-4">
          <div className="flex items-center gap-2 mb-1">
            <DollarSign className="h-5 w-5 text-primary" />
            <h2 className="text-2xl font-bold">💼 Precificação</h2>
          </div>
          <p className="text-muted-foreground">Configure valores e custos para cálculo automático</p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {/* Card: Valores de Mão de Obra */}
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
            <CardContent>
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  📊 Configure valores diferentes por tipo
                </p>
                <p className="text-xs text-primary font-medium">
                  Gerenciar Valores →
                </p>
              </div>
            </CardContent>
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
            <CardContent>
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  💰 Despesas fixas mensais
                </p>
                <p className="text-xs text-primary font-medium">
                  Gerenciar Custos →
                </p>
              </div>
            </CardContent>
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
            <CardContent>
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  📊 Unidades de medida
                </p>
                <p className="text-xs text-primary font-medium">
                  Gerenciar Unidades →
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Seção 2: CADASTROS BASE */}
      <div className="mb-12">
        <div className="mb-4">
          <div className="flex items-center gap-2 mb-1">
            <Package className="h-5 w-5 text-primary" />
            <h2 className="text-2xl font-bold">📦 Cadastros Base</h2>
          </div>
          <p className="text-muted-foreground">Gerencie elementos usados nas fichas técnicas</p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {/* Card: Dados da Confeitaria */}
          <Card 
            className="hover:shadow-lg transition-all cursor-pointer group border-2 hover:border-indigo-300"
            onClick={() => navigate("/configuracoes/dados-confeitaria")}
          >
            <CardHeader className="pb-3">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-12 h-12 rounded-lg bg-indigo-50 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-300 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                  <UserCircle className="h-6 w-6" />
                </div>
                {getStatusBadge("seusDados")}
              </div>
              <CardTitle className="text-lg">
                Dados da Confeitaria
                <ArrowRight className="inline-block ml-2 h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity" />
              </CardTitle>
              <CardDescription>
                Informações básicas do negócio
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  📊 Configure seus dados
                </p>
                <p className="text-xs text-primary font-medium">
                  Gerenciar →
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Card: Categorias */}
          <Card 
            className="hover:shadow-lg transition-all cursor-pointer group border-2 hover:border-pink-300"
            onClick={() => navigate("/configuracoes/categorias-receitas")}
          >
            <CardHeader className="pb-3">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-12 h-12 rounded-lg bg-pink-50 text-pink-600 dark:bg-pink-950 dark:text-pink-300 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                  <Tag className="h-6 w-6" />
                </div>
              </div>
              <CardTitle className="text-lg">
                Categorias de Receitas
                <ArrowRight className="inline-block ml-2 h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity" />
              </CardTitle>
              <CardDescription>
                Organize seus produtos por categorias
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  📊 Organize suas receitas
                </p>
                <p className="text-xs text-primary font-medium">
                  Gerenciar Categorias →
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Card: Tipos de Insumos */}
          <Card 
            className="hover:shadow-lg transition-all cursor-pointer group border-2 hover:border-green-300"
            onClick={() => navigate("/configuracoes/tipos-insumos")}
          >
            <CardHeader className="pb-3">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-12 h-12 rounded-lg bg-green-50 text-green-600 dark:bg-green-950 dark:text-green-300 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                  <Package className="h-6 w-6" />
                </div>
              </div>
              <CardTitle className="text-lg">
                Tipos de Insumos e Embalagens
                <ArrowRight className="inline-block ml-2 h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity" />
              </CardTitle>
              <CardDescription>
                Tipos de ingredientes e embalagens
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  📊 Cadastre os tipos base
                </p>
                <p className="text-xs text-primary font-medium">
                  Gerenciar Tipos →
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Card: Tags de Encomendas */}
          <Card 
            className="hover:shadow-lg transition-all cursor-pointer group border-2 hover:border-purple-300"
            onClick={() => navigate("/configuracoes/tags-encomendas")}
          >
            <CardHeader className="pb-3">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-12 h-12 rounded-lg bg-purple-50 text-purple-600 dark:bg-purple-950 dark:text-purple-300 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                  <Tags className="h-6 w-6" />
                </div>
              </div>
              <CardTitle className="text-lg">
                Tags de Encomendas
                <ArrowRight className="inline-block ml-2 h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity" />
              </CardTitle>
              <CardDescription>
                Crie e gerencie tags para categorizar suas encomendas
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  📊 Organize suas encomendas
                </p>
                <p className="text-xs text-primary font-medium">
                  Gerenciar Tags →
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Seção 3: FINANCEIRO */}
      <div className="mb-12">
        <div className="mb-4">
          <div className="flex items-center gap-2 mb-1">
            <Building2 className="h-5 w-5 text-primary" />
            <h2 className="text-2xl font-bold">💰 Financeiro</h2>
          </div>
          <p className="text-muted-foreground">Configure contas, documentos e planos financeiros</p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {/* Card: Bancos */}
          <Card 
            className="hover:shadow-lg transition-all cursor-pointer group border-2 hover:border-teal-300"
            onClick={() => navigate("/configuracoes/bancos")}
          >
            <CardHeader className="pb-3">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-12 h-12 rounded-lg bg-teal-50 text-teal-600 dark:bg-teal-950 dark:text-teal-300 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                  <Building2 className="h-6 w-6" />
                </div>
              </div>
              <CardTitle className="text-lg">
                Bancos
                <ArrowRight className="inline-block ml-2 h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity" />
              </CardTitle>
              <CardDescription>
                Cadastre os bancos que você utiliza
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  📊 Gerencie contas bancárias
                </p>
                <p className="text-xs text-primary font-medium">
                  Gerenciar Bancos →
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Card: Tipos de Documentos */}
          <Card 
            className="hover:shadow-lg transition-all cursor-pointer group border-2 hover:border-pink-300"
            onClick={() => navigate("/configuracoes/tipos-documentos")}
          >
            <CardHeader className="pb-3">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-12 h-12 rounded-lg bg-pink-50 text-pink-600 dark:bg-pink-950 dark:text-pink-300 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                  <FileText className="h-6 w-6" />
                </div>
              </div>
              <CardTitle className="text-lg">
                Tipos de Documentos
                <ArrowRight className="inline-block ml-2 h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity" />
              </CardTitle>
              <CardDescription>
                Tipos de documentos para lançamentos financeiros
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  📊 Configure tipos de documento
                </p>
                <p className="text-xs text-primary font-medium">
                  Gerenciar Tipos →
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Card: Categorias Plano de Contas */}
          <Card 
            className="hover:shadow-lg transition-all cursor-pointer group border-2 hover:border-blue-300"
            onClick={() => navigate("/configuracoes/categorias-plano-contas")}
          >
            <CardHeader className="pb-3">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-12 h-12 rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-300 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                  <Layers className="h-6 w-6" />
                </div>
              </div>
              <CardTitle className="text-lg">
                Categorias Plano de Contas
                <ArrowRight className="inline-block ml-2 h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity" />
              </CardTitle>
              <CardDescription>
                Categorias para classificação de receitas e despesas no DRE
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  📊 Categorias do DRE
                </p>
                <p className="text-xs text-primary font-medium">
                  Gerenciar Categorias →
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Card: Plano de Contas */}
          <Card 
            className="hover:shadow-lg transition-all cursor-pointer group border-2 hover:border-orange-300"
            onClick={() => navigate("/configuracoes/plano-contas")}
          >
            <CardHeader className="pb-3">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-12 h-12 rounded-lg bg-orange-50 text-orange-600 dark:bg-orange-950 dark:text-orange-300 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                  <BookOpen className="h-6 w-6" />
                </div>
              </div>
              <CardTitle className="text-lg">
                Plano de Contas
                <ArrowRight className="inline-block ml-2 h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity" />
              </CardTitle>
              <CardDescription>
                Contas detalhadas para lançamentos financeiros
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  📊 Contas financeiras
                </p>
                <p className="text-xs text-primary font-medium">
                  Gerenciar Contas →
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Card: Juros e Multas */}
          <Card 
            className="hover:shadow-lg transition-all cursor-pointer group border-2 hover:border-red-300"
            onClick={() => navigate("/configuracoes/juros")}
          >
            <CardHeader className="pb-3">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-12 h-12 rounded-lg bg-red-50 text-red-600 dark:bg-red-950 dark:text-red-300 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                  <Percent className="h-6 w-6" />
                </div>
              </div>
              <CardTitle className="text-lg">
                Juros e Multas
                <ArrowRight className="inline-block ml-2 h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity" />
              </CardTitle>
              <CardDescription>
                Configure juros e multas para pagamentos em atraso
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  📊 Configure taxas
                </p>
                <p className="text-xs text-primary font-medium">
                  Gerenciar →
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Card Informativo */}
      <Card className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20 border-blue-200 dark:border-blue-800">
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
    </div>
  );
}
