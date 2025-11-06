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
  usa_dados_sistema?: boolean;
  observacao?: string;
  created_at: string;
  updated_at: string;
}

export interface DadosCMVAnual {
  mes: number;
  mes_nome: string;
  estoque_inicial: number;
  compras: number;
  estoque_final: number;
  cmv: number;
  faturamento: number;
  percentual_cmv: number;
  editavel: boolean;
  tem_historico: boolean;
}

export function useCMVMensal(ano?: number) {
  const userId = useUserId();
  const queryClient = useQueryClient();
  const anoSelecionado = ano || new Date().getFullYear();

  const { data: dados = [], isLoading } = useQuery({
    queryKey: ["cmv_mensal", userId, anoSelecionado],
    queryFn: async () => {
      if (!userId) return [];
      
      const { data, error } = await supabase
        .from("cmv_mensal")
        .select("*")
        .eq("usuario_id", userId)
        .eq("ano", anoSelecionado)
        .order("mes", { ascending: true });

      if (error) throw error;
      return data as CMVMensal[];
    },
    enabled: !!userId,
  });

  const { data: dadosAnuais = [], isLoading: isLoadingAnual } = useQuery({
    queryKey: ["cmv_anual", userId, anoSelecionado],
    queryFn: async () => {
      if (!userId) return [];
      
      const { data, error } = await supabase.rpc("get_cmv_anual", {
        p_usuario_id: userId,
        p_ano: anoSelecionado,
      });

      if (error) throw error;
      return (data || []) as DadosCMVAnual[];
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
    dadosAnuais,
    isLoading: isLoading || isLoadingAnual,
    upsertDado: upsertDado.mutate,
    calcularCustoMensal,
    calcularCMVPercentual,
  };
}
