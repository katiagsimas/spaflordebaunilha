import { useState } from "react";
import { LayoutDashboard, Users, Cake, BookOpen, Settings, FileText, Building2, Lock, Package, Wallet, ClipboardList, CalendarCheck, Sparkles, MessageCircle, ListChecks, HardDrive, FileSignature, ScrollText } from "lucide-react";
import { usePlano } from "@/hooks/usePlano";
import { useMotherView } from "@/hooks/useMotherView";



import { NavLink } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useGroup } from "@/contexts/GroupContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import { useEncomendasHoje } from "@/hooks/useEncomendasHoje";
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
  useSidebar,
} from "@/components/ui/sidebar";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

interface MenuItem {
  title: string;
  url: string;
  icon: React.ComponentType<{ className?: string }>;
  active: boolean;
  adminOnly?: boolean;
  motherOnly?: boolean;
  motherUnlock?: boolean;
  
  
  comingSoonMessage?: string;
}


const menuSections: { label: string; items: MenuItem[] }[] = [
  {
    label: "MEU PAINEL",
    items: [
      { title: "Meu Painel", url: "/dashboard", icon: LayoutDashboard, active: true },
    ],
  },
  {
    label: "MINHA PRODUÇÃO",
    items: [
      { title: "Cadastros", url: "/cadastros", icon: FileText, active: true },
      { title: "Cardápio", url: "/precificacao", icon: BookOpen, active: true },
      { title: "Estoque", url: "/estoque", icon: Package, active: true },
    ],
  },
  {
    label: "MEU COMERCIAL",
    items: [
      { title: "Parceiros", url: "/clientes-fornecedores", icon: Users, active: true },
      { title: "Negociações", url: "/comercial/negociacoes", icon: FileSignature, active: true },
      { title: "Vendas", url: "/encomendas", icon: ClipboardList, active: true },
    ],
  },
  {
    label: "MEU NEGÓCIO",
    items: [
      { title: "Meu Dinheiro", url: "/financeiro", icon: Wallet, active: true },
      { title: "Meu Salário", url: "/meu-salario", icon: Sparkles, active: true, adminOnly: true },
      
    ],
  },
  {
    label: "SISTEMA",
    items: [
      { title: "Configurações", url: "/configuracoes/dados-confeitaria", icon: Settings, active: true },
      { title: "Backup", url: "/configuracoes/backup", icon: HardDrive, active: true },
      { title: "Governança", url: "/governanca", icon: Building2, active: true, motherOnly: true },
    ],
  },
];

