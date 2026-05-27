import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Trophy, Rocket, Compass, Heart } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

// URL do tour visual — será fornecida posteriormente pela usuária administradora.
// Quando vazia, o botão exibe um aviso amigável.
const TOUR_URL = "";

export default function OnboardingConcluido() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: profile } = useQuery({
    queryKey: ["profile", user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .maybeSingle();
      return data;
    },
    enabled: !!user,
  });

  // Já concluiu antes? Sai pro dashboard
  useEffect(() => {
    if (profile && (profile as any).onboarding_concluido) {
      navigate("/dashboard", { replace: true });
    }
  }, [profile, navigate]);

  const marcarConcluido = async () => {
    if (!user) return false;
    const { error } = await supabase
      .from("profiles")
      .update({ onboarding_concluido: true, onboarding_iniciado: true } as any)
      .eq("id", user.id);
    if (error) {
      toast.error("Erro ao concluir onboarding: " + error.message);
      return false;
    }
    await queryClient.invalidateQueries({ queryKey: ["profile", user.id] });
    return true;
  };

  const handleTour = async () => {
    const ok = await marcarConcluido();
    if (!ok) return;
    if (TOUR_URL) {
      window.open(TOUR_URL, "_blank", "noopener,noreferrer");
      navigate("/dashboard", { replace: true });
    } else {
      toast.info("O tour estará disponível em breve. Vamos para o seu painel!");
      navigate("/dashboard", { replace: true });
    }
  };

  const handleJornada = async () => {
    const ok = await marcarConcluido();
    if (!ok) return;
    navigate("/dashboard", { replace: true });
  };

  const primeiroNome = (profile?.nome_completo || "").split(" ")[0] || "confeiteira";

  return (
    <div className="min-h-[calc(100vh-8rem)] flex items-center justify-center p-4">
      <Card className="max-w-3xl w-full overflow-hidden border-cda-dourado/40 shadow-elevated">
        <div className="h-2 bg-gradient-to-r from-cda-dourado via-cda-vinho to-cda-dourado" />

        <CardContent className="p-8 md:p-12 bg-cda-creme">
          <div className="flex flex-col items-center text-center space-y-6">
            <div className="w-20 h-20 rounded-full bg-cda-dourado flex items-center justify-center shadow-elevated">
              <Trophy className="h-10 w-10 text-cda-vinho" />
            </div>

            <div className="space-y-3">
              <p className="text-sm uppercase tracking-[0.2em] text-cda-vinho font-semibold">
                Onboarding concluído
              </p>
              <h1 className="text-3xl md:text-4xl font-display font-bold text-cda-preto leading-tight">
                Parabéns, <span className="text-cda-vinho">{primeiroNome}</span>!  
                <br className="hidden md:block" /> Você está pronta para decolar 🚀
              </h1>
              <p className="text-base md:text-lg text-cda-preto/80 font-body leading-relaxed max-w-xl mx-auto">
                Obrigada por dedicar esse tempo aos cadastros iniciais. Tudo o que você
                preencheu agora vai trabalhar a seu favor — em cada precificação,
                cada encomenda e cada relatório.
              </p>
            </div>

            {/* Frase motivacional forte */}
            <div className="w-full rounded-xl bg-cda-vinho text-cda-creme p-6 shadow-soft">
              <div className="flex items-start gap-3">
                <Heart className="h-6 w-6 text-cda-dourado flex-shrink-0 mt-1" />
                <p className="text-base md:text-lg font-display italic leading-relaxed text-left">
                  "Negócio doce de verdade é aquele que <strong className="text-cda-dourado not-italic">dá lucro, sustenta sua vida e ainda sobra amor pra fazer mais</strong>.
                  E é exatamente isso que começa agora."
                </p>
              </div>
            </div>

            <p className="text-sm text-cda-preto/70 font-body">
              Escolha como quer continuar:
            </p>

            {/* Botões finais */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
              <Button
                variant="outline"
                size="lg"
                onClick={handleTour}
                className="border-cda-vinho text-cda-vinho hover:bg-cda-vinho hover:text-cda-creme h-auto py-5 flex-col gap-1"
              >
                <div className="flex items-center gap-2">
                  <Compass className="h-5 w-5" />
                  <span className="font-semibold">Tour pelo Caixa de Açúcar</span>
                </div>
                <span className="text-xs font-normal opacity-80">Conheça cada módulo antes de começar</span>
              </Button>

              <Button
                size="lg"
                onClick={handleJornada}
                className="bg-cda-vinho text-cda-creme hover:bg-cda-vinho-escuro hover:text-cda-branco h-auto py-5 flex-col gap-1 shadow-elevated"
              >
                <div className="flex items-center gap-2">
                  <Rocket className="h-5 w-5" />
                  <span className="font-semibold">Iniciar Minha Jornada</span>
                </div>
                <span className="text-xs font-normal opacity-90">Ir direto para Meu Painel</span>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
