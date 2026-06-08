import { useAuth } from '@/contexts/AuthContext';
import { useGroup } from '@/contexts/GroupContext';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useIsAdmin } from './useIsAdmin';

export function useOnboardingStatus() {
  const { user } = useAuth();
  const { isMother, activeGroup } = useGroup();
  const { isAdmin } = useIsAdmin();

  const { data: profile } = useQuery({
    queryKey: ['profile-onboarding-status', user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data } = await supabase
        .from('profiles')
        .select('onboarding_concluido')
        .eq('id', user.id)
        .maybeSingle();
      return data;
    },
    enabled: !!user,
  });

  const isMaster = !!user && (!activeGroup || activeGroup.master_user_id === user.id);
  
  // Apenas mestres de grupo (que não sejam Mother ou Admin) precisam de onboarding.
  // Membros (não-mestres) herdam as configurações do mestre e não precisam passar pelo fluxo.
  const onboardingPendente = !isAdmin && !isMother && isMaster && profile?.onboarding_concluido === false;

  return {
    onboardingPendente,
    isMaster,
    isAdmin,
    isMother,
    profile
  };
}
