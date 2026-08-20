import { useNavigate } from "react-router-dom";
import { PanelLeftClose, PanelLeftOpen, Database, LogOut, RefreshCw } from "lucide-react";
import { useSidebar } from "@/components/ui/sidebar";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export function ClearCacheButton() {
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
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            onClick={handleClear}
            className="flex items-center gap-2 h-9 rounded-full px-2 bg-sfb-baunilha/10 hover:bg-sfb-baunilha/20 text-sfb-baunilha ring-1 ring-sfb-baunilha/20 transition-all font-body text-xs"
            aria-label="Limpar cache e recarregar"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="bg-sfb-cacau text-sfb-baunilha border-sfb-baunilha/40 max-w-[240px]">
          <span className="font-body text-xs">
            Faz logout, limpa o cache do navegador e recarrega o app.
          </span>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}


export function SidebarToggleLabeled() {
  const { state, toggleSidebar, isMobile, openMobile } = useSidebar();
  const open = isMobile ? openMobile : state === "expanded";
  const Icon = open ? PanelLeftClose : PanelLeftOpen;
  const label = open ? "Fechar Menu" : "Abrir Menu";
  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            onClick={toggleSidebar}
            className="flex items-center gap-2 h-9 rounded-full px-2 bg-sfb-creme/10 hover:bg-sfb-creme/20 text-sfb-creme ring-1 ring-sfb-creme/20 transition-all font-body text-xs"
            aria-label={label}
          >
            <Icon className="h-4 w-4" />
          </button>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="bg-sfb-preto text-sfb-creme border-sfb-dourado/40">
          <span className="font-body text-xs">{label}</span>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}



export function BackupBadge({ texto }: { texto: string | null }) {
  if (!texto) return null;
  return (
    <div className="hidden sm:flex items-center gap-2 h-9 pl-2 pr-3 rounded-xl bg-sfb-creme/10 ring-1 ring-sfb-dourado/30">
      <div className="h-6 w-6 rounded-md bg-sfb-dourado/20 flex items-center justify-center">
        <Database className="h-3.5 w-3.5 text-sfb-dourado" />
      </div>
      <div className="flex flex-col leading-tight">
        <span className="text-[9px] uppercase tracking-wider text-sfb-creme/70 font-body">
          Último backup
        </span>
        <span className="text-[11px] font-semibold text-sfb-creme">{texto}</span>
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
      className="h-9 rounded-full bg-sfb-vinho-escuro hover:bg-sfb-preto text-sfb-creme ring-1 ring-sfb-dourado/40 font-body text-xs gap-2 px-4"
    >
      <LogOut className="h-4 w-4" />
      <span className="hidden sm:inline">Sair</span>
    </Button>
  );
}
