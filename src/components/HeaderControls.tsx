import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { PanelLeftClose, PanelLeftOpen, Database, LogOut, RefreshCw } from "lucide-react";
import { useSidebar } from "@/components/ui/sidebar";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";

export function ClearCacheButton() {
  const [expanded, setExpanded] = useState(false);

  const handleClear = async () => {
    try {
      await supabase.auth.signOut().catch(() => {});
      try { localStorage.clear(); } catch {}
      try { sessionStorage.clear(); } catch {}
      if ('caches' in window) {
        const keys = await caches.keys();
        await Promise.all(keys.map((k) => caches.delete(k)));
      }
      if ('serviceWorker' in navigator) {
        const regs = await navigator.serviceWorker.getRegistrations();
        await Promise.all(regs.map((r) => r.unregister()));
      }
    } finally {
      window.location.replace(`/auth/login?cleared=${Date.now()}`);
    }
  };

  return (
    <div className="flex items-center">
      <button
        onClick={() => {
          if (expanded) {
            handleClear();
          } else {
            setExpanded(true);
          }
        }}
        onBlur={() => setExpanded(false)}
        className={`flex items-center gap-2 h-9 rounded-full bg-cda-creme/10 hover:bg-cda-creme/20 text-cda-creme ring-1 ring-cda-dourado/30 transition-all font-body text-xs ${expanded ? 'px-3' : 'px-2'}`}
        title="Faz logout, limpa o cache do navegador e recarrega o app. Útil quando o menu ou permissões parecem desatualizados."
        aria-label="Limpar cache e recarregar"
      >
        <RefreshCw className="h-4 w-4" />
        {expanded && <span className="whitespace-nowrap">Limpar cache e recarregar</span>}
      </button>
    </div>
  );
}

export function SidebarToggleLabeled() {
  const { state, toggleSidebar, isMobile, openMobile } = useSidebar();
  const open = isMobile ? openMobile : state === "expanded";
  const Icon = open ? PanelLeftClose : PanelLeftOpen;
  return (
    <button
      onClick={toggleSidebar}
      className="flex items-center gap-2 h-9 px-3 rounded-full bg-cda-creme/10 hover:bg-cda-creme/20 text-cda-creme ring-1 ring-cda-creme/20 transition-colors font-body text-xs"
      aria-label={open ? "Fechar menu" : "Abrir menu"}
    >
      <Icon className="h-4 w-4" />
      <span className="hidden sm:inline">{open ? "Fechar Menu" : "Abrir Menu"}</span>
    </button>
  );
}

export function BackupBadge({ texto }: { texto: string | null }) {
  if (!texto) return null;
  return (
    <div className="hidden sm:flex items-center gap-2 h-9 pl-2 pr-3 rounded-xl bg-cda-creme/10 ring-1 ring-cda-dourado/30">
      <div className="h-6 w-6 rounded-md bg-cda-dourado/20 flex items-center justify-center">
        <Database className="h-3.5 w-3.5 text-cda-dourado" />
      </div>
      <div className="flex flex-col leading-tight">
        <span className="text-[9px] uppercase tracking-wider text-cda-creme/70 font-body">
          Último backup
        </span>
        <span className="text-[11px] font-semibold text-cda-creme">{texto}</span>
      </div>
    </div>
  );
}

export function SairButton() {
  const { signOut } = useAuth();
  const navigate = useNavigate();
  const handleSair = async () => {
    await signOut();
    navigate("/auth/login");
  };
  return (
    <Button
      onClick={handleSair}
      size="sm"
      className="h-9 rounded-full bg-cda-vinho-escuro hover:bg-cda-preto text-cda-creme ring-1 ring-cda-dourado/40 font-body text-xs gap-2 px-4"
    >
      <LogOut className="h-4 w-4" />
      <span className="hidden sm:inline">Sair</span>
    </Button>
  );
}
