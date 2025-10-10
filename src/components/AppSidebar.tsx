import { LayoutDashboard, Calculator, ShoppingBag, CalendarClock, BookOpen, DollarSign, TrendingUp } from "lucide-react";
import { NavLink } from "react-router-dom";
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
  useSidebar,
} from "@/components/ui/sidebar";
import { Badge } from "@/components/ui/badge";

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

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="border-b border-sidebar-border p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-accent">
            <span className="text-xl">🧁</span>
          </div>
          {open && (
            <div>
              <h2 className="text-lg font-semibold text-sidebar-foreground">Sweet Manager</h2>
              <p className="text-xs text-muted-foreground">Gestão de Confeitaria</p>
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
    </Sidebar>
  );
}
