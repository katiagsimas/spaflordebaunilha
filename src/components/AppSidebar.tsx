import { LayoutDashboard, Calculator, ShoppingBag, CalendarClock, BookOpen, DollarSign, TrendingUp, LogOut } from "lucide-react";
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
import donnasLogo from "@/assets/donnas-logo.png";

const menuItems = [
  { title: "Dashboard", url: "/", icon: LayoutDashboard, active: true },
  { title: "Calculadora", url: "/calculadora", icon: Calculator, active: true },
  { title: "Encomendas", url: "/encomendas", icon: ShoppingBag, active: true },
  { title: "Produção", url: "/producao", icon: CalendarClock, active: true },
  { title: "Biblioteca", url: "/biblioteca", icon: BookOpen, active: false },
  { title: "Financeiro", url: "/financeiro", icon: DollarSign, active: false },
  { title: "Relatórios", url: "/relatorios", icon: TrendingUp, active: false },
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
    <Sidebar collapsible="icon">
      <SidebarHeader className="border-b border-sidebar-border p-4">
        <div className="flex items-center gap-3">
          <img 
            src={donnasLogo} 
            alt="Donnas" 
            className="h-10 w-auto object-contain"
          />
          {open && (
            <div>
              <h2 className="text-lg font-semibold text-sidebar-foreground">SugarBox</h2>
              <p className="text-xs text-muted-foreground">Sistema da Confeiteira</p>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Menu Principal</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={false} disabled={!item.active}>
                    <NavLink
                      to={item.url}
                      end
                      className={({ isActive }) =>
                        `flex items-center gap-3 ${
                          isActive && item.active
                            ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                            : ""
                        } ${!item.active ? "opacity-60 cursor-not-allowed" : ""}`
                      }
                      onClick={(e) => !item.active && e.preventDefault()}
                    >
                      <item.icon className="h-4 w-4" />
                      <span className="flex-1">{item.title}</span>
                      {!item.active && open && (
                        <Badge variant="secondary" className="text-xs">
                          Em breve
                        </Badge>
                      )}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      {open && nomeNegocio && (
        <SidebarFooter className="border-t border-sidebar-border p-4">
          <div className="space-y-2">
            <p className="text-sm font-medium text-sidebar-foreground truncate">
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
