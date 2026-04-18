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

  // Verifica se existe ao menos 1 ingrediente e 1 embalagem
  const { data: insumosStatus, isLoading: loadingInsumos } = useQuery({
    queryKey: ['onboarding-insumos', user?.id],
    queryFn: async () => {
      if (!user) return null;
      const [{ count: ingCount }, { count: embCount }] = await Promise.all([
        supabase.from('ingredientes').select('id', { count: 'exact', head: true }).eq('usuario_id', user.id),
        supabase.from('embalagens').select('id', { count: 'exact', head: true }).eq('usuario_id', user.id),
      ]);
      return {
        temIngrediente: (ingCount ?? 0) > 0,
        temEmbalagem: (embCount ?? 0) > 0,
      };
    },
    enabled: !!user && !!profile && profile.ativo !== false && !!profile.nome_confeitaria && !profile.primeiro_acesso,
  });

  useEffect(() => {
    if (isLoading || !profile) return;

    // Usuário inativo → logout
    if (profile.ativo === false) {
      supabase.auth.signOut().then(() => {
        navigate('/auth/login', { replace: true });
      });
      return;
    }

    // Etapa 1: Dados da Confeitaria incompletos
    const dadosIncompletos = profile.primeiro_acesso || !profile.nome_confeitaria;
    if (dadosIncompletos) {
      if (location.pathname !== '/configuracoes/dados-confeitaria') {
        navigate('/configuracoes/dados-confeitaria', { replace: true });
      }
      return;
    }

    // Etapa 2: Insumos e Embalagens obrigatórios
    if (loadingInsumos || !insumosStatus) return;
    const onboardingCompleto = insumosStatus.temIngrediente && insumosStatus.temEmbalagem;

    if (!onboardingCompleto) {
      // Rotas permitidas durante o onboarding de insumos
      const rotasPermitidas = [
        '/configuracoes/tipos-insumos',
        '/configuracoes/dados-confeitaria',
      ];
      const emRotaPermitida = rotasPermitidas.some((r) => location.pathname.startsWith(r));
      if (!emRotaPermitida) {
        navigate('/configuracoes/tipos-insumos', { replace: true });
      }
    }
  }, [profile, isLoading, insumosStatus, loadingInsumos, location.pathname, navigate]);

  return null;
}
