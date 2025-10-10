import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import Dashboard from "./pages/Dashboard";
import Calculadora from "./pages/Calculadora";
import Encomendas from "./pages/Encomendas";
import Producao from "./pages/Producao";
import ComingSoon from "./pages/ComingSoon";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

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
          <Route path="/" element={<Layout><Dashboard /></Layout>} />
          <Route path="/calculadora" element={<Layout><Calculadora /></Layout>} />
          <Route path="/encomendas" element={<Layout><Encomendas /></Layout>} />
          <Route path="/producao" element={<Layout><Producao /></Layout>} />
          <Route 
            path="/biblioteca" 
            element={<Layout><ComingSoon title="Biblioteca de Receitas" description="Organize e gerencie todas as suas receitas" /></Layout>} 
          />
          <Route 
            path="/financeiro" 
            element={<Layout><ComingSoon title="Financeiro" description="Controle completo das suas finanças" /></Layout>} 
          />
          <Route 
            path="/relatorios" 
            element={<Layout><ComingSoon title="Relatórios" description="Análises detalhadas do seu negócio" /></Layout>} 
          />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
