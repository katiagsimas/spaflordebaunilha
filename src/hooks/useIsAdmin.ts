import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';

/**
 * Hook para verificar se o usuário atual é administrador do sistema
 * Verifica a role 'MOTHER' (system admin) na tabela user_global_roles (sistema novo)
 */
export function useIsAdmin() {
  const { user } = useAuth();

  const { data: isAdmin = false, isLoading } = useQuery({
    queryKey: ['isAdmin', user?.id],
    queryFn: async () => {
      if (!user) return false;
      
      const { data: roles } = await supabase
        .from('user_global_roles')
        .select('role_global')
        .eq('user_id', user.id)
        .eq('role_global', 'MOTHER')
        .eq('is_active', true)
        .maybeSingle();
      
      return !!roles;
    },
    enabled: !!user,
    staleTime: 1000 * 60 * 5, // Cache por 5 minutos
  });

  return { isAdmin, isLoading };
}
