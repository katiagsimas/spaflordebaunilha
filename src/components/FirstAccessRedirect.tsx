import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export function FirstAccessRedirect() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const { data: profile, isLoading } = useQuery({
    queryKey: ['profile', user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();
      return data;
    },
    enabled: !!user,
  });

  useEffect(() => {
    if (isLoading || !profile) {
      return;
    }
    
    // Se usuário está inativo, fazer logout
    if (profile.ativo === false) {
      supabase.auth.signOut().then(() => {
        navigate('/auth/login', { replace: true });
      });
      return;
    }

    // Se for primeiro acesso OU não tiver dados essenciais cadastrados
    // redireciona para página de cadastro, exceto se já estiver lá
    if (location.pathname !== '/configuracoes/dados-confeitaria') {
      const dadosIncompletos = profile.primeiro_acesso || !profile.nome_confeitaria;
      
      if (dadosIncompletos) {
        navigate('/configuracoes/dados-confeitaria', { replace: true });
      }
    }
  }, [profile, isLoading, location.pathname, navigate]);

  return null;
}
