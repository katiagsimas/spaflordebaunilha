import { LayoutDashboard, ShoppingBag, CalendarClock, DollarSign, TrendingUp, LogOut, Users, ChefHat, CookingPot, UserCircle, Calculator, Clipboard, Settings, Package } from "lucide-react";
import sugarboxSidebar from "@/assets/sugarbox-sidebar.png";
import { NavLink, useNavigate } from "react-router-dom";
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
import { useLocalStorage } from "@/hooks/useLocalStorage";

const menuItems = [
  { title: "Dashboard", url: "/", icon: LayoutDashboard, active: true },
  { title: "Encomendas", url: "/encomendas", icon: ShoppingBag, active: true },
  { title: "Produção", url: "/producao", icon: CalendarClock, active: true },
  { title: "Estoque", url: "/estoque", icon: Package, active: false },
  { title: "Clientes e Fornecedores", url: "/clientes-fornecedores", icon: UserCircle, active: true },
  { title: "Precificação", url: "/precificacao", icon: Calculator, active: true },
  { title: "Financeiro", url: "/financeiro", icon: DollarSign, active: true },
  { title: "Metas", url: "/planejamento", icon: Clipboard, active: true },
  { title: "Relatórios", url: "/relatorios", icon: TrendingUp, active: true },
  { title: "Configurações", url: "/configuracoes", icon: Settings, active: true },
];

export function AppSidebar() {
  const { open } = useSidebar();
  const [nomeNegocio, setNomeNegocio] = useLocalStorage<string>("nomeNegocio", "");
  const navigate = useNavigate();

  const handleLogout = () => {
    setNomeNegocio("");
    navigate("/login");
  };

  return (
    <Sidebar collapsible="icon" className="border-r border-border bg-card shadow-[2px_0_12px_rgba(107,80,71,0.06)]" style={{ width: open ? '280px' : undefined }}>
      <SidebarHeader className="border-b border-border p-6">
        {open && (
          <div className="flex justify-center">
            <img src={sugarboxSidebar} alt="Sugar Box - O Sistema Completo da Confeiteira" className="w-full h-auto object-contain" />
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

      {open && nomeNegocio && (
        <SidebarFooter className="border-t border-border p-6">
          <div className="space-y-2">
            <p className="text-sm font-semibold text-foreground truncate">
              {nomeNegocio}
            </p>
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
