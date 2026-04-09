import React from "react";
import { Settings, DollarSign, Package, Building2, Info, HardDrive } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { usePlano } from "@/hooks/usePlano";
import { useIsAdmin } from "@/hooks/useIsAdmin";

export default function Configuracoes() {
  const navigate = useNavigate();
  const { rotaBloqueada, isLoading: isPlanoLoading } = usePlano();
  const { isAdmin, isLoading: isAdminLoading } = useIsAdmin();
  const financeiroBloqueado = !isPlanoLoading && !isAdminLoading && !isAdmin && rotaBloqueada("/configuracoes/financeiro");

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
          className="group cursor-pointer hover:shadow-lg hover:scale-[1.02] transition-all duration-200 border-l-4 border-l-pink-500"
          onClick={() => navigate("/configuracoes/cadastros-base")}
        >
          <CardHeader className="p-4 space-y-2">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-pink-50 dark:bg-pink-950 text-pink-600 dark:text-pink-400 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
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
          className="group cursor-pointer hover:shadow-lg hover:scale-[1.02] transition-all duration-200 border-l-4 border-l-blue-500"
          onClick={() => navigate("/configuracoes/precificacao")}
        >
          <CardHeader className="p-4 space-y-2">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
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

        {/* Card 3: FINANCEIRO — oculto para Plano Base */}
        {!financeiroBloqueado && (
        <Card 
          className="group cursor-pointer hover:shadow-lg hover:scale-[1.02] transition-all duration-200 border-l-4 border-l-teal-500"
          onClick={() => navigate("/configuracoes/financeiro")}
        >
          <CardHeader className="p-4 space-y-2">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-teal-50 dark:bg-teal-950 text-teal-600 dark:text-teal-400 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                <Building2 className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <CardTitle className="text-base font-semibold leading-tight line-clamp-2">
                  Financeiro
                </CardTitle>
              </div>
            </div>
            <CardDescription className="text-xs line-clamp-2">
              Gerencie bancos, documentos e plano de contas
            </CardDescription>
          </CardHeader>
        </Card>
        )}

        {/* Card 4: BACKUP */}
        <Card 
          className="group cursor-pointer hover:shadow-lg hover:scale-[1.02] transition-all duration-200 border-l-4 border-l-emerald-500"
          onClick={() => navigate("/configuracoes/backup")}
        >
          <CardHeader className="p-4 space-y-2">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
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
