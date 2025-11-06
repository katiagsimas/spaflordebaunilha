import React from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { FirstAccessRedirect } from "@/components/FirstAccessRedirect";
import { Loader2 } from "lucide-react";
import Dashboard from "./pages/Dashboard";
import Encomendas from "./pages/Encomendas";
import Producao from "./pages/Producao";
import CatalogoItens from "./pages/CatalogoItens";
import RelatoriosEstoque from "./pages/estoque/RelatoriosEstoque";
import RelatorioMovimentacoes from "./pages/estoque/RelatorioMovimentacoes";
import RelatorioConsumoMedio from "./pages/estoque/RelatorioConsumoMedio";
import RelatorioCMVGlobal from "./pages/estoque/RelatorioCMVGlobal";
import Precificacao from "./pages/Precificacao";
import Planejamento from "./pages/Planejamento";
import CMVGlobal from "./pages/CMVGlobal";
import Cadastros from "./pages/Cadastros";
import ClientesFornecedores from "./pages/ClientesFornecedores";
import SeusDados from "./pages/cadastros/SeusDados";
import CustosFixos from "./pages/configuracoes/precificacao/CustosFixos";
import MaoDeObra from "./pages/configuracoes/precificacao/MaoDeObra";
import CadastrosBase from "./pages/configuracoes/CadastrosBase";
import PrecificacaoPage from "./pages/configuracoes/PrecificacaoPage";
import FinanceiroPage from "./pages/configuracoes/FinanceiroPage";
import Clientes from "./pages/cadastros/Clientes";
import Fornecedores from "./pages/cadastros/Fornecedores";
import UnidadesMedida from "./pages/cadastros/UnidadesMedida";
import Categorias from "./pages/cadastros/Categorias";
import CategoriasEstoque from "./pages/configuracoes/CategoriasEstoque";
import SubReceitas from "./pages/SubReceitas";
import SubReceitaForm from "./pages/SubReceitaForm";
import Receitas from "./pages/Receitas";
import ReceitaForm from "./pages/ReceitaForm";
import ComingSoon from "./pages/ComingSoon";
import Configuracoes from "./pages/Configuracoes";
import CategoriasPlanoContas from "./pages/configuracoes/CategoriasPlanoContas";
import PlanoContas from "./pages/configuracoes/PlanoContas";
import Bancos from "./pages/configuracoes/Bancos";
import TiposDocumentos from "./pages/configuracoes/TiposDocumentos";
import ConfiguracaoJurosPage from "./pages/configuracoes/ConfiguracaoJuros";
import TagsEncomendasPage from "./pages/configuracoes/TagsEncomendas";
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
import AuthLogin from "./pages/auth/Login";
import SignUp from "./pages/auth/SignUp";
import ForgotPassword from "./pages/auth/ForgotPassword";
import MigrationStatus from "./pages/MigrationStatus";
import NotFound from "./pages/NotFound";
import Usuarios from "./pages/admin/Usuarios";
import LogsAdmin from "./pages/admin/Logs";
import InteligenciaNegocios from "./pages/relatorios/InteligenciaNegocios";

const queryClient = new QueryClient();

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth/login" replace />;
  }

  return <>{children}</>;
};

