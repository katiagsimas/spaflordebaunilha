import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { 
  CheckCircle2, 
  Circle, 
  Clock, 
  ArrowRight, 
  UserRound, 
  ChefHat, 
  HardDrive,
  MessageSquare,
  AlertCircle
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";

export default function OnboardingProgresso() {
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

  const { data: onboardingStatus, isLoading: loadingStatus } = useQuery({
    queryKey: ['onboarding-status', user?.id],
    queryFn: async () => {
      if (!user) return null;
      const [{ count: moCount }, { count: bkpCount }] = await Promise.all([
        supabase.from('mao_obra_perfis').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
        (supabase.from('backups' as any).select('id', { count: 'exact', head: true }).eq('usuario_id', user.id) as any),
      ]);
      
      const camposObrigatoriosMeusDados = ['nome_completo', 'nome_confeitaria', 'cpf', 'whatsapp', 'cep', 'endereco', 'cidade', 'estado'];
      const meusDadosConcluido = profile && camposObrigatoriosMeusDados.every(campo => {
        const valor = (profile as any)[campo];
        return valor && String(valor).trim() !== '';
      });

      return {
        meusDados: !!meusDadosConcluido,
        maoObra: (moCount ?? 0) > 0,
        backup: (bkpCount ?? 0) > 0,
      };
    },
    enabled: !!user && !!profile,
  });

  const steps = [
    {
      id: "meus_dados",
      title: "Meus Dados",
      description: "Identificação e endereço da sua confeitaria",
      icon: UserRound,
      route: "/configuracoes/dados-confeitaria",
      completed: onboardingStatus?.meusDados,
    },
    {
      id: "mao_obra",
      title: "Mão de Obra",
      description: "Defina o valor da sua hora de trabalho",
      icon: ChefHat,
      route: "/configuracoes/precificacao/mao-de-obra",
      completed: onboardingStatus?.maoObra,
    },
    {
      id: "backup",
      title: "Segurança (Backup)",
      description: "Proteja seus dados desde o primeiro dia",
      icon: HardDrive,
      route: "/configuracoes/backup",
      completed: onboardingStatus?.backup,
    },
  ];

  const completedCount = steps.filter(s => s.completed).length;
  const progressPercent = (completedCount / steps.length) * 100;
  const allCompleted = completedCount === steps.length;

  const handleFinalizar = async () => {
    if (!user) return;
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ 
          onboarding_concluido: true,
          onboarding_concluido_at: new Date().toISOString()
        } as any)
        .eq("id", user.id);
      
      if (error) throw error;
      
      await queryClient.invalidateQueries({ queryKey: ["profile", user.id] });
      toast.success("Parabéns! Onboarding concluído com sucesso.");
      navigate("/onboarding/concluido", { replace: true });
    } catch (err: any) {
      toast.error("Erro ao finalizar: " + err.message);
    }
  };

  const handleSolicitarRevisao = () => {
    toast.info("Sua solicitação foi enviada. Nossa equipe entrará em contato em breve.", {
      description: "Você também pode nos chamar no suporte via WhatsApp."
    });
  };

  if (isLoading || loadingStatus) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Clock className="h-8 w-8 animate-spin text-cda-vinho" />
      </div>
    );
  }

  return (
    <div className="container max-w-2xl py-12 px-4 space-y-8">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-display font-bold text-cda-preto">Seu Progresso</h1>
        <p className="text-muted-foreground">Complete as etapas abaixo para liberar o acesso total ao sistema.</p>
      </div>

      <Card className="border-cda-dourado/20 shadow-sm overflow-hidden">
        <div className="h-1.5 bg-muted">
          <Progress value={progressPercent} className="h-full bg-cda-dourado rounded-none" />
        </div>
        <CardContent className="p-6">
          <div className="flex justify-between items-center mb-6">
            <span className="text-sm font-semibold text-cda-vinho uppercase tracking-wider">
              {completedCount} de {steps.length} etapas concluídas
            </span>
            <Badge variant={allCompleted ? "default" : "secondary"} className={allCompleted ? "bg-green-100 text-green-700 hover:bg-green-100" : ""}>
              {allCompleted ? "Tudo Pronto!" : "Em andamento"}
            </Badge>
          </div>

          <div className="space-y-4">
            {steps.map((step, index) => (
              <div 
                key={step.id}
                className={`flex items-center gap-4 p-4 rounded-xl border transition-all ${
                  step.completed 
                    ? "bg-green-50/50 border-green-100" 
                    : "bg-white border-slate-100 hover:border-cda-dourado/30"
                }`}
              >
                <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
                  step.completed ? "bg-green-100 text-green-600" : "bg-slate-50 text-slate-400"
                }`}>
                  <step.icon className="h-5 w-5" />
                </div>
                
                <div className="flex-1 min-w-0">
                  <h3 className={`font-semibold text-sm ${step.completed ? "text-green-800" : "text-slate-900"}`}>
                    {step.title}
                  </h3>
                  <p className="text-xs text-slate-500 truncate">{step.description}</p>
                </div>

                {step.completed ? (
                  <CheckCircle2 className="h-6 w-6 text-green-500" />
                ) : (
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => navigate(step.route)}
                    className="text-cda-vinho hover:text-cda-vinho-escuro hover:bg-cda-vinho/5"
                  >
                    Começar
                    <ArrowRight className="ml-1 h-3 w-3" />
                  </Button>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="flex flex-col gap-4">
        {allCompleted ? (
          <Button 
            size="lg" 
            onClick={handleFinalizar}
            className="w-full bg-cda-vinho text-cda-creme hover:bg-cda-vinho-escuro py-6 text-base font-bold shadow-elevated"
          >
            Concluir Onboarding e Começar
            <CheckCircle2 className="ml-2 h-5 w-5" />
          </Button>
        ) : (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex gap-3">
            <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-amber-800 leading-relaxed">
              <strong>Atenção:</strong> Você precisa completar todas as etapas acima para acessar o restante do sistema. 
              Isso garante que sua experiência seja completa e segura.
            </p>
          </div>
        )}

        <div className="pt-4 flex flex-col items-center gap-3">
          <p className="text-xs text-slate-500">Teve algum problema ou precisa de ajuda?</p>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleSolicitarRevisao}
              className="text-slate-600 border-slate-200"
            >
              <MessageSquare className="mr-2 h-4 w-4" />
              Solicitar Revisão
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => {
                toast.promise(
                  queryClient.invalidateQueries({ queryKey: ["onboarding-status"] }),
                  {
                    loading: "Atualizando status...",
                    success: "Status atualizado!",
                    error: "Erro ao atualizar."
                  }
                );
              }}
              className="text-slate-500"
            >
              <Clock className="mr-2 h-4 w-4" />
              Recarregar Status
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
