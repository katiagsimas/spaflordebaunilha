import React from "react";
import { Package, UserCircle, Tag, Archive } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { PageHeader } from "@/components/PageHeader";
import { BackButton } from "@/components/BackButton";

export default function CadastrosBase() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <PageHeader
        title="Cadastros Base"
        description="Gerencie categorias, tipos de insumos e dados da confeitaria"
        backButton={<BackButton to="/configuracoes" />}
      />
      
      <div className="p-4 md:p-6">

        {/* Grid com 4 Cards */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        
        {/* Card: Dados da Confeitaria */}
        <Card 
          className="group cursor-pointer hover:shadow-lg hover:scale-[1.02] transition-all duration-200 border-l-4 border-l-indigo-500"
          onClick={() => navigate("/configuracoes/dados-confeitaria")}
        >
          <CardHeader className="p-4 space-y-2">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                <UserCircle className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <CardTitle className="text-base font-semibold leading-tight line-clamp-2">
                  Dados da Confeitaria
                </CardTitle>
              </div>
            </div>
            <CardDescription className="text-xs line-clamp-2">
              Informações básicas do negócio
            </CardDescription>
          </CardHeader>
        </Card>

        {/* Card: Categorias de Receitas */}
        <Card 
          className="group cursor-pointer hover:shadow-lg hover:scale-[1.02] transition-all duration-200 border-l-4 border-l-pink-500"
          onClick={() => navigate("/configuracoes/categorias-receitas")}
        >
          <CardHeader className="p-4 space-y-2">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-pink-50 dark:bg-pink-950 text-pink-600 dark:text-pink-400 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
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

        {/* Card: Categorias de Estoque */}
        <Card 
          className="group cursor-pointer hover:shadow-lg hover:scale-[1.02] transition-all duration-200 border-l-4 border-l-amber-500"
          onClick={() => navigate("/configuracoes/categorias-estoque")}
        >
          <CardHeader className="p-4 space-y-2">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-amber-50 dark:bg-amber-950 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                <Archive className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <CardTitle className="text-base font-semibold leading-tight line-clamp-2">
                  Categorias de Estoque
                </CardTitle>
              </div>
            </div>
            <CardDescription className="text-xs line-clamp-2">
              Organize insumos por categorias de estoque
            </CardDescription>
          </CardHeader>
        </Card>
        </div>
      </div>
    </div>
  );
}
