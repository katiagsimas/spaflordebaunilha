import { useNavigate } from "react-router-dom";
import { useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { LogOut, Headphones, Crown, User as UserIcon, Mail, Store, Camera, Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useGroup } from "@/contexts/GroupContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { toast } from "sonner";
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
  return "Spa";
}

function useProfileMenu(userId?: string) {
  return useQuery({
    queryKey: ["profile-menu", userId],
    queryFn: async () => {
      if (!userId) return null;
      const { data } = await supabase
        .from("profiles")
        .select("nome_completo, nome_confeitaria, avatar_url")
        .eq("id", userId)
        .single();
      return data;
    },
    enabled: !!userId,
    staleTime: 1000 * 60 * 5,
  });
}

export function UserGreeting() {
  return null;
}

export function UserMenu() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const { isMother, sessionMode, activeGroup, activeRole } = useGroup();

  const { data: profile } = useProfileMenu(user?.id);

  const primeiroNome = getPrimeiroNome(profile?.nome_completo, user?.email);
  const nomeEmpresa = profile?.nome_confeitaria?.trim() || profile?.nome_completo?.trim();

  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const handleSair = async () => {
    await signOut();
    navigate("/auth/login");
  };

  const handleSuporte = () => {
    const msg = encodeURIComponent(
      `Olá! Sou ${primeiroNome} (${user?.email ?? ""}) e preciso de suporte no Spa Flor de Baunilha.`
    );
    window.open(`https://wa.me/${WHATSAPP_SUPORTE}?text=${msg}`, "_blank");
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Selecione um arquivo de imagem.");
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      toast.error("Imagem muito grande (máx 2 MB).");
      return;
    }
    try {
      setUploading(true);
      const ext = file.name.split(".").pop()?.toLowerCase() || "png";
      const path = `${user.id}/avatar-${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage
        .from("avatars")
        .upload(path, file, { upsert: true, cacheControl: "3600" });
      if (upErr) throw upErr;
      const { data: pub } = supabase.storage.from("avatars").getPublicUrl(path);
      const publicUrl = pub.publicUrl;
      const { error: updErr } = await supabase
        .from("profiles")
        .update({ avatar_url: publicUrl })
        .eq("id", user.id);
      if (updErr) throw updErr;
      await queryClient.invalidateQueries({ queryKey: ["profile-menu", user.id] });
      toast.success("Foto atualizada!");
    } catch (err: any) {
      toast.error("Falha ao enviar foto: " + (err.message ?? err));
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  if (!user) return null;

  const mostraBadges = (activeGroup && sessionMode === "group") || isMother;
  const iniciais = (primeiroNome || "U").slice(0, 2).toUpperCase();

  return (
    <div className="flex items-center gap-3">
      <Popover>
        <PopoverTrigger asChild>
          <button
            className="h-9 w-9 rounded-full bg-sfb-baunilha/15 hover:bg-sfb-baunilha/25 ring-1 ring-sfb-baunilha/40 flex items-center justify-center text-sfb-baunilha transition-colors overflow-hidden"
            aria-label="Menu do usuário"
          >
            {profile?.avatar_url ? (
              <Avatar className="h-9 w-9">
                <AvatarImage src={profile.avatar_url} alt={primeiroNome} />
                <AvatarFallback className="bg-sfb-baunilha/20 text-sfb-baunilha text-xs font-semibold">
                  {iniciais}
                </AvatarFallback>
              </Avatar>
            ) : (
              <UserIcon className="h-4 w-4" />
            )}
          </button>
        </PopoverTrigger>
        <PopoverContent
          align="end"
          className="w-80 p-0 overflow-hidden border-sfb-baunilha/30"
        >
          {/* Header com avatar + saudação + badges */}
          <div className="bg-gradient-to-b from-sfb-terracota to-sfb-terracota/90 text-sfb-baunilha px-4 py-4 space-y-3">
            <div className="flex items-center gap-3">
              <div className="relative">
                <Avatar className="h-14 w-14 ring-2 ring-sfb-baunilha/60">
                  {profile?.avatar_url && <AvatarImage src={profile.avatar_url} alt={primeiroNome} />}
                  <AvatarFallback className="bg-sfb-baunilha/20 text-sfb-baunilha font-display text-lg">
                    {iniciais}
                  </AvatarFallback>
                </Avatar>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  aria-label="Alterar foto"
                  className="absolute -bottom-1 -right-1 h-6 w-6 rounded-full bg-sfb-baunilha text-sfb-terracota flex items-center justify-center shadow ring-2 ring-sfb-terracota hover:bg-sfb-baunilha/90 disabled:opacity-60"
                >
                  {uploading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Camera className="h-3 w-3" />}
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleAvatarUpload}
                />
              </div>
              <div className="min-w-0">
                <p className="text-xs uppercase tracking-wider text-sfb-baunilha/70 font-body">
                  Olá,
                </p>
                <p className="font-display text-xl text-sfb-baunilha leading-tight truncate">
                  {primeiroNome}!
                </p>
              </div>
            </div>
            {mostraBadges && (
              <div className="flex items-center gap-2 flex-wrap pt-1">
                {activeGroup && sessionMode === "group" && (
                  <Badge variant="outline" className="text-[10px] border-sfb-baunilha/30 text-sfb-baunilha/80 font-body">
                    {activeRole === "ADMIN" ? "Admin" : "Usuário"}
                  </Badge>
                )}
                {isMother && (
                  <Badge variant="outline" className="text-[10px] border-sfb-baunilha text-sfb-baunilha font-body">
                    <Crown className="h-3 w-3 mr-1" />
                    MOTHER · Acesso total
                  </Badge>
                )}
              </div>
            )}
          </div>

          {/* Infos */}
          <div className="px-4 py-3 space-y-3 border-b border-border">
            <div>
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-body flex items-center gap-1">
                <Mail className="h-3 w-3" /> E-mail
              </p>
              <p className="text-sm text-foreground truncate">{user.email}</p>
            </div>
          </div>

          {/* Ações */}
          <div className="p-2 space-y-1">
            <Button
              variant="ghost"
              className="w-full justify-start font-body text-sm text-sfb-coral hover:text-sfb-coral hover:bg-sfb-coral/10"
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
