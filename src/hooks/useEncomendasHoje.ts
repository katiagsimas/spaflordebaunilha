import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { getTodayISO } from "@/lib/dateUtils";

/**
 * Retorna a quantidade de encomendas (não canceladas) com data_entrega = HOJE.
 * Reage em tempo real a mudanças na tabela `encomendas` do usuário.
 */
export function useEncomendasHoje() {
  const { user } = useAuth();
  const [quantidade, setQuantidade] = useState(0);

  const carregar = async () => {
    if (!user) {
      setQuantidade(0);
      return;
    }
    const hoje = getTodayISO();
    const { count } = await supabase
      .from("encomendas")
      .select("id", { count: "exact", head: true })
      .eq("usuario_id", user.id)
      .eq("data_entrega", hoje)
      .neq("status", "cancelado");

    setQuantidade(count || 0);
  };

  useEffect(() => {
    carregar();
  }, [user]);

  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel("encomendas-hoje-alerta")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "encomendas" },
        () => carregar()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  return { quantidade, temEncomendasHoje: quantidade > 0 };
}
