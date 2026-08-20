import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Sparkles, ChefHat, TrendingUp, ShieldCheck, ArrowRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export default function OnboardingBemVinda() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: profile, isLoading } = useQuery({
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

  // Se o usuário já iniciou ou já concluiu, sai daqui
  useEffect(() => {
    if (!profile) return;
    if ((profile as any).onboarding_concluido) {
      navigate("/dashboard", { replace: true });
    }
  }, [profile, navigate]);

  const handleIniciar = async () => {
    if (!user) return;
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ onboarding_iniciado: true } as any)
        .eq("id", user.id);
      if (error) throw error;
      await queryClient.invalidateQueries({ queryKey: ["profile", user.id] });
      navigate("/configuracoes/dados-confeitaria", { replace: true });
    } catch (err: any) {
      toast.error("Não foi possível iniciar o onboarding: " + err.message);
    }
  };

  const primeiroNome = (profile?.nome_completo || "").split(" ")[0] || "confeiteira";

  return (
    <div className="min-h-[calc(100vh-8rem)] flex items-center justify-center p-4">
      <Card className="max-w-3xl w-full overflow-hidden border-cda-dourado/40 shadow-elevated">
        {/* Faixa superior decorativa */}
        <div className="h-2 bg-gradient-to-r from-cda-vinho via-cda-dourado to-cda-vinho" />

        <CardContent className="p-8 md:p-12 bg-cda-creme">
          <div className="flex flex-col items-center text-center space-y-6">
            <div className="w-20 h-20 rounded-full bg-cda-vinho flex items-center justify-center shadow-elevated">
              <Sparkles className="h-10 w-10 text-cda-dourado" />
            </div>

            <div className="space-y-3">
              <p className="text-sm uppercase tracking-[0.2em] text-cda-vinho font-semibold">
                Boas-vindas ao Spa Flor de Baunilha
              </p>
              <h1 className="text-3xl md:text-4xl font-display font-bold text-cda-preto leading-tight">
                Que alegria ter você aqui,{" "}
                <span className="text-cda-vinho">{primeiroNome}</span>! 🎉
              </h1>
              <p className="text-base md:text-lg text-cda-preto/80 font-body leading-relaxed max-w-xl mx-auto">
                Você acaba de dar um passo decisivo para transformar a sua confeitaria
                em um negócio organizado, lucrativo e que <strong>cabe na sua rotina</strong>.
                Aqui você vai precificar com confiança, controlar o financeiro sem complicação
                e enxergar o resultado real do seu trabalho.
              </p>
            </div>

            {/* Pilares de valor */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full pt-2">
              <div className="rounded-xl border border-cda-dourado/30 bg-cda-branco p-4 flex flex-col items-center text-center gap-2">
                <ChefHat className="h-7 w-7 text-cda-vinho" />
                <p className="text-sm font-semibold text-cda-preto">Receitas precificadas</p>
                <p className="text-xs text-cda-preto/70">Saiba o custo real e o preço justo de cada item</p>
              </div>
              <div className="rounded-xl border border-cda-dourado/30 bg-cda-branco p-4 flex flex-col items-center text-center gap-2">
                <TrendingUp className="h-7 w-7 text-cda-vinho" />
                <p className="text-sm font-semibold text-cda-preto">Resultados visíveis</p>
                <p className="text-xs text-cda-preto/70">Métricas claras de faturamento, CMV e lucro</p>
              </div>
              <div className="rounded-xl border border-cda-dourado/30 bg-cda-branco p-4 flex flex-col items-center text-center gap-2">
                <ShieldCheck className="h-7 w-7 text-cda-vinho" />
                <p className="text-sm font-semibold text-cda-preto">Dados protegidos</p>
                <p className="text-xs text-cda-preto/70">Backups automáticos do seu negócio</p>
              </div>
            </div>

            {/* Aviso sobre os próximos passos */}
            <div className="w-full rounded-xl bg-cda-dourado/15 border border-cda-dourado/40 p-5 text-left">
              <p className="text-sm text-cda-preto font-body leading-relaxed">
                <strong className="text-cda-vinho">Antes de começar</strong>, vamos juntas
                preencher 3 cadastros rápidos e obrigatórios — eles garantem que cada módulo
                do sistema funcione perfeitamente para a sua confeitaria:
              </p>
              <ol className="mt-3 space-y-1.5 text-sm text-cda-preto/90 font-body list-decimal list-inside">
                <li><strong>Meus Dados</strong> — identificação e endereço da confeitaria</li>
                <li><strong>Valores de Mão de Obra</strong> — base para precificação justa</li>
                <li><strong>Backup</strong> — proteção dos seus dados desde o primeiro dia</li>
              </ol>
            </div>

            <Button
              size="lg"
              onClick={handleIniciar}
              disabled={isLoading || !user}
              className="bg-cda-vinho text-cda-creme hover:bg-cda-vinho-escuro hover:text-cda-branco px-8 py-6 text-base font-semibold shadow-elevated"
            >
              Iniciar Onboarding
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
