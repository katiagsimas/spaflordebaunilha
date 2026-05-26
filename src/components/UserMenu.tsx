import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { LogOut, ArrowUpCircle, Headphones, Crown, User as UserIcon, Mail } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { usePlano } from "@/hooks/usePlano";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
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

export function UserGreeting() {
  const { user } = useAuth();
  const { data: profile } = useQuery({
    queryKey: ["profile-menu", user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data } = await supabase
        .from("profiles")
        .select("nome_completo")
        .eq("id", user.id)
        .single();
      return data;
    },
    enabled: !!user,
    staleTime: 1000 * 60 * 5,
  });
  if (!user) return null;
  const primeiroNome = getPrimeiroNome(profile?.nome_completo, user?.email);
  return (
    <span className="hidden md:inline text-sm font-body text-cda-creme">
      Olá, <span className="font-semibold text-cda-dourado">{primeiroNome}</span>!
    </span>
  );
}

export function UserMenu() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const { plano } = usePlano();

  const { data: profile } = useQuery({
    queryKey: ["profile-menu", user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data } = await supabase
        .from("profiles")
        .select("nome_completo, nome_confeitaria, plano_tipo")
        .eq("id", user.id)
        .single();
      return data;
    },
    enabled: !!user,
    staleTime: 1000 * 60 * 5,
  });

  const primeiroNome = getPrimeiroNome(profile?.nome_completo, user?.email);

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
          className="w-72 p-0 overflow-hidden border-cda-dourado/30"
        >
          {/* Header com saudação */}
          <div className="bg-gradient-to-b from-cda-vinho-escuro to-cda-vinho text-cda-creme px-4 py-4">
            <p className="text-xs uppercase tracking-wider text-cda-creme/70 font-body">
              Olá,
            </p>
            <p className="font-display text-xl text-cda-dourado leading-tight">
              {primeiroNome}!
            </p>
          </div>

          {/* Infos */}
          <div className="px-4 py-3 space-y-3 border-b border-border">
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
