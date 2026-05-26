import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { LoadingMascote } from "@/components/LoadingMascote";
import { Button } from "@/components/ui/button";
import { AlertCircle } from "lucide-react";

type Estado = "carregando" | "erro";

export default function SSOReturnPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [estado, setEstado] = useState<Estado>("carregando");
  const [mensagemErro, setMensagemErro] = useState<string>("");

  useEffect(() => {
    const token = searchParams.get("token");

    // Limpa o token da URL imediatamente (evita exposição em logs/históricos)
    if (typeof window !== "undefined" && window.history?.replaceState) {
      window.history.replaceState({}, document.title, window.location.pathname);
    }

    if (!token) {
      setMensagemErro("Token de retorno ausente.");
      setEstado("erro");
      return;
    }

    let cancelado = false;

    (async () => {
      try {
        const { data, error } = await supabase.functions.invoke(
          "validar-token-retorno-doce",
          { body: { token } },
        );

        if (cancelado) return;

        if (error || !data?.action_link) {
          console.warn("[SSOReturn] validação falhou:", error?.message);
          setMensagemErro("Não foi possível retornar. Faça login novamente.");
          setEstado("erro");
          return;
        }

        // Redireciona ao action_link — Supabase abre a sessão automaticamente
        window.location.href = data.action_link as string;
      } catch (err) {
        if (cancelado) return;
        console.error("[SSOReturn] erro inesperado:", err);
        setMensagemErro("Não foi possível retornar. Faça login novamente.");
        setEstado("erro");
      }
    })();

    return () => {
      cancelado = true;
    };
  }, [searchParams]);

  if (estado === "carregando") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-cda-creme">
        <LoadingMascote size={96} label="Retornando do Planejamento Estratégico..." />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-cda-creme p-6">
      <div className="max-w-md w-full bg-cda-branco border border-cda-dourado/40 rounded-2xl shadow-lg p-8 text-center space-y-5">
        <div className="mx-auto w-14 h-14 rounded-full bg-cda-coral/15 flex items-center justify-center">
          <AlertCircle className="w-7 h-7 text-cda-coral" />
        </div>
        <h1 className="text-2xl font-heading text-cda-vinho">
          Não foi possível retornar
        </h1>
        <p className="text-cda-preto/70 font-body">
          {mensagemErro || "Faça login novamente para acessar a Caixa de Açúcar."}
        </p>
        <Button
          onClick={() => navigate("/auth/login")}
          className="w-full bg-cda-vinho hover:bg-cda-vinho-escuro text-cda-creme"
        >
          Voltar ao login
        </Button>
      </div>
    </div>
  );
}
