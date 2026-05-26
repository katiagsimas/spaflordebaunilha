import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface BusinessProfile {
  nome_confeitaria: string | null;
  cnpj: string | null;
  telefone: string | null;
  email: string | null;
  endereco: string | null;
  logomarca_url: string | null;
  assinatura_url: string | null;
  dados_bancarios: Record<string, unknown> | null;
}

export function useBusinessProfile() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["business-profile", user?.id],
    queryFn: async (): Promise<BusinessProfile | null> => {
      if (!user) return null;
      const { data, error } = await supabase
        .from("profiles")
        .select("nome_confeitaria, cnpj, telefone, email, endereco, logomarca_url, assinatura_url, dados_bancarios")
        .eq("id", user.id)
        .maybeSingle();
      if (error) throw error;
      return data as unknown as BusinessProfile | null;
    },
    enabled: !!user,
  });
}
