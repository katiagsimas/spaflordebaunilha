import { useState } from "react";
import { LayoutDashboard, Users, Cake, BookOpen, Settings, Shield, FileText, Building2, Crown, Lock, CalendarDays, Package, Wallet, ClipboardList, CalendarCheck, Globe, Sparkles, MessageCircle, Bug, CheckCircle2, EyeOff, Clock, RefreshCw } from "lucide-react";
import { usePlano } from "@/hooks/usePlano";

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
  SidebarFooter,
  useSidebar,
} from "@/components/ui/sidebar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
  comingSoonMessage?: string;
}

const menuSections: { label: string; items: MenuItem[] }[] = [
  {
    label: "MEU NEGÓCIO",
    items: [
      { title: "Meu Painel", url: "/dashboard", icon: LayoutDashboard, active: true },
      { title: "Meu Dinheiro", url: "/financeiro", icon: Wallet, active: true },
      { title: "Meu Salário", url: "/meu-salario", icon: Sparkles, active: true, adminOnly: true },
    ],
  },
  {
    label: "OPERAÇÃO",
    items: [
      { title: "Minhas Encomendas", url: "/encomendas", icon: ClipboardList, active: true },
      { title: "Meu Cardápio", url: "/precificacao", icon: BookOpen, active: true },
      { title: "Meus Insumos", url: "/estoque", icon: Package, active: false, comingSoonMessage: "Em breve você terá controle total dos seus insumos, com entrada, saída e ajuste de estoque integrados às suas receitas e encomendas.", adminOnly: true },
      { title: "Clientes e Fornecedores", url: "/clientes-fornecedores", icon: Users, active: true },
    ],
  },
  {
    label: "PLANEJAMENTO",
    items: [
      { title: "Meu Planejamento", url: "/planejamento", icon: CalendarCheck, active: false, comingSoonMessage: "Em breve você terá um plano claro para organizar sua produção, suas vendas e crescer com estratégia.", adminOnly: true },
      { title: "Conversa Doce", url: "/conversa-doce", icon: MessageCircle, active: true },
    ],
  },
  {
    label: "SISTEMA",
    items: [
      { title: "Configurações", url: "/configuracoes", icon: Settings, active: true },
      { title: "Usuários", url: "/admin/usuarios", icon: Shield, active: true, motherOnly: true },
      { title: "Log de Ações", url: "/admin/logs", icon: FileText, active: true, motherOnly: true },
    ],
  },
];

