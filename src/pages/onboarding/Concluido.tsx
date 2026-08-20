import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Trophy, Rocket, Heart } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

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

  const handleJornada = async () => {
    const ok = await marcarConcluido();
    if (!ok) return;
    navigate("/dashboard", { replace: true });
  };

  const primeiroNome = (profile?.nome_completo || "").split(" ")[0] || "confeiteira";

  return (
    <div className="min-h-[calc(100vh-8rem)] flex items-center justify-center p-4">
      <Card className="max-w-3xl w-full overflow-hidden border-sfb-dourado/40 shadow-elevated">
        <div className="h-2 bg-gradient-to-r from-sfb-dourado via-sfb-vinho to-sfb-dourado" />

        <CardContent className="p-8 md:p-12 bg-sfb-creme">
          <div className="flex flex-col items-center text-center space-y-6">
            <div className="w-20 h-20 rounded-full bg-sfb-dourado flex items-center justify-center shadow-elevated">
              <Trophy className="h-10 w-10 text-sfb-vinho" />
            </div>

            <div className="space-y-3">
              <p className="text-sm uppercase tracking-[0.2em] text-sfb-vinho font-semibold">
                Onboarding concluído
              </p>
              <h1 className="text-3xl md:text-4xl font-display font-bold text-sfb-preto leading-tight">
                Parabéns, <span className="text-sfb-vinho">{primeiroNome}</span>!  
                <br className="hidden md:block" /> Você está pronta para decolar 🚀
              </h1>
              <p className="text-base md:text-lg text-sfb-preto/80 font-body leading-relaxed max-w-xl mx-auto">
                Obrigada por dedicar esse tempo aos cadastros iniciais. Tudo o que você
                preencheu agora vai trabalhar a seu favor — em cada precificação,
                cada encomenda e cada relatório.
              </p>
            </div>

            {/* Frase motivacional forte */}
            <div className="w-full rounded-xl bg-sfb-vinho text-sfb-creme p-6 shadow-soft">
              <div className="flex items-start gap-3">
                <Heart className="h-6 w-6 text-sfb-dourado flex-shrink-0 mt-1" />
                <p className="text-base md:text-lg font-display italic leading-relaxed text-left">
                  "Negócio doce de verdade é aquele que <strong className="text-sfb-dourado not-italic">dá lucro, sustenta sua vida e ainda sobra amor pra fazer mais</strong>.
                  E é exatamente isso que começa agora."
                </p>
              </div>
            </div>

            <p className="text-sm text-sfb-preto/70 font-body">
              Pronta para começar?
            </p>

            {/* Botão final — centralizado */}
            <div className="flex justify-center w-full">
              <Button
                size="lg"
                onClick={handleJornada}
                className="bg-sfb-vinho text-sfb-creme hover:bg-sfb-vinho-escuro hover:text-sfb-branco h-auto py-5 flex-col gap-1 shadow-elevated"
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
