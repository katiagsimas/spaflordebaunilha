import { ReactNode, useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useOnboardingStatus } from '@/hooks/useOnboardingStatus';
import { toast } from 'sonner';
import { AlertCircle, Lock, UserRound, ChefHat, HardDrive, ArrowRight } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useNavigate, useLocation } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';

interface OnboardingGuardProps {
  children: ReactNode;
  actionName?: string;
}

export function OnboardingGuard({ children, actionName = "esta ação" }: OnboardingGuardProps) {
  const { user } = useAuth();
  const { onboardingPendente, isAdmin, isMother } = useOnboardingStatus();
  const navigate = useNavigate();
  const location = useLocation();

  const { data: profile } = useQuery({
    queryKey: ['profile-guard', user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      return data;
    },
    enabled: !!user,
  });

  const { data: onboardingStatus } = useQuery({
    queryKey: ['onboarding-status-guard', user?.id],
    queryFn: async () => {
      if (!user || !profile) return null;
      
      const [{ count: moCount }, { count: bkpCount }] = await Promise.all([
        supabase.from('mao_obra_perfis').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
        supabase.from('backups' as any).select('id', { count: 'exact', head: true }).eq('usuario_id', user.id) as any,
      ]);
      
      const camposObrigatorios = ['nome_completo', 'nome_confeitaria', 'cpf', 'whatsapp', 'cep', 'endereco', 'cidade', 'estado'];
      const meusDadosOk = camposObrigatorios.every(campo => (profile as any)[campo] && String((profile as any)[campo]).trim() !== '');

      return {
        meusDados: !!meusDadosOk,
        maoObra: (moCount ?? 0) > 0,
        backup: (bkpCount ?? 0) > 0,
      };
    },
    enabled: !!user && !!profile && onboardingPendente,
  });

  const logException = async () => {
    if (!user) return;
    await supabase.from('onboarding_exception_logs').insert({
      user_id: user.id,
      admin_id: user.id, // Se ele é admin e está furando, ele é o executor
      action: `Exceção Admin: ${actionName}`,
      route: location.pathname,
      details: { timestamp: new Date().toISOString(), context: 'Bypass Onboarding' }
    });
    toast.info("Ação permitida como Admin, log de exceção registrado.");
  };

  if (onboardingPendente) {
    const steps = [
      { 
        id: 'meusDados', 
        label: 'Meus Dados', 
        done: onboardingStatus?.meusDados, 
        icon: UserRound, 
        action: "Preencher dados da confeitaria",
        route: "/configuracoes/dados-confeitaria"
      },
      { 
        id: 'maoObra', 
        label: 'Mão de Obra', 
        done: onboardingStatus?.maoObra, 
        icon: ChefHat, 
        action: "Definir valor da sua hora",
        route: "/configuracoes/precificacao/mao-de-obra"
      },
      { 
        id: 'backup', 
        label: 'Backup', 
        done: onboardingStatus?.backup, 
        icon: HardDrive, 
        action: "Configurar segurança dos dados",
        route: "/configuracoes/backup"
      },
    ];

    const pendingSteps = steps.filter(s => !s.done);

    return (
      <Card className="border-amber-200 bg-amber-50 shadow-md">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-amber-800 text-lg">
            <Lock className="h-5 w-5" />
            Acesso Restrito: Onboarding Pendente
          </CardTitle>
          <CardDescription className="text-amber-700">
            Para realizar <strong>{actionName}</strong>, você precisa concluir as etapas de configuração inicial.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-2">
            {steps.map((step) => (
              <div 
                key={step.id} 
                className={`flex items-center justify-between p-3 rounded-lg border ${
                  step.done 
                    ? "bg-green-50/50 border-green-100 text-green-700" 
                    : "bg-white border-amber-100 text-amber-900 shadow-sm"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`p-1.5 rounded-full ${step.done ? "bg-green-100" : "bg-amber-100"}`}>
                    <step.icon className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold leading-none">{step.label}</p>
                    {!step.done && (
                      <p className="text-[11px] text-amber-600 mt-1">
                        Próxima ação: {step.action}
                      </p>
                    )}
                  </div>
                </div>
                {step.done ? (
                  <Badge variant="outline" className="border-green-200 bg-green-50 text-green-700 text-[10px]">Concluído</Badge>
                ) : (
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => navigate(step.route)}
                    className="h-8 text-[11px] text-amber-700 hover:bg-amber-100 hover:text-amber-800"
                  >
                    Resolver
                    <ArrowRight className="ml-1 h-3 w-3" />
                  </Button>
                )}
              </div>
            ))}
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <Button 
              onClick={() => navigate('/onboarding/progresso')}
              className="flex-1 bg-cda-vinho text-cda-creme hover:bg-cda-vinho-escuro"
            >
              Ver Painel de Onboarding
            </Button>
            {isAdmin && (
              <Button 
                variant="outline"
                onClick={logException}
                className="flex-1 border-amber-300 text-amber-800 hover:bg-amber-100"
              >
                Ignorar (Apenas Admin)
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  return <>{children}</>;
}
