import { useEffect } from "react";
import { Loader2, Sparkles, Lock } from "lucide-react";
import { useOpenPlannerDoce } from "@/hooks/useOpenPlannerDoce";
import { useGroup } from "@/contexts/GroupContext";

export default function PlanejamentoDoce() {
  const { abrir, loading } = useOpenPlannerDoce();
  const { isMother } = useGroup();

  useEffect(() => {
    if (isMother) abrir();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isMother]);

  if (!isMother) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center p-6">
        <div className="max-w-lg w-full text-center space-y-6 bg-gradient-to-br from-cda-vinho to-cda-vinho-escuro text-cda-creme rounded-2xl p-10 border-2 border-cda-dourado/40 shadow-soft">
          <div className="mx-auto h-16 w-16 rounded-2xl bg-cda-dourado/20 flex items-center justify-center relative">
            <Sparkles className="h-8 w-8 text-cda-dourado" />
            <div className="absolute -bottom-1 -right-1 h-6 w-6 rounded-full bg-cda-vinho-escuro border-2 border-cda-dourado flex items-center justify-center">
              <Lock className="h-3 w-3 text-cda-dourado" />
            </div>
          </div>
          <div className="space-y-3">
            <h1 className="text-2xl font-bold font-display">Planejamento Doce</h1>
            <p className="text-cda-creme/90 text-base font-body leading-relaxed">
              Estamos preparando algo especial para você!
            </p>
            <p className="text-cda-creme/80 text-sm font-body leading-relaxed">
              Em breve, o <strong className="text-cda-dourado">Planejamento Doce</strong> estará
              disponível para te ajudar a organizar seu ano com campanhas, metas e estratégias
              para crescer com doçura. Aguarde — vai valer a pena!
            </p>
          </div>
          <div className="pt-2">
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-cda-dourado/20 text-cda-dourado text-xs font-body font-semibold uppercase tracking-wider">
              <Sparkles className="h-3.5 w-3.5" /> Em breve
            </span>
          </div>
        </div>
      </div>
    );
  }

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
