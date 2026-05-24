import React from "react";
import { Settings, DollarSign, Package, Info, HardDrive } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";

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
      <Card className="bg-[#C9A14A]/10 border border-[#C9A14A]/30 mb-8">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <Info className="h-5 w-5 text-[#C9A14A] mt-0.5 shrink-0" />
            <div className="space-y-2">
              <h3 className="font-semibold text-[#5B1A2B]">
                💡 Dica: Configure uma vez, use sempre!
              </h3>
              <p className="text-sm text-[#5B1A2B]">
                Configure todos os valores agora e eles serão aplicados automaticamente em todas as suas 
                fichas técnicas e controles financeiros. Você sempre pode voltar aqui para ajustar conforme seu negócio cresce.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Grid Principal com 3 Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
        
        {/* Card 1: CADASTROS BASE */}
        <Card 
          className="group cursor-pointer hover:shadow-lg hover:scale-[1.02] transition-all duration-200 border-l-2 border-[#C9A14A]/60"
          onClick={() => navigate("/configuracoes/cadastros-base")}
        >
          <CardHeader className="p-4 space-y-2">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-[#FDF6EE] text-[#C9A14A] flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                <Package className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <CardTitle className="text-base font-semibold leading-tight line-clamp-2">
                  Cadastros Base
                </CardTitle>
              </div>
            </div>
            <CardDescription className="text-xs line-clamp-2">
              Gerencie categorias, insumos e embalagens e dados da confeitaria
            </CardDescription>
          </CardHeader>
        </Card>

        {/* Card 2: PRECIFICAÇÃO */}
        <Card 
          className="group cursor-pointer hover:shadow-lg hover:scale-[1.02] transition-all duration-200 border-l-2 border-[#C9A14A]/60"
          onClick={() => navigate("/configuracoes/precificacao")}
        >
          <CardHeader className="p-4 space-y-2">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-[#FDF6EE] text-[#C9A14A] flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                <DollarSign className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <CardTitle className="text-base font-semibold leading-tight line-clamp-2">
                  Precificação
                </CardTitle>
              </div>
            </div>
            <CardDescription className="text-xs line-clamp-2">
              Configure mão de obra, unidades de medida e categorias de receitas
            </CardDescription>
          </CardHeader>
        </Card>

        {/* Card 3: BACKUP */}
        <Card 
          className="group cursor-pointer hover:shadow-lg hover:scale-[1.02] transition-all duration-200 border-l-2 border-[#C9A14A]/60"
          onClick={() => navigate("/configuracoes/backup")}
        >
          <CardHeader className="p-4 space-y-2">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-[#FDF6EE] text-[#C9A14A] flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                <HardDrive className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <CardTitle className="text-base font-semibold leading-tight line-clamp-2">
                  Backup
                </CardTitle>
              </div>
            </div>
            <CardDescription className="text-xs line-clamp-2">
              Realize e restaure backups do seu projeto
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    </div>
  );
}
