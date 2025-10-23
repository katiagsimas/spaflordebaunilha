import { LayoutDashboard, ShoppingBag, CalendarClock, DollarSign, TrendingUp, LogOut, Users, ChefHat, CookingPot, UserCircle, Calculator, Clipboard, Settings, Package, User, Truck, Cake } from "lucide-react";
import donnasBoxLogo from "@/assets/donnas-box-logo.png";
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
  useSidebar,
} from "@/components/ui/sidebar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const menuItems = [
  { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard, active: true },
  { title: "Encomendas", url: "/encomendas", icon: ShoppingBag, active: true },
  { title: "Clientes", url: "/clientes", icon: User, active: true },
  { title: "Fornecedores", url: "/fornecedores", icon: Truck, active: true },
  { title: "Financeiro", url: "/financeiro", icon: DollarSign, active: true },
  { title: "Precificação", url: "/precificacao", icon: Calculator, active: true },
  { title: "Configurações", url: "/configuracoes", icon: Settings, active: true },
];

export function AppSidebar() {
  const { open } = useSidebar();
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  // Buscar perfil do usuário
  const { data: profile } = useQuery({
    queryKey: ['profile', user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      return data;
    },
    enabled: !!user,
  });

  // Buscar aniversariantes do mês de fornecedores
  const { data: aniversariantesFornecedores = [] } = useQuery({
    queryKey: ['fornecedores-aniversariantes', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const mesAtual = new Date().getMonth();
      const { data } = await supabase
        .from('fornecedores')
        .select('*')
        .eq('usuario_id', user.id);
      
      if (!data) return [];
      
      return data.filter(fornecedor => {
        if (!fornecedor.data_aniversario_contato || !fornecedor.contato) return false;
        const dataAniversario = new Date(fornecedor.data_aniversario_contato + 'T00:00:00');
        return dataAniversario.getMonth() === mesAtual;
      });
    },
    enabled: !!user,
  });

  // Buscar aniversariantes do mês de clientes
  const { data: aniversariantesClientes = [] } = useQuery({
    queryKey: ['clientes-aniversariantes', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const mesAtual = new Date().getMonth();
      const { data } = await supabase
        .from('clientes')
        .select('*')
        .eq('usuario_id', user.id);
      
      if (!data) return [];
      
      return data.filter(cliente => {
        if (!cliente.data_aniversario) return false;
        const dataAniversario = new Date(cliente.data_aniversario + 'T00:00:00');
        return dataAniversario.getMonth() === mesAtual;
      });
    },
    enabled: !!user,
  });

  const handleLogout = async () => {
    await signOut();
    navigate("/auth/login");
  };

  return (
    <Sidebar collapsible="icon" className="border-r border-border bg-card shadow-[2px_0_12px_rgba(107,80,71,0.06)]" style={{ width: open ? '280px' : undefined }}>
      <SidebarHeader className="border-b border-border p-6">
        {open && (
          <div className="flex justify-center">
            <img src={donnasBoxLogo} alt="Donna's Box - Sistema de Gestão" className="w-full max-w-[720px] h-auto object-contain" />
          </div>
        )}
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Menu Principal</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => {
                const Icon = item.icon;
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild isActive={false} disabled={!item.active}>
                      <NavLink
                        to={item.url}
                        end
                        className={({ isActive }) =>
                          `flex items-center gap-3 px-5 py-3 transition-all duration-200 rounded-lg ${
                            isActive && item.active
                              ? "bg-secondary text-primary font-semibold border-l-4 border-primary"
                              : "text-foreground hover:bg-secondary hover:text-primary"
                          } ${!item.active ? "opacity-60 cursor-not-allowed" : ""}`
                        }
                        onClick={(e) => !item.active && e.preventDefault()}
                      >
                        {({ isActive }) => (
                          <>
                            <Icon className={`h-5 w-5 ${isActive && item.active ? 'text-primary' : 'text-muted-foreground'}`} />
                            {open && (
                              <>
                                <span className="flex-1">{item.title}</span>
                                {item.title === "Clientes" && aniversariantesClientes.length > 0 && (
                                  <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center animate-bounce ml-1">
                                    <Cake className="h-3.5 w-3.5 text-white" />
                                  </div>
                                )}
                                {item.title === "Fornecedores" && aniversariantesFornecedores.length > 0 && (
                                  <div className="w-6 h-6 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center animate-bounce ml-1">
                                    <Cake className="h-3.5 w-3.5 text-white" />
                                  </div>
                                )}
                                {!item.active && (
                                  <Badge className="bg-warning text-foreground text-xs px-2 py-0.5 rounded-full font-medium">
                                    Em breve
                                  </Badge>
                                )}
                              </>
                            )}
                          </>
                        )}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      {open && profile && (
        <SidebarFooter className="border-t border-border p-6">
          <div className="space-y-2">
            <div>
              <p className="text-sm font-semibold text-foreground truncate">
                {profile.nome_confeitaria || profile.nome_completo}
              </p>
              <p className="text-xs text-muted-foreground truncate">
                {user?.email}
              </p>
            </div>
            <Button 
              onClick={handleLogout}
              variant="outline" 
              size="sm" 
              className="w-full"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Sair
            </Button>
          </div>
        </SidebarFooter>
      )}
    </Sidebar>
  );
}
