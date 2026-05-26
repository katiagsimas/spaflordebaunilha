import { useEffect } from "react";
import { Loader2, Sparkles } from "lucide-react";
import { useOpenPlannerDoce } from "@/hooks/useOpenPlannerDoce";

export default function PlanejamentoDoce() {
  const { abrir, loading } = useOpenPlannerDoce();

  useEffect(() => {
    abrir();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="min-h-[70vh] flex items-center justify-center p-6">
      <div className="max-w-md w-full text-center space-y-6 bg-gradient-to-br from-cda-vinho to-cda-vinho-escuro text-cda-creme rounded-2xl p-8 border-2 border-cda-dourado/40 shadow-soft">
        <div className="mx-auto h-14 w-14 rounded-2xl bg-cda-dourado/20 flex items-center justify-center">
          <Sparkles className="h-7 w-7 text-cda-dourado" />
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl font-bold">Planejamento Doce</h1>
          <p className="text-cda-creme/80 text-sm">
            Abrindo seu planejamento anual e campanhas estratégicas...
          </p>
        </div>
        <div className="flex items-center justify-center gap-2 text-cda-dourado">
          <Loader2 className="h-5 w-5 animate-spin" aria-hidden />
          <span className="text-sm" aria-live="polite">
            {loading ? "Gerando acesso seguro..." : "Redirecionando..."}
          </span>
        </div>
      </div>
    </div>
  );
}
