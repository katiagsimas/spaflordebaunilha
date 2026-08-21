import React from "react";
// Execute esta instrucao no projeto: Na listagem de produtos, implemente a coluna "Ações", com 3 pontinhos na vertical com as opões Editar, Excluir, Pausar
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider, useQuery } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { SidebarProvider } from "@/components/ui/sidebar";
import { SidebarToggleLabeled, BackupBadge, ClearCacheButton } from "@/components/HeaderControls";
import { AppSidebar } from "@/components/AppSidebar";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { GroupProvider } from "@/contexts/GroupContext";
import { GlobalLoadingProvider, useGlobalLoading } from "@/contexts/GlobalLoadingContext";
import { LoadingMascote } from "@/components/LoadingMascote";
import { ErrorBoundary } from "@/components/ErrorBoundary";

import { FloatingNavigation } from "@/components/FloatingNavigation";

import { UserMenu, UserGreeting } from "@/components/UserMenu";

import Dashboard from "./pages/Dashboard";
import Encomendas from "./pages/Encomendas";
import EncomendasLista from "./pages/EncomendasLista";
import EncomendasCalendarios from "./pages/EncomendasCalendarios";

import Precificacao from "./pages/Precificacao";

import SeusDados from "./pages/cadastros/SeusDados";
import MaoDeObra from "./pages/configuracoes/precificacao/MaoDeObra";

import CadastrosBase from "./pages/configuracoes/CadastrosBase";
import CadastrosHub from "./pages/Cadastros";
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
import CofreBackups from "./pages/admin/CofreBackups";
import GovernancaHub from "./pages/Governanca";
import { MotherGuard } from "./components/MotherGuard";

import EstoqueDashboard from "./pages/estoque/EstoqueDashboard";
import EstoqueEntrada from "./pages/estoque/EstoqueEntrada";
import EstoqueAjuste from "./pages/estoque/EstoqueAjuste";
import EstoqueMovimentacoes from "./pages/estoque/EstoqueMovimentacoes";
import MeuSalario from "./pages/meu-salario/MeuSalario";

import Propostas from "./pages/comercial/Propostas";
import NovaProposta from "./pages/comercial/NovaProposta";
import RelatorioPropostas from "./pages/comercial/RelatorioPropostas";
import Contratos from "./pages/comercial/Contratos";
import Negociacoes from "./pages/comercial/Negociacoes";
import ProdutosRevenda from "./pages/ProdutosRevenda";
import MarcaRevendaPage from "./pages/MarcaRevendaPage";




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
      <div className="flex min-h-screen w-full max-w-[100vw] overflow-x-hidden md:overflow-x-visible md:max-w-none">
        <AppSidebar />
        <div className="flex-1 min-w-0 flex flex-col relative">

          {/* Loading Global Overlay */}
          {isLoading && (
            <div className="absolute inset-0 z-50 flex items-center justify-center bg-app/90 backdrop-blur-sm">
              <LoadingMascote size={96} label={loadingLabel || "Carregando..."} />
            </div>
          )}
          
          <header className="sticky top-0 z-10 h-14 border-b border-sfb-baunilha/30 shadow-sm bg-sfb-terracota text-sfb-baunilha">
            <div className="flex h-full items-center px-4 gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <SidebarToggleLabeled />
              </div>
              <div className="flex-1 flex items-center justify-center">
              </div>
              <div className="flex items-center gap-2">
                <BackupBadge texto={ultimoBackupTexto} />
                <ClearCacheButton />
                <UserMenu />
              </div>
            </div>

          </header>
          
          
          <main className="flex-1 min-w-0 px-3 sm:px-4 md:px-8 pt-2 pb-6 md:pb-8 bg-app overflow-x-hidden md:overflow-x-visible">
            
            {children}
          </main>

          <FloatingNavigation />
          <footer className="border-t border-sfb-baunilha/30 bg-sfb-terracota text-sfb-baunilha/70 py-3 px-4 text-center text-[11px] font-body">
            Spa Flor de Baunilha - Todos os direitos Reservados - 2026
          </footer>
        </div>
      </div>
    </SidebarProvider>
  );
};

