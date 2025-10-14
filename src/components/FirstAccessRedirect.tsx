import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export function FirstAccessRedirect() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const { data: profile } = useQuery({
    queryKey: ['profile', user?.id],
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

  useEffect(() => {
    // Se for primeiro acesso e não estiver já na página de cadastro
    if (profile?.primeiro_acesso && location.pathname !== '/cadastros/seus-dados') {
      navigate('/cadastros/seus-dados', { replace: true });
    }
  }, [profile, location.pathname, navigate]);

  return null;
}
