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
        .maybeSingle();
      return data;
    },
    enabled: !!user,
  });

  useEffect(() => {
    console.log('FirstAccessRedirect - Profile:', profile);
    console.log('FirstAccessRedirect - Location:', location.pathname);
    
    // Se usuário está inativo, fazer logout
    if (profile && profile.ativo === false) {
      console.log('Usuário inativo, fazendo logout');
      supabase.auth.signOut().then(() => {
        navigate('/auth/login', { replace: true });
      });
      return;
    }

    // Se for primeiro acesso OU não tiver dados essenciais cadastrados
    // redireciona para página de cadastro, exceto se já estiver lá
    if (profile && location.pathname !== '/configuracoes/dados-confeitaria') {
      const dadosIncompletos = profile.primeiro_acesso || !profile.nome_confeitaria;
      console.log('Dados incompletos?', dadosIncompletos, { primeiro_acesso: profile.primeiro_acesso, nome_confeitaria: profile.nome_confeitaria });
      
      if (dadosIncompletos) {
        console.log('Redirecionando para /configuracoes/dados-confeitaria');
        navigate('/configuracoes/dados-confeitaria', { replace: true });
      }
    }
  }, [profile, location.pathname, navigate]);

  return null;
}