const App = () => (
  <ErrorBoundary>
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <GroupProvider>
        <GlobalLoadingProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              
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
          <Route path="/encomendas/lista/:status" element={<ProtectedRoute><Layout><EncomendasLista /></Layout></ProtectedRoute>} />
          <Route path="/encomendas/calendarios" element={<ProtectedRoute><Layout><EncomendasCalendarios /></Layout></ProtectedRoute>} />

          <Route path="/clientes-fornecedores" element={<ProtectedRoute><Layout><ClientesFornecedores /></Layout></ProtectedRoute>} />
          <Route path="/clientes" element={<ProtectedRoute><Layout><Clientes /></Layout></ProtectedRoute>} />
          <Route path="/fornecedores" element={<ProtectedRoute><Layout><Fornecedores /></Layout></ProtectedRoute>} />
          
          
          {/* Precificação - Página Container + Sub-rotas */}
          <Route path="/precificacao" element={<ProtectedRoute><Layout><Precificacao /></Layout></ProtectedRoute>} />
          <Route path="/precificacao/ficha-tecnica" element={<ProtectedRoute><Layout><Receitas /></Layout></ProtectedRoute>} />
          <Route path="/precificacao/ficha-tecnica/nova" element={<ProtectedRoute><Layout><ReceitaForm /></Layout></ProtectedRoute>} />
          <Route path="/precificacao/ficha-tecnica/editar/:id" element={<ProtectedRoute><Layout><ReceitaForm /></Layout></ProtectedRoute>} />
          
          {/* Configurações - Página Container + Sub-rotas */}
          <Route path="/cadastros" element={<ProtectedRoute><Layout><CadastrosHub /></Layout></ProtectedRoute>} />
          <Route path="/configuracoes" element={<ProtectedRoute><Layout><Configuracoes /></Layout></ProtectedRoute>} />
          <Route path="/configuracoes/cadastros-base" element={<ProtectedRoute><Layout><CadastrosBase /></Layout></ProtectedRoute>} />
          <Route path="/configuracoes/precificacao" element={<ProtectedRoute><Layout><PrecificacaoPage /></Layout></ProtectedRoute>} />
          <Route path="/configuracoes/financeiro" element={<ProtectedRoute><Layout><Navigate to="/financeiro/cadastros" replace /></Layout></ProtectedRoute>} />
          
          <Route path="/configuracoes/precificacao/mao-de-obra" element={<ProtectedRoute><Layout><MaoDeObra /></Layout></ProtectedRoute>} />
          <Route path="/configuracoes/tipos-insumos" element={<ProtectedRoute><Layout><TiposInsumos /></Layout></ProtectedRoute>} />
          <Route path="/configuracoes/categorias-plano-contas" element={<ProtectedRoute><Layout><Navigate to="/financeiro/cadastros/categorias-plano-contas" replace /></Layout></ProtectedRoute>} />
          <Route path="/configuracoes/plano-contas" element={<ProtectedRoute><Layout><Navigate to="/financeiro/cadastros/plano-contas" replace /></Layout></ProtectedRoute>} />
          <Route path="/configuracoes/bancos" element={<ProtectedRoute><Layout><Navigate to="/financeiro/cadastros/bancos" replace /></Layout></ProtectedRoute>} />
          <Route path="/configuracoes/tipos-documentos" element={<ProtectedRoute><Layout><Navigate to="/financeiro/cadastros/tipos-documentos" replace /></Layout></ProtectedRoute>} />
          <Route path="/configuracoes/juros" element={<ProtectedRoute><Layout><Navigate to="/financeiro/cadastros/juros" replace /></Layout></ProtectedRoute>} />
          <Route path="/encomendas/tags" element={<ProtectedRoute><Layout><TagsEncomendasPage /></Layout></ProtectedRoute>} />
          <Route path="/configuracoes/tags-encomendas" element={<Navigate to="/encomendas/tags" replace />} />
          <Route path="/configuracoes/backup" element={<ProtectedRoute><Layout><BackupPage /></Layout></ProtectedRoute>} />
          <Route path="/configuracoes/dados-confeitaria" element={<ProtectedRoute><Layout><SeusDados /></Layout></ProtectedRoute>} />
          <Route path="/configuracoes/categorias" element={<ProtectedRoute><Layout><Categorias /></Layout></ProtectedRoute>} />
          
          <Route path="/configuracoes/unidades-medida" element={<ProtectedRoute><Layout><UnidadesMedida /></Layout></ProtectedRoute>} />
          <Route path="/cadastros/produtos-revenda" element={<ProtectedRoute><Layout><ProdutosRevenda /></Layout></ProtectedRoute>} />
          <Route path="/cadastros/produtos-revenda/:marca" element={<ProtectedRoute><Layout><MarcaRevendaPage /></Layout></ProtectedRoute>} />
          
          {/* Precificação - Ingredientes e Embalagens */}
          <Route path="/precificacao/ingredientes" element={<ProtectedRoute><Layout><Ingredientes /></Layout></ProtectedRoute>} />
          <Route path="/precificacao/embalagens" element={<ProtectedRoute><Layout><Embalagens /></Layout></ProtectedRoute>} />
          
          {/* Pré-Preparos */}
          <Route path="/precificacao/pre-preparos" element={<ProtectedRoute><Layout><PrePreparos /></Layout></ProtectedRoute>} />
          <Route path="/precificacao/pre-preparos/novo" element={<ProtectedRoute><Layout><PrePreparoForm /></Layout></ProtectedRoute>} />
          <Route path="/precificacao/pre-preparos/:id" element={<ProtectedRoute><Layout><PrePreparoForm /></Layout></ProtectedRoute>} />
          
          {/* Financeiro - Página Principal */}
          <Route path="/financeiro" element={<ProtectedRoute><Layout><Financeiro /></Layout></ProtectedRoute>} />
          <Route path="/financeiro/cadastros" element={<ProtectedRoute><Layout><CadastrosFinanceiroPage /></Layout></ProtectedRoute>} />
          <Route path="/financeiro/cadastros/bancos" element={<ProtectedRoute><Layout><Bancos /></Layout></ProtectedRoute>} />
          <Route path="/financeiro/cadastros/tipos-documentos" element={<ProtectedRoute><Layout><TiposDocumentos /></Layout></ProtectedRoute>} />
          <Route path="/financeiro/cadastros/categorias-plano-contas" element={<ProtectedRoute><Layout><CategoriasPlanoContas /></Layout></ProtectedRoute>} />
          <Route path="/financeiro/cadastros/plano-contas" element={<ProtectedRoute><Layout><PlanoContas /></Layout></ProtectedRoute>} />
          <Route path="/financeiro/cadastros/juros" element={<ProtectedRoute><Layout><ConfiguracaoJurosPage /></Layout></ProtectedRoute>} />
          <Route path="/financeiro/dashboard" element={<ProtectedRoute><Layout><DashboardFinanceiro /></Layout></ProtectedRoute>} />
          
          {/* Financeiro - Contas a Receber */}
          <Route path="/financeiro/contas-receber" element={<ProtectedRoute><Layout><ContasReceber /></Layout></ProtectedRoute>} />
          <Route path="/financeiro/contas-receber/nova" element={<ProtectedRoute><Layout><ContasReceberForm /></Layout></ProtectedRoute>} />
          <Route path="/financeiro/contas-receber/editar/:id" element={<ProtectedRoute><Layout><ContasReceberForm /></Layout></ProtectedRoute>} />
          <Route path="/financeiro/contas-receber/detalhes/:id" element={<ProtectedRoute><Layout><ContasReceberDetalhes /></Layout></ProtectedRoute>} />
          
          {/* Financeiro - Contas a Pagar */}
          <Route path="/financeiro/contas-pagar" element={<ProtectedRoute><Layout><ContasPagar /></Layout></ProtectedRoute>} />
          <Route path="/financeiro/contas-pagar/nova" element={<ProtectedRoute><Layout><ContasPagarForm /></Layout></ProtectedRoute>} />
          <Route path="/financeiro/contas-pagar/editar/:id" element={<ProtectedRoute><Layout><ContasPagarForm /></Layout></ProtectedRoute>} />
          <Route path="/financeiro/contas-pagar/detalhes/:id" element={<ProtectedRoute><Layout><ContasPagarDetalhes /></Layout></ProtectedRoute>} />
          
          {/* Financeiro - Fluxo de Caixa */}
          <Route path="/financeiro/fluxo-caixa" element={<ProtectedRoute><Layout><FluxoCaixaHub /></Layout></ProtectedRoute>} />
          <Route path="/financeiro/fluxo-caixa/diario" element={<ProtectedRoute><Layout><FluxoCaixaDiario /></Layout></ProtectedRoute>} />
          <Route path="/financeiro/fluxo-caixa/mensal" element={<ProtectedRoute><Layout><FluxoCaixaMensal /></Layout></ProtectedRoute>} />
          
          {/* Financeiro - DRE */}
          <Route path="/financeiro/dre" element={<ProtectedRoute><Layout><DRE /></Layout></ProtectedRoute>} />

          {/* Financeiro - Fechamento de Mês */}
          <Route path="/financeiro/fechamento-mes" element={<ProtectedRoute><Layout><FechamentoMes /></Layout></ProtectedRoute>} />
          
          {/* Estoque */}
          <Route path="/estoque" element={<ProtectedRoute><Layout><EstoqueDashboard /></Layout></ProtectedRoute>} />
          <Route path="/estoque/entrada" element={<ProtectedRoute><Layout><EstoqueEntrada /></Layout></ProtectedRoute>} />
          <Route path="/estoque/ajuste" element={<ProtectedRoute><Layout><EstoqueAjuste /></Layout></ProtectedRoute>} />
          <Route path="/estoque/movimentacoes" element={<ProtectedRoute><Layout><EstoqueMovimentacoes /></Layout></ProtectedRoute>} />
          
          

          {/* Meu Salário (Renda Doce) */}
          <Route path="/meu-salario" element={<ProtectedRoute><Layout><MeuSalario /></Layout></ProtectedRoute>} />



          {/* Comercial — Propostas e Contratos (Business + Imersão + Mother) */}
          <Route path="/comercial/negociacoes" element={<ProtectedRoute><Layout><Negociacoes /></Layout></ProtectedRoute>} />
          <Route path="/comercial/propostas" element={<ProtectedRoute><Layout><Propostas /></Layout></ProtectedRoute>} />
          <Route path="/comercial/propostas/nova" element={<ProtectedRoute><Layout><NovaProposta /></Layout></ProtectedRoute>} />
          <Route path="/comercial/propostas/editar/:id" element={<ProtectedRoute><Layout><NovaProposta /></Layout></ProtectedRoute>} />
          <Route path="/comercial/propostas/relatorio" element={<ProtectedRoute><Layout><RelatorioPropostas /></Layout></ProtectedRoute>} />
          <Route path="/comercial/contratos" element={<ProtectedRoute><Layout><Contratos /></Layout></ProtectedRoute>} />




          {/* Admin - Gestão de Usuários */}
          <Route path="/admin/usuarios" element={<ProtectedRoute><Layout><Usuarios /></Layout></ProtectedRoute>} />
          <Route path="/admin/logs" element={<ProtectedRoute><Layout><LogsAdmin /></Layout></ProtectedRoute>} />
          <Route path="/admin/governanca" element={<ProtectedRoute><Layout><Governanca /></Layout></ProtectedRoute>} />
          <Route path="/admin/cofre-backups" element={<ProtectedRoute><Layout><CofreBackups /></Layout></ProtectedRoute>} />
          <Route path="/governanca" element={<ProtectedRoute><Layout><GovernancaHub /></Layout></ProtectedRoute>} />
          
          
          <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </GlobalLoadingProvider>
      </GroupProvider>
    </AuthProvider>
  </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