const Layout = ({ children }: { children: React.ReactNode }) => (
  <SidebarProvider>
    <div className="flex min-h-screen w-full">
      <AppSidebar />
      <div className="flex-1 flex flex-col">
        <header className="sticky top-0 z-10 h-14 border-b bg-background/80 backdrop-blur-md shadow-sm supports-[backdrop-filter]:bg-background/70">
          <div className="flex h-full items-center px-6 gap-3">
            <SidebarTrigger className="hover:bg-accent/50 transition-colors" />
            <div className="h-6 w-px bg-border" />
          </div>
        </header>
        <main className="flex-1 p-6 md:p-8 bg-muted/20">
          <FirstAccessRedirect />
          {children}
        </main>
      </div>
    </div>
  </SidebarProvider>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            {/* Auth routes */}
            <Route path="/auth/login" element={<AuthLogin />} />
            <Route path="/auth/signup" element={<SignUp />} />
            <Route path="/auth/forgot-password" element={<ForgotPassword />} />
          {/* Redirecionar raiz para Dashboard */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          
          {/* Dashboard Principal */}
          <Route path="/dashboard" element={<ProtectedRoute><Layout><Dashboard /></Layout></ProtectedRoute>} />
          
          {/* Páginas Diretas */}
          <Route path="/encomendas" element={<ProtectedRoute><Layout><Encomendas /></Layout></ProtectedRoute>} />
          <Route path="/clientes" element={<ProtectedRoute><Layout><Clientes /></Layout></ProtectedRoute>} />
          <Route path="/fornecedores" element={<ProtectedRoute><Layout><Fornecedores /></Layout></ProtectedRoute>} />
          
          {/* Estoque */}
          <Route path="/estoque" element={<ProtectedRoute><Layout><CatalogoItens /></Layout></ProtectedRoute>} />
          <Route path="/estoque/relatorios" element={<ProtectedRoute><Layout><RelatoriosEstoque /></Layout></ProtectedRoute>} />
          <Route path="/estoque/movimentacoes" element={<ProtectedRoute><Layout><RelatorioMovimentacoes /></Layout></ProtectedRoute>} />
          <Route path="/estoque/consumo-medio" element={<ProtectedRoute><Layout><RelatorioConsumoMedio /></Layout></ProtectedRoute>} />
          <Route path="/estoque/cmv-global" element={<ProtectedRoute><Layout><RelatorioCMVGlobal /></Layout></ProtectedRoute>} />
          
          {/* Precificação - Página Container + Sub-rotas */}
          <Route path="/precificacao" element={<ProtectedRoute><Layout><Precificacao /></Layout></ProtectedRoute>} />
          <Route path="/precificacao/custos-fixos" element={<ProtectedRoute><Layout><CustosFixos /></Layout></ProtectedRoute>} />
          <Route path="/precificacao/pre-preparo" element={<ProtectedRoute><Layout><SubReceitas /></Layout></ProtectedRoute>} />
          <Route path="/precificacao/pre-preparo/nova" element={<ProtectedRoute><Layout><SubReceitaForm /></Layout></ProtectedRoute>} />
          <Route path="/precificacao/pre-preparo/editar/:id" element={<ProtectedRoute><Layout><SubReceitaForm /></Layout></ProtectedRoute>} />
          <Route path="/precificacao/ficha-tecnica" element={<ProtectedRoute><Layout><Receitas /></Layout></ProtectedRoute>} />
          <Route path="/precificacao/ficha-tecnica/nova" element={<ProtectedRoute><Layout><ReceitaForm /></Layout></ProtectedRoute>} />
          <Route path="/precificacao/ficha-tecnica/editar/:id" element={<ProtectedRoute><Layout><ReceitaForm /></Layout></ProtectedRoute>} />
          
          {/* Configurações - Página Container + Sub-rotas */}
          <Route path="/configuracoes" element={<ProtectedRoute><Layout><Configuracoes /></Layout></ProtectedRoute>} />
          <Route path="/configuracoes/cadastros-base" element={<ProtectedRoute><Layout><CadastrosBase /></Layout></ProtectedRoute>} />
          <Route path="/configuracoes/precificacao" element={<ProtectedRoute><Layout><PrecificacaoPage /></Layout></ProtectedRoute>} />
          <Route path="/configuracoes/financeiro" element={<ProtectedRoute><Layout><FinanceiroPage /></Layout></ProtectedRoute>} />
          <Route path="/configuracoes/precificacao/mao-obra" element={<ProtectedRoute><Layout><MaoDeObra /></Layout></ProtectedRoute>} />
          <Route path="/configuracoes/precificacao/custos-fixos" element={<ProtectedRoute><Layout><CustosFixos /></Layout></ProtectedRoute>} />
          <Route path="/configuracoes/categorias-plano-contas" element={<ProtectedRoute><Layout><CategoriasPlanoContas /></Layout></ProtectedRoute>} />
          <Route path="/configuracoes/plano-contas" element={<ProtectedRoute><Layout><PlanoContas /></Layout></ProtectedRoute>} />
          <Route path="/configuracoes/bancos" element={<ProtectedRoute><Layout><Bancos /></Layout></ProtectedRoute>} />
          <Route path="/configuracoes/tipos-documentos" element={<ProtectedRoute><Layout><TiposDocumentos /></Layout></ProtectedRoute>} />
          <Route path="/configuracoes/juros" element={<ProtectedRoute><Layout><ConfiguracaoJurosPage /></Layout></ProtectedRoute>} />
          <Route path="/configuracoes/tags-encomendas" element={<ProtectedRoute><Layout><TagsEncomendasPage /></Layout></ProtectedRoute>} />
          <Route path="/configuracoes/dados-confeitaria" element={<ProtectedRoute><Layout><SeusDados /></Layout></ProtectedRoute>} />
          <Route path="/configuracoes/categorias-receitas" element={<ProtectedRoute><Layout><Categorias /></Layout></ProtectedRoute>} />
          <Route path="/configuracoes/categorias-estoque" element={<ProtectedRoute><Layout><CategoriasEstoque /></Layout></ProtectedRoute>} />
          <Route path="/configuracoes/unidades-medida" element={<ProtectedRoute><Layout><UnidadesMedida /></Layout></ProtectedRoute>} />
          
          {/* Precificação - Ingredientes e Embalagens */}
          <Route path="/precificacao/ingredientes" element={<ProtectedRoute><Layout><Ingredientes /></Layout></ProtectedRoute>} />
          <Route path="/precificacao/embalagens" element={<ProtectedRoute><Layout><Embalagens /></Layout></ProtectedRoute>} />
          
          {/* Pré-Preparos */}
          <Route path="/precificacao/pre-preparos" element={<ProtectedRoute><Layout><PrePreparos /></Layout></ProtectedRoute>} />
          <Route path="/precificacao/pre-preparos/novo" element={<ProtectedRoute><Layout><PrePreparoForm /></Layout></ProtectedRoute>} />
          <Route path="/precificacao/pre-preparos/:id" element={<ProtectedRoute><Layout><PrePreparoForm /></Layout></ProtectedRoute>} />
          
          {/* Financeiro - Página Principal */}
          <Route path="/financeiro" element={<ProtectedRoute><Layout><Financeiro /></Layout></ProtectedRoute>} />
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
          
          {/* Admin - Gestão de Usuários */}
          <Route path="/admin/usuarios" element={<ProtectedRoute><Layout><Usuarios /></Layout></ProtectedRoute>} />
          <Route path="/admin/logs" element={<ProtectedRoute><Layout><LogsAdmin /></Layout></ProtectedRoute>} />
          
          {/* Relatórios - Inteligência de Negócios */}
          <Route path="/relatorios/inteligencia" element={<ProtectedRoute><Layout><InteligenciaNegocios /></Layout></ProtectedRoute>} />
          
          <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