export function AppSidebar() {
  const { open, isMobile, setOpenMobile } = useSidebar();
  const { user } = useAuth();
  const { isMother, isGroupAdmin, sessionMode, activeGroup, activeRole } = useGroup();
  const { isAdmin } = useIsAdmin();
  const { enabled: motherEnabled, view: motherView } = useMotherView();
  const simulating = motherEnabled && !!motherView;
  const effectiveIsMother = isMother && !simulating;
  const effectiveIsAdmin = isAdmin && !simulating;
  

  const { rotaBloqueada, isLoading: isPlanoLoading, plano } = usePlano();


  
  const { quantidade: encomendasHojeQtd, temEncomendasHoje } = useEncomendasHoje();
  const [comingSoonModal, setComingSoonModal] = useState<{ title: string; message: string } | null>(null);
  const [upgradeModal, setUpgradeModal] = useState<{ title: string } | null>(null);


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

  const { data: planoNome } = useQuery({
    queryKey: ['plano-nome', profile?.plano_id],
    queryFn: async () => {
      if (!profile?.plano_id) return null;
      const { data } = await supabase
        .from('planos')
        .select('nome')
        .eq('id', profile.plano_id)
        .single();
      return data?.nome || null;
    },
    enabled: !!profile?.plano_id,
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


  return (
    <Sidebar collapsible="icon" className="border-r border-sidebar-border bg-sfb-terracota" style={{ width: open ? '280px' : undefined }}>
      <SidebarHeader className="h-14 border-b border-sfb-baunilha/30 px-4 py-0 flex items-center justify-center bg-sfb-terracota">
        {open && (
          <div className="flex items-center gap-2.5">
            <img src="/sfb-logo-dourado.png" alt="Spa Flor de Baunilha" className="h-7 w-7 drop-shadow" />
            <div className="flex flex-col leading-tight">
              <span className="font-display text-base text-sfb-baunilha tracking-wide">
                Spa Flor de Baunilha
              </span>
              <span className="text-[9px] font-body font-light text-sfb-baunilha/80 tracking-[0.2em] uppercase">
                by Spa Flor de Baunilha
              </span>
            </div>
          </div>
        )}
      </SidebarHeader>

      <SidebarContent>
        {open && <GroupSelector />}

        {menuSections.map((section, sectionIndex) => (
          <div key={section.label}>
            {sectionIndex > 0 && (
              /* Separador entre seções */
              <div className="mx-4 my-2 h-px bg-gradient-to-r from-transparent via-sfb-baunilha/40 to-transparent" />
            )}
            <SidebarGroup>
              <SidebarGroupLabel className="text-sfb-baunilha/70 text-[10px] uppercase tracking-[0.22em] font-display">
                {section.label}
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {section.items
                    .filter((item) => (!item.adminOnly || effectiveIsAdmin) && (!item.motherOnly || effectiveIsMother))
                    .map((item) => {
                      const Icon = item.icon;
                      

                      const bloqueado = !isPlanoLoading && !effectiveIsAdmin && item.active && rotaBloqueada(item.url);

                      const isComingSoon = !item.active && !effectiveIsAdmin;

                      // Se o usuário é admin e o item é adminOnly+inactive, ele pode acessar
                      const adminUnlocked = item.adminOnly && effectiveIsAdmin;
                      const motherUnlocked = item.motherUnlock && effectiveIsMother;

                      if (isComingSoon && !adminUnlocked && !motherUnlocked) {
                        return (
                          <SidebarMenuItem key={item.title}>
                            <SidebarMenuButton asChild isActive={false} disabled>
                              <NavLink
                                to={item.url}
                                end
                                className="flex items-center gap-3 px-4 py-2.5 transition-all duration-200 rounded-lg font-body text-sm opacity-40 cursor-not-allowed text-sfb-baunilha"
                                onClick={(e) => {
                                  e.preventDefault();
                                  if (isMobile) setOpenMobile(false);
                                  setComingSoonModal({ title: item.title, message: item.comingSoonMessage || '' });
                                }}
                              >
                                <Icon className="h-5 w-5 text-sfb-baunilha/80" />
                                {open && (
                                  <>
                                    <span className="flex-1">{item.title}</span>
                                    <Lock className="h-3.5 w-3.5 text-sfb-baunilha/40" />
                                  </>
                                )}
                              </NavLink>
                            </SidebarMenuButton>
                          </SidebarMenuItem>
                        );
                      }

                      return (
                        <SidebarMenuItem key={item.title}>
                          <SidebarMenuButton asChild isActive={false}>
                            <NavLink
                              to={bloqueado ? "/upgrade" : item.url}
                              end
                              onClick={(e) => {
                                if (bloqueado) {
                                  e.preventDefault();
                                  setUpgradeModal({ title: item.title });
                                }
                                if (isMobile) setOpenMobile(false);
                              }}
                              className={({ isActive }) =>
                                `relative flex items-center gap-3 px-4 py-2.5 transition-all duration-200 rounded-lg font-body text-sm ${
                                  isActive && !bloqueado
                                    ? "bg-gradient-to-r from-sfb-baunilha/15 via-sfb-baunilha/5 to-transparent border-l-2 border-sfb-baunilha text-sfb-baunilha font-semibold"
                                    : "text-sfb-baunilha/80 hover:bg-sfb-baunilha/10 hover:text-sfb-baunilha"
                                } ${bloqueado ? "opacity-60" : ""}`
                              }
                            >
                              {({ isActive }) => (
                                <>
                                  <Icon className={`h-5 w-5 transition-colors ${isActive && !bloqueado ? 'text-sfb-baunilha' : 'text-sfb-baunilha/70 group-hover:text-sfb-baunilha'}`} />
                                  {item.title === "Vendas" && temEncomendasHoje && !bloqueado && !open && (
                                    <span className="absolute top-1 right-1 h-2.5 w-2.5 rounded-full bg-sfb-baunilha animate-ping" />
                                  )}
                                  {open && (
                                    <>
                                      <span className="flex-1">{item.title}</span>
                                      {bloqueado && (
                                        <Lock className="h-3.5 w-3.5 text-sfb-baunilha/40" />
                                      )}
                                      {item.title === "Vendas" && temEncomendasHoje && !bloqueado && (
                                        <Badge className="bg-sfb-terracota text-sfb-baunilha text-[10px] px-2 py-0.5 rounded-full font-body font-bold animate-pulse ml-1">
                                          {encomendasHojeQtd} HOJE
                                        </Badge>
                                      )}
                                      {item.title === "Parceiros" && aniversariantesClientes.length > 0 && !bloqueado && (
                                        <div className="w-5 h-5 rounded-full bg-sfb-terracota flex items-center justify-center animate-bounce ml-1 ring-1 ring-sfb-terracota/20">
                                          <Cake className="h-3 w-3 text-sfb-baunilha" />
                                        </div>
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
          </div>
        ))}

        {/* Governança consolidada dentro de "Usuários" (aba Grupos). Rota /admin/governanca permanece acessível por URL direta. */}


      </SidebarContent>


      {/* Modal "Em Breve" */}
      <Dialog open={!!comingSoonModal} onOpenChange={() => setComingSoonModal(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 font-display text-xl">
              {comingSoonModal?.title} <Lock className="h-5 w-5 text-sfb-terracota" />
            </DialogTitle>
            <DialogDescription className="text-base font-body text-muted-foreground pt-2">
              {comingSoonModal?.message}
            </DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>

      {/* Modal "Upgrade necessário" para usuárias Lite */}
      <Dialog open={!!upgradeModal} onOpenChange={() => setUpgradeModal(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 font-display text-xl">
              {upgradeModal?.title} <Lock className="h-5 w-5 text-sfb-terracota" />
            </DialogTitle>
            <DialogDescription className="text-base font-body text-muted-foreground pt-2">
              Este módulo é exclusivo do <strong>Plano Flor de Baunilha Business</strong>. Faça o upgrade do seu plano para liberar <strong>{upgradeModal?.title}</strong> e todas as ferramentas avançadas do Spa Flor de Baunilha.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end pt-2">
            <a
              href="https://spa.spaflordebaunilha.com.br"
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setUpgradeModal(null)}
              className="inline-flex items-center justify-center rounded-md bg-sfb-coral px-5 py-2.5 text-sm font-semibold font-body text-sfb-preto shadow hover:opacity-90 transition"
            >
              Quero fazer o upgrade
            </a>
          </div>
        </DialogContent>
      </Dialog>
    </Sidebar>
  );
}
