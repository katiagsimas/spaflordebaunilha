import { useNavigate } from "react-router-dom";
import { PanelLeftClose, PanelLeftOpen, Database, LogOut } from "lucide-react";
import { useSidebar } from "@/components/ui/sidebar";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";

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
