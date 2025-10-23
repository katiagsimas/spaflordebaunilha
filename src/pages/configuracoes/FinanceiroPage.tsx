import React from "react";
import { Building2, FileText, Layers, BookOpen, Percent, ArrowRight } from "lucide-react";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { PageHeader } from "@/components/PageHeader";
import { BackButton } from "@/components/BackButton";

export default function FinanceiroPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <PageHeader
        title="Financeiro"
        description="Gerencie bancos, documentos e plano de contas"
        backButton={<BackButton to="/configuracoes" />}
      />
      
      <div className="p-4 md:p-6">
        {/* Grid com 5 Cards */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        
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
        </Card>
        </div>
      </div>
    </div>
  );
}
