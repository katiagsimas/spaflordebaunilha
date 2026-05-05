import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";

interface TransferenciaParams {
  banco_origem_id: string;
  banco_destino_id: string;
  valor: number;
  data_transferencia: string;
  descricao?: string;
}

interface TransferenciaHistorico {
  id: string;
  valor: number;
  data_transferencia: string;
  descricao: string | null;
  created_at: string;
  banco_origem_nome: string;
  banco_destino_nome: string;
}

export function useTransferenciaBancos() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const realizarTransferencia = useMutation({
    mutationFn: async (params: TransferenciaParams) => {
      const { data, error } = await supabase.rpc("realizar_transferencia", {
        p_banco_origem_id: params.banco_origem_id,
        p_banco_destino_id: params.banco_destino_id,
        p_valor: params.valor,
        p_data_transferencia: params.data_transferencia,
        p_descricao: params.descricao || null,
      });

      if (error) throw error;

      const result = data as any;
      if (!result?.success) {
        throw new Error(result?.error || "Erro ao realizar transferência.");
      }

      return result;
    },
    onSuccess: () => {
      toast({
        title: "Transferência realizada!",
        description: "Os saldos foram atualizados com sucesso.",
      });
      queryClient.invalidateQueries({ queryKey: ["bancos"] });
      queryClient.invalidateQueries({ queryKey: ["transferencias"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro na transferência",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const historicoTransferencias = useQuery({
    queryKey: ["transferencias", user?.id],
    queryFn: async (): Promise<TransferenciaHistorico[]> => {
      if (!user) return [];

      const { data, error } = await supabase
        .from("transferencias_bancos")
        .select("id, valor, data_transferencia, descricao, created_at, banco_origem_id, banco_destino_id")
        .eq("usuario_id", user.id)
        .order("data_transferencia", { ascending: false });

      if (error) throw error;

      // Fetch bank names
      const { data: bancos } = await supabase
        .from("bancos")
        .select("id, nome")
        .eq("usuario_id", user.id);

      const bancosMap = new Map(bancos?.map((b) => [b.id, b.nome]) || []);

      return (data || []).map((t: any) => ({
        id: t.id,
        valor: t.valor,
        data_transferencia: t.data_transferencia,
        descricao: t.descricao,
        created_at: t.created_at,
        banco_origem_nome: bancosMap.get(t.banco_origem_id) || "Desconhecido",
        banco_destino_nome: bancosMap.get(t.banco_destino_id) || "Desconhecido",
      }));
    },
    enabled: !!user,
  });

  return {
    realizarTransferencia,
    historicoTransferencias,
  };
}
