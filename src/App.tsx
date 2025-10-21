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
import Categorias from "./pages/cadastros/Categorias";
import SubReceitas from "./pages/SubReceitas";
import SubReceitaForm from "./pages/SubReceitaForm";
import Receitas from "./pages/Receitas";
import ReceitaForm from "./pages/ReceitaForm";
import ComingSoon from "./pages/ComingSoon";
import Configuracoes from "./pages/Configuracoes";
import TiposInsumos from "./pages/configuracoes/TiposInsumos";
import Ingredientes from "./pages/precificacao/Ingredientes";
import Embalagens from "./pages/precificacao/Embalagens";
import PrePreparos from "./pages/precificacao/PrePreparos";
import PrePreparoForm from "./pages/precificacao/PrePreparoForm";
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
          {/* Redirecionar raiz para Encomendas */}
          <Route path="/" element={<Navigate to="/encomendas" replace />} />
          
          {/* Páginas Diretas */}
          <Route path="/encomendas" element={<ProtectedRoute><Layout><Encomendas /></Layout></ProtectedRoute>} />
          <Route path="/clientes" element={<ProtectedRoute><Layout><Clientes /></Layout></ProtectedRoute>} />
          <Route path="/fornecedores" element={<ProtectedRoute><Layout><Fornecedores /></Layout></ProtectedRoute>} />
          
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
          <Route path="/configuracoes/tipos-insumos" element={<ProtectedRoute><Layout><TiposInsumos /></Layout></ProtectedRoute>} />
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
          
          <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
