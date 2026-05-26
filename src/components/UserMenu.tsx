import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { LogOut, ArrowUpCircle, Headphones, Crown, User as UserIcon, Mail, CalendarDays, Store } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { usePlano } from "@/hooks/usePlano";
import { useGroup } from "@/contexts/GroupContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

const WHATSAPP_SUPORTE = "5511978902943";

export function getPrimeiroNome(nomeCompleto?: string | null, fallbackEmail?: string | null): string {
  if (nomeCompleto && nomeCompleto.trim()) {
    return nomeCompleto.trim().split(/\s+/)[0];
  }
  if (fallbackEmail) {
    return fallbackEmail.split("@")[0];
  }
  return "Confeiteira";
}

function useProfileMenu(userId?: string) {
  return useQuery({
    queryKey: ["profile-menu", userId],
    queryFn: async () => {
      if (!userId) return null;
      const { data } = await supabase
        .from("profiles")
        .select("nome_completo, nome_confeitaria, plano_tipo, plano_inicio, plano_fim")
        .eq("id", userId)
        .single();
      return data;
    },
    enabled: !!userId,
    staleTime: 1000 * 60 * 5,
  });
}

export function UserGreeting() {
  const { user } = useAuth();
  const { data: profile } = useProfileMenu(user?.id);
  if (!user) return null;
  const nomeEmpresa =
    profile?.nome_confeitaria?.trim() ||
    profile?.nome_completo?.trim() ||
    user.email ||
    "Minha Confeitaria";
  return (
    <span className="hidden md:inline text-sm font-display text-cda-dourado truncate max-w-[260px]">
      {nomeEmpresa}
    </span>
  );
}

export function UserMenu() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const { plano } = usePlano();
  const { isMother, sessionMode, activeGroup, activeRole } = useGroup();

  const { data: profile } = useProfileMenu(user?.id);

  const primeiroNome = getPrimeiroNome(profile?.nome_completo, user?.email);
  const nomeEmpresa = profile?.nome_confeitaria?.trim() || profile?.nome_completo?.trim();

  const handleSair = async () => {
    await signOut();
    navigate("/auth/login");
  };

  const handleSuporte = () => {
    const msg = encodeURIComponent(
      `Olá! Sou ${primeiroNome} (${user?.email ?? ""}) e preciso de suporte no Caixa de Açúcar.`
    );
    window.open(`https://wa.me/${WHATSAPP_SUPORTE}?text=${msg}`, "_blank");
  };

  if (!user) return null;

  const mostraBadges = activeGroup && sessionMode === "group";
  const formataData = (iso?: string | null) =>
    iso ? new Date(iso + "T00:00:00").toLocaleDateString("pt-BR") : "—";

  return (
    <div className="flex items-center gap-3">
      <Popover>
        <PopoverTrigger asChild>
          <button
            className="h-9 w-9 rounded-full bg-cda-dourado/15 hover:bg-cda-dourado/25 ring-1 ring-cda-dourado/40 flex items-center justify-center text-cda-dourado transition-colors"
            aria-label="Menu do usuário"
          >
            <UserIcon className="h-4 w-4" />
          </button>
        </PopoverTrigger>
        <PopoverContent
          align="end"
          className="w-80 p-0 overflow-hidden border-cda-dourado/30"
        >
          {/* Header com saudação + badges */}
          <div className="bg-gradient-to-b from-cda-vinho-escuro to-cda-vinho text-cda-creme px-4 py-4 space-y-2">
            <div>
              <p className="text-xs uppercase tracking-wider text-cda-creme/70 font-body">
                Olá,
              </p>
              <p className="font-display text-xl text-cda-dourado leading-tight">
                {primeiroNome}!
              </p>
            </div>
            {mostraBadges && (
              <div className="flex items-center gap-2 flex-wrap pt-1">
                <Badge variant="outline" className="text-[10px] border-cda-creme/30 text-cda-creme/80 font-body">
                  {activeRole === "ADMIN" ? "Admin" : "Usuário"}
                </Badge>
                {isMother && (
                  <Badge variant="outline" className="text-[10px] border-cda-dourado text-cda-dourado font-body">
                    <Crown className="h-3 w-3 mr-1" />
                    MOTHER
                  </Badge>
                )}
              </div>
            )}
          </div>

          {/* Infos */}
          <div className="px-4 py-3 space-y-3 border-b border-border">
            {nomeEmpresa && (
              <div>
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-body flex items-center gap-1">
                  <Store className="h-3 w-3 text-cda-vinho" /> Confeitaria
                </p>
                <p className="text-sm font-semibold text-cda-vinho-escuro truncate">
                  {nomeEmpresa}
                </p>
              </div>
            )}
            <div>
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-body flex items-center gap-1">
                <Mail className="h-3 w-3" /> E-mail
              </p>
              <p className="text-sm text-foreground truncate">{user.email}</p>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-body flex items-center gap-1">
                <Crown className="h-3 w-3 text-cda-dourado" /> Plano
              </p>
              <p className="text-sm font-semibold text-cda-vinho-escuro">
                {plano?.nome ?? "Carregando..."}
                {profile?.plano_tipo && (
                  <span className="ml-1 font-normal text-muted-foreground">
                    ({profile.plano_tipo === "anual" ? "Anual" : "Mensal"})
                  </span>
                )}
              </p>
              {(profile?.plano_inicio || profile?.plano_fim) && (
                <p className="text-[11px] text-muted-foreground flex items-center gap-1 mt-0.5">
                  <CalendarDays className="h-3 w-3" />
                  {formataData(profile?.plano_inicio)} → {formataData(profile?.plano_fim)}
                </p>
              )}
            </div>
          </div>

          {/* Ações */}
          <div className="p-2 space-y-1">
            <Button
              variant="ghost"
              className="w-full justify-start font-body text-sm"
              onClick={() => navigate("/upgrade")}
            >
              <ArrowUpCircle className="h-4 w-4 mr-2 text-cda-dourado" />
              Atualizar plano
            </Button>
            <Button
              variant="ghost"
              className="w-full justify-start font-body text-sm"
              onClick={handleSuporte}
            >
              <Headphones className="h-4 w-4 mr-2 text-green-600" />
              Suporte via WhatsApp
            </Button>
            <Button
              variant="ghost"
              className="w-full justify-start font-body text-sm text-cda-coral hover:text-cda-coral hover:bg-cda-coral/10"
              onClick={handleSair}
            >
              <LogOut className="h-4 w-4 mr-2" />
              Sair
            </Button>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
