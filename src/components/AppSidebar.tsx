import { LayoutDashboard, ShoppingBag, CalendarClock, DollarSign, TrendingUp, LogOut, Users, ChefHat, CookingPot, UserCircle, Calculator, Clipboard, Settings, Package, User, Truck, Cake, Shield, FileText, Building2, Crown } from "lucide-react";
import caixaAcucarSidebarIcon from "@/assets/caixa-acucar-sidebar-icon.png";
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useGroup } from "@/contexts/GroupContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import { GroupSelector } from "@/components/GroupSelector";
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
  { title: "Usuários do Grupo", url: "/admin/usuarios-grupo", icon: Users, active: true, requiresGroupAdmin: true },
  { title: "Financeiro", url: "/financeiro", icon: DollarSign, active: true },
  { title: "Precificação", url: "/precificacao", icon: Calculator, active: true },
  { title: "Configurações", url: "/configuracoes", icon: Settings, active: true },
];

export function AppSidebar() {
  const { open } = useSidebar();
  const { user, signOut } = useAuth();
  const { isMother, isGroupAdmin, sessionMode, activeGroup, activeRole } = useGroup();
  const navigate = useNavigate();
  const { isAdmin } = useIsAdmin();

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

  const { data: aniversariantesFornecedores = [] } = useQuery({
    queryKey: ['fornecedores-contatos-aniversariantes', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const mesAtual = new Date().getMonth();
      const { data } = await supabase
        .from('fornecedor_contatos')
        .select('*')
        .eq('usuario_id', user.id)
        .eq('ativo', true);
      if (!data) return [];
      return data.filter(contato => {
        if (!contato.data_aniversario) return false;
        const dataAniversario = new Date(contato.data_aniversario + 'T00:00:00');
        return dataAniversario.getMonth() === mesAtual;
      });
    },
    enabled: !!user,
  });

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
    <Sidebar collapsible="icon" className="border-r border-sidebar-border" style={{ width: open ? '280px' : undefined }}>
      <SidebarHeader className="border-b border-sidebar-border p-6">
        {open && (
          <div className="space-y-4">
            {/* Logo / Brand */}
            <div className="flex flex-col items-center gap-1">
              <div className="flex items-center gap-2">
                <img src={caixaAcucarSidebarIcon} alt="Caixa de Açúcar" className="h-8 w-8" />
                <span className="text-lg font-semibold font-body text-sidebar-foreground tracking-wide uppercase">
                  Caixa de Açúcar
                </span>
              </div>
              <span className="text-[11px] font-light font-body text-umbrella-dourado tracking-wider">
                by Umbrella Doce
              </span>
            </div>
            {/* Seletor de Grupo */}
            <GroupSelector />
          </div>
        )}
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-sidebar-foreground/50 text-[10px] uppercase tracking-widest font-body">
            Menu Principal
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.filter(item => {
                if ((item as any).requiresGroupAdmin) {
                  return isGroupAdmin() && sessionMode === 'group';
                }
                return true;
              }).map((item) => {
                const Icon = item.icon;
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild isActive={false} disabled={!item.active}>
                      <NavLink
                        to={item.url}
                        end
                        className={({ isActive }) =>
                          `flex items-center gap-3 px-4 py-2.5 transition-all duration-200 rounded-lg font-body text-sm ${
                            isActive && item.active
                              ? "bg-sidebar-accent text-sidebar-accent-foreground font-semibold"
                              : "text-sidebar-foreground/80 hover:bg-sidebar-accent/20 hover:text-sidebar-foreground"
                          } ${!item.active ? "opacity-40 cursor-not-allowed" : ""}`
                        }
                        onClick={(e) => !item.active && e.preventDefault()}
                      >
                        {({ isActive }) => (
                          <>
                            <Icon className={`h-5 w-5 ${isActive && item.active ? 'text-umbrella-dourado' : 'text-sidebar-foreground/60'}`} />
                            {open && (
                              <>
                                <span className="flex-1">{item.title}</span>
                                {item.title === "Clientes" && aniversariantesClientes.length > 0 && (
                                  <div className="w-5 h-5 rounded-full bg-umbrella-coral flex items-center justify-center animate-bounce ml-1">
                                    <Cake className="h-3 w-3 text-umbrella-preto" />
                                  </div>
                                )}
                                {item.title === "Fornecedores" && aniversariantesFornecedores.length > 0 && (
                                  <div className="w-5 h-5 rounded-full bg-umbrella-pink flex items-center justify-center animate-bounce ml-1">
                                    <Cake className="h-3 w-3 text-umbrella-preto" />
                                  </div>
                                )}
                                {!item.active && (
                                  <Badge className="bg-umbrella-dourado/25 text-sidebar-foreground text-[10px] px-2 py-0.5 rounded-full font-body font-medium">
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

        {/* Separador dourado */}
        <div className="mx-4 h-px bg-umbrella-dourado/30" />

        {/* Seção MOTHER - Governança do Sistema */}
        {isMother && (
          <SidebarGroup>
            <SidebarGroupLabel className="flex items-center gap-2 text-sidebar-foreground/50 text-[10px] uppercase tracking-widest font-body">
              <Crown className="h-3 w-3 text-umbrella-dourado" />
              Governança
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild isActive={false}>
                    <NavLink
                      to="/admin/governanca"
                      className={({ isActive }) =>
                        `flex items-center gap-3 px-4 py-2.5 transition-all duration-200 rounded-lg font-body text-sm ${
                          isActive
                            ? "bg-sidebar-accent text-sidebar-accent-foreground font-semibold"
                            : "text-sidebar-foreground/80 hover:bg-sidebar-accent/20 hover:text-sidebar-foreground"
                        }`
                      }
                    >
                      {({ isActive }) => (
                        <>
                          <Building2 className={`h-5 w-5 ${isActive ? 'text-umbrella-dourado' : 'text-sidebar-foreground/60'}`} />
                          {open && <span className="flex-1">Grupos e Usuários</span>}
                        </>
                      )}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}


        {/* Seção de Administração - Apenas para Admins (legado) */}
        {isAdmin && (
          <SidebarGroup>
            <SidebarGroupLabel className="text-sidebar-foreground/50 text-[10px] uppercase tracking-widest font-body">
              Sistema
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild isActive={false}>
                    <NavLink
                      to="/admin/usuarios"
                      className={({ isActive }) =>
                        `flex items-center gap-3 px-4 py-2.5 transition-all duration-200 rounded-lg font-body text-sm ${
                          isActive
                            ? "bg-sidebar-accent text-sidebar-accent-foreground font-semibold"
                            : "text-sidebar-foreground/80 hover:bg-sidebar-accent/20 hover:text-sidebar-foreground"
                        }`
                      }
                    >
                      {({ isActive }) => (
                        <>
                          <Shield className={`h-5 w-5 ${isActive ? 'text-umbrella-dourado' : 'text-sidebar-foreground/60'}`} />
                          {open && <span className="flex-1">Usuários</span>}
                        </>
                      )}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild isActive={false}>
                    <NavLink
                      to="/admin/logs"
                      className={({ isActive }) =>
                        `flex items-center gap-3 px-4 py-2.5 transition-all duration-200 rounded-lg font-body text-sm ${
                          isActive
                            ? "bg-sidebar-accent text-sidebar-accent-foreground font-semibold"
                            : "text-sidebar-foreground/80 hover:bg-sidebar-accent/20 hover:text-sidebar-foreground"
                        }`
                      }
                    >
                      {({ isActive }) => (
                        <>
                          <FileText className={`h-5 w-5 ${isActive ? 'text-umbrella-dourado' : 'text-sidebar-foreground/60'}`} />
                          {open && <span className="flex-1">Logs de Ações</span>}
                        </>
                      )}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>

      {open && profile && (
        <SidebarFooter className="border-t border-sidebar-border p-5">
          <div className="space-y-3">
            {activeGroup && sessionMode === 'group' && (
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-[10px] border-sidebar-foreground/30 text-sidebar-foreground/80 font-body">
                  {activeRole === 'ADMIN' ? 'Admin' : 'Usuário'}
                </Badge>
                {isMother && (
                  <Badge variant="outline" className="text-[10px] border-umbrella-dourado text-umbrella-dourado font-body">
                    <Crown className="h-3 w-3 mr-1" />
                    MOTHER
                  </Badge>
                )}
              </div>
            )}
            <div>
              <p className="text-sm font-semibold font-body text-sidebar-foreground truncate">
                {profile.nome_confeitaria || profile.nome_completo}
              </p>
              <p className="text-xs font-body text-sidebar-foreground/50 truncate">
                {user?.email}
              </p>
            </div>
            <Button
              onClick={handleLogout}
              variant="ghost"
              size="sm"
              className="w-full bg-umbrella-cloud text-sidebar-foreground hover:text-sidebar-foreground hover:bg-umbrella-cloud/80 border border-umbrella-dourado font-body"
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
