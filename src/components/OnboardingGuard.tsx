import { ReactNode, useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useIsAdmin } from '@/hooks/useIsAdmin';
import { useGroup } from '@/contexts/GroupContext';
import { toast } from 'sonner';
import { AlertCircle, Lock } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useNavigate, useLocation } from 'react-router-dom';

interface OnboardingGuardProps {
  children: ReactNode;
  actionName?: string;
}

export function OnboardingGuard({ children, actionName = "esta ação" }: OnboardingGuardProps) {
  const { user } = useAuth();
  const { isAdmin } = useIsAdmin();
  const { isMother } = useGroup();
  const navigate = useNavigate();
  const location = useLocation();

  const { data: profile } = useQuery({
    queryKey: ['profile-guard', user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data } = await supabase
        .from('profiles')
        .select('onboarding_concluido')
        .eq('id', user.id)
        .single();
      return data;
    },
    enabled: !!user,
  });

  const onboardingPendente = !isAdmin && !isMother && profile && profile.onboarding_concluido === false;

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
    return (
      <Card className="border-amber-200 bg-amber-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-amber-800 text-lg">
            <Lock className="h-5 w-5" />
            Onboarding Pendente
          </CardTitle>
          <CardDescription className="text-amber-700">
            Você precisa concluir o onboarding antes de realizar {actionName}.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button 
            onClick={() => navigate('/onboarding/progresso')}
            className="bg-cda-vinho text-cda-creme hover:bg-cda-vinho-escuro"
          >
            Ir para Onboarding
          </Button>
        </CardContent>
      </Card>
    );
  }

  return <>{children}</>;
}
