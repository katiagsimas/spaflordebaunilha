import { useState } from "react";
import { LayoutDashboard, Users, Cake, BookOpen, Settings, FileText, Building2, Lock, Package, Wallet, ClipboardList, CalendarCheck, Sparkles, MessageCircle, ListChecks, HardDrive, FileSignature, ScrollText } from "lucide-react";
import { usePlano } from "@/hooks/usePlano";
import { useMotherView } from "@/hooks/useMotherView";
import { useConversaDoceAccess } from "@/hooks/useConversaDoceAccess";

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
  ssoDoce?: boolean;
  conversaDoce?: boolean;
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
    label: "MINHA OPERAÇÃO",
    items: [
      { title: "Cadastros", url: "/cadastros", icon: FileText, active: true },
      { title: "Cardápio", url: "/precificacao", icon: BookOpen, active: true },
      { title: "Estoque", url: "/estoque", icon: Package, active: true },
      { title: "Organização Doce", url: "/organizacao-doce", icon: ListChecks, active: true },
    ],
  },
  {
    label: "MEU COMERCIAL",
    items: [
      { title: "Parceiros", url: "/clientes-fornecedores", icon: Users, active: true },
      { title: "Negociações", url: "/comercial/negociacoes", icon: FileSignature, active: true },
      { title: "Pedidos e Encomendas", url: "/encomendas", icon: ClipboardList, active: true },
    ],
  },
  {
    label: "MEU NEGÓCIO",
    items: [
      { title: "Meu Dinheiro", url: "/financeiro", icon: Wallet, active: true },
      { title: "Meu Salário", url: "/meu-salario", icon: Sparkles, active: true, adminOnly: true },
      { title: "Meu Planejamento", url: "/planejamento", icon: CalendarCheck, active: false, comingSoonMessage: "Em breve você terá um plano claro para organizar sua produção, suas vendas e crescer com estratégia.", motherOnly: true },
      { title: "Conversa Doce", url: "/conversa-doce", icon: MessageCircle, active: true, conversaDoce: true },
      { title: "Planejamento Doce", url: "/planejamento-doce", icon: Sparkles, active: false, motherUnlock: true, comingSoonMessage: "Estamos preparando algo especial para você! Em breve, o Planejamento Doce estará disponível para te ajudar a organizar seu ano com campanhas, metas e estratégias para crescer com doçura." },
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
  const { open } = useSidebar();
  const { user } = useAuth();
  const { isMother, isGroupAdmin, sessionMode, activeGroup, activeRole } = useGroup();
  const { isAdmin } = useIsAdmin();
  const { enabled: motherEnabled, view: motherView } = useMotherView();
  const simulating = motherEnabled && !!motherView;
  const effectiveIsMother = isMother && !simulating;
  const effectiveIsAdmin = isAdmin && !simulating;
  const { rotaBloqueada, isLoading: isPlanoLoading, plano } = usePlano();
  const podeAcessarSsoDoce = effectiveIsAdmin || plano?.id === "negocio" || plano?.id === "aluna_imersao";
  const { temAcesso: podeAcessarConversaDoce } = useConversaDoceAccess();
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
    <Sidebar collapsible="icon" className="border-r border-sidebar-border" style={{ width: open ? '280px' : undefined }}>
      <SidebarHeader className="h-14 border-b border-cda-dourado/30 px-4 py-0 flex items-center justify-center bg-gradient-to-r from-cda-vinho-escuro via-cda-vinho to-cda-vinho-escuro">
        {open && (
          <div className="flex items-center gap-2.5">
            <img src="/cda-logo-dourado.png" alt="Caixa de Açúcar" className="h-7 w-7 drop-shadow" />
            <div className="flex flex-col leading-tight">
              <span className="font-display text-base text-cda-creme tracking-wide">
                Caixa de Açúcar
              </span>
              <span className="text-[9px] font-body font-light text-cda-dourado/80 tracking-[0.2em] uppercase">
                by Umbrella Doce
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
              /* Separador dourado entre seções */
              <div className="mx-4 my-2 h-px bg-gradient-to-r from-transparent via-cda-dourado/40 to-transparent" />
            )}
            <SidebarGroup>
              <SidebarGroupLabel className="text-cda-dourado/70 text-[10px] uppercase tracking-[0.22em] font-display">
                {section.label}
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {section.items
                    .filter((item) => (!item.adminOnly || effectiveIsAdmin) && (!item.motherOnly || effectiveIsMother) && (!item.ssoDoce || podeAcessarSsoDoce) && (!item.conversaDoce || podeAcessarConversaDoce))
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
                                className="flex items-center gap-3 px-4 py-2.5 transition-all duration-200 rounded-lg font-body text-sm opacity-40 cursor-not-allowed text-cda-creme"
                                onClick={(e) => {
                                  e.preventDefault();
                                  setComingSoonModal({ title: item.title, message: item.comingSoonMessage || '' });
                                }}
                              >
                                <Icon className="h-5 w-5 text-cda-creme/80" />
                                {open && (
                                  <>
                                    <span className="flex-1">{item.title}</span>
                                    <Lock className="h-3.5 w-3.5 text-cda-creme/40" />
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
                              }}
                              className={({ isActive }) =>
                                `relative flex items-center gap-3 px-4 py-2.5 transition-all duration-200 rounded-lg font-body text-sm ${
                                  isActive && !bloqueado
                                    ? "bg-gradient-to-r from-cda-dourado/15 via-cda-dourado/5 to-transparent border-l-2 border-cda-dourado text-cda-dourado font-semibold"
                                    : "text-cda-creme/80 hover:bg-cda-dourado/10 hover:text-cda-creme"
                                } ${bloqueado ? "opacity-60" : ""}`
                              }
                            >
                              {({ isActive }) => (
                                <>
                                  <Icon className={`h-5 w-5 transition-colors ${isActive && !bloqueado ? 'text-cda-dourado' : 'text-cda-creme/70 group-hover:text-cda-dourado'}`} />
                                  {item.title === "Pedidos e Encomendas" && temEncomendasHoje && !bloqueado && !open && (
                                    <span className="absolute top-1 right-1 h-2.5 w-2.5 rounded-full bg-cda-dourado animate-ping" />
                                  )}
                                  {open && (
                                    <>
                                      <span className="flex-1">{item.title}</span>
                                      {bloqueado && (
                                        <Lock className="h-3.5 w-3.5 text-cda-creme/40" />
                                      )}
                                      {item.title === "Pedidos e Encomendas" && temEncomendasHoje && !bloqueado && (
                                        <Badge className="bg-cda-dourado text-cda-vinho-escuro text-[10px] px-2 py-0.5 rounded-full font-body font-bold animate-pulse ml-1">
                                          {encomendasHojeQtd} HOJE
                                        </Badge>
                                      )}
                                      {item.title === "Parceiros" && aniversariantesClientes.length > 0 && !bloqueado && (
                                        <div className="w-5 h-5 rounded-full bg-cda-dourado flex items-center justify-center animate-bounce ml-1 ring-1 ring-cda-creme/20">
                                          <Cake className="h-3 w-3 text-cda-vinho" />
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
              {comingSoonModal?.title} <Lock className="h-5 w-5 text-cda-dourado" />
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
              {upgradeModal?.title} <Lock className="h-5 w-5 text-cda-dourado" />
            </DialogTitle>
            <DialogDescription className="text-base font-body text-muted-foreground pt-2">
              Este módulo é exclusivo do <strong>Plano Caixa Business</strong>. Faça o upgrade do seu plano para liberar <strong>{upgradeModal?.title}</strong> e todas as ferramentas avançadas do Caixa de Açúcar.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end pt-2">
            <a
              href="https://caixa.umbrelladoce.com.br"
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setUpgradeModal(null)}
              className="inline-flex items-center justify-center rounded-md bg-cda-coral px-5 py-2.5 text-sm font-semibold font-body text-cda-preto shadow hover:opacity-90 transition"
            >
              Quero fazer o upgrade
            </a>
          </div>
        </DialogContent>
      </Dialog>
    </Sidebar>
  );
}
