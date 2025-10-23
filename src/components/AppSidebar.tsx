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
  const { data: aniversariantesDoMes = [] } = useQuery({
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

  const handleLogout = async () => {
    await signOut();
    navigate("/auth/login");
  };

  return (
    <Sidebar collapsible="icon" className="border-r border-sidebar-border bg-sidebar shadow-xl" style={{ width: open ? '280px' : undefined }}>
      <SidebarHeader className="border-b border-sidebar-border p-8 bg-sidebar">
        {open && (
          <div className="flex justify-center">
            <img 
              src={profile?.logo_url || donnasBoxLogo} 
              alt="Donna's Box - O Sistema Completo da Confeiteira" 
              className="w-full h-auto object-contain max-w-[240px]" 
            />
          </div>
        )}
      </SidebarHeader>

      <SidebarContent className="bg-sidebar">
        <SidebarGroup>
          <SidebarGroupLabel className="text-sidebar-foreground/60 uppercase text-xs font-semibold px-5 py-2">Menu Principal</SidebarGroupLabel>
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
                          `flex items-center gap-3 px-5 py-3 transition-all duration-200 ${
                            isActive && item.active
                              ? "bg-sidebar-accent text-white font-medium border-l-4 border-gold"
                              : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-white"
                          } ${!item.active ? "opacity-60 cursor-not-allowed" : ""}`
                        }
                        onClick={(e) => !item.active && e.preventDefault()}
                      >
                        {({ isActive }) => (
                          <>
                            <Icon className={`h-5 w-5 ${isActive && item.active ? 'text-white' : 'text-sidebar-foreground/80'}`} />
                            {open && (
                              <>
                                <span className="flex-1">{item.title}</span>
                                {item.title === "Fornecedores" && aniversariantesDoMes.length > 0 && (
                                  <Cake className="h-4 w-4 text-gold animate-bounce" />
                                )}
                                {!item.active && (
                                  <Badge className="bg-warning text-terracotta text-xs px-2 py-0.5 rounded-full font-medium">
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
        <SidebarFooter className="border-t border-sidebar-border p-6 bg-sidebar">
          <div className="space-y-2">
            <div>
              <p className="text-sm font-semibold text-sidebar-foreground truncate">
                {profile.nome_confeitaria || profile.nome_completo}
              </p>
              <p className="text-xs text-sidebar-foreground/60 truncate">
                {user?.email}
              </p>
            </div>
            <Button 
              onClick={handleLogout}
              variant="ghost" 
              size="sm" 
              className="w-full text-sidebar-foreground hover:bg-sidebar-accent hover:text-white justify-start"
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
