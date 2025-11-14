import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useUserId } from "./useUserId";
import { toast } from "sonner";

export interface CMVMensal {
  id: string;
  usuario_id: string;
  ano: number;
  mes: number;
  estoque_inicial: number;
  compras: number;
  estoque_final: number;
  faturamento: number;
  created_at: string;
  updated_at: string;
}

export function useCMVMensal() {
  const userId = useUserId();
  const queryClient = useQueryClient();

  const { data: dados = [], isLoading } = useQuery({
    queryKey: ["cmv_mensal", userId],
    queryFn: async () => {
      if (!userId) return [];
      
      const anoAtual = new Date().getFullYear();
      
      const { data, error } = await supabase
        .from("cmv_mensal")
        .select("*")
        .eq("usuario_id", userId)
        .eq("ano", anoAtual)
        .order("mes", { ascending: true });

      if (error) throw error;
      return data as CMVMensal[];
    },
    enabled: !!userId,
  });

  const upsertDado = useMutation({
    mutationFn: async ({
      ano,
      mes,
      updates,
    }: {
      ano: number;
      mes: number;
      updates: Partial<CMVMensal>;
    }) => {
      if (!userId) throw new Error("User not authenticated");

      const { data, error } = await supabase
        .from("cmv_mensal")
        .upsert(
          {
            usuario_id: userId,
            ano,
            mes,
            ...updates,
          },
          {
            onConflict: "usuario_id,ano,mes",
          }
        )
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cmv_mensal"] });
    },
    onError: (error) => {
      console.error("Erro ao salvar dados de CMV:", error);
      toast.error("Erro ao salvar dados");
    },
  });

  const calcularCustoMensal = (dado: CMVMensal): number => {
    return dado.estoque_inicial + dado.compras - dado.estoque_final;
  };

  const calcularCMVPercentual = (dado: CMVMensal): number => {
    const custoMensal = calcularCustoMensal(dado);
    if (dado.faturamento === 0) return 0;
    return (custoMensal / dado.faturamento) * 100;
  };

  return {
    dados,
    isLoading,
    upsertDado: upsertDado.mutate,
    calcularCustoMensal,
    calcularCMVPercentual,
  };
}
