import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface BusinessProfile {
  nome_confeitaria: string | null;
  razao_social: string | null;
  cpf: string | null;
  telefone: string | null;
  whatsapp: string | null;
  email: string | null;
  endereco: string | null;
  numero: string | null;
  bairro: string | null;
  cidade: string | null;
  estado: string | null;
  cep: string | null;
  instagram: string | null;
  logo_url: string | null;
  assinatura_url: string | null;
  dados_bancarios: Record<string, unknown> | null;
}

/** Monta uma linha de endereço legível a partir das colunas separadas. */
export function montarEnderecoCompleto(p: Partial<BusinessProfile> | null | undefined): string {
  if (!p) return "";
  const linha1 = [p.endereco, p.numero].filter(Boolean).join(", ");
  const linha2 = [p.bairro, p.cidade, p.estado].filter(Boolean).join(" · ");
  return [linha1, linha2].filter(Boolean).join(" — ");
}

export function useBusinessProfile() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["business-profile", user?.id],
    queryFn: async (): Promise<BusinessProfile | null> => {
      if (!user) return null;
      const { data, error } = await supabase
        .from("profiles")
        .select("nome_confeitaria, razao_social, cpf, telefone, whatsapp, email, endereco, numero, bairro, cidade, estado, cep, instagram, logo_url, assinatura_url, dados_bancarios")
        .eq("id", user.id)
        .maybeSingle();
      if (error) throw error;
      return data as unknown as BusinessProfile | null;
    },
    enabled: !!user,
  });
}
