import React from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider, useQuery } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { GroupProvider } from "@/contexts/GroupContext";
import { GlobalLoadingProvider, useGlobalLoading } from "@/contexts/GlobalLoadingContext";
import { LoadingMascote } from "@/components/LoadingMascote";
import { FirstAccessRedirect } from "@/components/FirstAccessRedirect";
import { AlertaExpiracaoPlano } from "@/components/AlertaExpiracaoPlano";
import { PlanExpirationWatcher } from "@/components/PlanExpirationWatcher";
import Dashboard from "./pages/Dashboard";
import Encomendas from "./pages/Encomendas";
import Precificacao from "./pages/Precificacao";
import Planejamento from "./pages/Planejamento";
import SeusDados from "./pages/cadastros/SeusDados";
import MaoDeObra from "./pages/configuracoes/precificacao/MaoDeObra";

import CadastrosBase from "./pages/configuracoes/CadastrosBase";
import PrecificacaoPage from "./pages/configuracoes/PrecificacaoPage";
import CadastrosFinanceiroPage from "./pages/configuracoes/FinanceiroPage";
import Clientes from "./pages/cadastros/Clientes";
import Fornecedores from "./pages/cadastros/Fornecedores";
import UnidadesMedida from "./pages/cadastros/UnidadesMedida";
import Categorias from "./pages/cadastros/Categorias";

import Receitas from "./pages/Receitas";
import ReceitaForm from "./pages/ReceitaForm";
import Configuracoes from "./pages/Configuracoes";
import ClientesFornecedores from "./pages/ClientesFornecedores";
import TiposInsumos from "./pages/configuracoes/TiposInsumos";
import CategoriasPlanoContas from "./pages/configuracoes/CategoriasPlanoContas";
import PlanoContas from "./pages/configuracoes/PlanoContas";
import Bancos from "./pages/configuracoes/Bancos";
import TiposDocumentos from "./pages/configuracoes/TiposDocumentos";
import ConfiguracaoJurosPage from "./pages/configuracoes/ConfiguracaoJuros";
import TagsEncomendasPage from "./pages/configuracoes/TagsEncomendas";
import BackupPage from "./pages/configuracoes/Backup";
import Ingredientes from "./pages/precificacao/Ingredientes";
import Embalagens from "./pages/precificacao/Embalagens";
import PrePreparos from "./pages/precificacao/PrePreparos";
import PrePreparoForm from "./pages/precificacao/PrePreparoForm";
import Financeiro from "./pages/financeiro/Financeiro";
import DashboardFinanceiro from "./pages/financeiro/DashboardFinanceiro";
import ContasReceber from "./pages/financeiro/ContasReceber";
import ContasReceberForm from "./pages/financeiro/ContasReceberForm";
import ContasReceberDetalhes from "./pages/financeiro/ContasReceberDetalhes";
import ContasPagar from "./pages/financeiro/ContasPagar";
import ContasPagarForm from "./pages/financeiro/ContasPagarForm";
import ContasPagarDetalhes from "./pages/financeiro/ContasPagarDetalhes";
import FluxoCaixaHub from "./pages/financeiro/FluxoCaixaHub";
import FluxoCaixaDiario from "./pages/financeiro/FluxoCaixaDiario";
import FluxoCaixaMensal from "./pages/financeiro/FluxoCaixaMensal";
import DRE from "./pages/financeiro/DRE";
import FechamentoMes from "./pages/financeiro/FechamentoMes";
import AuthLogin from "./pages/auth/Login";

import ForgotPassword from "./pages/auth/ForgotPassword";
import ResetPassword from "./pages/auth/ResetPassword";

import NotFound from "./pages/NotFound";
import Usuarios from "./pages/admin/Usuarios";
import LogsAdmin from "./pages/admin/Logs";
import Governanca from "./pages/admin/Governanca";
import Upgrade from "./pages/Upgrade";
import { PlanoGuard } from "./components/PlanoGuard";
import EstoqueDashboard from "./pages/estoque/EstoqueDashboard";
import EstoqueEntrada from "./pages/estoque/EstoqueEntrada";
import EstoqueAjuste from "./pages/estoque/EstoqueAjuste";
import EstoqueMovimentacoes from "./pages/estoque/EstoqueMovimentacoes";
import MeuSalario from "./pages/meu-salario/MeuSalario";


const queryClient = new QueryClient();

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-app">
        <LoadingMascote size={80} label="Autenticando..." />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth/login" replace />;
  }

  return <>{children}</>;
};

