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
import Estoque from "./pages/Estoque";
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
import CustosFixos from "./pages/cadastros/CustosFixos";
import Clientes from "./pages/cadastros/Clientes";
import Fornecedores from "./pages/cadastros/Fornecedores";
import UnidadesMedida from "./pages/cadastros/UnidadesMedida";
import Ingredientes from "./pages/cadastros/Ingredientes";
import Embalagens from "./pages/cadastros/Embalagens";
import Categorias from "./pages/cadastros/Categorias";
import SubReceitas from "./pages/SubReceitas";
import SubReceitaForm from "./pages/SubReceitaForm";
import Receitas from "./pages/Receitas";
import ReceitaForm from "./pages/ReceitaForm";
import ComingSoon from "./pages/ComingSoon";
import Financeiro from "./pages/Financeiro";
import ContasReceber from "./pages/financeiro/ContasReceber";
import ContasPagar from "./pages/financeiro/ContasPagar";
import Configuracoes from "./pages/Configuracoes";
import ConfiguracoesFinanceiro from "./pages/financeiro/ConfiguracoesFinanceiro";
import CategoriasPlanoContas from "./pages/financeiro/CategoriasPlanoContas";
import CategoriasFinanceiras from "./pages/financeiro/CategoriasFinanceiras";
import AjudaCategorias from "./pages/financeiro/AjudaCategorias";
import PlanosContas from "./pages/financeiro/PlanosContas";
import TiposDocumento from "./pages/financeiro/TiposDocumento";
import Bancos from "./pages/financeiro/Bancos";
import Relatorios from "./pages/relatorios/Relatorios";
import FluxoCaixaDiario from "./pages/relatorios/FluxoCaixaDiario";
import FluxoCaixaMensal from "./pages/relatorios/FluxoCaixaMensal";
import DRE from "./pages/relatorios/DRE";
import AuthLogin from "./pages/auth/Login";
import SignUp from "./pages/auth/SignUp";
import ForgotPassword from "./pages/auth/ForgotPassword";
import MigrationStatus from "./pages/MigrationStatus";
import NotFound from "./pages/NotFound";

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
        <header className="sticky top-0 z-10 h-16 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="flex h-full items-center px-4">
            <SidebarTrigger />
          </div>
        </header>
        <main className="flex-1 p-6 md:p-8">
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
          <Route path="/" element={<ProtectedRoute><Layout><Dashboard /></Layout></ProtectedRoute>} />
          <Route path="/encomendas" element={<ProtectedRoute><Layout><Encomendas /></Layout></ProtectedRoute>} />
          <Route path="/producao" element={<ProtectedRoute><Layout><Producao /></Layout></ProtectedRoute>} />
          <Route path="/estoque" element={<ProtectedRoute><Layout><Estoque /></Layout></ProtectedRoute>} />
          <Route path="/estoque/relatorios" element={<ProtectedRoute><Layout><RelatoriosEstoque /></Layout></ProtectedRoute>} />
          <Route path="/estoque/relatorios/movimentacoes" element={<ProtectedRoute><Layout><RelatorioMovimentacoes /></Layout></ProtectedRoute>} />
          <Route path="/estoque/relatorios/consumo-medio" element={<ProtectedRoute><Layout><RelatorioConsumoMedio /></Layout></ProtectedRoute>} />
          <Route path="/estoque/relatorios/cmv-global" element={<ProtectedRoute><Layout><RelatorioCMVGlobal /></Layout></ProtectedRoute>} />
          <Route path="/precificacao" element={<ProtectedRoute><Layout><Precificacao /></Layout></ProtectedRoute>} />
          <Route path="/planejamento" element={<ProtectedRoute><Layout><Planejamento /></Layout></ProtectedRoute>} />
          <Route path="/cmv-global" element={<ProtectedRoute><Layout><CMVGlobal /></Layout></ProtectedRoute>} />
          <Route path="/cadastros" element={<ProtectedRoute><Layout><Cadastros /></Layout></ProtectedRoute>} />
          <Route path="/clientes-fornecedores" element={<ProtectedRoute><Layout><ClientesFornecedores /></Layout></ProtectedRoute>} />
          <Route path="/configuracoes/seus-dados" element={<ProtectedRoute><Layout><SeusDados /></Layout></ProtectedRoute>} />
          <Route path="/cadastros/seus-dados" element={<ProtectedRoute><Layout><SeusDados /></Layout></ProtectedRoute>} />
          <Route path="/cadastros/custos-fixos" element={<ProtectedRoute><Layout><CustosFixos /></Layout></ProtectedRoute>} />
          <Route path="/cadastros/clientes" element={<ProtectedRoute><Layout><Clientes /></Layout></ProtectedRoute>} />
          <Route path="/cadastros/fornecedores" element={<ProtectedRoute><Layout><Fornecedores /></Layout></ProtectedRoute>} />
          <Route path="/configuracoes/unidades" element={<ProtectedRoute><Layout><UnidadesMedida /></Layout></ProtectedRoute>} />
          <Route path="/cadastros/unidades" element={<ProtectedRoute><Layout><UnidadesMedida /></Layout></ProtectedRoute>} />
          <Route path="/cadastros/ingredientes" element={<ProtectedRoute><Layout><Ingredientes /></Layout></ProtectedRoute>} />
          <Route path="/cadastros/embalagens" element={<ProtectedRoute><Layout><Embalagens /></Layout></ProtectedRoute>} />
          <Route path="/configuracoes/categorias-receitas" element={<ProtectedRoute><Layout><Categorias /></Layout></ProtectedRoute>} />
          <Route path="/cadastros/categorias" element={<ProtectedRoute><Layout><Categorias /></Layout></ProtectedRoute>} />
          <Route path="/receitas" element={<ProtectedRoute><Layout><Receitas /></Layout></ProtectedRoute>} />
          <Route path="/receitas/nova" element={<ProtectedRoute><Layout><ReceitaForm /></Layout></ProtectedRoute>} />
          <Route path="/receitas/editar/:id" element={<ProtectedRoute><Layout><ReceitaForm /></Layout></ProtectedRoute>} />
          <Route path="/sub-receitas" element={<ProtectedRoute><Layout><SubReceitas /></Layout></ProtectedRoute>} />
          <Route path="/sub-receitas/nova" element={<ProtectedRoute><Layout><SubReceitaForm /></Layout></ProtectedRoute>} />
          <Route path="/sub-receitas/editar/:id" element={<ProtectedRoute><Layout><SubReceitaForm /></Layout></ProtectedRoute>} />
          <Route 
            path="/financeiro" 
            element={<ProtectedRoute><Layout><Financeiro /></Layout></ProtectedRoute>} 
          />
          <Route 
            path="/financeiro/contas-receber" 
            element={<ProtectedRoute><Layout><ContasReceber /></Layout></ProtectedRoute>} 
          />
          <Route 
            path="/financeiro/contas-pagar" 
            element={<ProtectedRoute><Layout><ContasPagar /></Layout></ProtectedRoute>} 
          />
          <Route 
            path="/financeiro/configuracoes" 
            element={<ProtectedRoute><Layout><ConfiguracoesFinanceiro /></Layout></ProtectedRoute>} 
          />
          <Route 
            path="/configuracoes" 
            element={<ProtectedRoute><Layout><Configuracoes /></Layout></ProtectedRoute>} 
          />
          <Route 
            path="/migration-status" 
            element={<ProtectedRoute><Layout><MigrationStatus /></Layout></ProtectedRoute>} 
          />
          <Route 
            path="/configuracoes/categorias" 
            element={<ProtectedRoute><Layout><CategoriasFinanceiras /></Layout></ProtectedRoute>} 
          />
          <Route 
            path="/financeiro/configuracoes/categorias" 
            element={<ProtectedRoute><Layout><CategoriasPlanoContas /></Layout></ProtectedRoute>} 
          />
          <Route 
            path="/financeiro/categorias" 
            element={<ProtectedRoute><Layout><CategoriasFinanceiras /></Layout></ProtectedRoute>} 
          />
          <Route 
            path="/financeiro/categorias-financeiras" 
            element={<ProtectedRoute><Layout><CategoriasFinanceiras /></Layout></ProtectedRoute>} 
          />
          <Route 
            path="/financeiro/ajuda-categorias" 
            element={<ProtectedRoute><Layout><AjudaCategorias /></Layout></ProtectedRoute>} 
          />
          <Route 
            path="/configuracoes/planos-contas" 
            element={<ProtectedRoute><Layout><PlanosContas /></Layout></ProtectedRoute>} 
          />
          <Route 
            path="/financeiro/configuracoes/planos-contas" 
            element={<ProtectedRoute><Layout><PlanosContas /></Layout></ProtectedRoute>} 
          />
          <Route 
            path="/configuracoes/tipos-documento" 
            element={<ProtectedRoute><Layout><TiposDocumento /></Layout></ProtectedRoute>} 
          />
          <Route 
            path="/financeiro/configuracoes/tipos-documento" 
            element={<ProtectedRoute><Layout><TiposDocumento /></Layout></ProtectedRoute>} 
          />
          <Route 
            path="/financeiro/tipos-documento" 
            element={<ProtectedRoute><Layout><TiposDocumento /></Layout></ProtectedRoute>} 
          />
          <Route 
            path="/configuracoes/bancos" 
            element={<ProtectedRoute><Layout><Bancos /></Layout></ProtectedRoute>} 
          />
          <Route 
            path="/financeiro/configuracoes/bancos" 
            element={<ProtectedRoute><Layout><Bancos /></Layout></ProtectedRoute>} 
          />
          <Route
            path="/relatorios" 
            element={<ProtectedRoute><Layout><Relatorios /></Layout></ProtectedRoute>} 
          />
          <Route
            path="/relatorios/fluxo-caixa-diario" 
            element={<ProtectedRoute><Layout><FluxoCaixaDiario /></Layout></ProtectedRoute>} 
          />
          <Route
            path="/relatorios/fluxo-caixa-mensal" 
            element={<ProtectedRoute><Layout><FluxoCaixaMensal /></Layout></ProtectedRoute>} 
          />
          <Route
            path="/relatorios/dre" 
            element={<ProtectedRoute><Layout><DRE /></Layout></ProtectedRoute>} 
          />
          <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
