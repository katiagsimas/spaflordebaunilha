import React from "react";
import { Building2, FileText, Layers, BookOpen, Percent } from "lucide-react";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { PageHeader } from "@/components/PageHeader";
import { BackButton } from "@/components/BackButton";
import { FinanceiroNav } from "@/components/financeiro/FinanceiroNav";

export default function CadastrosFinanceiroPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background px-4 md:px-6 pt-1 pb-4 md:pb-6 space-y-6">
      <PageHeader
        title="Cadastros"
        description="Gerencie bancos, documentos e plano de contas do Financeiro"
        backButton={
          <div className="flex flex-wrap items-center gap-2 w-full">
            <BackButton to="/financeiro" />
            <FinanceiroNav current="/financeiro/cadastros" />
          </div>
        }
      />
      
      <div>
        {/* Grid com 5 Cards */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">

        
        {/* Card: Bancos */}
        <Card 
          className="group cursor-pointer hover:shadow-lg hover:scale-[1.02] transition-all duration-200 border-l-2 border-sfb-terracota/60"
          onClick={() => navigate("/financeiro/cadastros/bancos")}
        >
          <CardHeader className="p-4 space-y-2">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-sfb-baunilha text-sfb-terracota flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                <Building2 className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <CardTitle className="text-base font-semibold leading-tight line-clamp-2">
                  Bancos
                </CardTitle>
              </div>
            </div>
            <CardDescription className="text-xs line-clamp-2">
              Cadastre os bancos que você utiliza
            </CardDescription>
          </CardHeader>
        </Card>

        {/* Card: Tipos de Documentos */}
        <Card 
          className="group cursor-pointer hover:shadow-lg hover:scale-[1.02] transition-all duration-200 border-l-2 border-sfb-terracota/60"
          onClick={() => navigate("/financeiro/cadastros/tipos-documentos")}
        >
          <CardHeader className="p-4 space-y-2">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-sfb-baunilha text-sfb-terracota flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                <FileText className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <CardTitle className="text-base font-semibold leading-tight line-clamp-2">
                  Tipos de Documentos
                </CardTitle>
              </div>
            </div>
            <CardDescription className="text-xs line-clamp-2">
              Tipos de documentos para lançamentos financeiros
            </CardDescription>
          </CardHeader>
        </Card>

        {/* Card: Categorias Plano de Contas */}
        <Card 
          className="group cursor-pointer hover:shadow-lg hover:scale-[1.02] transition-all duration-200 border-l-2 border-sfb-terracota/60"
          onClick={() => navigate("/financeiro/cadastros/categorias-plano-contas")}
        >
          <CardHeader className="p-4 space-y-2">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-sfb-baunilha text-sfb-terracota flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                <Layers className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <CardTitle className="text-base font-semibold leading-tight line-clamp-2">
                  Categorias Plano de Contas
                </CardTitle>
              </div>
            </div>
            <CardDescription className="text-xs line-clamp-2">
              Categorias para classificação de receitas e despesas no DRE
            </CardDescription>
          </CardHeader>
        </Card>

        {/* Card: Plano de Contas */}
        <Card 
          className="group cursor-pointer hover:shadow-lg hover:scale-[1.02] transition-all duration-200 border-l-2 border-sfb-terracota/60"
          onClick={() => navigate("/financeiro/cadastros/plano-contas")}
        >
          <CardHeader className="p-4 space-y-2">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-sfb-baunilha text-sfb-terracota flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                <BookOpen className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <CardTitle className="text-base font-semibold leading-tight line-clamp-2">
                  Plano de Contas
                </CardTitle>
              </div>
            </div>
            <CardDescription className="text-xs line-clamp-2">
              Contas detalhadas para lançamentos financeiros
            </CardDescription>
          </CardHeader>
        </Card>

        {/* Card: Juros e Multas */}
        <Card 
          className="group cursor-pointer hover:shadow-lg hover:scale-[1.02] transition-all duration-200 border-l-2 border-sfb-terracota/60"
          onClick={() => navigate("/financeiro/cadastros/juros")}
        >
          <CardHeader className="p-4 space-y-2">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-sfb-baunilha text-sfb-terracota flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                <Percent className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <CardTitle className="text-base font-semibold leading-tight line-clamp-2">
                  Juros e Multas
                </CardTitle>
              </div>
            </div>
            <CardDescription className="text-xs line-clamp-2">
              Configure juros e multas para pagamentos em atraso
            </CardDescription>
          </CardHeader>
        </Card>
        </div>
      </div>
    </div>
  );
}
