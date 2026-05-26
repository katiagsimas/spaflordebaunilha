import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useGroup } from "@/contexts/GroupContext";

/**
 * Verifica se o usuário atual pode acessar o módulo Conversa Doce.
 * - Admin-mãe (MOTHER): sempre tem acesso.
 * - Demais: somente se `profiles.conversa_doce_ativo = true` e
 *   `conversa_doce_fim >= hoje` (ou nulo, sem expiração).
 */
export function useConversaDoceAccess() {
  const { user } = useAuth();
  const { isMother } = useGroup();

  const { data, isLoading } = useQuery({
    queryKey: ["conversa-doce-access", user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data } = await supabase
        .from("profiles")
        .select("conversa_doce_ativo, conversa_doce_inicio, conversa_doce_fim")
        .eq("id", user.id)
        .maybeSingle();
      return data as {
        conversa_doce_ativo: boolean | null;
        conversa_doce_inicio: string | null;
        conversa_doce_fim: string | null;
      } | null;
    },
    enabled: !!user?.id,
    staleTime: 1000 * 60 * 2,
  });

  const hoje = new Date().toISOString().split("T")[0];
  const acessoManual =
    !!data?.conversa_doce_ativo &&
    (!data?.conversa_doce_fim || data.conversa_doce_fim >= hoje);

  const temAcesso = isMother || acessoManual;

  return { temAcesso, isLoading, dados: data };
}
