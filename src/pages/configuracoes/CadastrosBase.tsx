import React from "react";
import { Package, UserCircle, Tag, Tags, ArrowRight, ArrowLeft } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";

export default function CadastrosBase() {
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
          <Package className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Cadastros Base</h1>
            <p className="text-muted-foreground">Gerencie categorias, tipos de insumos e dados da confeitaria</p>
          </div>
        </div>
      </div>

      {/* Grid com 4 Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        
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
            </div>
            <CardTitle className="text-lg">
              Dados da Confeitaria
              <ArrowRight className="inline-block ml-2 h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity" />
            </CardTitle>
            <CardDescription>
              Informações básicas do negócio
            </CardDescription>
          </CardHeader>
        </Card>

        {/* Card: Categorias de Receitas */}
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
              Tipos de Insumos
              <ArrowRight className="inline-block ml-2 h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity" />
            </CardTitle>
            <CardDescription>
              Tipos de ingredientes e embalagens
            </CardDescription>
          </CardHeader>
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
              Crie e gerencie tags para categorizar encomendas
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    </div>
  );
}
