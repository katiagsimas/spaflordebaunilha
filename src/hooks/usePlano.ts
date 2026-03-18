import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const MODULOS_POR_PLANO: Record<string, string[]> = {
  base: [
    "/dashboard",
    "/encomendas",
    "/clientes",
    "/fornecedores",
    "/configuracoes/cadastros-base",
    "/configuracoes/categorias-receitas",
    "/configuracoes/unidades-medida",
    "/configuracoes/tipos-insumos",
    "/configuracoes/precificacao",
    "/configuracoes/precificacao/mao-de-obra",
    "/configuracoes/dados-confeitaria",
    "/configuracoes/tags-encomendas",
  ],
  negocio: ["*"], // acesso total
  controle: [],   // em breve
};

export interface Plano {
  id: string;
  nome: string;
  descricao: string | null;
  ativo: boolean;
  em_breve: boolean;
}

export function usePlano() {
  const { user } = useAuth();

  const { data: planoData, isLoading } = useQuery({
    queryKey: ["plano", user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("profiles")
        .select("plano_id")
        .eq("id", user!.id)
        .single();

      if (!data?.plano_id) return { id: "base", nome: "Plano Base", descricao: null, ativo: true, em_breve: false } as Plano;

      const { data: plano } = await supabase
        .from("planos")
        .select("*")
        .eq("id", data.plano_id)
        .single();

      return plano as Plano | null;
    },
    enabled: !!user?.id,
    staleTime: 1000 * 60 * 5,
  });

  const plano = planoData ?? null;

  const temAcesso = (rota: string): boolean => {
    if (!plano) return false;
    const modulos = MODULOS_POR_PLANO[plano.id] ?? [];
    if (modulos.includes("*")) return true;
    return modulos.some((m) => rota.startsWith(m));
  };

  const rotaBloqueada = (rota: string): boolean => {
    if (!plano) return true;
    const modulos = MODULOS_POR_PLANO[plano.id] ?? [];
    if (modulos.includes("*")) return false;
    return !modulos.some((m) => rota.startsWith(m));
  };

  return { plano, temAcesso, rotaBloqueada, isLoading };
}
