import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import Dashboard from "./pages/Dashboard";
import Encomendas from "./pages/Encomendas";
import Producao from "./pages/Producao";
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
import Login from "./pages/Login";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const [nomeNegocio] = useLocalStorage<string>("nomeNegocio", "");
  
  if (!nomeNegocio) {
    return <Navigate to="/login" replace />;
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
        <main className="flex-1 p-6 md:p-8">{children}</main>
      </div>
    </div>
  </SidebarProvider>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<ProtectedRoute><Layout><Dashboard /></Layout></ProtectedRoute>} />
          <Route path="/encomendas" element={<ProtectedRoute><Layout><Encomendas /></Layout></ProtectedRoute>} />
          <Route path="/producao" element={<ProtectedRoute><Layout><Producao /></Layout></ProtectedRoute>} />
          <Route path="/precificacao" element={<ProtectedRoute><Layout><Precificacao /></Layout></ProtectedRoute>} />
          <Route path="/planejamento" element={<ProtectedRoute><Layout><Planejamento /></Layout></ProtectedRoute>} />
          <Route path="/cmv-global" element={<ProtectedRoute><Layout><CMVGlobal /></Layout></ProtectedRoute>} />
          <Route path="/cadastros" element={<ProtectedRoute><Layout><Cadastros /></Layout></ProtectedRoute>} />
          <Route path="/clientes-fornecedores" element={<ProtectedRoute><Layout><ClientesFornecedores /></Layout></ProtectedRoute>} />
          <Route path="/cadastros/seus-dados" element={<ProtectedRoute><Layout><SeusDados /></Layout></ProtectedRoute>} />
          <Route path="/cadastros/custos-fixos" element={<ProtectedRoute><Layout><CustosFixos /></Layout></ProtectedRoute>} />
          <Route path="/cadastros/clientes" element={<ProtectedRoute><Layout><Clientes /></Layout></ProtectedRoute>} />
          <Route path="/cadastros/fornecedores" element={<ProtectedRoute><Layout><Fornecedores /></Layout></ProtectedRoute>} />
          <Route path="/cadastros/unidades" element={<ProtectedRoute><Layout><UnidadesMedida /></Layout></ProtectedRoute>} />
          <Route path="/cadastros/ingredientes" element={<ProtectedRoute><Layout><Ingredientes /></Layout></ProtectedRoute>} />
          <Route path="/cadastros/embalagens" element={<ProtectedRoute><Layout><Embalagens /></Layout></ProtectedRoute>} />
          <Route path="/cadastros/categorias" element={<ProtectedRoute><Layout><Categorias /></Layout></ProtectedRoute>} />
          <Route path="/receitas" element={<ProtectedRoute><Layout><Receitas /></Layout></ProtectedRoute>} />
          <Route path="/receitas/nova" element={<ProtectedRoute><Layout><ReceitaForm /></Layout></ProtectedRoute>} />
          <Route path="/receitas/editar/:id" element={<ProtectedRoute><Layout><ReceitaForm /></Layout></ProtectedRoute>} />
          <Route path="/sub-receitas" element={<ProtectedRoute><Layout><SubReceitas /></Layout></ProtectedRoute>} />
          <Route path="/sub-receitas/nova" element={<ProtectedRoute><Layout><SubReceitaForm /></Layout></ProtectedRoute>} />
          <Route path="/sub-receitas/editar/:id" element={<ProtectedRoute><Layout><SubReceitaForm /></Layout></ProtectedRoute>} />
          <Route 
            path="/financeiro" 
            element={<ProtectedRoute><Layout><ComingSoon title="Financeiro" description="Controle completo das suas finanças" /></Layout></ProtectedRoute>} 
          />
          <Route 
            path="/relatorios" 
            element={<ProtectedRoute><Layout><ComingSoon title="Relatórios" description="Análises detalhadas do seu negócio" /></Layout></ProtectedRoute>} 
          />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