export function AppSidebar() {
  const { open } = useSidebar();
  const { user } = useAuth();
  const { isMother, isGroupAdmin, sessionMode, activeGroup, activeRole } = useGroup();
  const { isAdmin } = useIsAdmin();
  const { rotaBloqueada, isLoading: isPlanoLoading } = usePlano();
  const { quantidade: encomendasHojeQtd, temEncomendasHoje } = useEncomendasHoje();
  const [comingSoonModal, setComingSoonModal] = useState<{ title: string; message: string } | null>(null);
  const [diagOpen, setDiagOpen] = useState(false);

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
      <SidebarHeader className="border-b border-sidebar-border p-6">
        {open && (
          <div className="space-y-4">
            {/* Logo / Brand */}
            <div className="flex flex-col items-center gap-1">
              <div className="flex items-center gap-2">
                <img src="/cda-logo-dourado.png" alt="Caixa de Açúcar" className="h-8 w-8" />
                <span className="text-lg font-semibold font-body text-sidebar-foreground tracking-wide uppercase">
                  Caixa de Açúcar
                </span>
              </div>
              <span className="text-[11px] font-light font-body text-cda-creme tracking-wider">
                by Umbrella Doce
              </span>
            </div>
            {/* Seletor de Grupo */}
            <GroupSelector />
          </div>
        )}
      </SidebarHeader>

      <SidebarContent>
        {menuSections.map((section, sectionIndex) => (
          <div key={section.label}>
            {sectionIndex > 0 && (
              /* Separador dourado entre seções */
              <div className="mx-4 h-px bg-cda-dourado/30" />
            )}
            <SidebarGroup>
              <SidebarGroupLabel className="text-[#FFF9F5]/40 text-[10px] uppercase tracking-widest font-body">
                {section.label}
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {section.items
                    .filter((item) => (!item.adminOnly || isAdmin) && (!item.motherOnly || isMother))
                    .map((item) => {
                      const Icon = item.icon;
                      const bloqueado = !isPlanoLoading && !isAdmin && item.active && rotaBloqueada(item.url);
                      const isComingSoon = !item.active && !isAdmin;

                      // Se o usuário é admin e o item é adminOnly+inactive, ele pode acessar
                      const adminUnlocked = item.adminOnly && isAdmin;

                      if (isComingSoon && !adminUnlocked) {
                        return (
                          <SidebarMenuItem key={item.title}>
                            <SidebarMenuButton asChild isActive={false} disabled>
                              <NavLink
                                to={item.url}
                                end
                                className="flex items-center gap-3 px-4 py-2.5 transition-all duration-200 rounded-lg font-body text-sm opacity-40 cursor-not-allowed text-[#FFF9F5]"
                                onClick={(e) => {
                                  e.preventDefault();
                                  setComingSoonModal({ title: item.title, message: item.comingSoonMessage || '' });
                                }}
                              >
                                <Icon className="h-5 w-5 text-[#FFF9F5]/80" />
                                {open && (
                                  <>
                                    <span className="flex-1">{item.title}</span>
                                    <Lock className="h-3.5 w-3.5 text-[#FFF9F5]/40" />
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
                              className={({ isActive }) =>
                                `flex items-center gap-3 px-4 py-2.5 transition-all duration-200 rounded-lg font-body text-sm ${
                                  isActive && !bloqueado
                                    ? "bg-[#FFF9F5]/[0.08] border-l-2 border-[#C9A14A] text-[#C9A14A] font-semibold"
                                    : "text-[#FFF9F5]/80 hover:bg-[#FFF9F5]/10 hover:text-[#FFF9F5]"
                                } ${bloqueado ? "opacity-40 cursor-not-allowed" : ""}`
                              }
                            >
                              {({ isActive }) => (
                                <>
                                  <Icon className={`h-5 w-5 ${isActive && !bloqueado ? 'text-cda-dourado' : 'text-[#FFF9F5]/80'}`} />
                                  {item.title === "Minhas Encomendas" && temEncomendasHoje && !bloqueado && !open && (
                                    <span className="absolute top-1 right-1 h-2.5 w-2.5 rounded-full bg-red-500 animate-ping" />
                                  )}
                                  {open && (
                                    <>
                                      <span className="flex-1">{item.title}</span>
                                      {bloqueado && (
                                        <Lock className="h-3.5 w-3.5 text-[#FFF9F5]/40" />
                                      )}
                                      {item.title === "Minhas Encomendas" && temEncomendasHoje && !bloqueado && (
                                        <Badge className="bg-red-500 text-white text-[10px] px-2 py-0.5 rounded-full font-body font-bold animate-pulse ml-1">
                                          {encomendasHojeQtd} HOJE
                                        </Badge>
                                      )}
                                      {item.title === "Clientes e Fornecedores" && aniversariantesClientes.length > 0 && !bloqueado && (
                                        <div className="w-5 h-5 rounded-full bg-cda-dourado flex items-center justify-center animate-bounce ml-1">
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

        {/* Seção MOTHER - Governança do Sistema */}
        {isMother && (
          <SidebarGroup>
            <SidebarGroupLabel className="flex items-center gap-2 text-[#FFF9F5]/40 text-[10px] uppercase tracking-widest font-body">
              <Crown className="h-3 w-3 text-cda-dourado" />
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
                              ? "bg-[#FFF9F5]/[0.08] border-l-2 border-[#C9A14A] text-[#C9A14A] font-semibold"
                              : "text-[#FFF9F5]/80 hover:bg-[#FFF9F5]/10 hover:text-[#FFF9F5]"
                        }`
                      }
                    >
                      {({ isActive }) => (
                        <>
                          <Building2 className={`h-5 w-5 ${isActive ? 'text-cda-dourado' : 'text-[#FFF9F5]/80'}`} />
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

      </SidebarContent>

      {open && user && (
        <SidebarFooter className="border-t border-sidebar-border p-5">
          <div className="space-y-3">
            {activeGroup && sessionMode === 'group' && (
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-[10px] border-[#FFF9F5]/30 text-[#FFF9F5]/70 font-body">
                  {activeRole === 'ADMIN' ? 'Admin' : 'Usuário'}
                </Badge>
                {isMother && (
                  <Badge variant="outline" className="text-[10px] border-cda-dourado text-cda-dourado font-body">
                    <Crown className="h-3 w-3 mr-1" />
                    MOTHER
                  </Badge>
                )}
              </div>
            )}
            <div>
              <p className="text-sm font-semibold font-body text-[#FFF9F5] truncate">
                {profile?.nome_confeitaria || profile?.nome_completo || user?.email}
              </p>
              <p className="text-xs font-body text-[#FFF9F5]/60 truncate">
                {user?.email}
              </p>
            </div>
            {planoNome && !isAdmin && (
              <div className="bg-sidebar-accent/30 rounded-md px-3 py-2 space-y-1">
                <div className="flex items-center gap-1.5">
                  <Crown className="h-3 w-3 text-cda-dourado" />
                  <span className="text-xs font-semibold font-body text-sidebar-foreground">
                    {planoNome}
                    {profile?.plano_tipo && (
                      <span className="ml-1 font-normal text-[#FFF9F5]/80">
                        ({profile.plano_tipo === 'anual' ? 'Anual' : 'Mensal'})
                      </span>
                    )}
                  </span>
                </div>
                {(profile?.plano_inicio || profile?.plano_fim) && (
                  <div className="flex items-center gap-1.5">
                    <CalendarDays className="h-3 w-3 text-sidebar-foreground/50" />
                    <span className="text-[10px] font-body text-[#FFF9F5]/80">
                      {profile?.plano_inicio
                        ? new Date(profile.plano_inicio + 'T00:00:00').toLocaleDateString('pt-BR')
                        : '—'}
                      {' → '}
                      {profile?.plano_fim
                        ? new Date(profile.plano_fim + 'T00:00:00').toLocaleDateString('pt-BR')
                        : '—'}
                    </span>
                  </div>
                )}
              </div>
            )}
            <Button
              onClick={async () => {
                try {
                  // 1) signOut local para invalidar tokens em memória
                  await supabase.auth.signOut().catch(() => {});
                  // 2) limpar storages
                  try { localStorage.clear(); } catch {}
                  try { sessionStorage.clear(); } catch {}
                  // 3) limpar caches do Service Worker, se houver
                  if ('caches' in window) {
                    const keys = await caches.keys();
                    await Promise.all(keys.map((k) => caches.delete(k)));
                  }
                  if ('serviceWorker' in navigator) {
                    const regs = await navigator.serviceWorker.getRegistrations();
                    await Promise.all(regs.map((r) => r.unregister()));
                  }
                } finally {
                  // 4) hard reload com cache-buster e ir para login
                  window.location.replace(`/auth/login?cleared=${Date.now()}`);
                }
              }}
              variant="ghost"
              size="sm"
              className="w-full text-[#FFF9F5]/70 hover:text-cda-dourado font-body text-xs border border-cda-dourado/30"
              title="Faz logout, limpa o cache do navegador e recarrega o app. Útil quando o menu ou permissões parecem desatualizados."
            >
              <RefreshCw className="h-3.5 w-3.5 mr-2" />
              Limpar cache e recarregar
            </Button>
            {isMother && (
              <Button
                onClick={() => {
                  console.log('[Sidebar Diag]', { isAdmin, isMother, isPlanoLoading, userEmail: user?.email });
                  setDiagOpen(true);
                }}
                variant="ghost"
                size="sm"
                className="w-full text-[#FFF9F5]/50 hover:text-cda-dourado font-body text-xs border border-cda-dourado/30"
              >
                <Bug className="h-3.5 w-3.5 mr-2" />
                Diagnóstico do Menu
              </Button>
            )}
          </div>
        </SidebarFooter>
      )}
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

      {/* Modal de Diagnóstico do Menu (MOTHER only) */}
      <Dialog open={diagOpen} onOpenChange={setDiagOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 font-display text-xl">
              <Bug className="h-5 w-5 text-cda-dourado" /> Diagnóstico do Menu
            </DialogTitle>
            <DialogDescription className="font-body">
              Estado de cada item do sidebar para o usuário atual.
              <span className="block mt-1 text-xs">
                <strong>isAdmin:</strong> {String(isAdmin)} · <strong>isMother:</strong> {String(isMother)} · <strong>plano carregando:</strong> {String(isPlanoLoading)}
              </span>
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-3">
            {menuSections.map((section) => (
              <div key={section.label}>
                <div className="text-[11px] uppercase tracking-widest font-body text-muted-foreground mb-2">
                  {section.label}
                </div>
                <div className="space-y-1.5">
                  {section.items.map((item) => {
                    const hiddenByAdmin = !!item.adminOnly && !isAdmin;
                    const bloqueado = !isPlanoLoading && !isAdmin && item.active && rotaBloqueada(item.url);
                    const comingSoon = !item.active && !(item.adminOnly && isAdmin);
                    const visible = !hiddenByAdmin;
                    return (
                      <div
                        key={item.title}
                        className="flex items-center justify-between gap-2 rounded-md border border-border/50 px-3 py-2 text-sm font-body"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          {visible ? (
                            <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                          ) : (
                            <EyeOff className="h-4 w-4 text-destructive shrink-0" />
                          )}
                          <span className="truncate font-medium">{item.title}</span>
                          <span className="text-xs text-muted-foreground truncate">{item.url}</span>
                        </div>
                        <div className="flex flex-wrap items-center gap-1 justify-end">
                          {item.adminOnly && (
                            <Badge variant="outline" className="text-[10px]">adminOnly</Badge>
                          )}
                          {!item.active && (
                            <Badge variant="outline" className="text-[10px]">
                              <Clock className="h-3 w-3 mr-0.5" /> inactive
                            </Badge>
                          )}
                          {hiddenByAdmin && (
                            <Badge variant="destructive" className="text-[10px]">oculto: não é admin</Badge>
                          )}
                          {bloqueado && (
                            <Badge variant="destructive" className="text-[10px]">bloqueado: plano</Badge>
                          )}
                          {comingSoon && !hiddenByAdmin && (
                            <Badge variant="outline" className="text-[10px]">em breve</Badge>
                          )}
                          {visible && !bloqueado && !comingSoon && (
                            <Badge className="text-[10px] bg-emerald-600/90 hover:bg-emerald-600">visível</Badge>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </Sidebar>
  );
}