const Layout = ({ children }: { children: React.ReactNode }) => {
  const { isLoading, loadingLabel } = useGlobalLoading();
  const { user } = useAuth();

  const { data: ultimoBackup } = useQuery({
    queryKey: ['ultimo-backup', user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data } = await (supabase
        .from("backups" as any)
        .select("created_at")
        .eq("usuario_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .single() as any);
      return data?.created_at ?? null;
    },
    enabled: !!user,
    staleTime: 1000 * 60 * 5,
  });

  const ultimoBackupTexto = ultimoBackup
    ? (() => {
        const d = new Date(ultimoBackup);
        const dia = String(d.getDate()).padStart(2, '0');
        const mes = String(d.getMonth() + 1).padStart(2, '0');
        const hh = String(d.getHours()).padStart(2, '0');
        const mm = String(d.getMinutes()).padStart(2, '0');
        return `${dia}/${mes} às ${hh}:${mm}`;
      })()
    : null;

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <AppSidebar />
        <div className="flex-1 flex flex-col relative">
          {/* Loading Global Overlay */}
          {isLoading && (
            <div className="absolute inset-0 z-50 flex items-center justify-center bg-app/90 backdrop-blur-sm">
              <LoadingMascote size={96} label={loadingLabel || "Carregando..."} />
            </div>
          )}
          
          <header className="sticky top-0 z-10 h-14 border-b border-cda-dourado/30 shadow-sm bg-cda-vinho text-cda-creme">
            <div className="flex h-full items-center justify-between px-4">
              <div className="flex items-center gap-3">
                <SidebarTrigger className="text-cda-creme hover:bg-cda-creme/10 hover:text-cda-creme transition-colors" />
                <div className="h-6 w-px bg-cda-creme/30" />
              </div>
              {ultimoBackupTexto && (
                <span className="text-xs font-bold text-cda-creme hidden sm:inline-flex items-center gap-1.5">
                  💾 Último backup: {ultimoBackupTexto}
                </span>
              )}
            </div>
          </header>
          <AlertaExpiracaoPlano />
          <main className="flex-1 p-6 md:p-8 bg-app">
            <FirstAccessRedirect />
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <GroupProvider>
        <GlobalLoadingProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <PlanExpirationWatcher />
          <Routes>
            {/* Auth routes */}
            <Route path="/auth/login" element={<AuthLogin />} />
            <Route path="/auth/signup" element={<Navigate to="/auth/login" replace />} />
            
            <Route path="/auth/forgot-password" element={<ForgotPassword />} />
            <Route path="/auth/reset-password" element={<ResetPassword />} />
          {/* Redirecionar raiz para Dashboard */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          
          {/* Dashboard Principal */}
          <Route path="/dashboard" element={<ProtectedRoute><Layout><Dashboard /></Layout></ProtectedRoute>} />
          
          {/* Páginas Diretas */}
          <Route path="/encomendas" element={<ProtectedRoute><Layout><Encomendas /></Layout></ProtectedRoute>} />
          <Route path="/clientes-fornecedores" element={<ProtectedRoute><Layout><ClientesFornecedores /></Layout></ProtectedRoute>} />
          <Route path="/clientes" element={<ProtectedRoute><Layout><Clientes /></Layout></ProtectedRoute>} />
          <Route path="/fornecedores" element={<ProtectedRoute><Layout><Fornecedores /></Layout></ProtectedRoute>} />
          
          
          {/* Precificação - Página Container + Sub-rotas */}
          <Route path="/precificacao" element={<ProtectedRoute><Layout><Precificacao /></Layout></ProtectedRoute>} />
          <Route path="/precificacao/ficha-tecnica" element={<ProtectedRoute><Layout><Receitas /></Layout></ProtectedRoute>} />
          <Route path="/precificacao/ficha-tecnica/nova" element={<ProtectedRoute><Layout><ReceitaForm /></Layout></ProtectedRoute>} />
          <Route path="/precificacao/ficha-tecnica/editar/:id" element={<ProtectedRoute><Layout><ReceitaForm /></Layout></ProtectedRoute>} />
          
          {/* Configurações - Página Container + Sub-rotas */}
          <Route path="/configuracoes" element={<ProtectedRoute><Layout><Configuracoes /></Layout></ProtectedRoute>} />
          <Route path="/configuracoes/cadastros-base" element={<ProtectedRoute><Layout><CadastrosBase /></Layout></ProtectedRoute>} />
          <Route path="/configuracoes/precificacao" element={<ProtectedRoute><Layout><PrecificacaoPage /></Layout></ProtectedRoute>} />
          <Route path="/configuracoes/financeiro" element={<ProtectedRoute><Layout><PlanoGuard><Navigate to="/financeiro/cadastros" replace /></PlanoGuard></Layout></ProtectedRoute>} />
          
          <Route path="/configuracoes/precificacao/mao-de-obra" element={<ProtectedRoute><Layout><MaoDeObra /></Layout></ProtectedRoute>} />
          <Route path="/configuracoes/tipos-insumos" element={<ProtectedRoute><Layout><TiposInsumos /></Layout></ProtectedRoute>} />
          <Route path="/configuracoes/categorias-plano-contas" element={<ProtectedRoute><Layout><PlanoGuard><Navigate to="/financeiro/cadastros/categorias-plano-contas" replace /></PlanoGuard></Layout></ProtectedRoute>} />
          <Route path="/configuracoes/plano-contas" element={<ProtectedRoute><Layout><PlanoGuard><Navigate to="/financeiro/cadastros/plano-contas" replace /></PlanoGuard></Layout></ProtectedRoute>} />
          <Route path="/configuracoes/bancos" element={<ProtectedRoute><Layout><PlanoGuard><Navigate to="/financeiro/cadastros/bancos" replace /></PlanoGuard></Layout></ProtectedRoute>} />
          <Route path="/configuracoes/tipos-documentos" element={<ProtectedRoute><Layout><PlanoGuard><Navigate to="/financeiro/cadastros/tipos-documentos" replace /></PlanoGuard></Layout></ProtectedRoute>} />
          <Route path="/configuracoes/juros" element={<ProtectedRoute><Layout><PlanoGuard><Navigate to="/financeiro/cadastros/juros" replace /></PlanoGuard></Layout></ProtectedRoute>} />
          <Route path="/configuracoes/tags-encomendas" element={<ProtectedRoute><Layout><TagsEncomendasPage /></Layout></ProtectedRoute>} />
          <Route path="/configuracoes/backup" element={<ProtectedRoute><Layout><BackupPage /></Layout></ProtectedRoute>} />
          <Route path="/configuracoes/dados-confeitaria" element={<ProtectedRoute><Layout><SeusDados /></Layout></ProtectedRoute>} />
          <Route path="/configuracoes/categorias-receitas" element={<ProtectedRoute><Layout><Categorias /></Layout></ProtectedRoute>} />
          
          <Route path="/configuracoes/unidades-medida" element={<ProtectedRoute><Layout><UnidadesMedida /></Layout></ProtectedRoute>} />
          
          {/* Precificação - Ingredientes e Embalagens */}
          <Route path="/precificacao/ingredientes" element={<ProtectedRoute><Layout><Ingredientes /></Layout></ProtectedRoute>} />
          <Route path="/precificacao/embalagens" element={<ProtectedRoute><Layout><Embalagens /></Layout></ProtectedRoute>} />
          
          {/* Pré-Preparos */}
          <Route path="/precificacao/pre-preparos" element={<ProtectedRoute><Layout><PrePreparos /></Layout></ProtectedRoute>} />
          <Route path="/precificacao/pre-preparos/novo" element={<ProtectedRoute><Layout><PrePreparoForm /></Layout></ProtectedRoute>} />
          <Route path="/precificacao/pre-preparos/:id" element={<ProtectedRoute><Layout><PrePreparoForm /></Layout></ProtectedRoute>} />
          
          {/* Financeiro - Página Principal */}
          <Route path="/financeiro" element={<ProtectedRoute><Layout><PlanoGuard><Financeiro /></PlanoGuard></Layout></ProtectedRoute>} />
          <Route path="/financeiro/cadastros" element={<ProtectedRoute><Layout><PlanoGuard><CadastrosFinanceiroPage /></PlanoGuard></Layout></ProtectedRoute>} />
          <Route path="/financeiro/cadastros/bancos" element={<ProtectedRoute><Layout><PlanoGuard><Bancos /></PlanoGuard></Layout></ProtectedRoute>} />
          <Route path="/financeiro/cadastros/tipos-documentos" element={<ProtectedRoute><Layout><PlanoGuard><TiposDocumentos /></PlanoGuard></Layout></ProtectedRoute>} />
          <Route path="/financeiro/cadastros/categorias-plano-contas" element={<ProtectedRoute><Layout><PlanoGuard><CategoriasPlanoContas /></PlanoGuard></Layout></ProtectedRoute>} />
          <Route path="/financeiro/cadastros/plano-contas" element={<ProtectedRoute><Layout><PlanoGuard><PlanoContas /></PlanoGuard></Layout></ProtectedRoute>} />
          <Route path="/financeiro/cadastros/juros" element={<ProtectedRoute><Layout><PlanoGuard><ConfiguracaoJurosPage /></PlanoGuard></Layout></ProtectedRoute>} />
          <Route path="/financeiro/dashboard" element={<ProtectedRoute><Layout><PlanoGuard><DashboardFinanceiro /></PlanoGuard></Layout></ProtectedRoute>} />
          
          {/* Financeiro - Contas a Receber */}
          <Route path="/financeiro/contas-receber" element={<ProtectedRoute><Layout><PlanoGuard><ContasReceber /></PlanoGuard></Layout></ProtectedRoute>} />
          <Route path="/financeiro/contas-receber/nova" element={<ProtectedRoute><Layout><PlanoGuard><ContasReceberForm /></PlanoGuard></Layout></ProtectedRoute>} />
          <Route path="/financeiro/contas-receber/editar/:id" element={<ProtectedRoute><Layout><PlanoGuard><ContasReceberForm /></PlanoGuard></Layout></ProtectedRoute>} />
          <Route path="/financeiro/contas-receber/detalhes/:id" element={<ProtectedRoute><Layout><PlanoGuard><ContasReceberDetalhes /></PlanoGuard></Layout></ProtectedRoute>} />
          
          {/* Financeiro - Contas a Pagar */}
          <Route path="/financeiro/contas-pagar" element={<ProtectedRoute><Layout><PlanoGuard><ContasPagar /></PlanoGuard></Layout></ProtectedRoute>} />
          <Route path="/financeiro/contas-pagar/nova" element={<ProtectedRoute><Layout><PlanoGuard><ContasPagarForm /></PlanoGuard></Layout></ProtectedRoute>} />
          <Route path="/financeiro/contas-pagar/editar/:id" element={<ProtectedRoute><Layout><PlanoGuard><ContasPagarForm /></PlanoGuard></Layout></ProtectedRoute>} />
          <Route path="/financeiro/contas-pagar/detalhes/:id" element={<ProtectedRoute><Layout><PlanoGuard><ContasPagarDetalhes /></PlanoGuard></Layout></ProtectedRoute>} />
          
          {/* Financeiro - Fluxo de Caixa */}
          <Route path="/financeiro/fluxo-caixa" element={<ProtectedRoute><Layout><PlanoGuard><FluxoCaixaHub /></PlanoGuard></Layout></ProtectedRoute>} />
          <Route path="/financeiro/fluxo-caixa/diario" element={<ProtectedRoute><Layout><PlanoGuard><FluxoCaixaDiario /></PlanoGuard></Layout></ProtectedRoute>} />
          <Route path="/financeiro/fluxo-caixa/mensal" element={<ProtectedRoute><Layout><PlanoGuard><FluxoCaixaMensal /></PlanoGuard></Layout></ProtectedRoute>} />
          
          {/* Financeiro - DRE */}
          <Route path="/financeiro/dre" element={<ProtectedRoute><Layout><PlanoGuard><DRE /></PlanoGuard></Layout></ProtectedRoute>} />

          {/* Financeiro - Fechamento de Mês */}
          <Route path="/financeiro/fechamento-mes" element={<ProtectedRoute><Layout><PlanoGuard><FechamentoMes /></PlanoGuard></Layout></ProtectedRoute>} />
          
          {/* Estoque */}
          <Route path="/estoque" element={<ProtectedRoute><Layout><PlanoGuard><EstoqueDashboard /></PlanoGuard></Layout></ProtectedRoute>} />
          <Route path="/estoque/entrada" element={<ProtectedRoute><Layout><PlanoGuard><EstoqueEntrada /></PlanoGuard></Layout></ProtectedRoute>} />
          <Route path="/estoque/ajuste" element={<ProtectedRoute><Layout><PlanoGuard><EstoqueAjuste /></PlanoGuard></Layout></ProtectedRoute>} />
          <Route path="/estoque/movimentacoes" element={<ProtectedRoute><Layout><PlanoGuard><EstoqueMovimentacoes /></PlanoGuard></Layout></ProtectedRoute>} />
          
          {/* Planejamento */}
          <Route path="/planejamento" element={<ProtectedRoute><Layout><PlanoGuard><Planejamento /></PlanoGuard></Layout></ProtectedRoute>} />

          {/* Meu Salário (Renda Doce) */}
          <Route path="/meu-salario" element={<ProtectedRoute><Layout><PlanoGuard><MeuSalario /></PlanoGuard></Layout></ProtectedRoute>} />

          {/* Admin - Gestão de Usuários */}
          <Route path="/admin/usuarios" element={<ProtectedRoute><Layout><Usuarios /></Layout></ProtectedRoute>} />
          <Route path="/admin/logs" element={<ProtectedRoute><Layout><LogsAdmin /></Layout></ProtectedRoute>} />
          <Route path="/admin/governanca" element={<ProtectedRoute><Layout><Governanca /></Layout></ProtectedRoute>} />
          
          {/* Upgrade */}
          <Route path="/upgrade" element={<ProtectedRoute><Upgrade /></ProtectedRoute>} />
          
          <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </GlobalLoadingProvider>
      </GroupProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
