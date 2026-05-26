import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

/**
 * Hook reutilizável que gera um token SSO e redireciona o usuário
 * para o Planejamento DOCE (planejamento.umbrelladoce.com.br).
 */
export function useOpenPlannerDoce() {
  const [loading, setLoading] = useState(false);

  const abrir = useCallback(async () => {
    if (loading) return;
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke(
        "gerar-token-sso-doce"
      );

      if (error) throw error;

      const redirectUrl: string | undefined = data?.redirect_url;
      if (!redirectUrl) {
        throw new Error("Resposta inválida do servidor SSO");
      }

      window.location.href = redirectUrl;
    } catch (err) {
      console.error("[useOpenPlannerDoce] Falha ao gerar SSO:", err);
      toast({
        title: "Não foi possível abrir o Planejamento",
        description: "Tente novamente em alguns instantes.",
        variant: "destructive",
      });
      setLoading(false);
    }
  }, [loading]);

  return { abrir, loading };
}
