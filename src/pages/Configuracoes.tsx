import React from "react";
import { Settings, DollarSign, Package, Building2, Info, Clock, Ruler, Tag, UserCircle, Tags, FileText, Layers, BookOpen, Percent } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";

export default function Configuracoes() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background p-4 md:p-6">
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <Settings className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Configurações</h1>
            <p className="text-muted-foreground">Organize e configure todos os aspectos do seu negócio</p>
          </div>
        </div>
      </div>

      <Card className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20 border-blue-200 dark:border-blue-800 mb-8">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <Info className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5 shrink-0" />
            <div className="space-y-2">
              <h3 className="font-semibold text-blue-900 dark:text-blue-100">💡 Dica: Configure uma vez, use sempre!</h3>
              <p className="text-sm text-blue-700 dark:text-blue-300">Configure todos os valores agora e eles serão aplicados automaticamente em todas as suas fichas técnicas e controles financeiros.</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* BLOCO 1: CONFEITARIA & BASE */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-4">
          <Package className="h-5 w-5 text-pink-600 dark:text-pink-400" />
          <h2 className="text-xl font-bold">Confeitaria & Base</h2>
        </div>
        <p className="text-sm text-muted-foreground mb-4">Configurações gerais que não afetam precificação</p>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <Card className="group cursor-pointer hover:shadow-lg hover:scale-[1.02] transition-all duration-200 border-l-4 border-l-pink-500" onClick={() => navigate("/configuracoes/seus-dados")}>
            <CardHeader className="p-4 space-y-2">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-pink-50 dark:bg-pink-950 text-pink-600 dark:text-pink-400 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                  <UserCircle className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <CardTitle className="text-sm font-semibold leading-tight line-clamp-2">Dados da Confeitaria</CardTitle>
                </div>
              </div>
              <CardDescription className="text-xs line-clamp-2">Nome, contatos e informações do negócio</CardDescription>
            </CardHeader>
          </Card>

          <Card className="group cursor-pointer hover:shadow-lg hover:scale-[1.02] transition-all duration-200 border-l-4 border-l-purple-500" onClick={() => navigate("/configuracoes/categorias-estoque")}>
            <CardHeader className="p-4 space-y-2">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-purple-50 dark:bg-purple-950 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                  <Layers className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <CardTitle className="text-sm font-semibold leading-tight line-clamp-2">Categorias de Estoque</CardTitle>
                </div>
              </div>
              <CardDescription className="text-xs line-clamp-2">Organize ingredientes e embalagens</CardDescription>
            </CardHeader>
          </Card>

          <Card className="group cursor-pointer hover:shadow-lg hover:scale-[1.02] transition-all duration-200 border-l-4 border-l-amber-500" onClick={() => navigate("/configuracoes/unidades-medida")}>
            <CardHeader className="p-4 space-y-2">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-amber-50 dark:bg-amber-950 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                  <Ruler className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <CardTitle className="text-sm font-semibold leading-tight line-clamp-2">Unidades de Medida</CardTitle>
                </div>
              </div>
              <CardDescription className="text-xs line-clamp-2">Kg, litros, unidades e outras medidas</CardDescription>
            </CardHeader>
          </Card>

          <Card className="group cursor-pointer hover:shadow-lg hover:scale-[1.02] transition-all duration-200 border-l-4 border-l-indigo-500" onClick={() => navigate("/configuracoes/tags-encomendas")}>
            <CardHeader className="p-4 space-y-2">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                  <Tags className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <CardTitle className="text-sm font-semibold leading-tight line-clamp-2">Tags de Encomendas</CardTitle>
                </div>
              </div>
              <CardDescription className="text-xs line-clamp-2">Etiquetas para organizar pedidos</CardDescription>
            </CardHeader>
          </Card>
        </div>
      </div>

      {/* BLOCO 2: PRECIFICAÇÃO */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-4">
          <DollarSign className="h-5 w-5 text-blue-600 dark:text-blue-400" />
          <h2 className="text-xl font-bold">Precificação</h2>
        </div>
        <p className="text-sm text-muted-foreground mb-4">Tudo que influencia cálculos de CMV, margem e preço de venda</p>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Card className="group cursor-pointer hover:shadow-lg hover:scale-[1.02] transition-all duration-200 border-l-4 border-l-blue-500" onClick={() => navigate("/configuracoes/categorias")}>
            <CardHeader className="p-4 space-y-2">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                  <Tag className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <CardTitle className="text-sm font-semibold leading-tight line-clamp-2">Categorias de Receitas</CardTitle>
                </div>
              </div>
              <CardDescription className="text-xs line-clamp-2">Classifique bolos, doces, tortas e mais</CardDescription>
            </CardHeader>
          </Card>

          <Card className="group cursor-pointer hover:shadow-lg hover:scale-[1.02] transition-all duration-200 border-l-4 border-l-cyan-500" onClick={() => navigate("/configuracoes/precificacao/mao-de-obra")}>
            <CardHeader className="p-4 space-y-2">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-cyan-50 dark:bg-cyan-950 text-cyan-600 dark:text-cyan-400 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                  <Clock className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <CardTitle className="text-sm font-semibold leading-tight line-clamp-2">Mão de Obra</CardTitle>
                </div>
              </div>
              <CardDescription className="text-xs line-clamp-2">Valor/hora e perfis de trabalho</CardDescription>
            </CardHeader>
          </Card>
        </div>
      </div>

      {/* BLOCO 3: FINANCEIRO */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <Building2 className="h-5 w-5 text-teal-600 dark:text-teal-400" />
          <h2 className="text-xl font-bold">Financeiro</h2>
        </div>
        <p className="text-sm text-muted-foreground mb-4">Configurações para controle financeiro e DRE</p>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <Card className="group cursor-pointer hover:shadow-lg hover:scale-[1.02] transition-all duration-200 border-l-4 border-l-teal-500" onClick={() => navigate("/configuracoes/bancos")}>
            <CardHeader className="p-4 space-y-2">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-teal-50 dark:bg-teal-950 text-teal-600 dark:text-teal-400 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                  <Building2 className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <CardTitle className="text-sm font-semibold leading-tight line-clamp-2">Bancos</CardTitle>
                </div>
              </div>
              <CardDescription className="text-xs line-clamp-2">Contas bancárias e saldos</CardDescription>
            </CardHeader>
          </Card>

          <Card className="group cursor-pointer hover:shadow-lg hover:scale-[1.02] transition-all duration-200 border-l-4 border-l-emerald-500" onClick={() => navigate("/configuracoes/tipos-documentos")}>
            <CardHeader className="p-4 space-y-2">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                  <FileText className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <CardTitle className="text-sm font-semibold leading-tight line-clamp-2">Tipos de Documentos</CardTitle>
                </div>
              </div>
              <CardDescription className="text-xs line-clamp-2">PIX, boleto, transferência, etc</CardDescription>
            </CardHeader>
          </Card>

          <Card className="group cursor-pointer hover:shadow-lg hover:scale-[1.02] transition-all duration-200 border-l-4 border-l-sky-500" onClick={() => navigate("/configuracoes/plano-contas")}>
            <CardHeader className="p-4 space-y-2">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-sky-50 dark:bg-sky-950 text-sky-600 dark:text-sky-400 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                  <BookOpen className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <CardTitle className="text-sm font-semibold leading-tight line-clamp-2">Plano de Contas</CardTitle>
                </div>
              </div>
              <CardDescription className="text-xs line-clamp-2">Estrutura contábil do DRE</CardDescription>
            </CardHeader>
          </Card>

          <Card className="group cursor-pointer hover:shadow-lg hover:scale-[1.02] transition-all duration-200 border-l-4 border-l-orange-500" onClick={() => navigate("/configuracoes/juros")}>
            <CardHeader className="p-4 space-y-2">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-orange-50 dark:bg-orange-950 text-orange-600 dark:text-orange-400 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                  <Percent className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <CardTitle className="text-sm font-semibold leading-tight line-clamp-2">Juros e Multas</CardTitle>
                </div>
              </div>
              <CardDescription className="text-xs line-clamp-2">Taxas para atrasos de pagamento</CardDescription>
            </CardHeader>
          </Card>
        </div>
      </div>
    </div>
  );
}
