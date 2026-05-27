import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useMotherView } from "./useMotherView";

const MODULOS_POR_PLANO: Record<string, string[]> = {
  base: [
    // MEU PAINEL
    "/dashboard",
    // MINHA OPERAÇÃO (acesso total)
    "/cadastros",
    "/precificacao",
    "/estoque",
    "/organizacao-doce",
    // MEU COMERCIAL (parcial: apenas Clientes/Fornecedores e Pedidos/Encomendas)
    "/clientes-fornecedores",
    "/clientes",
    "/fornecedores",
    "/encomendas",
    // SISTEMA (acesso total)
    "/configuracoes",
    "/configuracoes/cadastros-base",
    "/configuracoes/categorias-receitas",
    "/configuracoes/unidades-medida",
    "/configuracoes/precificacao",
    "/configuracoes/precificacao/mao-de-obra",
    "/configuracoes/dados-confeitaria",
    "/encomendas/tags",
    "/configuracoes/backup",
    // Bloqueados (mostram modal de upgrade): /financeiro, /conversa-doce,
    // /comercial/propostas, /comercial/contratos
  ],

  negocio: ["*"], // acesso total
  aluna_imersao: ["*"], // mesmos módulos do Business durante 30 dias
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
  const { enabled: motherEnabled, view: motherView } = useMotherView();

  const { data: planoData, isLoading } = useQuery({
    queryKey: ["plano", user?.id, motherEnabled, motherView],
    queryFn: async () => {
      // MOTHER: tem acesso total por padrão; pode visualizar como um plano específico
      if (motherEnabled) {
        if (motherView) {
          const { data: plano } = await supabase
            .from("planos")
            .select("*")
            .eq("id", motherView)
            .maybeSingle();
          if (plano) return plano as Plano;
        }
        return {
          id: "negocio",
          nome: "MOTHER · Acesso total",
          descricao: null,
          ativo: true,
          em_breve: false,
        } as Plano;
      }

      const { data } = await supabase
        .from("profiles")
        .select("plano_id")
        .eq("id", user!.id)
        .single();

      if (!data?.plano_id) return { id: "base", nome: "Caixa Lite", descricao: null, ativo: true, em_breve: false } as Plano;

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

  const rotaPermitida = (rota: string, modulos: string[]): boolean => {
    if (modulos.includes("*")) return true;
    return modulos.some((m) => {
      if (rota === m) return true;
      if (m === "/configuracoes") return false;
      return rota.startsWith(m + "/");
    });
  };

  const temAcesso = (rota: string): boolean => {
    if (!plano) return false;
    const modulos = MODULOS_POR_PLANO[plano.id] ?? [];
    return rotaPermitida(rota, modulos);
  };

  const rotaBloqueada = (rota: string): boolean => {
    if (!plano) return true;
    const modulos = MODULOS_POR_PLANO[plano.id] ?? [];
    return !rotaPermitida(rota, modulos);
  };

  return { plano, temAcesso, rotaBloqueada, isLoading, isMotherMode: motherEnabled };
}
